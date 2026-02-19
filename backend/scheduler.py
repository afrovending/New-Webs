"""
AfroVending - Payout Scheduler Service
Handles automatic weekly payouts for verified vendors
"""
import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import stripe
import os

from database import get_db

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_API_KEY")

# Global scheduler instance
scheduler = None


async def process_scheduled_payouts():
    """Process automatic payouts for eligible vendors"""
    logger.info("Starting scheduled payout processing...")
    db = get_db()
    
    # Get current day of week
    current_day = datetime.now(timezone.utc).strftime('%A').lower()
    
    # Find vendors with auto-payout enabled for today
    vendors = await db.vendors.find({
        "auto_payout_enabled": True,
        "stripe_payouts_enabled": True,
        "stripe_account_id": {"$exists": True},
        "payout_day": current_day
    }, {"_id": 0}).to_list(None)
    
    logger.info(f"Found {len(vendors)} vendors eligible for payouts today ({current_day})")
    
    processed = []
    errors = []
    
    for vendor in vendors:
        stripe_account_id = vendor["stripe_account_id"]
        threshold = vendor.get("payout_threshold", 50.0)
        vendor_id = vendor["id"]
        
        try:
            # Check balance
            balance = stripe.Balance.retrieve(stripe_account=stripe_account_id)
            available_amount = sum(b.amount for b in balance.available) / 100
            
            logger.info(f"Vendor {vendor_id}: Available balance ${available_amount}, threshold ${threshold}")
            
            if available_amount >= threshold:
                # Create payout
                payout = stripe.Payout.create(
                    amount=int(available_amount * 100),
                    currency="usd",
                    stripe_account=stripe_account_id,
                    metadata={
                        "vendor_id": vendor_id,
                        "type": "automatic"
                    }
                )
                
                # Record in database
                payout_record = {
                    "id": payout.id,
                    "vendor_id": vendor_id,
                    "stripe_account_id": stripe_account_id,
                    "amount": available_amount,
                    "currency": "usd",
                    "status": payout.status,
                    "type": "automatic",
                    "arrival_date": payout.arrival_date,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.payouts.insert_one(payout_record)
                
                # Send notification email
                from payout_emails import send_payout_initiated_email
                await send_payout_initiated_email(vendor, available_amount, payout.id, "automatic")
                
                processed.append({
                    "vendor_id": vendor_id,
                    "amount": available_amount,
                    "payout_id": payout.id
                })
                
                logger.info(f"Payout created for vendor {vendor_id}: ${available_amount}")
                
        except stripe.error.StripeError as e:
            error_msg = str(e)
            errors.append({
                "vendor_id": vendor_id,
                "error": error_msg
            })
            logger.error(f"Stripe error for vendor {vendor_id}: {error_msg}")
        except Exception as e:
            error_msg = str(e)
            errors.append({
                "vendor_id": vendor_id,
                "error": error_msg
            })
            logger.error(f"Error processing payout for vendor {vendor_id}: {error_msg}")
    
    result = {
        "processed": len(processed),
        "errors": len(errors),
        "details": {
            "processed": processed,
            "errors": errors
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Log the job run
    await db.scheduler_logs.insert_one({
        "job": "process_scheduled_payouts",
        "result": result,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    logger.info(f"Payout processing complete: {len(processed)} processed, {len(errors)} errors")
    return result


def init_scheduler():
    """Initialize the APScheduler for background jobs"""
    global scheduler
    
    if scheduler is not None:
        logger.info("Scheduler already initialized")
        return scheduler
    
    scheduler = AsyncIOScheduler()
    
    # Schedule weekly payout processing
    # Runs every day at 9 AM UTC to check if it's the vendor's payout day
    scheduler.add_job(
        process_scheduled_payouts,
        CronTrigger(hour=9, minute=0),  # 9:00 AM UTC daily
        id="process_scheduled_payouts",
        name="Process scheduled vendor payouts",
        replace_existing=True
    )
    
    logger.info("Scheduler initialized with payout job (daily at 9:00 AM UTC)")
    return scheduler


def start_scheduler():
    """Start the scheduler"""
    global scheduler
    
    if scheduler is None:
        scheduler = init_scheduler()
    
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started")
    
    return scheduler


def stop_scheduler():
    """Stop the scheduler"""
    global scheduler
    
    if scheduler and scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")


def get_scheduler_status():
    """Get current scheduler status"""
    global scheduler
    
    if scheduler is None:
        return {"running": False, "jobs": []}
    
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger)
        })
    
    return {
        "running": scheduler.running,
        "jobs": jobs
    }
