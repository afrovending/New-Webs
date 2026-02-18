"""
AfroVending - Booking Routes
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
import uuid

from database import get_db
from auth import get_current_user
from models import BookingCreate, BookingResponse

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("")
async def get_bookings(user: dict = Depends(get_current_user)):
    """Get current user's bookings"""
    db = get_db()
    bookings = await db.bookings.find(
        {"customer_id": user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return bookings


@router.get("/vendor")
async def get_vendor_bookings(user: dict = Depends(get_current_user)):
    """Get bookings for vendor's services"""
    db = get_db()
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="Vendor access required")
    
    bookings = await db.bookings.find(
        {"vendor_id": vendor["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return bookings


@router.post("", response_model=BookingResponse)
async def create_booking(
    booking_data: BookingCreate, 
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """Create a new booking"""
    db = get_db()
    service = await db.services.find_one({"id": booking_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if slot is available
    existing = await db.bookings.find_one({
        "service_id": booking_data.service_id,
        "booking_date": booking_data.booking_date,
        "booking_time": booking_data.booking_time,
        "status": {"$ne": "cancelled"}
    })
    if existing:
        raise HTTPException(status_code=400, detail="This time slot is not available")
    
    booking = {
        "id": str(uuid.uuid4()),
        "service_id": booking_data.service_id,
        "service_name": service["name"],
        "customer_id": user["id"],
        "customer_name": f"{user.get('first_name', '')} {user.get('last_name', '')}",
        "customer_email": user.get("email"),
        "vendor_id": service["vendor_id"],
        "booking_date": booking_data.booking_date,
        "booking_time": booking_data.booking_time,
        "notes": booking_data.notes,
        "customer_address": booking_data.customer_address,
        "status": "pending",
        "payment_status": "pending",
        "price": service["price"],
        "delivery_confirmed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking)
    await db.services.update_one({"id": service["id"]}, {"$inc": {"booking_count": 1}})
    
    return BookingResponse(**{k: v for k, v in booking.items() if k != "_id"})


@router.put("/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str, user: dict = Depends(get_current_user)):
    """Update booking status"""
    db = get_db()
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Only vendor or customer can update
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    is_vendor = vendor and vendor["id"] == booking["vendor_id"]
    is_customer = user["id"] == booking["customer_id"]
    
    if not is_vendor and not is_customer and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.bookings.update_one(
        {"id": booking_id}, 
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Booking status updated to {status}"}


@router.put("/{booking_id}/confirm-delivery")
async def confirm_delivery(booking_id: str, user: dict = Depends(get_current_user)):
    """Customer confirms service delivery"""
    db = get_db()
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if user["id"] != booking["customer_id"]:
        raise HTTPException(status_code=403, detail="Only the customer can confirm delivery")
    
    if booking.get("delivery_confirmed"):
        raise HTTPException(status_code=400, detail="Delivery already confirmed")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "delivery_confirmed": True,
            "status": "completed",
            "delivery_confirmed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update vendor stats
    await db.vendors.update_one(
        {"id": booking["vendor_id"]},
        {"$inc": {"total_sales": booking["price"]}}
    )
    
    return {"message": "Delivery confirmed successfully"}
