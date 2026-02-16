"""
AfroVending - African Marketplace Backend
Complete API with Products, Vendors, Orders, Services, Bookings, Payments
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import os
import uuid
import bcrypt
import jwt
import httpx
import logging

load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'afrovending_db')]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# App Setup
app = FastAPI(title="AfroVending API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str = "customer"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    picture: Optional[str] = None
    vendor_id: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    user: UserResponse

class VendorCreate(BaseModel):
    store_name: str
    description: str
    country: str
    city: str
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None

class VendorResponse(BaseModel):
    id: str
    user_id: str
    store_name: str
    description: str
    country: str
    city: str
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_approved: bool
    is_verified: bool = False
    total_sales: float = 0
    product_count: int = 0
    average_rating: float = 0
    created_at: str

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    compare_price: Optional[float] = None
    category_id: str
    images: List[str] = []
    stock: int = 0
    tags: List[str] = []

class ProductResponse(BaseModel):
    id: str
    vendor_id: str
    name: str
    description: str
    price: float
    compare_price: Optional[float] = None
    category_id: str
    images: List[str] = []
    stock: int
    is_active: bool
    tags: List[str] = []
    average_rating: float = 0
    review_count: int = 0
    created_at: str

class ServiceCreate(BaseModel):
    name: str
    description: str
    price: float
    price_type: str = "fixed"  # fixed, hourly, starting_from
    duration_minutes: int = 60
    location_type: str = "both"  # remote, onsite, both
    category_id: str
    images: List[str] = []
    tags: List[str] = []

class ServiceResponse(BaseModel):
    id: str
    vendor_id: str
    name: str
    description: str
    price: float
    price_type: str
    duration_minutes: int
    location_type: str
    category_id: str
    images: List[str] = []
    tags: List[str] = []
    is_active: bool
    average_rating: float = 0
    review_count: int = 0
    created_at: str

class BookingCreate(BaseModel):
    service_id: str
    booking_date: str
    booking_time: str
    notes: Optional[str] = None
    customer_address: Optional[str] = None

class BookingResponse(BaseModel):
    id: str
    service_id: str
    service_name: str
    customer_id: str
    vendor_id: str
    booking_date: str
    booking_time: str
    status: str
    payment_status: str
    price: float
    notes: Optional[str] = None
    delivery_confirmed: bool = False
    created_at: str

class CartItem(BaseModel):
    product_id: str
    quantity: int

class OrderCreate(BaseModel):
    items: List[CartItem]
    shipping_address: str
    shipping_city: str
    shipping_country: str

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[Dict]
    total: float
    status: str
    payment_status: str
    shipping_address: str
    created_at: str

class ReviewCreate(BaseModel):
    rating: int
    comment: str
    product_id: Optional[str] = None
    service_id: Optional[str] = None

class MessageCreate(BaseModel):
    recipient_id: str
    content: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    """Get current user from JWT token or session cookie"""
    token = None
    
    # Check Authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    
    # Check session cookie
    if not token:
        token = request.cookies.get("session_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Try JWT first
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            user = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user:
                return user
    except jwt.InvalidTokenError:
        pass
    
    # Try Google session
    session = await db.google_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at > datetime.now(timezone.utc):
            user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
            if user:
                return user
    
    raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_optional_user(request: Request) -> Optional[dict]:
    """Get current user if authenticated, otherwise None"""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "vendor_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_access_token({"sub": user_id})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(**{k: v for k, v in user_doc.items() if k != "password_hash"})
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email/password"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google login for this account")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["id"]})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(**{k: v for k, v in user.items() if k != "password_hash"})
    )

@api_router.post("/auth/google/session")
async def process_google_session(request: Request, response: Response):
    """Process Google OAuth session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        google_data = auth_response.json()
    
    email = google_data.get("email")
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")
    session_token = google_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["id"]
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"picture": picture, "last_login": datetime.now(timezone.utc).isoformat()}}
        )
        user = existing_user
    else:
        user_id = str(uuid.uuid4())
        name_parts = name.split(" ", 1)
        user = {
            "id": user_id,
            "email": email,
            "first_name": name_parts[0] if name_parts else "User",
            "last_name": name_parts[1] if len(name_parts) > 1 else "",
            "role": "customer",
            "picture": picture,
            "password_hash": None,
            "vendor_id": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    
    # Store session
    await db.google_sessions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    jwt_token = create_access_token({"sub": user_id})
    
    json_response = JSONResponse(content={
        "success": True,
        "access_token": jwt_token,
        "user": {k: v for k, v in user.items() if k != "password_hash"}
    })
    
    json_response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return json_response

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {k: v for k, v in user.items() if k != "password_hash"}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.google_sessions.delete_one({"session_token": session_token})
    
    json_response = JSONResponse(content={"success": True})
    json_response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return json_response

# ==================== CATEGORIES ====================

@api_router.get("/categories")
async def get_categories(type: str = None):
    """Get categories, optionally filtered by type (product/service)"""
    query = {}
    if type:
        query["type"] = type
    categories = await db.categories.find(query, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories")
async def create_category(name: str, icon: str = None, parent_id: str = None, type: str = "product", user: dict = Depends(get_current_user)):
    """Create a category (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = {
        "id": str(uuid.uuid4()),
        "name": name,
        "icon": icon,
        "parent_id": parent_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category)
    return category

# ==================== VENDORS ====================

@api_router.get("/vendors")
async def get_vendors(
    country: str = None,
    is_approved: bool = True,
    skip: int = 0,
    limit: int = 20
):
    """Get vendors list"""
    query = {"is_approved": is_approved}
    if country:
        query["country"] = country
    
    vendors = await db.vendors.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return vendors

@api_router.get("/vendors/{vendor_id}")
async def get_vendor(vendor_id: str):
    """Get vendor by ID"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@api_router.post("/vendors", response_model=VendorResponse)
async def create_vendor(vendor_data: VendorCreate, user: dict = Depends(get_current_user)):
    """Create a vendor store"""
    existing = await db.vendors.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You already have a vendor store")
    
    vendor_id = str(uuid.uuid4())
    vendor = {
        "id": vendor_id,
        "user_id": user["id"],
        **vendor_data.model_dump(),
        "is_approved": False,
        "is_verified": False,
        "total_sales": 0,
        "product_count": 0,
        "average_rating": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vendors.insert_one(vendor)
    await db.users.update_one({"id": user["id"]}, {"$set": {"role": "vendor", "vendor_id": vendor_id}})
    
    return VendorResponse(**vendor)

@api_router.put("/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, vendor_data: VendorCreate, user: dict = Depends(get_current_user)):
    """Update vendor store"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if vendor["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.vendors.update_one({"id": vendor_id}, {"$set": vendor_data.model_dump()})
    return {"message": "Vendor updated"}

# ==================== PRODUCTS ====================

@api_router.get("/products")
async def get_products(
    category_id: str = None,
    vendor_id: str = None,
    search: str = None,
    min_price: float = None,
    max_price: float = None,
    sort_by: str = "created_at",
    skip: int = 0,
    limit: int = 20
):
    """Get products with filters"""
    query = {"is_active": True}
    
    if category_id:
        query["category_id"] = category_id
    if vendor_id:
        query["vendor_id"] = vendor_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search.lower()]}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    
    sort_field = sort_by if sort_by in ["price", "created_at", "average_rating"] else "created_at"
    products = await db.products.find(query, {"_id": 0}).sort(sort_field, -1).skip(skip).limit(limit).to_list(limit)
    
    # Add vendor info
    for product in products:
        vendor = await db.vendors.find_one({"id": product["vendor_id"]}, {"_id": 0, "store_name": 1, "country": 1, "is_verified": 1})
        if vendor:
            product["vendor_name"] = vendor.get("store_name")
            product["vendor_country"] = vendor.get("country")
            product["vendor_verified"] = vendor.get("is_verified", False)
    
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get product by ID"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"id": product["vendor_id"]}, {"_id": 0})
    if vendor:
        product["vendor"] = vendor
    
    return product

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product_data: ProductCreate, user: dict = Depends(get_current_user)):
    """Create a product"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="You must be a vendor to create products")
    
    if not vendor.get("is_approved"):
        raise HTTPException(status_code=403, detail="Your vendor account is pending approval")
    
    product = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor["id"],
        **product_data.model_dump(),
        "is_active": True,
        "average_rating": 0,
        "review_count": 0,
        "view_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product)
    await db.vendors.update_one({"id": vendor["id"]}, {"$inc": {"product_count": 1}})
    
    return ProductResponse(**product)

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product_data: ProductCreate, user: dict = Depends(get_current_user)):
    """Update a product"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor or (vendor["id"] != product["vendor_id"] and user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.update_one({"id": product_id}, {"$set": product_data.model_dump()})
    return {"message": "Product updated"}

@api_router.delete("/products/{product_id}")
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

# ==================== SERVICES ====================

@api_router.get("/services")
async def get_services(
    category_id: str = None,
    vendor_id: str = None,
    location_type: str = None,
    search: str = None,
    skip: int = 0,
    limit: int = 20
):
    """Get services"""
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
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    services = await db.services.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for service in services:
        vendor = await db.vendors.find_one({"id": service["vendor_id"]}, {"_id": 0, "store_name": 1})
        if vendor:
            service["vendor_name"] = vendor.get("store_name")
    
    return services

@api_router.get("/services/{service_id}")
async def get_service(service_id: str):
    """Get service by ID"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    vendor = await db.vendors.find_one({"id": service["vendor_id"]}, {"_id": 0})
    if vendor:
        service["vendor"] = vendor
    
    return service

@api_router.post("/services", response_model=ServiceResponse)
async def create_service(service_data: ServiceCreate, user: dict = Depends(get_current_user)):
    """Create a service"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="You must be a vendor")
    
    service = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor["id"],
        **service_data.model_dump(),
        "is_active": True,
        "average_rating": 0,
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.services.insert_one(service)
    return ServiceResponse(**service)

@api_router.get("/services/{service_id}/timeslots")
async def get_service_timeslots(service_id: str, date: str):
    """Get available time slots for a service"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get booked slots for this date
    bookings = await db.bookings.find({
        "service_id": service_id,
        "booking_date": date,
        "status": {"$nin": ["cancelled"]}
    }, {"_id": 0, "booking_time": 1}).to_list(100)
    
    booked_times = [b["booking_time"] for b in bookings]
    
    # Generate available slots (9 AM to 6 PM)
    all_slots = [f"{h:02d}:00" for h in range(9, 18)]
    available_slots = [s for s in all_slots if s not in booked_times]
    
    return available_slots

# ==================== BOOKINGS ====================

@api_router.get("/bookings")
async def get_bookings(user: dict = Depends(get_current_user)):
    """Get user's bookings"""
    bookings = await db.bookings.find(
        {"customer_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return bookings

@api_router.get("/vendor/bookings")
async def get_vendor_bookings(user: dict = Depends(get_current_user)):
    """Get vendor's bookings"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="Not a vendor")
    
    bookings = await db.bookings.find(
        {"vendor_id": vendor["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return bookings

@api_router.post("/bookings", response_model=BookingResponse)
async def create_booking(booking_data: BookingCreate, user: dict = Depends(get_current_user)):
    """Create a booking"""
    service = await db.services.find_one({"id": booking_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check availability
    existing = await db.bookings.find_one({
        "service_id": booking_data.service_id,
        "booking_date": booking_data.booking_date,
        "booking_time": booking_data.booking_time,
        "status": {"$nin": ["cancelled"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="This time slot is not available")
    
    booking = {
        "id": str(uuid.uuid4()),
        "service_id": service["id"],
        "service_name": service["name"],
        "customer_id": user["id"],
        "vendor_id": service["vendor_id"],
        "booking_date": booking_data.booking_date,
        "booking_time": booking_data.booking_time,
        "status": "pending",
        "payment_status": "pending",
        "price": service["price"],
        "notes": booking_data.notes,
        "customer_address": booking_data.customer_address,
        "delivery_confirmed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking)
    return BookingResponse(**booking)

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str, user: dict = Depends(get_current_user)):
    """Update booking status"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    is_vendor = vendor and vendor["id"] == booking["vendor_id"]
    is_customer = booking["customer_id"] == user["id"]
    is_admin = user.get("role") == "admin"
    
    if not (is_vendor or is_customer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Customers can only cancel
    if is_customer and not is_admin and status not in ["cancelled"]:
        raise HTTPException(status_code=403, detail="Customers can only cancel bookings")
    
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": status}})
    return {"message": "Booking status updated"}

@api_router.put("/bookings/{booking_id}/confirm-delivery")
async def confirm_delivery(booking_id: str, user: dict = Depends(get_current_user)):
    """Confirm service delivery (releases escrow payment)"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["customer_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only the customer can confirm delivery")
    
    if booking["payment_status"] != "paid":
        raise HTTPException(status_code=400, detail="Payment must be completed first")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"delivery_confirmed": True, "payment_status": "released", "status": "completed"}}
    )
    
    # Update vendor sales
    await db.vendors.update_one(
        {"id": booking["vendor_id"]},
        {"$inc": {"total_sales": booking["price"]}}
    )
    
    return {"message": "Delivery confirmed, payment released to vendor"}

# ==================== CART & ORDERS ====================

@api_router.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    """Get user's cart"""
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart:
        return {"items": [], "total": 0}
    
    # Populate product details
    items = []
    total = 0
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item_total = product["price"] * item["quantity"]
            items.append({
                **item,
                "product": product,
                "item_total": item_total
            })
            total += item_total
    
    return {"items": items, "total": total}

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    """Add item to cart"""
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart = await db.carts.find_one({"user_id": user["id"]})
    
    if cart:
        # Check if product already in cart
        existing_item = next((i for i in cart["items"] if i["product_id"] == item.product_id), None)
        if existing_item:
            await db.carts.update_one(
                {"user_id": user["id"], "items.product_id": item.product_id},
                {"$inc": {"items.$.quantity": item.quantity}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["id"]},
                {"$push": {"items": item.model_dump()}}
            )
    else:
        await db.carts.insert_one({
            "user_id": user["id"],
            "items": [item.model_dump()],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": "Item added to cart"}

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, user: dict = Depends(get_current_user)):
    """Remove item from cart"""
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Item removed from cart"}

@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    """Get user's orders"""
    orders = await db.orders.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/vendor/orders")
async def get_vendor_orders(user: dict = Depends(get_current_user)):
    """Get vendor's orders"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="Not a vendor")
    
    orders = await db.orders.find(
        {"items.vendor_id": vendor["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return orders

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, user: dict = Depends(get_current_user)):
    """Create an order from cart"""
    items = []
    total = 0
    
    for cart_item in order_data.items:
        product = await db.products.find_one({"id": cart_item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {cart_item.product_id} not found")
        
        if product["stock"] < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        item_total = product["price"] * cart_item.quantity
        items.append({
            "product_id": product["id"],
            "product_name": product["name"],
            "vendor_id": product["vendor_id"],
            "price": product["price"],
            "quantity": cart_item.quantity,
            "item_total": item_total
        })
        total += item_total
    
    order = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "items": items,
        "total": total,
        "status": "pending",
        "payment_status": "pending",
        "shipping_address": order_data.shipping_address,
        "shipping_city": order_data.shipping_city,
        "shipping_country": order_data.shipping_country,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order)
    
    # Clear cart
    await db.carts.delete_one({"user_id": user["id"]})
    
    # Update stock
    for cart_item in order_data.items:
        await db.products.update_one(
            {"id": cart_item.product_id},
            {"$inc": {"stock": -cart_item.quantity}}
        )
    
    return OrderResponse(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user: dict = Depends(get_current_user)):
    """Update order status (vendor/admin)"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    if user.get("role") != "admin":
        vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
        if not vendor or not any(item["vendor_id"] == vendor["id"] for item in order["items"]):
            raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    return {"message": "Order status updated"}

# ==================== PAYMENTS ====================

import stripe

@api_router.post("/checkout/order/{order_id}")
async def create_order_checkout(order_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Create checkout session for order"""
    stripe.api_key = STRIPE_API_KEY
    
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    body = await request.json()
    origin_url = body.get("origin_url", str(request.base_url).rstrip("/"))
    
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": f"Order #{order_id[:8]}"},
                "unit_amount": int(order["total"] * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"{origin_url}/orders/{order_id}?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin_url}/orders/{order_id}",
        metadata={"order_id": order_id, "user_id": user["id"], "type": "order"}
    )
    
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.id,
        "order_id": order_id,
        "user_id": user["id"],
        "amount": order["total"],
        "currency": "usd",
        "type": "order",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"checkout_url": session.url, "session_id": session.id}

@api_router.post("/checkout/booking/{booking_id}")
async def create_booking_checkout(booking_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Create checkout session for booking (escrow)"""
    stripe.api_key = STRIPE_API_KEY
    
    booking = await db.bookings.find_one({"id": booking_id, "customer_id": user["id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    body = await request.json()
    origin_url = body.get("origin_url", str(request.base_url).rstrip("/"))
    
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": booking["service_name"]},
                "unit_amount": int(booking["price"] * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"{origin_url}/bookings/{booking_id}?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin_url}/bookings/{booking_id}",
        metadata={"booking_id": booking_id, "user_id": user["id"], "type": "booking"}
    )
    
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.id,
        "booking_id": booking_id,
        "user_id": user["id"],
        "amount": booking["price"],
        "currency": "usd",
        "type": "booking",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"checkout_url": session.url, "session_id": session.id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Get checkout session status"""
    stripe.api_key = STRIPE_API_KEY
    
    session = stripe.checkout.Session.retrieve(session_id)
    payment_status = "paid" if session.payment_status == "paid" else "pending"
    
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if transaction and transaction["payment_status"] != payment_status:
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": payment_status}}
        )
        
        if payment_status == "paid":
            if transaction.get("order_id"):
                await db.orders.update_one(
                    {"id": transaction["order_id"]},
                    {"$set": {"payment_status": "paid", "status": "processing"}}
                )
            elif transaction.get("booking_id"):
                await db.bookings.update_one(
                    {"id": transaction["booking_id"]},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
    
    return {
        "status": session.status,
        "payment_status": payment_status,
        "amount_total": session.amount_total,
        "currency": session.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    stripe.api_key = STRIPE_API_KEY
    
    body = await request.body()
    
    try:
        event = stripe.Event.construct_from(
            stripe.util.json.loads(body), stripe.api_key
        )
        
        if event.type == "checkout.session.completed":
            session = event.data.object
            
            transaction = await db.payment_transactions.find_one(
                {"session_id": session.id},
                {"_id": 0}
            )
            if transaction:
                await db.payment_transactions.update_one(
                    {"session_id": session.id},
                    {"$set": {"payment_status": "paid"}}
                )
                
                if transaction.get("order_id"):
                    await db.orders.update_one(
                        {"id": transaction["order_id"]},
                        {"$set": {"payment_status": "paid", "status": "processing"}}
                    )
                elif transaction.get("booking_id"):
                    await db.bookings.update_one(
                        {"id": transaction["booking_id"]},
                        {"$set": {"payment_status": "paid", "status": "confirmed"}}
                    )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ==================== REVIEWS ====================

@api_router.get("/reviews")
async def get_reviews(product_id: str = None, service_id: str = None, vendor_id: str = None):
    """Get reviews"""
    query = {}
    if product_id:
        query["product_id"] = product_id
    if service_id:
        query["service_id"] = service_id
    if vendor_id:
        query["vendor_id"] = vendor_id
    
    reviews = await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@api_router.post("/reviews")
async def create_review(review_data: ReviewCreate, user: dict = Depends(get_current_user)):
    """Create a review"""
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    vendor_id = None
    if review_data.product_id:
        product = await db.products.find_one({"id": review_data.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        vendor_id = product["vendor_id"]
    elif review_data.service_id:
        service = await db.services.find_one({"id": review_data.service_id}, {"_id": 0})
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
        vendor_id = service["vendor_id"]
    
    review = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": f"{user['first_name']} {user['last_name']}",
        "vendor_id": vendor_id,
        **review_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review)
    
    # Update average rating
    if review_data.product_id:
        reviews = await db.reviews.find({"product_id": review_data.product_id}, {"rating": 1}).to_list(1000)
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
        await db.products.update_one(
            {"id": review_data.product_id},
            {"$set": {"average_rating": round(avg_rating, 1), "review_count": len(reviews)}}
        )
    elif review_data.service_id:
        reviews = await db.reviews.find({"service_id": review_data.service_id}, {"rating": 1}).to_list(1000)
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
        await db.services.update_one(
            {"id": review_data.service_id},
            {"$set": {"average_rating": round(avg_rating, 1), "review_count": len(reviews)}}
        )
    
    return review

# ==================== MESSAGING ====================

@api_router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    """Get user's conversations"""
    conversations = await db.conversations.find(
        {"participants": user["id"]},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(50)
    
    # Add other participant info
    for conv in conversations:
        other_id = [p for p in conv["participants"] if p != user["id"]][0]
        other_user = await db.users.find_one({"id": other_id}, {"_id": 0, "first_name": 1, "last_name": 1, "picture": 1})
        if other_user:
            conv["other_user"] = other_user
    
    return conversations

@api_router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, user: dict = Depends(get_current_user)):
    """Get messages in a conversation"""
    conversation = await db.conversations.find_one(
        {"id": conversation_id, "participants": user["id"]},
        {"_id": 0}
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    return messages

@api_router.post("/messages")
async def send_message(message_data: MessageCreate, user: dict = Depends(get_current_user)):
    """Send a message"""
    # Find or create conversation
    conversation = await db.conversations.find_one({
        "participants": {"$all": [user["id"], message_data.recipient_id]}
    }, {"_id": 0})
    
    if not conversation:
        conversation = {
            "id": str(uuid.uuid4()),
            "participants": [user["id"], message_data.recipient_id],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.conversations.insert_one(conversation)
    
    message = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation["id"],
        "sender_id": user["id"],
        "content": message_data.content,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message)
    await db.conversations.update_one(
        {"id": conversation["id"]},
        {"$set": {"updated_at": message["created_at"], "last_message": message_data.content}}
    )
    
    return message

# ==================== ADMIN ====================

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(get_current_user)):
    """Get admin dashboard stats"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = await db.users.count_documents({})
    total_vendors = await db.vendors.count_documents({})
    total_products = await db.products.count_documents({})
    total_services = await db.services.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    pending_vendors = await db.vendors.count_documents({"is_approved": False})
    
    # Calculate revenue
    paid_orders = await db.orders.find({"payment_status": "paid"}, {"total": 1}).to_list(10000)
    order_revenue = sum(o.get("total", 0) for o in paid_orders)
    
    paid_bookings = await db.bookings.find({"payment_status": {"$in": ["paid", "released"]}}, {"price": 1}).to_list(10000)
    booking_revenue = sum(b.get("price", 0) for b in paid_bookings)
    
    return {
        "total_users": total_users,
        "total_vendors": total_vendors,
        "total_products": total_products,
        "total_services": total_services,
        "total_orders": total_orders,
        "total_bookings": total_bookings,
        "pending_vendors": pending_vendors,
        "total_revenue": round(order_revenue + booking_revenue, 2),
        "order_revenue": round(order_revenue, 2),
        "booking_revenue": round(booking_revenue, 2)
    }

@api_router.get("/admin/users")
async def get_all_users(user: dict = Depends(get_current_user), skip: int = 0, limit: int = 50):
    """Get all users (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    return users

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin: dict = Depends(get_current_user)):
    """Update user role (admin)"""
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if role not in ["customer", "vendor", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    return {"message": "User role updated"}

@api_router.put("/admin/vendors/{vendor_id}/approve")
async def approve_vendor(vendor_id: str, user: dict = Depends(get_current_user)):
    """Approve a vendor (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.vendors.update_one({"id": vendor_id}, {"$set": {"is_approved": True}})
    return {"message": "Vendor approved"}

@api_router.put("/admin/vendors/{vendor_id}/verify")
async def verify_vendor(vendor_id: str, user: dict = Depends(get_current_user)):
    """Verify a vendor - adds verification badge (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.vendors.update_one({"id": vendor_id}, {"$set": {"is_verified": True}})
    return {"message": "Vendor verified"}

@api_router.put("/admin/vendors/{vendor_id}/unverify")
async def unverify_vendor(vendor_id: str, user: dict = Depends(get_current_user)):
    """Remove verification badge from vendor (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.vendors.update_one({"id": vendor_id}, {"$set": {"is_verified": False}})
    return {"message": "Vendor verification removed"}

@api_router.get("/admin/orders")
async def get_all_orders(user: dict = Depends(get_current_user), skip: int = 0, limit: int = 50):
    """Get all orders (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return orders

# ==================== MISC ====================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/stats/platform")
async def get_platform_stats():
    """Get public platform stats"""
    total_vendors = await db.vendors.count_documents({"is_approved": True})
    total_products = await db.products.count_documents({"is_active": True})
    total_services = await db.services.count_documents({"is_active": True})
    
    countries = await db.vendors.distinct("country", {"is_approved": True})
    
    return {
        "total_vendors": total_vendors,
        "total_products": total_products,
        "total_services": total_services,
        "countries_served": len(countries),
        "countries": countries
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed initial data"""
    # Check if already seeded
    existing_categories = await db.categories.count_documents({})
    if existing_categories > 0:
        return {"message": "Database already seeded"}
    
    # Categories
    categories = [
        {"id": str(uuid.uuid4()), "name": "Fashion", "icon": "shirt", "parent_id": None},
        {"id": str(uuid.uuid4()), "name": "Art & Crafts", "icon": "palette", "parent_id": None},
        {"id": str(uuid.uuid4()), "name": "Food & Groceries", "icon": "utensils", "parent_id": None},
        {"id": str(uuid.uuid4()), "name": "Jewelry", "icon": "gem", "parent_id": None},
        {"id": str(uuid.uuid4()), "name": "Home Decor", "icon": "home", "parent_id": None},
        {"id": str(uuid.uuid4()), "name": "Beauty", "icon": "sparkles", "parent_id": None},
        {"id": str(uuid.uuid4()), "name": "Services", "icon": "briefcase", "parent_id": None},
    ]
    
    for cat in categories:
        cat["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.categories.insert_many(categories)
    
    # Create admin user
    admin_id = str(uuid.uuid4())
    admin = {
        "id": admin_id,
        "email": "admin@afrovending.com",
        "first_name": "Afro",
        "last_name": "Admin",
        "role": "admin",
        "password_hash": hash_password("AfroAdmin2024!"),
        "picture": None,
        "vendor_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin)
    
    # Create sample vendor user
    vendor_user_id = str(uuid.uuid4())
    vendor_id = str(uuid.uuid4())
    
    vendor_user = {
        "id": vendor_user_id,
        "email": "vendor@afrovending.com",
        "first_name": "Afro",
        "last_name": "Vendor",
        "role": "vendor",
        "password_hash": hash_password("AfroVendor2024!"),
        "picture": None,
        "vendor_id": vendor_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(vendor_user)
    
    vendor = {
        "id": vendor_id,
        "user_id": vendor_user_id,
        "store_name": "AfroVending Official Store",
        "description": "Official AfroVending marketplace store featuring premium African products.",
        "country": "Nigeria",
        "city": "Lagos",
        "logo_url": None,
        "banner_url": None,
        "is_approved": True,
        "total_sales": 0,
        "product_count": 0,
        "average_rating": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vendors.insert_one(vendor)
    
    return {
        "message": "Database seeded successfully",
        "admin": {"email": "admin@afrovending.com", "password": "AfroAdmin2024!"},
        "vendor": {"email": "vendor@afrovending.com", "password": "AfroVendor2024!"}
    }

# Mount router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
