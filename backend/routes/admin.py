"""
AfroVending - Admin Routes
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import bcrypt
import os

from database import get_db
from auth import get_current_user
from email_service import email_service

router = APIRouter(prefix="/admin", tags=["Admin"])


async def require_admin(user: dict = Depends(get_current_user)):
    """Dependency to require admin role"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/stats")
async def get_admin_stats(user: dict = Depends(require_admin)):
    """Get admin dashboard statistics"""
    db = get_db()
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    
    total_users = await db.users.count_documents({})
    new_users_30d = await db.users.count_documents({"created_at": {"$gte": thirty_days_ago}})
    new_users_7d = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
    
    total_vendors = await db.vendors.count_documents({})
    approved_vendors = await db.vendors.count_documents({"is_approved": True})
    pending_vendors = await db.vendors.count_documents({"is_approved": False})
    verified_vendors = await db.vendors.count_documents({"is_verified": True})
    
    total_products = await db.products.count_documents({})
    active_products = await db.products.count_documents({"is_active": True})
    
    total_services = await db.services.count_documents({})
    
    total_orders = await db.orders.count_documents({})
    orders_30d = await db.orders.count_documents({"created_at": {"$gte": thirty_days_ago}})
    
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    pipeline_30d = [
        {"$match": {"payment_status": "paid", "created_at": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_30d_result = await db.orders.aggregate(pipeline_30d).to_list(1)
    revenue_30d = revenue_30d_result[0]["total"] if revenue_30d_result else 0
    
    return {
        "users": {
            "total": total_users,
            "new_30d": new_users_30d,
            "new_7d": new_users_7d,
            "growth_rate": round((new_users_30d / max(total_users - new_users_30d, 1)) * 100, 1)
        },
        "vendors": {
            "total": total_vendors,
            "approved": approved_vendors,
            "pending": pending_vendors,
            "verified": verified_vendors
        },
        "products": {
            "total": total_products,
            "active": active_products
        },
        "services": {
            "total": total_services
        },
        "orders": {
            "total": total_orders,
            "last_30d": orders_30d
        },
        "revenue": {
            "total": total_revenue,
            "last_30d": revenue_30d
        }
    }


@router.get("/vendors")
async def get_all_vendors(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    user: dict = Depends(require_admin)
):
    """Get all vendors for admin management"""
    db = get_db()
    query = {}
    if status == "pending":
        query["is_approved"] = False
    elif status == "approved":
        query["is_approved"] = True
    elif status == "verified":
        query["is_verified"] = True
    
    vendors = await db.vendors.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.vendors.count_documents(query)
    
    for vendor in vendors:
        vendor_user = await db.users.find_one({"id": vendor["user_id"]}, {"_id": 0, "email": 1, "first_name": 1, "last_name": 1})
        vendor["user"] = vendor_user
    
    return {"vendors": vendors, "total": total}


@router.put("/vendors/{vendor_id}/approve")
async def approve_vendor(vendor_id: str, user: dict = Depends(require_admin)):
    """Approve a vendor"""
    db = get_db()
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"is_approved": True, "approved_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Vendor approved"}


@router.put("/vendors/{vendor_id}/verify")
async def verify_vendor(vendor_id: str, user: dict = Depends(require_admin)):
    """Verify a vendor"""
    db = get_db()
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"is_verified": True, "verified_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Vendor verified"}


@router.put("/vendors/{vendor_id}/deactivate")
async def deactivate_vendor(
    vendor_id: str, 
    reason: str = "Policy violation",
    user: dict = Depends(require_admin)
):
    """Deactivate a vendor"""
    db = get_db()
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "is_active": False,
            "deactivated_at": datetime.now(timezone.utc).isoformat(),
            "deactivation_reason": reason
        }}
    )
    
    await db.products.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": False}})
    await db.services.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": False}})
    
    return {"message": "Vendor deactivated"}


@router.put("/vendors/{vendor_id}/activate")
async def activate_vendor(vendor_id: str, user: dict = Depends(require_admin)):
    """Reactivate a vendor"""
    db = get_db()
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "is_active": True,
            "reactivated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    await db.products.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": True}})
    await db.services.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": True}})
    
    return {"message": "Vendor reactivated"}


@router.get("/users")
async def get_all_users(
    role: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    user: dict = Depends(require_admin)
):
    """Get all users for admin management"""
    db = get_db()
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0, "hashed_password": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total}


@router.post("/check-price-alerts")
async def trigger_price_alert_check(user: dict = Depends(require_admin)):
    """Manually trigger price alert checks"""
    db = get_db()
    from routes.price_alerts import check_price_alerts_for_product
    
    alerts = await db.price_alerts.find({"is_active": True, "triggered": False}, {"_id": 0}).to_list(1000)
    
    checked = 0
    triggered = 0
    
    for alert in alerts:
        product = await db.products.find_one({"id": alert["product_id"]}, {"_id": 0})
        if product and product["price"] <= alert["target_price"]:
            await check_price_alerts_for_product(alert["product_id"], product["price"])
            triggered += 1
        checked += 1
    
    return {"message": "Price alert check completed", "checked": checked, "triggered": triggered}


@router.post("/seed-database")
async def seed_database_endpoint(user: dict = Depends(require_admin)):
    """
    Trigger database seeding with essential data.
    Protected endpoint - requires admin authentication.
    Seeds: Categories, Countries, Admin Account, Demo Vendor with Products/Services
    """
    db = get_db()
    results = {
        "categories_created": 0,
        "countries_created": 0,
        "users_created": 0,
        "products_created": 0,
        "services_created": 0,
        "skipped": []
    }
    
    # Production credentials from env or defaults
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@afrovending.com')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'AfroAdmin2024!')
    DEMO_VENDOR_EMAIL = os.environ.get('DEMO_VENDOR_EMAIL', 'vendor@afrovending.com')
    DEMO_VENDOR_PASSWORD = os.environ.get('DEMO_VENDOR_PASSWORD', 'AfroVendor2024!')
    
    # Product Categories
    PRODUCT_CATEGORIES = [
        {"name": "Fashion & Clothing", "slug": "fashion", "icon": "shirt", "description": "Traditional and modern African fashion"},
        {"name": "Home & Decor", "slug": "home", "icon": "home", "description": "African-inspired home decor and furnishings"},
        {"name": "Food & Beverages", "slug": "food", "icon": "utensils", "description": "Authentic African food products and ingredients"},
        {"name": "Beauty & Skincare", "slug": "beauty", "icon": "sparkles", "description": "Natural African beauty and skincare products"},
        {"name": "Health & Wellness", "slug": "health", "icon": "heart", "description": "Traditional remedies and wellness products"},
        {"name": "Art & Crafts", "slug": "art", "icon": "palette", "description": "Handcrafted African art and collectibles"},
        {"name": "Jewelry & Accessories", "slug": "jewelry", "icon": "gem", "description": "African-inspired jewelry and accessories"},
        {"name": "Music & Instruments", "slug": "music", "icon": "music", "description": "Traditional African instruments and music"},
    ]
    
    # Service Categories
    SERVICE_CATEGORIES = [
        {"name": "Hair & Beauty", "slug": "hair-beauty", "icon": "scissors", "description": "African hair styling and beauty services"},
        {"name": "Catering & Events", "slug": "catering", "icon": "chef-hat", "description": "African cuisine catering for events"},
        {"name": "Cultural Experiences", "slug": "cultural", "icon": "globe", "description": "African cultural tours and experiences"},
        {"name": "Fashion Design", "slug": "fashion-design", "icon": "ruler", "description": "Custom African fashion design services"},
        {"name": "Music & Entertainment", "slug": "entertainment", "icon": "mic", "description": "African musicians and entertainers"},
        {"name": "Health & Wellness", "slug": "wellness", "icon": "leaf", "description": "Traditional healing and wellness services"},
    ]
    
    # African Countries
    COUNTRIES = [
        {"code": "NG", "name": "Nigeria", "flag": "🇳🇬"},
        {"code": "GH", "name": "Ghana", "flag": "🇬🇭"},
        {"code": "KE", "name": "Kenya", "flag": "🇰🇪"},
        {"code": "ZA", "name": "South Africa", "flag": "🇿🇦"},
        {"code": "ET", "name": "Ethiopia", "flag": "🇪🇹"},
        {"code": "TZ", "name": "Tanzania", "flag": "🇹🇿"},
        {"code": "SN", "name": "Senegal", "flag": "🇸🇳"},
        {"code": "CM", "name": "Cameroon", "flag": "🇨🇲"},
        {"code": "CI", "name": "Ivory Coast", "flag": "🇨🇮"},
        {"code": "MA", "name": "Morocco", "flag": "🇲🇦"},
        {"code": "EG", "name": "Egypt", "flag": "🇪🇬"},
        {"code": "UG", "name": "Uganda", "flag": "🇺🇬"},
    ]
    
    # Sample Products
    SAMPLE_PRODUCTS = [
        {
            "name": "Traditional African Black Soap",
            "description": "Authentic raw African black soap from Ghana. Handmade using traditional methods with plantain skins, cocoa pods, and palm oil. Natural cleanser suitable for all skin types.",
            "price": 12.99, "compare_price": 18.00, "category_slug": "beauty", "stock": 100,
            "tags": ["black soap", "skincare", "organic", "ghana", "natural"], "country_code": "GH"
        },
        {
            "name": "Hand-Carved Djembe Drum",
            "description": "Authentic West African djembe drum, hand-carved from solid wood with genuine goatskin head. Professional quality sound with traditional rope tuning system.",
            "price": 195.00, "compare_price": 275.00, "category_slug": "music", "stock": 10,
            "tags": ["djembe", "drum", "music", "instrument", "wooden"], "country_code": "SN"
        },
        {
            "name": "African Print Headwrap Gele",
            "description": "Elegant pre-tied African headwrap in beautiful Ankara print fabric. Easy to wear, adjustable sizing fits most head sizes. Perfect for weddings, church, or cultural events.",
            "price": 28.00, "compare_price": 40.00, "category_slug": "fashion", "stock": 50,
            "tags": ["headwrap", "gele", "ankara", "fashion", "accessories"], "country_code": "NG"
        },
        {
            "name": "Shea Butter - Raw Unrefined",
            "description": "100% pure, raw, unrefined shea butter from Ghana. Rich in vitamins A and E. Perfect for skin moisturizing, hair care, and natural beauty routines.",
            "price": 15.99, "compare_price": 22.00, "category_slug": "beauty", "stock": 200,
            "tags": ["shea butter", "natural", "skincare", "ghana", "organic"], "country_code": "GH"
        },
        {
            "name": "Kente Cloth Table Runner",
            "description": "Authentic handwoven Kente cloth table runner from Ghana. Vibrant colors and traditional patterns. Perfect for adding African elegance to your dining space.",
            "price": 45.00, "compare_price": 65.00, "category_slug": "home", "stock": 25,
            "tags": ["kente", "table runner", "handwoven", "ghana", "decor"], "country_code": "GH"
        },
        {
            "name": "Ethiopian Coffee - Yirgacheffe",
            "description": "Premium single-origin Ethiopian coffee beans from the Yirgacheffe region. Light roast with floral and citrus notes. Freshly roasted and packaged.",
            "price": 18.99, "compare_price": 24.00, "category_slug": "food", "stock": 150,
            "tags": ["coffee", "ethiopian", "yirgacheffe", "organic", "arabica"], "country_code": "ET"
        },
        {
            "name": "Maasai Beaded Necklace",
            "description": "Handcrafted Maasai beaded necklace from Kenya. Traditional design with vibrant colors. Each piece is unique and supports local artisans.",
            "price": 35.00, "compare_price": 50.00, "category_slug": "jewelry", "stock": 40,
            "tags": ["maasai", "beaded", "necklace", "kenya", "handmade"], "country_code": "KE"
        },
        {
            "name": "Moringa Powder - Organic",
            "description": "100% organic moringa leaf powder from Nigeria. Superfood packed with nutrients, vitamins, and antioxidants. Add to smoothies, teas, or meals.",
            "price": 14.99, "compare_price": 20.00, "category_slug": "health", "stock": 100,
            "tags": ["moringa", "organic", "superfood", "nigeria", "health"], "country_code": "NG"
        },
    ]
    
    # Sample Services
    SAMPLE_SERVICES = [
        {
            "name": "African Hair Braiding",
            "description": "Professional African hair braiding services including box braids, cornrows, twists, and more. Using quality hair extensions and products.",
            "price": 120.00, "category_slug": "hair-beauty", "duration_minutes": 180, "location_type": "in_person",
            "tags": ["braiding", "hair", "cornrows", "twists", "styling"]
        },
        {
            "name": "African Cuisine Catering",
            "description": "Authentic African cuisine catering for events, parties, and gatherings. Menu includes Jollof rice, Egusi soup, Suya, and more traditional dishes.",
            "price": 350.00, "category_slug": "catering", "duration_minutes": 240, "location_type": "in_person",
            "tags": ["catering", "african food", "jollof", "events", "cuisine"]
        },
        {
            "name": "Djembe Drumming Lessons",
            "description": "Learn traditional West African djembe drumming from an experienced instructor. Individual or group lessons available for all skill levels.",
            "price": 60.00, "category_slug": "entertainment", "duration_minutes": 60, "location_type": "both",
            "tags": ["djembe", "drumming", "lessons", "music", "african"]
        },
        {
            "name": "Custom African Attire Design",
            "description": "Custom design and tailoring of traditional African attire. Agbada, Dashiki, Kente outfits, and more. Consultation included.",
            "price": 200.00, "category_slug": "fashion-design", "duration_minutes": 90, "location_type": "both",
            "tags": ["custom", "tailoring", "agbada", "dashiki", "fashion"]
        },
        {
            "name": "African Cultural Experience Tour",
            "description": "Guided tour of local African cultural sites, markets, and restaurants. Learn about African history, art, and traditions.",
            "price": 75.00, "category_slug": "cultural", "duration_minutes": 180, "location_type": "in_person",
            "tags": ["tour", "cultural", "history", "experience", "guided"]
        },
    ]
    
    try:
        # 1. Seed Product Categories
        category_map = {}
        for cat in PRODUCT_CATEGORIES:
            existing = await db.categories.find_one({"slug": cat["slug"], "type": "product"})
            if not existing:
                cat_id = str(uuid.uuid4())
                await db.categories.insert_one({
                    "id": cat_id,
                    "type": "product",
                    **cat,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                category_map[cat["slug"]] = cat_id
                results["categories_created"] += 1
            else:
                category_map[cat["slug"]] = existing["id"]
                results["skipped"].append(f"Product category: {cat['name']}")
        
        # 2. Seed Service Categories
        for cat in SERVICE_CATEGORIES:
            existing = await db.categories.find_one({"slug": cat["slug"], "type": "service"})
            if not existing:
                cat_id = str(uuid.uuid4())
                await db.categories.insert_one({
                    "id": cat_id,
                    "type": "service",
                    **cat,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                category_map[cat["slug"]] = cat_id
                results["categories_created"] += 1
            else:
                category_map[cat["slug"]] = existing["id"]
                results["skipped"].append(f"Service category: {cat['name']}")
        
        # 3. Seed Countries
        for country in COUNTRIES:
            existing = await db.countries.find_one({"code": country["code"]})
            if not existing:
                await db.countries.insert_one({
                    "id": str(uuid.uuid4()),
                    **country,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                results["countries_created"] += 1
            else:
                results["skipped"].append(f"Country: {country['name']}")
        
        # 4. Create Admin Account
        existing_admin = await db.users.find_one({"email": ADMIN_EMAIL})
        if not existing_admin:
            admin_id = str(uuid.uuid4())
            hashed_password = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            await db.users.insert_one({
                "id": admin_id,
                "email": ADMIN_EMAIL,
                "hashed_password": hashed_password,
                "first_name": "Admin",
                "last_name": "User",
                "role": "admin",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            results["users_created"] += 1
        else:
            results["skipped"].append(f"Admin: {ADMIN_EMAIL}")
        
        # 5. Create Demo Vendor Account
        existing_vendor_user = await db.users.find_one({"email": DEMO_VENDOR_EMAIL})
        vendor_id = None
        
        if not existing_vendor_user:
            vendor_user_id = str(uuid.uuid4())
            vendor_id = str(uuid.uuid4())
            hashed_password = bcrypt.hashpw(DEMO_VENDOR_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            await db.users.insert_one({
                "id": vendor_user_id,
                "email": DEMO_VENDOR_EMAIL,
                "hashed_password": hashed_password,
                "first_name": "Afro",
                "last_name": "Vendor",
                "role": "vendor",
                "vendor_id": vendor_id,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            await db.vendors.insert_one({
                "id": vendor_id,
                "user_id": vendor_user_id,
                "store_name": "AfroVending Official Store",
                "description": "Official demo store showcasing authentic African products and services from across the continent.",
                "country": "Nigeria",
                "country_code": "NG",
                "is_approved": True,
                "is_verified": True,
                "subscription_plan": "pro",
                "commission_rate": 10,
                "max_products": -1,
                "cultural_story": "We celebrate the rich heritage and craftsmanship of Africa, bringing authentic products directly from artisans to your doorstep.",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            results["users_created"] += 1
        else:
            vendor = await db.vendors.find_one({"user_id": existing_vendor_user["id"]})
            if vendor:
                vendor_id = vendor["id"]
            results["skipped"].append(f"Vendor: {DEMO_VENDOR_EMAIL}")
        
        # 6. Seed Products
        if vendor_id:
            for product in SAMPLE_PRODUCTS:
                existing = await db.products.find_one({"name": product["name"], "vendor_id": vendor_id})

                if not existing:
                    cat_id = category_map.get(product["category_slug"], "")
                    country = next((c for c in COUNTRIES if c["code"] == product["country_code"]), None)
                    
                    await db.products.insert_one({
                        "id": str(uuid.uuid4()),
                        "vendor_id": vendor_id,
                        "name": product["name"],
                        "description": product["description"],
                        "price": product["price"],
                        "compare_price": product["compare_price"],
                        "category_id": cat_id,
                        "images": [],
                        "stock": product["stock"],
                        "tags": product["tags"],
                        "is_active": True,
                        "average_rating": 4.5,
                        "review_count": 0,
                        "view_count": 0,
                        "country_code": product["country_code"],
                        "country_name": country["name"] if country else "",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
                    results["products_created"] += 1
                else:
                    results["skipped"].append(f"Product: {product['name']}")
            
            # 7. Seed Services
            for service in SAMPLE_SERVICES:
                existing = await db.services.find_one({"name": service["name"], "vendor_id": vendor_id})
                if not existing:
                    cat_id = category_map.get(service["category_slug"], "")
                    
                    await db.services.insert_one({
                        "id": str(uuid.uuid4()),
                        "vendor_id": vendor_id,
                        "name": service["name"],
                        "description": service["description"],
                        "price": service["price"],
                        "category_id": cat_id,
                        "images": [],
                        "duration_minutes": service["duration_minutes"],
                        "location_type": service["location_type"],
                        "tags": service["tags"],
                        "is_active": True,
                        "average_rating": 4.5,
                        "review_count": 0,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
                    results["services_created"] += 1
                else:
                    results["skipped"].append(f"Service: {service['name']}")
        
        return {
            "success": True,
            "message": "Database seeding completed successfully",
            "results": results,
            "credentials": {
                "admin": {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                "vendor": {"email": DEMO_VENDOR_EMAIL, "password": DEMO_VENDOR_PASSWORD}
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")


@router.get("/scheduler/status")
async def get_scheduler_status_endpoint(user: dict = Depends(require_admin)):
    """Get the current scheduler status"""
    from scheduler import get_scheduler_status
    return get_scheduler_status()


@router.post("/scheduler/trigger-payouts")
async def trigger_payouts_manually(user: dict = Depends(require_admin)):
    """Manually trigger the payout processing job"""
    from scheduler import process_scheduled_payouts
    result = await process_scheduled_payouts()
    return result


@router.get("/scheduler/logs")
async def get_scheduler_logs(
    limit: int = 20,
    user: dict = Depends(require_admin)
):
    """Get recent scheduler job logs"""
    db = get_db()
    logs = await db.scheduler_logs.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return {"logs": logs}


@router.get("/products/broken-images")
async def get_products_with_broken_images(
    user: dict = Depends(require_admin)
):
    """
    Identify products with missing or potentially broken images.
    Images are considered broken if:
    - No images at all (empty array)
    - Images stored locally (not Cloudinary URLs)
    - Images with /uploads/ path (ephemeral local storage)
    """
    db = get_db()
    
    # Get all products
    products = await db.products.find(
        {},
        {"_id": 0, "id": 1, "name": 1, "images": 1, "vendor_id": 1, "is_active": 1}
    ).to_list(None)
    
    broken_images = []
    no_images = []
    cloudinary_images = []
    
    for product in products:
        images = product.get("images", [])
        
        if not images or len(images) == 0:
            # No images at all
            no_images.append({
                "product_id": product["id"],
                "product_name": product["name"],
                "vendor_id": product["vendor_id"],
                "is_active": product.get("is_active", True),
                "issue": "No images uploaded"
            })
        else:
            # Check each image URL
            has_broken = False
            has_cloudinary = False
            broken_urls = []
            
            for img in images:
                img_url = img if isinstance(img, str) else img.get("url", "")
                
                if "cloudinary.com" in img_url or "res.cloudinary.com" in img_url:
                    has_cloudinary = True
                elif "/uploads/" in img_url or img_url.startswith("/uploads"):
                    # Local ephemeral storage - will be lost on redeployment
                    has_broken = True
                    broken_urls.append(img_url)
                elif img_url.startswith("http://localhost") or img_url.startswith("https://localhost"):
                    has_broken = True
                    broken_urls.append(img_url)
                elif not img_url.startswith("http"):
                    # Relative path - likely broken
                    has_broken = True
                    broken_urls.append(img_url)
            
            if has_broken:
                broken_images.append({
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "vendor_id": product["vendor_id"],
                    "is_active": product.get("is_active", True),
                    "issue": "Local/ephemeral storage images",
                    "broken_urls": broken_urls
                })
            elif has_cloudinary:
                cloudinary_images.append({
                    "product_id": product["id"],
                    "product_name": product["name"]
                })
    
    # Get vendor info for affected products
    vendor_ids = set()
    for item in broken_images + no_images:
        vendor_ids.add(item["vendor_id"])
    
    vendors_info = {}
    for vendor_id in vendor_ids:
        vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0, "store_name": 1, "user_id": 1})
        if vendor:
            user_info = await db.users.find_one({"id": vendor["user_id"]}, {"_id": 0, "email": 1})
            vendors_info[vendor_id] = {
                "store_name": vendor.get("store_name", "Unknown"),
                "email": user_info.get("email", "Unknown") if user_info else "Unknown"
            }
    
    # Add vendor info to results
    for item in broken_images + no_images:
        vendor_info = vendors_info.get(item["vendor_id"], {})
        item["vendor_store"] = vendor_info.get("store_name", "Unknown")
        item["vendor_email"] = vendor_info.get("email", "Unknown")
    
    return {
        "summary": {
            "total_products": len(products),
            "products_with_cloudinary_images": len(cloudinary_images),
            "products_with_broken_images": len(broken_images),
            "products_with_no_images": len(no_images),
            "total_needing_attention": len(broken_images) + len(no_images)
        },
        "broken_images": broken_images,
        "no_images": no_images,
        "affected_vendors": list(vendors_info.values()),
        "recommendation": "Vendors need to re-upload images for products listed above. New uploads will use Cloudinary and persist across deployments."
    }


@router.post("/products/notify-broken-images")
async def notify_vendors_broken_images(
    background_tasks: BackgroundTasks,
    user: dict = Depends(require_admin)
):
    """
    Send email notifications to all vendors with broken/missing product images.
    """
    db = get_db()
    
    # Get broken images data
    products = await db.products.find(
        {},
        {"_id": 0, "id": 1, "name": 1, "images": 1, "vendor_id": 1, "is_active": 1}
    ).to_list(None)
    
    # Group affected products by vendor
    vendor_products = {}
    
    for product in products:
        images = product.get("images", [])
        has_issue = False
        issue = ""
        
        if not images or len(images) == 0:
            has_issue = True
            issue = "No images uploaded"
        else:
            for img in images:
                img_url = img if isinstance(img, str) else img.get("url", "")
                if not ("cloudinary.com" in img_url or "res.cloudinary.com" in img_url):
                    if "/uploads/" in img_url or not img_url.startswith("http"):
                        has_issue = True
                        issue = "Image needs re-upload"
                        break
        
        if has_issue:
            vendor_id = product["vendor_id"]
            if vendor_id not in vendor_products:
                vendor_products[vendor_id] = []
            vendor_products[vendor_id].append({
                "product_id": product["id"],
                "product_name": product["name"],
                "issue": issue
            })
    
    # Send emails to each affected vendor
    emails_sent = 0
    emails_failed = 0
    vendors_notified = []
    
    for vendor_id, affected_products in vendor_products.items():
        vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0, "store_name": 1, "user_id": 1})
        if vendor:
            user_info = await db.users.find_one({"id": vendor["user_id"]}, {"_id": 0, "email": 1, "first_name": 1})
            if user_info and user_info.get("email"):
                vendor_name = vendor.get("store_name", user_info.get("first_name", "Vendor"))
                
                # Send email in background
                background_tasks.add_task(
                    email_service.send_broken_images_notification,
                    user_info["email"],
                    vendor_name,
                    affected_products
                )
                
                emails_sent += 1
                vendors_notified.append({
                    "store_name": vendor_name,
                    "email": user_info["email"],
                    "affected_products_count": len(affected_products)
                })
    
    return {
        "success": True,
        "message": f"Notification emails queued for {emails_sent} vendors",
        "vendors_notified": vendors_notified,
        "total_affected_products": sum(len(p) for p in vendor_products.values())
    }


