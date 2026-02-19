"""
AfroVending - Vendor Routes
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional
import uuid

from database import get_db
from auth import get_current_user
from models import VendorCreate, VendorResponse

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.get("")
async def get_vendors(
    country: Optional[str] = None,
    verified: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get vendors with optional filters"""
    db = get_db()
    query = {"is_approved": True}
    
    if country:
        query["country"] = country
    if verified is not None:
        query["is_verified"] = verified
    if search:
        query["$or"] = [
            {"store_name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    vendors = await db.vendors.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return vendors


@router.get("/{vendor_id}")
async def get_vendor(vendor_id: str):
    """Get single vendor by ID"""
    db = get_db()
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.post("", response_model=VendorResponse)
async def create_vendor(vendor_data: VendorCreate, user: dict = Depends(get_current_user)):
    """Create a new vendor profile"""
    db = get_db()
    existing = await db.vendors.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Vendor profile already exists")
    
    vendor_id = str(uuid.uuid4())
    vendor = {
        "id": vendor_id,
        "user_id": user["id"],
        **vendor_data.model_dump(),
        "is_approved": True,  # Auto-approve
        "is_verified": False,
        "subscription_plan": "free",
        "commission_rate": 15,
        "max_products": 10,
        "product_count": 0,
        "total_sales": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vendors.insert_one(vendor)
    
    # Update user with vendor_id
    await db.users.update_one({"id": user["id"]}, {"$set": {"vendor_id": vendor_id, "role": "vendor"}})
    
    return VendorResponse(**{k: v for k, v in vendor.items() if k != "_id"})


@router.post("/setup")
async def setup_vendor_profile(user: dict = Depends(get_current_user)):
    """Setup vendor profile for existing users who registered as vendor but don't have a profile"""
    db = get_db()
    
    # Check if already has vendor profile
    existing = await db.vendors.find_one({"user_id": user["id"]})
    if existing:
        return {"message": "Vendor profile already exists", "vendor_id": existing["id"]}
    
    # Create vendor profile
    vendor_id = str(uuid.uuid4())
    vendor = {
        "id": vendor_id,
        "user_id": user["id"],
        "store_name": f"{user.get('first_name', 'My')}'s Store",
        "description": "Welcome to my African marketplace store!",
        "country": "Nigeria",
        "country_code": "NG",
        "is_approved": True,
        "is_verified": False,
        "subscription_plan": "free",
        "commission_rate": 15,
        "max_products": 10,
        "product_count": 0,
        "total_sales": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vendors.insert_one(vendor)
    
    # Update user with vendor_id and role
    await db.users.update_one({"id": user["id"]}, {"$set": {"vendor_id": vendor_id, "role": "vendor"}})
    
    return {"message": "Vendor profile created successfully", "vendor_id": vendor_id}
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **vendor_data.model_dump(),
        "is_approved": False,
        "is_verified": False,
        "is_active": True,
        "total_sales": 0,
        "product_count": 0,
        "average_rating": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vendors.insert_one(vendor)
    await db.users.update_one({"id": user["id"]}, {"$set": {"role": "vendor", "vendor_id": vendor["id"]}})
    
    return VendorResponse(**{k: v for k, v in vendor.items() if k != "_id"})


@router.put("/{vendor_id}")
async def update_vendor(vendor_id: str, vendor_data: VendorCreate, user: dict = Depends(get_current_user)):
    """Update vendor profile"""
    db = get_db()
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if vendor["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.vendors.update_one({"id": vendor_id}, {"$set": vendor_data.model_dump()})
    return {"message": "Vendor updated"}


@router.get("/{vendor_id}/products")
async def get_vendor_products(vendor_id: str, skip: int = 0, limit: int = 20):
    """Get all products for a vendor"""
    db = get_db()
    products = await db.products.find(
        {"vendor_id": vendor_id, "is_active": True}, 
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    return products


@router.get("/{vendor_id}/services")
async def get_vendor_services(vendor_id: str, skip: int = 0, limit: int = 20):
    """Get all services for a vendor"""
    db = get_db()
    services = await db.services.find(
        {"vendor_id": vendor_id, "is_active": True}, 
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    return services
