"""
AfroVending - Service Routes
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from database import get_db
from auth import get_current_user
from models import ServiceCreate, ServiceResponse

router = APIRouter(prefix="/services", tags=["Services"])
db = get_db()


@router.get("")
async def get_services(
    category_id: Optional[str] = None,
    vendor_id: Optional[str] = None,
    country: Optional[str] = None,
    location_type: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get services with optional filters"""
    query = {"is_active": True}
    
    if category_id:
        query["category_id"] = category_id
    if vendor_id:
        query["vendor_id"] = vendor_id
    if location_type:
        query["location_type"] = {"$in": [location_type, "both"]}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        if "price" in query:
            query["price"]["$lte"] = max_price
        else:
            query["price"] = {"$lte": max_price}
    
    if country:
        vendor_ids = await db.vendors.distinct("id", {"country": country})
        query["vendor_id"] = {"$in": vendor_ids}
    
    services = await db.services.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return services


@router.get("/{service_id}")
async def get_service(service_id: str):
    """Get single service by ID"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    vendor = await db.vendors.find_one({"id": service["vendor_id"]}, {"_id": 0})
    service["vendor"] = vendor
    
    return service


@router.post("", response_model=ServiceResponse)
async def create_service(service_data: ServiceCreate, user: dict = Depends(get_current_user)):
    """Create a new service"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="Only vendors can create services")
    
    service = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor["id"],
        **service_data.model_dump(),
        "is_active": True,
        "average_rating": 0,
        "review_count": 0,
        "booking_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.services.insert_one(service)
    
    return ServiceResponse(**{k: v for k, v in service.items() if k != "_id"})


@router.put("/{service_id}")
async def update_service(service_id: str, service_data: ServiceCreate, user: dict = Depends(get_current_user)):
    """Update a service"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor or (vendor["id"] != service["vendor_id"] and user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.services.update_one({"id": service_id}, {"$set": service_data.model_dump()})
    return {"message": "Service updated"}


@router.delete("/{service_id}")
async def delete_service(service_id: str, user: dict = Depends(get_current_user)):
    """Delete a service"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor or (vendor["id"] != service["vendor_id"] and user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.services.delete_one({"id": service_id})
    return {"message": "Service deleted"}


@router.get("/{service_id}/timeslots")
async def get_service_timeslots(service_id: str, date: str):
    """Get available time slots for a service on a specific date"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get existing bookings for this service on this date
    existing_bookings = await db.bookings.find({
        "service_id": service_id,
        "booking_date": date,
        "status": {"$ne": "cancelled"}
    }, {"_id": 0, "booking_time": 1}).to_list(100)
    
    booked_times = [b["booking_time"] for b in existing_bookings]
    
    # Generate available time slots (9 AM to 5 PM)
    all_slots = [f"{h:02d}:00" for h in range(9, 17)]
    available_slots = [slot for slot in all_slots if slot not in booked_times]
    
    return {"date": date, "available_slots": available_slots, "booked_slots": booked_times}
