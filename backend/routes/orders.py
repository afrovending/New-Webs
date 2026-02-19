"""
AfroVending - Cart & Order Routes
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
from typing import List
import uuid

from database import get_db
from auth import get_current_user
from models import CartItem, OrderCreate, OrderResponse

router = APIRouter(tags=["Cart & Orders"])


# ==================== CART ====================
@router.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    """Get current user's cart"""
    db = get_db()
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
    db = get_db()
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
    db = get_db()
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
    db = get_db()
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Removed from cart"}


@router.delete("/cart")
async def clear_cart(user: dict = Depends(get_current_user)):
    """Clear entire cart"""
    db = get_db()
    await db.carts.delete_one({"user_id": user["id"]})
    return {"message": "Cart cleared"}


# ==================== ORDERS ====================
@router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    """Get current user's orders"""
    db = get_db()
    orders = await db.orders.find(
        {"user_id": user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return orders


@router.get("/orders/track/{order_id}")
async def get_order_tracking(order_id: str):
    """Public endpoint for order tracking - accessible without auth"""
    db = get_db()
    
    order = await db.orders.find_one(
        {"id": order_id},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Return limited info for public tracking
    return {
        "id": order.get("id"),
        "status": order.get("status"),
        "tracking_number": order.get("tracking_number"),
        "shipping_carrier": order.get("shipping_carrier"),
        "shipping_label_url": order.get("shipping_label_url"),
        "shipping_name": order.get("shipping_name"),
        "shipping_address": order.get("shipping_address"),
        "shipping_address2": order.get("shipping_address2"),
        "shipping_city": order.get("shipping_city"),
        "shipping_state": order.get("shipping_state"),
        "shipping_zip": order.get("shipping_zip"),
        "shipping_country": order.get("shipping_country"),
        "items": order.get("items", []),
        "total": order.get("total"),
        "estimated_delivery": order.get("estimated_delivery"),
        "timeline": order.get("timeline", []),
        "created_at": order.get("created_at")
    }


@router.get("/orders/history")
async def get_order_history(
    status: str = None,
    page: int = 1,
    limit: int = 10,
    user: dict = Depends(get_current_user)
):
    """Get order history with pagination"""
    db = get_db()
    query = {"user_id": user["id"]}
    if status and status != "all":
        query["status"] = status
    
    skip = (page - 1) * limit
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    
    return {"orders": orders, "total": total, "page": page, "limit": limit}


@router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    """Get single order by ID"""
    db = get_db()
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["user_id"] != user["id"] and user.get("role") != "admin":
        vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
        if not vendor:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return order


@router.get("/orders/{order_id}/detail")
async def get_order_detail(order_id: str, user: dict = Depends(get_current_user)):
    """Get detailed order info"""
    db = get_db()
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return order


@router.get("/vendor/orders")
async def get_vendor_orders(user: dict = Depends(get_current_user)):
    """Get orders for vendor's products"""
    db = get_db()
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="Vendor access required")
    
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
    db = get_db()
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
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
    
    # Trigger push notification for order status updates
    try:
        from routes.notifications import notify_order_update
        await notify_order_update(order["user_id"], order_id, status)
    except Exception as e:
        print(f"Push notification error: {e}")
    
    return {"message": f"Order status updated to {status}"}


@router.post("/orders/{order_id}/reorder")
async def reorder(order_id: str, user: dict = Depends(get_current_user)):
    """Reorder items from a previous order"""
    db = get_db()
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Add items to cart
    cart = await db.carts.find_one({"user_id": user["id"]})
    
    for item in order.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if not product or product["stock"] < item.get("quantity", 1):
            continue
        
        if cart:
            existing = next((i for i in cart.get("items", []) if i["product_id"] == item["product_id"]), None)
            if existing:
                await db.carts.update_one(
                    {"user_id": user["id"], "items.product_id": item["product_id"]},
                    {"$inc": {"items.$.quantity": item.get("quantity", 1)}}
                )
            else:
                await db.carts.update_one(
                    {"user_id": user["id"]},
                    {"$push": {"items": {"product_id": item["product_id"], "quantity": item.get("quantity", 1)}}}
                )
        else:
            await db.carts.insert_one({
                "user_id": user["id"],
                "items": [{"product_id": item["product_id"], "quantity": item.get("quantity", 1)}],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            cart = {"items": []}
    
    return {"message": "Items added to cart"}
