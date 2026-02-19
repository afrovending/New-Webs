"""
AfroVending - Checkout Routes
Customer checkout and payment processing with Stripe
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
import stripe
import os
import uuid

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/checkout", tags=["Checkout"])

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_API_KEY")


@router.post("/order/{order_id}")
async def create_checkout_session(
    order_id: str,
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Create a Stripe Checkout session for an order"""
    db = get_db()
    
    # Get the order
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")
    
    body = await request.json()
    origin_url = body.get("origin_url", os.environ.get("FRONTEND_URL", "https://afrovending.com"))
    
    try:
        # Build line items from order
        line_items = []
        
        for item in order.get("items", []):
            # Get product details
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            
            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": item.get("name") or (product.get("name") if product else "Product"),
                        "description": f"Qty: {item.get('quantity', 1)}",
                        "images": [item.get("image") or (product.get("images", [None])[0] if product else None)] if (item.get("image") or (product and product.get("images"))) else []
                    },
                    "unit_amount": int(float(item.get("price", 0)) * 100),  # Convert to cents
                },
                "quantity": item.get("quantity", 1),
            })
        
        # Add shipping as a line item if applicable
        shipping_cost = order.get("shipping_cost", 0)
        if shipping_cost > 0:
            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": "Shipping",
                        "description": f"Delivery to {order.get('shipping_country', 'your address')}"
                    },
                    "unit_amount": int(float(shipping_cost) * 100),
                },
                "quantity": 1,
            })
        
        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}",
            cancel_url=f"{origin_url}/checkout/cancel?order_id={order_id}",
            customer_email=user.get("email"),
            metadata={
                "order_id": order_id,
                "user_id": user["id"],
                "platform": "afrovending"
            },
            billing_address_collection="required",
            shipping_address_collection={
                "allowed_countries": ["US", "CA", "GB", "AU", "NG", "GH", "KE", "ZA", "DE", "FR", "IT", "ES", "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI", "IE", "PL", "PT", "CZ", "GR", "BR", "MX", "JP", "KR", "SG", "MY", "TH", "IN", "AE"]
            }
        )
        
        # Update order with checkout session ID
        await db.orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "stripe_checkout_session_id": checkout_session.id,
                    "checkout_started_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")


@router.get("/success")
async def checkout_success(session_id: str, order_id: str):
    """Handle successful checkout - called from success URL"""
    db = get_db()
    
    try:
        # Verify the session
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == "paid":
            # Update order status
            await db.orders.update_one(
                {"id": order_id},
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": "confirmed",
                        "stripe_payment_intent": session.payment_intent,
                        "paid_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            return {
                "success": True,
                "order_id": order_id,
                "message": "Payment successful"
            }
        
        return {
            "success": False,
            "order_id": order_id,
            "message": "Payment not completed"
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks for payment events"""
    db = get_db()
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        else:
            # For development without webhook signature
            import json
            event = json.loads(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")
        user_id = session.get("metadata", {}).get("user_id")
        
        if order_id and session["payment_status"] == "paid":
            await db.orders.update_one(
                {"id": order_id},
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": "confirmed",
                        "stripe_payment_intent": session.get("payment_intent"),
                        "paid_at": datetime.now(timezone.utc).isoformat()
                    },
                    "$push": {
                        "timeline": {
                            "status": "confirmed",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "note": "Payment received - order confirmed"
                        }
                    }
                }
            )
            
            # Get order and user details for email
            order = await db.orders.find_one({"id": order_id}, {"_id": 0})
            user = await db.users.find_one({"id": user_id}, {"_id": 0}) if user_id else None
            
            if order:
                # Send push notification to customer
                try:
                    from routes.notifications import notify_order_update
                    await notify_order_update(order["user_id"], order_id, "confirmed")
                except Exception as e:
                    print(f"Push notification error: {e}")
                
                # Send "Purchase Complete" email to customer
                try:
                    from email_service import email_service
                    user_email = session.get("customer_email") or (user.get("email") if user else None)
                    frontend_url = os.environ.get("FRONTEND_URL", "https://afrovending.com")
                    
                    if user_email:
                        email_service.send_purchase_complete(user_email, order, frontend_url)
                        print(f"Purchase complete email sent to {user_email}")
                    
                    # Send "New Order" email to each vendor with items in this order
                    vendor_items_map = {}  # vendor_id -> list of items
                    for item in order.get("items", []):
                        vendor_id = item.get("vendor_id")
                        if vendor_id:
                            if vendor_id not in vendor_items_map:
                                vendor_items_map[vendor_id] = []
                            vendor_items_map[vendor_id].append(item)
                    
                    # Notify each vendor
                    for vendor_id, vendor_items in vendor_items_map.items():
                        try:
                            vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
                            if vendor:
                                vendor_user = await db.users.find_one({"id": vendor.get("user_id")}, {"_id": 0})
                                if vendor_user and vendor_user.get("email"):
                                    vendor_name = vendor.get("store_name") or vendor.get("business_name") or "Vendor"
                                    email_service.send_vendor_new_order(
                                        vendor_user["email"],
                                        vendor_name,
                                        order,
                                        vendor_items,
                                        frontend_url
                                    )
                                    print(f"Vendor notification sent to {vendor_user['email']} for order {order_id[:8]}")
                        except Exception as ve:
                            print(f"Error notifying vendor {vendor_id}: {ve}")
                    
                    # Check for low stock and notify vendors
                    await check_and_notify_low_stock(db, order, email_service, frontend_url)
                            
                except Exception as e:
                    print(f"Email notification error: {e}")
    
    elif event["type"] == "payment_intent.payment_failed":
        payment_intent = event["data"]["object"]
        # Handle failed payment
        order_id = payment_intent.get("metadata", {}).get("order_id")
        if order_id:
            await db.orders.update_one(
                {"id": order_id},
                {
                    "$set": {
                        "payment_status": "failed",
                        "payment_failed_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
    
    return {"status": "success"}


@router.post("/cart")
async def create_cart_checkout(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Create checkout directly from cart without pre-creating order"""
    db = get_db()
    body = await request.json()
    
    items = body.get("items", [])
    shipping_info = body.get("shipping", {})
    origin_url = body.get("origin_url", os.environ.get("FRONTEND_URL", "https://afrovending.com"))
    
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Create order first
    order_id = str(uuid.uuid4())
    order_items = []
    subtotal = 0
    
    for item in items:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if not product:
            continue
        
        item_total = float(product["price"]) * int(item.get("quantity", 1))
        subtotal += item_total
        
        order_items.append({
            "product_id": item["product_id"],
            "name": product["name"],
            "price": product["price"],
            "quantity": item.get("quantity", 1),
            "image": product.get("images", [None])[0] if product.get("images") else None,
            "vendor_id": product.get("vendor_id")
        })
    
    # Calculate shipping
    shipping_cost = body.get("shipping_cost", 0)
    total = subtotal + shipping_cost
    
    # Create order
    order = {
        "id": order_id,
        "user_id": user["id"],
        "items": order_items,
        "subtotal": subtotal,
        "shipping_cost": shipping_cost,
        "total": total,
        "status": "pending",
        "payment_status": "pending",
        "shipping_name": shipping_info.get("name"),
        "shipping_address": shipping_info.get("address"),
        "shipping_address2": shipping_info.get("address2"),
        "shipping_city": shipping_info.get("city"),
        "shipping_state": shipping_info.get("state"),
        "shipping_zip": shipping_info.get("zip"),
        "shipping_country": shipping_info.get("country"),
        "shipping_phone": shipping_info.get("phone"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order)
    
    # Now create checkout session
    try:
        line_items = []
        
        for item in order_items:
            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": item["name"],
                        "images": [item["image"]] if item.get("image") else []
                    },
                    "unit_amount": int(float(item["price"]) * 100),
                },
                "quantity": item["quantity"],
            })
        
        if shipping_cost > 0:
            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": "Shipping",
                    },
                    "unit_amount": int(float(shipping_cost) * 100),
                },
                "quantity": 1,
            })
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}",
            cancel_url=f"{origin_url}/checkout/cancel?order_id={order_id}",
            customer_email=user.get("email"),
            metadata={
                "order_id": order_id,
                "user_id": user["id"]
            }
        )
        
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"stripe_checkout_session_id": checkout_session.id}}
        )
        
        # Send "Order Placed" notification to user
        try:
            from routes.notifications import notify_order_update
            await notify_order_update(user["id"], order_id, "placed")
        except Exception as e:
            print(f"Order placed notification error: {e}")
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "order_id": order_id
        }
        
    except stripe.error.StripeError as e:
        # Delete the order if checkout fails
        await db.orders.delete_one({"id": order_id})
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
