"""
AfroVending Production Database Seeding Script
Seeds: Categories, Admin Account, Sample Vendor with Products/Services
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'afrovending_db')

# Production credentials (change these in production!)
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

# Sample Products for Demo Vendor
SAMPLE_PRODUCTS = [
    {
        "name": "Traditional African Black Soap",
        "description": "Authentic raw African black soap from Ghana. Handmade using traditional methods with plantain skins, cocoa pods, and palm oil. Natural cleanser suitable for all skin types.",
        "price": 12.99,
        "compare_price": 18.00,
        "category_slug": "beauty",
        "stock": 100,
        "tags": ["black soap", "skincare", "organic", "ghana", "natural"],
        "country_code": "GH"
    },
    {
        "name": "Hand-Carved Djembe Drum",
        "description": "Authentic West African djembe drum, hand-carved from solid wood with genuine goatskin head. Professional quality sound with traditional rope tuning system.",
        "price": 195.00,
        "compare_price": 275.00,
        "category_slug": "music",
        "stock": 10,
        "tags": ["djembe", "drum", "music", "instrument", "wooden"],
        "country_code": "SN"
    },
    {
        "name": "African Print Headwrap Gele",
        "description": "Elegant pre-tied African headwrap in beautiful Ankara print fabric. Easy to wear, adjustable sizing fits most head sizes. Perfect for weddings, church, or cultural events.",
        "price": 28.00,
        "compare_price": 40.00,
        "category_slug": "fashion",
        "stock": 50,
        "tags": ["headwrap", "gele", "ankara", "fashion", "accessories"],
        "country_code": "NG"
    },
    {
        "name": "Shea Butter - Raw Unrefined",
        "description": "100% pure, raw, unrefined shea butter from Ghana. Rich in vitamins A and E. Perfect for skin moisturizing, hair care, and natural beauty routines.",
        "price": 15.99,
        "compare_price": 22.00,
        "category_slug": "beauty",
        "stock": 200,
        "tags": ["shea butter", "natural", "skincare", "ghana", "organic"],
        "country_code": "GH"
    },
    {
        "name": "Kente Cloth Table Runner",
        "description": "Authentic handwoven Kente cloth table runner from Ghana. Vibrant colors and traditional patterns. Perfect for adding African elegance to your dining space.",
        "price": 45.00,
        "compare_price": 65.00,
        "category_slug": "home",
        "stock": 25,
        "tags": ["kente", "table runner", "handwoven", "ghana", "decor"],
        "country_code": "GH"
    },
    {
        "name": "Ethiopian Coffee - Yirgacheffe",
        "description": "Premium single-origin Ethiopian coffee beans from the Yirgacheffe region. Light roast with floral and citrus notes. Freshly roasted and packaged.",
        "price": 18.99,
        "compare_price": 24.00,
        "category_slug": "food",
        "stock": 150,
        "tags": ["coffee", "ethiopian", "yirgacheffe", "organic", "arabica"],
        "country_code": "ET"
    },
    {
        "name": "Maasai Beaded Necklace",
        "description": "Handcrafted Maasai beaded necklace from Kenya. Traditional design with vibrant colors. Each piece is unique and supports local artisans.",
        "price": 35.00,
        "compare_price": 50.00,
        "category_slug": "jewelry",
        "stock": 40,
        "tags": ["maasai", "beaded", "necklace", "kenya", "handmade"],
        "country_code": "KE"
    },
    {
        "name": "Moringa Powder - Organic",
        "description": "100% organic moringa leaf powder from Nigeria. Superfood packed with nutrients, vitamins, and antioxidants. Add to smoothies, teas, or meals.",
        "price": 14.99,
        "compare_price": 20.00,
        "category_slug": "health",
        "stock": 100,
        "tags": ["moringa", "organic", "superfood", "nigeria", "health"],
        "country_code": "NG"
    },
]

# Sample Services for Demo Vendor
SAMPLE_SERVICES = [
    {
        "name": "African Hair Braiding",
        "description": "Professional African hair braiding services including box braids, cornrows, twists, and more. Using quality hair extensions and products.",
        "price": 120.00,
        "category_slug": "hair-beauty",
        "duration_minutes": 180,
        "location_type": "in_person",
        "tags": ["braiding", "hair", "cornrows", "twists", "styling"]
    },
    {
        "name": "African Cuisine Catering",
        "description": "Authentic African cuisine catering for events, parties, and gatherings. Menu includes Jollof rice, Egusi soup, Suya, and more traditional dishes.",
        "price": 350.00,
        "category_slug": "catering",
        "duration_minutes": 240,
        "location_type": "in_person",
        "tags": ["catering", "african food", "jollof", "events", "cuisine"]
    },
    {
        "name": "Djembe Drumming Lessons",
        "description": "Learn traditional West African djembe drumming from an experienced instructor. Individual or group lessons available for all skill levels.",
        "price": 60.00,
        "category_slug": "entertainment",
        "duration_minutes": 60,
        "location_type": "both",
        "tags": ["djembe", "drumming", "lessons", "music", "african"]
    },
    {
        "name": "Custom African Attire Design",
        "description": "Custom design and tailoring of traditional African attire. Agbada, Dashiki, Kente outfits, and more. Consultation included.",
        "price": 200.00,
        "category_slug": "fashion-design",
        "duration_minutes": 90,
        "location_type": "both",
        "tags": ["custom", "tailoring", "agbada", "dashiki", "fashion"]
    },
    {
        "name": "African Cultural Experience Tour",
        "description": "Guided tour of local African cultural sites, markets, and restaurants. Learn about African history, art, and traditions.",
        "price": 75.00,
        "category_slug": "cultural",
        "duration_minutes": 180,
        "location_type": "in_person",
        "tags": ["tour", "cultural", "history", "experience", "guided"]
    },
]


async def seed_database():
    """Main seeding function"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🌱 Starting AfroVending Production Database Seeding...")
    print(f"📦 Database: {DB_NAME}")
    print("-" * 50)
    
    # 1. Seed Categories
    print("\n📂 Seeding Categories...")
    category_map = {}
    
    # Product categories
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
            print(f"  ✅ Product Category: {cat['name']}")
        else:
            category_map[cat["slug"]] = existing["id"]
            print(f"  ⏭️  Product Category exists: {cat['name']}")
    
    # Service categories
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
            print(f"  ✅ Service Category: {cat['name']}")
        else:
            category_map[cat["slug"]] = existing["id"]
            print(f"  ⏭️  Service Category exists: {cat['name']}")
    
    # 2. Seed Countries
    print("\n🌍 Seeding Countries...")
    for country in COUNTRIES:
        existing = await db.countries.find_one({"code": country["code"]})
        if not existing:
            await db.countries.insert_one({
                "id": str(uuid.uuid4()),
                **country,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            print(f"  ✅ Country: {country['name']} {country['flag']}")
        else:
            print(f"  ⏭️  Country exists: {country['name']}")
    
    # 3. Create Admin Account
    print("\n👑 Creating Admin Account...")
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
        print(f"  ✅ Admin: {ADMIN_EMAIL}")
    else:
        print(f"  ⏭️  Admin exists: {ADMIN_EMAIL}")
    
    # 4. Create Demo Vendor Account
    print("\n🏪 Creating Demo Vendor Account...")
    existing_vendor_user = await db.users.find_one({"email": DEMO_VENDOR_EMAIL})
    vendor_id = None
    
    if not existing_vendor_user:
        vendor_user_id = str(uuid.uuid4())
        vendor_id = str(uuid.uuid4())
        hashed_password = bcrypt.hashpw(DEMO_VENDOR_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create vendor user
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
        
        # Create vendor profile
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
        print(f"  ✅ Vendor: {DEMO_VENDOR_EMAIL}")
    else:
        vendor = await db.vendors.find_one({"user_id": existing_vendor_user["id"]})
        if vendor:
            vendor_id = vendor["id"]
        print(f"  ⏭️  Vendor exists: {DEMO_VENDOR_EMAIL}")
    
    # 5. Seed Additional Demo Vendors for Vendor Spotlight
    print("\n🌟 Seeding Vendor Spotlight Vendors...")
    SPOTLIGHT_VENDORS = [
        {
            "email": "amara.fashion@afrovending.com",
            "password": "AmaraVendor2024!",
            "first_name": "Amara",
            "last_name": "Okonkwo",
            "store_name": "Amara's Ankara Designs",
            "description": "Authentic Nigerian fashion designs featuring vibrant Ankara prints. Custom tailoring available.",
            "country": "Nigeria",
            "country_code": "NG",
            "story": "Growing up in Lagos, I watched my grandmother transform simple fabrics into stunning outfits. Her hands told stories through every stitch. Today, I carry on her legacy, bringing traditional Nigerian fashion to the world. Each piece I create honors the artisans who taught me that fashion is more than clothing—it's our history worn with pride.",
            "total_sales": 15420.50,
            "order_count": 156
        },
        {
            "email": "kwame.crafts@afrovending.com",
            "password": "KwameVendor2024!",
            "first_name": "Kwame",
            "last_name": "Asante",
            "store_name": "Ashanti Heritage Crafts",
            "description": "Handcrafted Ghanaian art and Kente cloth from master weavers in Bonwire village.",
            "country": "Ghana",
            "country_code": "GH",
            "story": "I am a third-generation Kente weaver from Bonwire, the birthplace of Kente cloth. My father taught me that each pattern has meaning—some tell stories of royalty, others of wisdom. Now I share these treasures globally, ensuring our ancient craft thrives for generations to come.",
            "total_sales": 28750.00,
            "order_count": 89
        },
        {
            "email": "fatima.beauty@afrovending.com",
            "password": "FatimaVendor2024!",
            "first_name": "Fatima",
            "last_name": "Diallo",
            "store_name": "Sahel Natural Beauty",
            "description": "Pure shea butter and natural beauty products sourced directly from women's cooperatives in Senegal.",
            "country": "Senegal",
            "country_code": "SN",
            "story": "In my village, women have been making shea butter for centuries. When I started AfroVending, I wanted to connect these hardworking women with customers who appreciate pure, natural products. Every jar of shea butter supports a family and preserves our traditions.",
            "total_sales": 42300.75,
            "order_count": 312
        },
        {
            "email": "kofi.drums@afrovending.com",
            "password": "KofiVendor2024!",
            "first_name": "Kofi",
            "last_name": "Mensah",
            "store_name": "Rhythm of Africa",
            "description": "Authentic djembe drums and traditional musical instruments handcrafted by master artisans.",
            "country": "Ghana",
            "country_code": "GH",
            "story": "Music runs through my veins. My grandfather was a master djembe maker who carved drums for village ceremonies. Today, his rhythms echo worldwide through instruments I craft with the same love and precision. Each drum carries the heartbeat of Africa.",
            "total_sales": 18900.00,
            "order_count": 67
        }
    ]
    
    for vendor_data in SPOTLIGHT_VENDORS:
        existing_user = await db.users.find_one({"email": vendor_data["email"]})
        if not existing_user:
            vendor_user_id = str(uuid.uuid4())
            spotlight_vendor_id = str(uuid.uuid4())
            hashed_password = bcrypt.hashpw(vendor_data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            await db.users.insert_one({
                "id": vendor_user_id,
                "email": vendor_data["email"],
                "hashed_password": hashed_password,
                "first_name": vendor_data["first_name"],
                "last_name": vendor_data["last_name"],
                "role": "vendor",
                "vendor_id": spotlight_vendor_id,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            await db.vendors.insert_one({
                "id": spotlight_vendor_id,
                "user_id": vendor_user_id,
                "store_name": vendor_data["store_name"],
                "description": vendor_data["description"],
                "country": vendor_data["country"],
                "country_code": vendor_data["country_code"],
                "is_approved": True,
                "is_verified": True,
                "subscription_plan": "pro",
                "commission_rate": 10,
                "max_products": -1,
                "story": vendor_data["story"],
                "cultural_story": vendor_data["story"],
                "total_sales": vendor_data["total_sales"],
                "order_count": vendor_data["order_count"],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            print(f"  ✅ Spotlight Vendor: {vendor_data['store_name']}")
        else:
            # Update existing vendor with story if missing
            vendor = await db.vendors.find_one({"user_id": existing_user["id"]})
            if vendor and not vendor.get("story"):
                await db.vendors.update_one(
                    {"id": vendor["id"]},
                    {"$set": {
                        "story": vendor_data["story"],
                        "cultural_story": vendor_data["story"],
                        "total_sales": vendor_data["total_sales"],
                        "order_count": vendor_data["order_count"]
                    }}
                )
                print(f"  🔄 Updated Spotlight Vendor: {vendor_data['store_name']}")
            else:
                print(f"  ⏭️  Spotlight Vendor exists: {vendor_data['store_name']}")
    
    # 5. Seed Sample Products
    if vendor_id:
        print("\n📦 Seeding Sample Products...")
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
                print(f"  ✅ Product: {product['name']}")
            else:
                print(f"  ⏭️  Product exists: {product['name']}")
        
        # 6. Seed Sample Services
        print("\n💼 Seeding Sample Services...")
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
                print(f"  ✅ Service: {service['name']}")
            else:
                print(f"  ⏭️  Service exists: {service['name']}")
    
    print("\n" + "=" * 50)
    print("✨ Database seeding complete!")
    print("=" * 50)
    print(f"\n📋 Credentials:")
    print(f"  Admin:  {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print(f"  Vendor: {DEMO_VENDOR_EMAIL} / {DEMO_VENDOR_PASSWORD}")
    print("\n")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
