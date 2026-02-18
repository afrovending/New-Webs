"""
AfroVending - Cart & Order Routes
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
from typing import List
import uuid
import os

from database import get_db
from auth import get_current_user
from models import CartItem, OrderCreate, OrderResponse

router = APIRouter(tags=["Cart & Orders"])
# db initialized per-request


# ==================== CART ====================
@router.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    """Get current user's cart"""
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart:
        return {"items": [], "total": 0}
    
    items_with_details = []
    total = 0
    
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item_total = product["price"] * item["quantity"]
            items_with_details.append({
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "product": product,
                "subtotal": item_total
            })
            total += item_total
    
    return {"items": items_with_details, "total": total}


@router.post("/cart/add")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    """Add item to cart"""
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["stock"] < item.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")
    
    cart = await db.carts.find_one({"user_id": user["id"]})
    
    if cart:
        existing_item = next((i for i in cart["items"] if i["product_id"] == item.product_id), None)
        if existing_item:
            await db.carts.update_one(
                {"user_id": user["id"], "items.product_id": item.product_id},
                {"$set": {"items.$.quantity": existing_item["quantity"] + item.quantity}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["id"]},
                {"$push": {"items": {"product_id": item.product_id, "quantity": item.quantity}}}
            )
    else:
        await db.carts.insert_one({
            "user_id": user["id"],
            "items": [{"product_id": item.product_id, "quantity": item.quantity}],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": "Added to cart"}


@router.put("/cart/{product_id}")
async def update_cart_item(product_id: str, quantity: int, user: dict = Depends(get_current_user)):
    """Update cart item quantity"""
    if quantity <= 0:
        await db.carts.update_one(
            {"user_id": user["id"]},
            {"$pull": {"items": {"product_id": product_id}}}
        )
    else:
        await db.carts.update_one(
            {"user_id": user["id"], "items.product_id": product_id},
            {"$set": {"items.$.quantity": quantity}}
        )
    return {"message": "Cart updated"}


@router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, user: dict = Depends(get_current_user)):
    """Remove item from cart"""
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Removed from cart"}


@router.delete("/cart")
async def clear_cart(user: dict = Depends(get_current_user)):
    """Clear entire cart"""
    await db.carts.delete_one({"user_id": user["id"]})
    return {"message": "Cart cleared"}


# ==================== ORDERS ====================
@router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    """Get current user's orders"""
    orders = await db.orders.find(
        {"user_id": user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return orders


@router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    """Get single order by ID"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["user_id"] != user["id"] and user.get("role") != "admin":
        # Check if user is vendor of any product in order
        vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
        if not vendor:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return order


@router.get("/orders/{order_id}/detail")
async def get_order_detail(order_id: str, user: dict = Depends(get_current_user)):
    """Get detailed order info"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return order


@router.get("/vendor/orders")
async def get_vendor_orders(user: dict = Depends(get_current_user)):
    """Get orders for vendor's products"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="Vendor access required")
    
    # Get orders containing vendor's products
    orders = await db.orders.find(
        {"items.vendor_id": vendor["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders


@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str, 
    status: str, 
    tracking_number: str = None,
    user: dict = Depends(get_current_user)
):
    """Update order status (vendor or admin)"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    if user.get("role") != "admin":
        vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
        if not vendor:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if tracking_number:
        update_data["tracking_number"] = tracking_number
    
    # Add to timeline
    timeline_entry = {
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": f"Status updated to {status}"
    }
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": update_data,
            "$push": {"timeline": timeline_entry}
        }
    )
    
    return {"message": f"Order status updated to {status}"}
