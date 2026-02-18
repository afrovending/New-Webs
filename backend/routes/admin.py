"""
AfroVending - Admin Routes
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])
# db initialized per-request


async def require_admin(user: dict = Depends(get_current_user)):
    """Dependency to require admin role"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/stats")
async def get_admin_stats(user: dict = Depends(require_admin)):
    """Get admin dashboard statistics"""
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    
    # User stats
    total_users = await db.users.count_documents({})
    new_users_30d = await db.users.count_documents({"created_at": {"$gte": thirty_days_ago}})
    new_users_7d = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
    
    # Vendor stats
    total_vendors = await db.vendors.count_documents({})
    approved_vendors = await db.vendors.count_documents({"is_approved": True})
    pending_vendors = await db.vendors.count_documents({"is_approved": False})
    verified_vendors = await db.vendors.count_documents({"is_verified": True})
    
    # Product stats
    total_products = await db.products.count_documents({})
    active_products = await db.products.count_documents({"is_active": True})
    
    # Service stats
    total_services = await db.services.count_documents({})
    
    # Order stats
    total_orders = await db.orders.count_documents({})
    orders_30d = await db.orders.count_documents({"created_at": {"$gte": thirty_days_ago}})
    
    # Revenue (sum of order totals)
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Revenue last 30 days
    pipeline_30d = [
        {"$match": {"payment_status": "paid", "created_at": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_30d_result = await db.orders.aggregate(pipeline_30d).to_list(1)
    revenue_30d = revenue_30d_result[0]["total"] if revenue_30d_result else 0
    
    return {
        "users": {
            "total": total_users,
            "new_30d": new_users_30d,
            "new_7d": new_users_7d,
            "growth_rate": round((new_users_30d / max(total_users - new_users_30d, 1)) * 100, 1)
        },
        "vendors": {
            "total": total_vendors,
            "approved": approved_vendors,
            "pending": pending_vendors,
            "verified": verified_vendors
        },
        "products": {
            "total": total_products,
            "active": active_products
        },
        "services": {
            "total": total_services
        },
        "orders": {
            "total": total_orders,
            "last_30d": orders_30d
        },
        "revenue": {
            "total": total_revenue,
            "last_30d": revenue_30d
        }
    }


@router.get("/vendors")
async def get_all_vendors(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    user: dict = Depends(require_admin)
):
    """Get all vendors for admin management"""
    query = {}
    if status == "pending":
        query["is_approved"] = False
    elif status == "approved":
        query["is_approved"] = True
    elif status == "verified":
        query["is_verified"] = True
    
    vendors = await db.vendors.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.vendors.count_documents(query)
    
    # Enrich with user info
    for vendor in vendors:
        vendor_user = await db.users.find_one({"id": vendor["user_id"]}, {"_id": 0, "email": 1, "first_name": 1, "last_name": 1})
        vendor["user"] = vendor_user
    
    return {"vendors": vendors, "total": total}


@router.put("/vendors/{vendor_id}/approve")
async def approve_vendor(vendor_id: str, user: dict = Depends(require_admin)):
    """Approve a vendor"""
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"is_approved": True, "approved_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Vendor approved"}


@router.put("/vendors/{vendor_id}/verify")
async def verify_vendor(vendor_id: str, user: dict = Depends(require_admin)):
    """Verify a vendor"""
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"is_verified": True, "verified_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Vendor verified"}


@router.put("/vendors/{vendor_id}/deactivate")
async def deactivate_vendor(
    vendor_id: str, 
    reason: str = "Policy violation",
    background_tasks: BackgroundTasks = None,
    user: dict = Depends(require_admin)
):
    """Deactivate a vendor"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "is_active": False,
            "deactivated_at": datetime.now(timezone.utc).isoformat(),
            "deactivation_reason": reason
        }}
    )
    
    # Deactivate all products and services
    await db.products.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": False}})
    await db.services.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": False}})
    
    return {"message": "Vendor deactivated"}


@router.put("/vendors/{vendor_id}/activate")
async def activate_vendor(vendor_id: str, user: dict = Depends(require_admin)):
    """Reactivate a vendor"""
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "is_active": True,
            "reactivated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Reactivate products and services
    await db.products.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": True}})
    await db.services.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": True}})
    
    return {"message": "Vendor reactivated"}


@router.get("/users")
async def get_all_users(
    role: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    user: dict = Depends(require_admin)
):
    """Get all users for admin management"""
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0, "hashed_password": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total}


@router.post("/check-price-alerts")
async def trigger_price_alert_check(user: dict = Depends(require_admin)):
    """Manually trigger price alert checks"""
    from routes.price_alerts import check_price_alerts_for_product
    
    # Get all active alerts
    alerts = await db.price_alerts.find({"is_active": True, "triggered": False}, {"_id": 0}).to_list(1000)
    
    checked = 0
    triggered = 0
    
    for alert in alerts:
        product = await db.products.find_one({"id": alert["product_id"]}, {"_id": 0})
        if product and product["price"] <= alert["target_price"]:
            await check_price_alerts_for_product(alert["product_id"], product["price"])
            triggered += 1
        checked += 1
    
    return {"message": "Price alert check completed", "checked": checked, "triggered": triggered}
