"""
AfroVending - Wishlist Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("")
async def get_wishlist(user: dict = Depends(get_current_user)):
    """Get user's wishlist with product details"""
    db = get_db()
    wishlist = await db.wishlists.find_one({"user_id": user["id"]}, {"_id": 0})
    
    if not wishlist or not wishlist.get("product_ids"):
        return {"items": [], "count": 0}
    
    products = await db.products.find(
        {"id": {"$in": wishlist["product_ids"]}},
        {"_id": 0}
    ).to_list(100)
    
    for product in products:
        vendor = await db.vendors.find_one({"id": product["vendor_id"]}, {"_id": 0, "store_name": 1})
        product["vendor_name"] = vendor.get("store_name") if vendor else "Unknown"
    
    return {"items": products, "count": len(products)}


@router.post("/{product_id}")
async def add_to_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    """Add product to wishlist"""
    db = get_db()
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    wishlist = await db.wishlists.find_one({"user_id": user["id"]})
    
    if wishlist:
        if product_id in wishlist.get("product_ids", []):
            return {"message": "Product already in wishlist", "in_wishlist": True}
        
        await db.wishlists.update_one(
            {"user_id": user["id"]},
            {
                "$addToSet": {"product_ids": product_id},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
    else:
        await db.wishlists.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "product_ids": [product_id],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": "Added to wishlist", "in_wishlist": True}


@router.delete("/{product_id}")
async def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    """Remove product from wishlist"""
    db = get_db()
    result = await db.wishlists.update_one(
        {"user_id": user["id"]},
        {
            "$pull": {"product_ids": product_id},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.modified_count == 0:
        return {"message": "Product not in wishlist", "in_wishlist": False}
    
    return {"message": "Removed from wishlist", "in_wishlist": False}


@router.get("/check/{product_id}")
async def check_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    """Check if product is in wishlist"""
    db = get_db()
    wishlist = await db.wishlists.find_one({"user_id": user["id"]}, {"_id": 0})
    
    in_wishlist = wishlist and product_id in wishlist.get("product_ids", [])
    return {"in_wishlist": in_wishlist}


@router.post("/{product_id}/move-to-cart")
async def move_to_cart(product_id: str, user: dict = Depends(get_current_user)):
    """Move item from wishlist to cart"""
    db = get_db()
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["stock"] < 1:
        raise HTTPException(status_code=400, detail="Product out of stock")
    
    cart = await db.carts.find_one({"user_id": user["id"]})
    
    if cart:
        existing = next((i for i in cart.get("items", []) if i["product_id"] == product_id), None)
        if existing:
            await db.carts.update_one(
                {"user_id": user["id"], "items.product_id": product_id},
                {"$inc": {"items.$.quantity": 1}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["id"]},
                {"$push": {"items": {"product_id": product_id, "quantity": 1}}}
            )
    else:
        await db.carts.insert_one({
            "user_id": user["id"],
            "items": [{"product_id": product_id, "quantity": 1}],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.wishlists.update_one(
        {"user_id": user["id"]},
        {"$pull": {"product_ids": product_id}}
    )
    
    return {"message": "Moved to cart"}
