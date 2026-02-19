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
