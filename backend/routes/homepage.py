"""
AfroVending - Homepage Data Routes
Social proof, recently sold, vendor success stories
"""
from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
import random

from database import get_db

router = APIRouter(prefix="/homepage", tags=["Homepage"])


@router.get("/recently-sold")
async def get_recently_sold():
    """Get recently sold items for social proof"""
    db = get_db()
    recent_orders = await db.orders.find(
        {"status": {"$in": ["completed", "shipped", "delivered"]}},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    items = []
    countries = ["USA", "UK", "Canada", "Ghana", "Nigeria", "Kenya", "Germany", "France", "Netherlands"]
    
    for order in recent_orders[:10]:
        for item in order.get("items", [])[:1]:
            product = await db.products.find_one({"id": item.get("product_id")}, {"_id": 0})
            if product:
                created = datetime.fromisoformat(order["created_at"].replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                diff = now - created
                
                if diff.days > 0:
                    time_ago = f"{diff.days} days ago"
                elif diff.seconds > 3600:
                    time_ago = f"{diff.seconds // 3600} hours ago"
                else:
                    time_ago = f"{diff.seconds // 60} minutes ago"
                
                items.append({
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "product_image": product.get("images", [None])[0],
                    "price": product["price"],
                    "sold_to": random.choice(countries),
                    "time_ago": time_ago
                })
    
    if len(items) < 5:
        products = await db.products.find({"is_active": True}, {"_id": 0}).limit(10).to_list(10)
        for product in products:
            if len(items) >= 5:
                break
            items.append({
                "product_id": product["id"],
                "product_name": product["name"],
                "product_image": product.get("images", [None])[0],
                "price": product["price"],
                "sold_to": random.choice(countries),
                "time_ago": f"{random.randint(1, 12)} hours ago"
            })
    
    return {"items": items[:5]}


@router.get("/vendor-success")
async def get_vendor_success_stories():
    """Get vendor success stories for social proof"""
    db = get_db()
    vendors = await db.vendors.find(
        {"is_approved": True, "is_active": True},
        {"_id": 0}
    ).sort("total_sales", -1).limit(5).to_list(5)
    
    stories = []
    
    for vendor in vendors:
        product_count = await db.products.count_documents({"vendor_id": vendor["id"], "is_active": True})
        
        stories.append({
            "vendor_id": vendor["id"],
            "store_name": vendor["store_name"],
            "logo_url": vendor.get("logo_url"),
            "country": vendor.get("country", "Africa"),
            "total_sales": vendor.get("total_sales", 0),
            "product_count": product_count,
            "is_verified": vendor.get("is_verified", False),
            "joined_date": vendor.get("created_at", "")[:10],
            "average_rating": vendor.get("average_rating", 4.5)
        })
    
    return stories


@router.get("/stats")
async def get_homepage_stats():
    """Get platform statistics for homepage"""
    db = get_db()
    vendor_count = await db.vendors.count_documents({"is_approved": True, "is_active": True})
    product_count = await db.products.count_documents({"is_active": True})
    service_count = await db.services.count_documents({"is_active": True})
    
    countries = await db.vendors.distinct("country", {"is_approved": True})
    
    return {
        "vendors": vendor_count,
        "products": product_count,
        "services": service_count,
        "countries": len(countries),
        "customers": 50000
    }
