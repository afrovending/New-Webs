"""
AfroVending - Product Routes
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from datetime import datetime, timezone
from typing import Optional, List
import uuid

from database import get_db
from auth import get_current_user
from models import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])
db = get_db()


@router.get("")
async def get_products(
    category_id: Optional[str] = None,
    vendor_id: Optional[str] = None,
    country: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: str = "newest",
    skip: int = 0,
    limit: int = 20
):
    """Get products with optional filters"""
    query = {"is_active": True}
    
    if category_id:
        query["category_id"] = category_id
    if vendor_id:
        query["vendor_id"] = vendor_id
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
    
    sort_options = {
        "newest": [("created_at", -1)],
        "price_low": [("price", 1)],
        "price_high": [("price", -1)],
        "popular": [("sales_count", -1)],
        "rating": [("average_rating", -1)]
    }
    
    products = await db.products.find(query, {"_id": 0}).sort(
        sort_options.get(sort, [("created_at", -1)])
    ).skip(skip).limit(limit).to_list(limit)
    
    return products


@router.get("/{product_id}")
async def get_product(product_id: str):
    """Get single product by ID"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"id": product["vendor_id"]}, {"_id": 0})
    product["vendor"] = vendor
    
    return product


@router.post("", response_model=ProductResponse)
async def create_product(product_data: ProductCreate, user: dict = Depends(get_current_user)):
    """Create a new product"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="Only vendors can create products")
    
    product = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor["id"],
        **product_data.model_dump(),
        "is_active": True,
        "average_rating": 0,
        "review_count": 0,
        "sales_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product)
    await db.vendors.update_one({"id": vendor["id"]}, {"$inc": {"product_count": 1}})
    
    return ProductResponse(**{k: v for k, v in product.items() if k != "_id"})


@router.put("/{product_id}")
async def update_product(
    product_id: str, 
    product_data: ProductCreate, 
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """Update a product"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor or (vendor["id"] != product["vendor_id"] and user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    old_price = product.get("price", 0)
    new_price = product_data.price
    
    await db.products.update_one({"id": product_id}, {"$set": product_data.model_dump()})
    
    # If price dropped, check price alerts in background
    if new_price < old_price:
        from routes.price_alerts import check_price_alerts_for_product
        background_tasks.add_task(check_price_alerts_for_product, product_id, new_price)
    
    return {"message": "Product updated"}


@router.delete("/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    """Delete a product"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor or (vendor["id"] != product["vendor_id"] and user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.delete_one({"id": product_id})
    await db.vendors.update_one({"id": vendor["id"]}, {"$inc": {"product_count": -1}})
    
    return {"message": "Product deleted"}
