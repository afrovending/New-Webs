"""
AfroVending - Price Alert Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid
import logging

from database import get_db
from auth import get_current_user
from models import PriceAlertCreate

router = APIRouter(prefix="/price-alerts", tags=["Price Alerts"])
logger = logging.getLogger(__name__)


@router.get("")
async def get_price_alerts(user: dict = Depends(get_current_user)):
    """Get user's price alerts"""
    db = get_db()
    alerts = await db.price_alerts.find(
        {"user_id": user["id"], "is_active": True},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for alert in alerts:
        product = await db.products.find_one({"id": alert["product_id"]}, {"_id": 0, "price": 1, "name": 1, "images": 1})
        if product:
            alert["current_price"] = product.get("price", 0)
            alert["price_dropped"] = product.get("price", 0) <= alert["target_price"]
            alert["product_image"] = product.get("images", [None])[0]
    
    return {"alerts": alerts, "count": len(alerts)}


@router.post("/create")
async def create_price_alert(alert_data: PriceAlertCreate, user: dict = Depends(get_current_user)):
    """Create a new price alert"""
    db = get_db()
    product = await db.products.find_one({"id": alert_data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = await db.price_alerts.find_one({
        "user_id": user["id"],
        "product_id": alert_data.product_id,
        "is_active": True
    })
    if existing:
        await db.price_alerts.update_one(
            {"id": existing["id"]},
            {"$set": {
                "target_price": alert_data.target_price,
                "notify_email": alert_data.notify_email,
                "notify_app": alert_data.notify_app,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"message": "Price alert updated", "alert_id": existing["id"]}
    
    alert = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "product_id": alert_data.product_id,
        "product_name": product["name"],
        "target_price": alert_data.target_price,
        "current_price": product["price"],
        "notify_email": alert_data.notify_email,
        "notify_app": alert_data.notify_app,
        "is_active": True,
        "triggered": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.price_alerts.insert_one(alert)
    
    return {"message": "Price alert created", "alert_id": alert["id"]}


@router.delete("/{alert_id}")
async def delete_price_alert(alert_id: str, user: dict = Depends(get_current_user)):
    """Delete a price alert"""
    db = get_db()
    result = await db.price_alerts.delete_one({"id": alert_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Price alert not found")
    return {"message": "Price alert deleted"}


async def check_price_alerts_for_product(product_id: str, new_price: float):
    """Check all alerts for a specific product and send notifications if price dropped"""
    db = get_db()
    active_alerts = await db.price_alerts.find({
        "product_id": product_id,
        "is_active": True,
        "triggered": False
    }, {"_id": 0}).to_list(1000)
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        return
    
    for alert in active_alerts:
        if new_price <= alert["target_price"]:
            user = await db.users.find_one({"id": alert["user_id"]}, {"_id": 0, "email": 1, "first_name": 1})
            
            if alert.get("notify_email") and user:
                try:
                    await send_price_alert_email(
                        user["email"],
                        alert["product_name"],
                        alert["target_price"],
                        new_price,
                        alert["product_id"]
                    )
                    logger.info(f"Sent price alert email to {user['email']} for product {product_id}")
                except Exception as e:
                    logger.error(f"Failed to send price alert email: {e}")
            
            if alert.get("notify_app"):
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": alert["user_id"],
                    "type": "price_alert",
                    "title": "Price Drop Alert!",
                    "message": f"{alert['product_name']} is now ${new_price:.2f} (was ${alert.get('current_price', 0):.2f})",
                    "product_id": alert["product_id"],
                    "link": f"/products/{product_id}",
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            
            await db.price_alerts.update_one(
                {"id": alert["id"]},
                {"$set": {"triggered": True, "triggered_at": datetime.now(timezone.utc).isoformat()}}
            )
            logger.info(f"Price alert {alert['id']} triggered for user {alert['user_id']}")


async def send_price_alert_email(to_email: str, product_name: str, target_price: float, current_price: float, product_id: str):
    """Send price drop email notification"""
    try:
        from email_service import email_service
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #e63946, #d62828); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Price Drop Alert!</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
                <p style="font-size: 16px; color: #333;">Great news! A product on your price alert list has dropped in price.</p>
                
                <h3>{product_name}</h3>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Your target price:</strong> ${target_price:.2f}</p>
                    <p><strong>Current price:</strong> <span style="color: #28a745; font-size: 24px;">${current_price:.2f}</span></p>
                </div>
                
                <a href="https://afrovending.com/products/{product_id}" 
                   style="display: inline-block; background: #e63946; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Shop Now
                </a>
            </div>
        </div>
        """
        
        email_service._send(to_email, f"Price Drop: {product_name} is now ${current_price:.2f}!", html_content)
    except Exception as e:
        logger.error(f"Failed to send price alert email: {e}")
