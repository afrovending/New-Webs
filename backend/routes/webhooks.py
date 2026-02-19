"""
AfroVending - Stripe Webhooks
Handles Stripe webhook events for payouts and payments
"""
from fastapi import APIRouter, Request, HTTPException, Header
from datetime import datetime, timezone
import stripe
import os
import logging

from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

stripe.api_key = os.environ.get("STRIPE_API_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhook events"""
    payload = await request.body()
    
    # Verify webhook signature if secret is configured
    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # For development, parse without verification
        import json
        event = json.loads(payload)
    
    event_type = event.get("type") if isinstance(event, dict) else event.type
    data = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object
    
    logger.info(f"Received Stripe webhook: {event_type}")
    
    db = get_db()
    
    # Handle payout events
    if event_type == "payout.paid":
        await handle_payout_paid(db, data)
    elif event_type == "payout.failed":
        await handle_payout_failed(db, data)
    elif event_type == "payout.canceled":
        await handle_payout_canceled(db, data)
    elif event_type == "account.updated":
        await handle_account_updated(db, data)
    
    return {"status": "success"}


async def handle_payout_paid(db, payout_data):
    """Handle payout.paid event"""
    payout_id = payout_data.get("id")
    
    # Update payout status in database
    result = await db.payouts.find_one_and_update(
        {"id": payout_id},
        {"$set": {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat()
        }},
        return_document=True
    )
    
    if result:
        # Get vendor and send email
        vendor = await db.vendors.find_one({"id": result.get("vendor_id")}, {"_id": 0})
        if vendor:
            try:
                from payout_emails import send_payout_completed_email
                await send_payout_completed_email(vendor, result.get("amount", 0), payout_id)
                logger.info(f"Sent payout completed email for {payout_id}")
            except Exception as e:
                logger.error(f"Failed to send payout completed email: {e}")
    
    logger.info(f"Payout {payout_id} marked as paid")


async def handle_payout_failed(db, payout_data):
    """Handle payout.failed event"""
    payout_id = payout_data.get("id")
    failure_message = payout_data.get("failure_message", "Unknown error")
    
    # Update payout status in database
    result = await db.payouts.find_one_and_update(
        {"id": payout_id},
        {"$set": {
            "status": "failed",
            "failure_message": failure_message,
            "failed_at": datetime.now(timezone.utc).isoformat()
        }},
        return_document=True
    )
    
    if result:
        # Get vendor and send email
        vendor = await db.vendors.find_one({"id": result.get("vendor_id")}, {"_id": 0})
        if vendor:
            try:
                from payout_emails import send_payout_failed_email
                await send_payout_failed_email(vendor, result.get("amount", 0), payout_id, failure_message)
                logger.info(f"Sent payout failed email for {payout_id}")
            except Exception as e:
                logger.error(f"Failed to send payout failed email: {e}")
    
    logger.info(f"Payout {payout_id} marked as failed: {failure_message}")


async def handle_payout_canceled(db, payout_data):
    """Handle payout.canceled event"""
    payout_id = payout_data.get("id")
    
    await db.payouts.update_one(
        {"id": payout_id},
        {"$set": {
            "status": "canceled",
            "canceled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    logger.info(f"Payout {payout_id} marked as canceled")


async def handle_account_updated(db, account_data):
    """Handle account.updated event for Connect accounts"""
    account_id = account_data.get("id")
    
    # Find vendor with this Stripe account
    vendor = await db.vendors.find_one({"stripe_account_id": account_id})
    
    if vendor:
        # Update vendor's Stripe status
        update_data = {
            "stripe_payouts_enabled": account_data.get("payouts_enabled", False),
            "stripe_charges_enabled": account_data.get("charges_enabled", False),
            "stripe_details_submitted": account_data.get("details_submitted", False),
            "stripe_updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.vendors.update_one(
            {"stripe_account_id": account_id},
            {"$set": update_data}
        )
        
        logger.info(f"Updated Stripe status for vendor {vendor.get('id')}")
