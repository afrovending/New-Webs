"""
AfroVending - Notification Routes
Includes both in-app notifications and push notifications
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import json
import os

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# VAPID keys for push notifications
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U')
VAPID_CLAIMS = {"sub": "mailto:support@afrovending.com"}


# ============ PYDANTIC MODELS ============
class PushSubscription(BaseModel):
    user_id: str
    subscription: Dict[str, Any]


class UnsubscribeRequest(BaseModel):
    endpoint: str


class NotificationPayload(BaseModel):
    title: str
    body: str
    icon: Optional[str] = "/icons/icon-192x192.png"
    badge: Optional[str] = "/icons/icon-72x72.png"
    tag: Optional[str] = "afrovending"
    url: Optional[str] = "/"
    user_ids: Optional[List[str]] = None


# ============ IN-APP NOTIFICATIONS ============


@router.get("")
async def get_notifications(user: dict = Depends(get_current_user), unread_only: bool = False):
    """Get user's notifications"""
    db = get_db()
    query = {"user_id": user["id"]}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    unread_count = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    
    return {"notifications": notifications, "unread_count": unread_count}


@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    db = get_db()
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    db = get_db()
    await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, user: dict = Depends(get_current_user)):
    """Delete a notification"""
    db = get_db()
    result = await db.notifications.delete_one({"id": notification_id, "user_id": user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}


# ============ PUSH NOTIFICATIONS ============

@router.post("/subscribe")
async def subscribe_push(
    data: PushSubscription,
    user: dict = Depends(get_current_user)
):
    """Subscribe to push notifications"""
    db = get_db()
    
    subscription_data = {
        "user_id": data.user_id,
        "endpoint": data.subscription.get("endpoint"),
        "keys": data.subscription.get("keys"),
        "subscription_json": json.dumps(data.subscription),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    existing = await db.push_subscriptions.find_one({
        "endpoint": subscription_data["endpoint"]
    })
    
    if existing:
        await db.push_subscriptions.update_one(
            {"endpoint": subscription_data["endpoint"]},
            {"$set": {
                "user_id": data.user_id,
                "keys": data.subscription.get("keys"),
                "subscription_json": json.dumps(data.subscription),
                "is_active": True
            }}
        )
    else:
        await db.push_subscriptions.insert_one(subscription_data)
    
    return {"success": True, "message": "Subscribed to push notifications"}


@router.post("/unsubscribe")
async def unsubscribe_push(
    data: UnsubscribeRequest,
    user: dict = Depends(get_current_user)
):
    """Unsubscribe from push notifications"""
    db = get_db()
    
    await db.push_subscriptions.update_one(
        {"endpoint": data.endpoint},
        {"$set": {"is_active": False}}
    )
    
    return {"success": True, "message": "Unsubscribed from push notifications"}


@router.get("/push-status")
async def get_push_status(user: dict = Depends(get_current_user)):
    """Get user's push notification subscription status"""
    db = get_db()
    
    subscriptions = await db.push_subscriptions.find(
        {"user_id": user["id"], "is_active": True},
        {"_id": 0, "endpoint": 1, "created_at": 1}
    ).to_list(10)
    
    return {
        "is_subscribed": len(subscriptions) > 0,
        "subscription_count": len(subscriptions)
    }


@router.post("/send-push")
async def send_push_notification(
    payload: NotificationPayload,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """Send push notification (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db = get_db()
    
    query = {"is_active": True}
    if payload.user_ids:
        query["user_id"] = {"$in": payload.user_ids}
    
    subscriptions = await db.push_subscriptions.find(query).to_list(None)
    
    if not subscriptions:
        return {"success": False, "message": "No active subscriptions found"}
    
    background_tasks.add_task(
        send_push_notifications_batch,
        subscriptions,
        {
            "title": payload.title,
            "body": payload.body,
            "icon": payload.icon,
            "badge": payload.badge,
            "tag": payload.tag,
            "data": {"url": payload.url}
        }
    )
    
    return {
        "success": True,
        "message": f"Sending to {len(subscriptions)} subscribers"
    }


async def send_push_notifications_batch(subscriptions: list, payload: dict):
    """Background task to send push notifications"""
    try:
        from pywebpush import webpush, WebPushException
        
        success_count = 0
        failed_count = 0
        db = get_db()
        
        for sub in subscriptions:
            try:
                subscription_info = json.loads(sub.get("subscription_json", "{}"))
                
                webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(payload),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims=VAPID_CLAIMS
                )
                success_count += 1
                
            except WebPushException as e:
                failed_count += 1
                if e.response and e.response.status_code in [404, 410]:
                    await db.push_subscriptions.update_one(
                        {"endpoint": sub["endpoint"]},
                        {"$set": {"is_active": False}}
                    )
            except Exception as e:
                failed_count += 1
                print(f"Push error: {e}")
        
        print(f"Push sent: {success_count} ok, {failed_count} failed")
        
    except ImportError:
        print("pywebpush not installed - notifications disabled")


# ============ NOTIFICATION HELPERS ============

async def create_notification(user_id: str, title: str, message: str, notification_type: str, link: str = None):
    """Helper to create in-app notification"""
    db = get_db()
    
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notification_type,
        "link": link,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.notifications.insert_one(notification)
    return notification


async def notify_order_update(user_id: str, order_id: str, status: str):
    """Send order status notification (in-app + push)"""
    db = get_db()
    
    status_messages = {
        "confirmed": "Your order has been confirmed!",
        "shipped": "Your order is on the way!",
        "delivered": "Your order has been delivered!",
        "cancelled": "Your order has been cancelled"
    }
    
    message = status_messages.get(status, f"Order status: {status}")
    
    # Create in-app notification
    await create_notification(
        user_id=user_id,
        title="Order Update",
        message=message,
        notification_type="order",
        link=f"/orders/{order_id}"
    )
    
    # Send push notification
    subscriptions = await db.push_subscriptions.find({
        "user_id": user_id,
        "is_active": True
    }).to_list(None)
    
    if subscriptions:
        await send_push_notifications_batch(
            subscriptions,
            {
                "title": "Order Update",
                "body": message,
                "icon": "/icons/icon-192x192.png",
                "tag": f"order-{order_id}",
                "data": {"url": f"/orders/{order_id}"}
            }
        )

