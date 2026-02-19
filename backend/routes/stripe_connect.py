"""
AfroVending - Stripe Connect Routes
Vendor onboarding, identity verification, and payout management
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
import stripe
import os
import logging

from database import get_db
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stripe-connect", tags=["Stripe Connect"])

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_API_KEY")


@router.post("/create-account")
async def create_connected_account(request: Request, user: dict = Depends(get_current_user)):
    """Create a Stripe Connect Express account for a vendor"""
    db = get_db()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Check if vendor already has a Stripe account
    if vendor.get("stripe_account_id"):
        return {"stripe_account_id": vendor["stripe_account_id"], "already_exists": True}
    
    try:
        # Create Express connected account
        account = stripe.Account.create(
            type="express",
            country=vendor.get("country_code", "US"),
            email=user.get("email"),
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            business_type="individual",
            metadata={
                "vendor_id": vendor["id"],
                "user_id": user["id"],
                "platform": "afrovending"
            }
        )
        
        # Save Stripe account ID to vendor profile
        await db.vendors.update_one(
            {"id": vendor["id"]},
            {
                "$set": {
                    "stripe_account_id": account.id,
                    "stripe_account_status": "pending",
                    "stripe_created_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "stripe_account_id": account.id,
            "message": "Stripe account created successfully"
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/onboarding-link")
async def create_onboarding_link(request: Request, user: dict = Depends(get_current_user)):
    """Generate Stripe Connect onboarding link for vendor"""
    db = get_db()
    body = await request.json()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    stripe_account_id = vendor.get("stripe_account_id")
    if not stripe_account_id:
        raise HTTPException(status_code=400, detail="Please create a Stripe account first")
    
    # Get frontend origin from request
    origin_url = body.get("origin_url", os.environ.get("FRONTEND_URL", "https://afrovending.com"))
    
    try:
        account_link = stripe.AccountLink.create(
            account=stripe_account_id,
            refresh_url=f"{origin_url}/vendor/store-settings?stripe_refresh=true",
            return_url=f"{origin_url}/vendor/store-settings?stripe_complete=true",
            type="account_onboarding",
        )
        
        return {
            "url": account_link.url,
            "expires_at": account_link.expires_at
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/account-status")
async def get_account_status(user: dict = Depends(get_current_user)):
    """Get the current Stripe Connect account status"""
    db = get_db()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    stripe_account_id = vendor.get("stripe_account_id")
    if not stripe_account_id:
        return {
            "has_account": False,
            "status": "not_created",
            "payouts_enabled": False,
            "charges_enabled": False
        }
    
    try:
        account = stripe.Account.retrieve(stripe_account_id)
        
        # Update vendor record with current status
        status = "complete" if account.details_submitted else "incomplete"
        await db.vendors.update_one(
            {"id": vendor["id"]},
            {
                "$set": {
                    "stripe_account_status": status,
                    "stripe_payouts_enabled": account.payouts_enabled,
                    "stripe_charges_enabled": account.charges_enabled,
                    "stripe_details_submitted": account.details_submitted
                }
            }
        )
        
        return {
            "has_account": True,
            "account_id": stripe_account_id,
            "status": status,
            "details_submitted": account.details_submitted,
            "payouts_enabled": account.payouts_enabled,
            "charges_enabled": account.charges_enabled,
            "requirements": {
                "currently_due": account.requirements.currently_due if account.requirements else [],
                "eventually_due": account.requirements.eventually_due if account.requirements else [],
                "pending_verification": account.requirements.pending_verification if account.requirements else []
            }
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/identity-verification")
async def create_identity_verification(request: Request, user: dict = Depends(get_current_user)):
    """Create a Stripe Identity verification session"""
    db = get_db()
    body = await request.json()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    origin_url = body.get("origin_url", os.environ.get("FRONTEND_URL", "https://afrovending.com"))
    
    try:
        # Create Identity verification session
        verification_session = stripe.identity.VerificationSession.create(
            type="document",
            options={
                "document": {
                    "allowed_types": ["passport", "driving_license", "id_card"],
                    "require_matching_selfie": True
                }
            },
            metadata={
                "vendor_id": vendor["id"],
                "user_id": user["id"]
            },
            return_url=f"{origin_url}/vendor/store-settings?identity_complete=true"
        )
        
        # Save verification session ID
        await db.vendors.update_one(
            {"id": vendor["id"]},
            {
                "$set": {
                    "identity_verification_id": verification_session.id,
                    "identity_verification_status": verification_session.status,
                    "identity_verification_started": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "verification_session_id": verification_session.id,
            "url": verification_session.url,
            "status": verification_session.status
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/identity-status")
async def get_identity_status(user: dict = Depends(get_current_user)):
    """Get the current identity verification status"""
    db = get_db()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    verification_id = vendor.get("identity_verification_id")
    if not verification_id:
        return {
            "has_verification": False,
            "status": "not_started"
        }
    
    try:
        verification = stripe.identity.VerificationSession.retrieve(verification_id)
        
        # Update vendor record
        await db.vendors.update_one(
            {"id": vendor["id"]},
            {
                "$set": {
                    "identity_verification_status": verification.status,
                    "identity_verified": verification.status == "verified"
                }
            }
        )
        
        return {
            "has_verification": True,
            "verification_id": verification_id,
            "status": verification.status,
            "verified": verification.status == "verified"
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/tax-information")
async def update_tax_information(request: Request, user: dict = Depends(get_current_user)):
    """Update vendor tax information"""
    db = get_db()
    data = await request.json()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Tax fields that can be updated
    tax_fields = {
        "tax_id_type": data.get("tax_id_type"),  # ssn, ein, vat, business_registration
        "tax_id_last4": data.get("tax_id")[-4:] if data.get("tax_id") else None,  # Store only last 4 digits
        "business_name": data.get("business_name"),
        "business_type": data.get("business_type"),  # individual, company, non_profit
        "vat_number": data.get("vat_number"),
        "tax_country": data.get("tax_country"),
        "tax_info_submitted": True,
        "tax_info_updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Filter out None values
    tax_fields = {k: v for k, v in tax_fields.items() if v is not None}
    
    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": tax_fields}
    )
    
    # If vendor has Stripe account, update it there too
    stripe_account_id = vendor.get("stripe_account_id")
    if stripe_account_id and data.get("tax_id"):
        try:
            # Update tax ID on Stripe (for US vendors)
            if data.get("tax_id_type") in ["ssn", "ein"]:
                stripe.Account.modify(
                    stripe_account_id,
                    individual={
                        "ssn_last_4": data.get("tax_id")[-4:]
                    } if data.get("tax_id_type") == "ssn" else None
                )
        except stripe.error.StripeError:
            pass  # Non-critical, continue
    
    return {"message": "Tax information updated successfully"}


@router.get("/payout-balance")
async def get_payout_balance(user: dict = Depends(get_current_user)):
    """Get vendor's available payout balance"""
    db = get_db()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    stripe_account_id = vendor.get("stripe_account_id")
    if not stripe_account_id:
        return {"available": 0, "pending": 0, "currency": "usd"}
    
    try:
        balance = stripe.Balance.retrieve(stripe_account=stripe_account_id)
        
        available = sum(b.amount for b in balance.available) / 100  # Convert from cents
        pending = sum(b.amount for b in balance.pending) / 100
        
        return {
            "available": available,
            "pending": pending,
            "currency": balance.available[0].currency if balance.available else "usd"
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/onboarding-status")
async def get_onboarding_status(user: dict = Depends(get_current_user)):
    """Get comprehensive vendor onboarding status"""
    db = get_db()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Calculate completion status for each step
    steps = {
        "profile": {
            "completed": bool(vendor.get("store_name") and vendor.get("description")),
            "fields": ["store_name", "description", "country"]
        },
        "contact": {
            "completed": bool(vendor.get("phone") or vendor.get("email")),
            "fields": ["phone", "email", "city", "address"]
        },
        "branding": {
            "completed": bool(vendor.get("logo_url")),
            "fields": ["logo_url", "banner_url"]
        },
        "payment": {
            "completed": vendor.get("stripe_details_submitted", False),
            "stripe_account_id": vendor.get("stripe_account_id"),
            "payouts_enabled": vendor.get("stripe_payouts_enabled", False)
        },
        "identity": {
            "completed": vendor.get("identity_verified", False),
            "status": vendor.get("identity_verification_status", "not_started")
        },
        "tax": {
            "completed": vendor.get("tax_info_submitted", False),
            "fields": ["tax_id_type", "business_type"]
        }
    }
    
    completed_steps = sum(1 for s in steps.values() if s.get("completed"))
    total_steps = len(steps)
    
    return {
        "steps": steps,
        "completed_steps": completed_steps,
        "total_steps": total_steps,
        "completion_percentage": int((completed_steps / total_steps) * 100),
        "is_fully_verified": all(s.get("completed") for s in steps.values())
    }


# ==================== PAYOUT SCHEDULING ====================

@router.get("/payout-settings")
async def get_payout_settings(user: dict = Depends(get_current_user)):
    """Get vendor's payout settings"""
    db = get_db()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    return {
        "auto_payout_enabled": vendor.get("auto_payout_enabled", False),
        "payout_threshold": vendor.get("payout_threshold", 50.0),
        "payout_frequency": vendor.get("payout_frequency", "weekly"),  # weekly, biweekly, monthly
        "payout_day": vendor.get("payout_day", "monday"),  # day of week for weekly
        "minimum_payout": 10.0,  # Platform minimum
        "currency": "usd"
    }


@router.put("/payout-settings")
async def update_payout_settings(request: Request, user: dict = Depends(get_current_user)):
    """Update vendor's payout settings"""
    db = get_db()
    data = await request.json()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Validate vendor is verified for payouts
    if not vendor.get("stripe_payouts_enabled"):
        raise HTTPException(status_code=400, detail="Please complete Stripe setup first")
    
    # Validate threshold (minimum $10)
    threshold = float(data.get("payout_threshold", 50.0))
    if threshold < 10.0:
        raise HTTPException(status_code=400, detail="Minimum payout threshold is $10")
    
    # Validate frequency
    frequency = data.get("payout_frequency", "weekly")
    if frequency not in ["weekly", "biweekly", "monthly"]:
        raise HTTPException(status_code=400, detail="Invalid payout frequency")
    
    update_fields = {
        "auto_payout_enabled": bool(data.get("auto_payout_enabled", False)),
        "payout_threshold": threshold,
        "payout_frequency": frequency,
        "payout_day": data.get("payout_day", "monday"),
        "payout_settings_updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": update_fields}
    )
    
    # Send email if auto-payout was just enabled
    if update_fields["auto_payout_enabled"] and not vendor.get("auto_payout_enabled"):
        try:
            from payout_emails import send_auto_payout_enabled_email
            await send_auto_payout_enabled_email(vendor, threshold, frequency)
        except Exception as e:
            logger.error(f"Failed to send auto-payout email: {e}")
    
    return {"message": "Payout settings updated successfully", **update_fields}


@router.post("/request-payout")
async def request_manual_payout(request: Request, user: dict = Depends(get_current_user)):
    """Request a manual payout"""
    db = get_db()
    data = await request.json()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    stripe_account_id = vendor.get("stripe_account_id")
    if not stripe_account_id:
        raise HTTPException(status_code=400, detail="Stripe account not set up")
    
    if not vendor.get("stripe_payouts_enabled"):
        raise HTTPException(status_code=400, detail="Payouts not enabled on your account")
    
    try:
        # Get available balance
        balance = stripe.Balance.retrieve(stripe_account=stripe_account_id)
        available_amount = sum(b.amount for b in balance.available) / 100  # Convert from cents
        
        # Get requested amount or use full balance
        amount = float(data.get("amount", available_amount))
        
        if amount < 10.0:
            raise HTTPException(status_code=400, detail="Minimum payout amount is $10")
        
        if amount > available_amount:
            raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: ${available_amount:.2f}")
        
        # Create payout
        payout = stripe.Payout.create(
            amount=int(amount * 100),  # Convert to cents
            currency="usd",
            stripe_account=stripe_account_id,
            metadata={
                "vendor_id": vendor["id"],
                "type": "manual"
            }
        )
        
        # Record payout in database
        payout_record = {
            "id": payout.id,
            "vendor_id": vendor["id"],
            "stripe_account_id": stripe_account_id,
            "amount": amount,
            "currency": "usd",
            "status": payout.status,
            "type": "manual",
            "arrival_date": payout.arrival_date,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payouts.insert_one(payout_record)
        
        # Send email notification
        try:
            from payout_emails import send_payout_initiated_email
            await send_payout_initiated_email(vendor, amount, payout.id, "manual")
        except Exception as e:
            logger.error(f"Failed to send payout email: {e}")
        
        return {
            "payout_id": payout.id,
            "amount": amount,
            "status": payout.status,
            "estimated_arrival": payout.arrival_date,
            "message": f"Payout of ${amount:.2f} initiated successfully"
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payout-history")
async def get_payout_history(
    user: dict = Depends(get_current_user),
    limit: int = 20,
    skip: int = 0
):
    """Get vendor's payout history"""
    db = get_db()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Get payouts from database
    payouts = await db.payouts.find(
        {"vendor_id": vendor["id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Get total count
    total = await db.payouts.count_documents({"vendor_id": vendor["id"]})
    
    # Calculate totals
    total_paid = await db.payouts.aggregate([
        {"$match": {"vendor_id": vendor["id"], "status": {"$in": ["paid", "in_transit"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    return {
        "payouts": payouts,
        "total_count": total,
        "total_paid": total_paid[0]["total"] if total_paid else 0,
        "has_more": (skip + limit) < total
    }


@router.get("/earnings-summary")
async def get_earnings_summary(user: dict = Depends(get_current_user)):
    """Get vendor's earnings summary"""
    db = get_db()
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    stripe_account_id = vendor.get("stripe_account_id")
    
    # Get balance from Stripe
    available_balance = 0
    pending_balance = 0
    
    if stripe_account_id:
        try:
            balance = stripe.Balance.retrieve(stripe_account=stripe_account_id)
            available_balance = sum(b.amount for b in balance.available) / 100
            pending_balance = sum(b.amount for b in balance.pending) / 100
        except stripe.error.StripeError:
            pass
    
    # Get total paid out from database
    total_paid_result = await db.payouts.aggregate([
        {"$match": {"vendor_id": vendor["id"], "status": {"$in": ["paid", "in_transit"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    total_paid = total_paid_result[0]["total"] if total_paid_result else 0
    
    # Get total sales from orders
    total_sales_result = await db.orders.aggregate([
        {"$match": {"vendor_id": vendor["id"], "status": {"$in": ["completed", "delivered"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]).to_list(1)
    total_sales = total_sales_result[0]["total"] if total_sales_result else vendor.get("total_sales", 0)
    
    # Get pending orders revenue
    pending_orders_result = await db.orders.aggregate([
        {"$match": {"vendor_id": vendor["id"], "status": {"$in": ["pending", "confirmed", "processing", "shipped"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]).to_list(1)
    pending_orders = pending_orders_result[0]["total"] if pending_orders_result else 0
    
    # Platform commission rate
    commission_rate = vendor.get("commission_rate", 15)
    
    return {
        "available_balance": available_balance,
        "pending_balance": pending_balance,
        "total_paid_out": total_paid,
        "total_sales": total_sales,
        "pending_orders_revenue": pending_orders,
        "commission_rate": commission_rate,
        "net_earnings": total_sales * (1 - commission_rate / 100),
        "currency": "usd",
        "auto_payout_enabled": vendor.get("auto_payout_enabled", False),
        "payout_threshold": vendor.get("payout_threshold", 50.0),
        "payout_frequency": vendor.get("payout_frequency", "weekly"),
        "next_payout_eligible": available_balance >= vendor.get("payout_threshold", 50.0)
    }


# Background job function (to be called by scheduler)
async def process_scheduled_payouts():
    """Process automatic payouts for eligible vendors"""
    db = get_db()
    
    # Find vendors with auto-payout enabled and sufficient balance
    vendors = await db.vendors.find({
        "auto_payout_enabled": True,
        "stripe_payouts_enabled": True,
        "stripe_account_id": {"$exists": True}
    }, {"_id": 0}).to_list(None)
    
    processed = []
    errors = []
    
    for vendor in vendors:
        stripe_account_id = vendor["stripe_account_id"]
        threshold = vendor.get("payout_threshold", 50.0)
        
        try:
            # Check balance
            balance = stripe.Balance.retrieve(stripe_account=stripe_account_id)
            available_amount = sum(b.amount for b in balance.available) / 100
            
            if available_amount >= threshold:
                # Create payout
                payout = stripe.Payout.create(
                    amount=int(available_amount * 100),
                    currency="usd",
                    stripe_account=stripe_account_id,
                    metadata={
                        "vendor_id": vendor["id"],
                        "type": "automatic"
                    }
                )
                
                # Record in database
                payout_record = {
                    "id": payout.id,
                    "vendor_id": vendor["id"],
                    "stripe_account_id": stripe_account_id,
                    "amount": available_amount,
                    "currency": "usd",
                    "status": payout.status,
                    "type": "automatic",
                    "arrival_date": payout.arrival_date,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.payouts.insert_one(payout_record)
                
                processed.append({
                    "vendor_id": vendor["id"],
                    "amount": available_amount,
                    "payout_id": payout.id
                })
                
        except stripe.error.StripeError as e:
            errors.append({
                "vendor_id": vendor["id"],
                "error": str(e)
            })
    
    return {"processed": processed, "errors": errors}

