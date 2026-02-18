"""
AfroVending - African Marketplace Backend
Complete API with Products, Vendors, Orders, Services, Bookings, Payments
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query, BackgroundTasks
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

# Import email service
from email_service import email_service

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection with error handling
mongo_url = os.environ.get('MONGO_URL', '')
if not mongo_url:
    logger.error("MONGO_URL environment variable is not set!")
    mongo_url = 'mongodb://localhost:27017'  # Fallback for local dev

try:
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[os.environ.get('DB_NAME', 'afrovending_db')]
    logger.info(f"MongoDB client initialized for database: {os.environ.get('DB_NAME', 'afrovending_db')}")
except Exception as e:
    logger.error(f"Failed to initialize MongoDB client: {e}")
    client = None
    db = None

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# App Setup
app = FastAPI(title="AfroVending API", version="1.0.0")
api_router = APIRouter()

# ==================== PERFORMANCE MONITORING ====================
import time
from collections import defaultdict
import statistics

# In-memory metrics storage (use Redis in production for persistence)
class MetricsCollector:
    def __init__(self):
        self.request_times = defaultdict(list)  # endpoint -> [response_times]
        self.request_counts = defaultdict(int)  # endpoint -> count
        self.error_counts = defaultdict(int)  # endpoint -> error_count
        self.db_query_times = []  # list of (query_name, duration)
        self.errors = []  # list of error records
        self.start_time = datetime.now(timezone.utc)
        
    def record_request(self, endpoint: str, duration: float, status_code: int):
        self.request_times[endpoint].append(duration)
        self.request_counts[endpoint] += 1
        if status_code >= 400:
            self.error_counts[endpoint] += 1
        # Keep only last 1000 records per endpoint
        if len(self.request_times[endpoint]) > 1000:
            self.request_times[endpoint] = self.request_times[endpoint][-1000:]
    
    def record_db_query(self, query_name: str, duration: float):
        self.db_query_times.append((query_name, duration, datetime.now(timezone.utc).isoformat()))
        if len(self.db_query_times) > 500:
            self.db_query_times = self.db_query_times[-500:]
    
    def record_error(self, endpoint: str, error: str, status_code: int):
        self.errors.append({
            "endpoint": endpoint,
            "error": error[:500],  # Truncate long errors
            "status_code": status_code,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        if len(self.errors) > 100:
            self.errors = self.errors[-100:]
    
    def get_metrics(self):
        metrics = {
            "uptime_seconds": (datetime.now(timezone.utc) - self.start_time).total_seconds(),
            "total_requests": sum(self.request_counts.values()),
            "total_errors": sum(self.error_counts.values()),
            "endpoints": {}
        }
        
        for endpoint, times in self.request_times.items():
            if times:
                metrics["endpoints"][endpoint] = {
                    "count": self.request_counts[endpoint],
                    "errors": self.error_counts[endpoint],
                    "avg_ms": round(statistics.mean(times) * 1000, 2),
                    "min_ms": round(min(times) * 1000, 2),
                    "max_ms": round(max(times) * 1000, 2),
                    "p95_ms": round(sorted(times)[int(len(times) * 0.95)] * 1000, 2) if len(times) > 1 else round(times[0] * 1000, 2)
                }
        
        return metrics
    
    def get_slow_queries(self, threshold_ms: float = 100):
        return [
            {"query": q[0], "duration_ms": round(q[1] * 1000, 2), "timestamp": q[2]}
            for q in self.db_query_times if q[1] * 1000 > threshold_ms
        ]

metrics = MetricsCollector()

# Performance monitoring middleware
@app.middleware("http")
async def performance_middleware(request: Request, call_next):
    start_time = time.time()
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Record metrics
        endpoint = f"{request.method} {request.url.path}"
        metrics.record_request(endpoint, duration, response.status_code)
        
        # Add timing header
        response.headers["X-Response-Time"] = f"{duration * 1000:.2f}ms"
        
        return response
    except Exception as e:
        duration = time.time() - start_time
        endpoint = f"{request.method} {request.url.path}"
        metrics.record_error(endpoint, str(e), 500)
        raise

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
    
    # Check for password in both possible field names
    password_hash = user.get("password_hash") or user.get("hashed_password")
    
    if not password_hash:
        raise HTTPException(status_code=401, detail="Please use Google login for this account")
    
    if not verify_password(credentials.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["id"]})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(**{k: v for k, v in user.items() if k not in ["password_hash", "hashed_password"]})
    )

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset"""
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If this email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.password_resets.insert_one({
        "user_id": user["id"],
        "email": request.email,
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # In production, send email here
    # For now, return token (remove in production)
    logger.info(f"Password reset token for {request.email}: {reset_token}")
    
    return {
        "message": "If this email exists, a reset link has been sent",
        "reset_token": reset_token  # Remove this in production when email is set up
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password with token"""
    reset_record = await db.password_resets.find_one({
        "token": request.token,
        "used": False
    }, {"_id": 0})
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check expiration
    expires_at = datetime.fromisoformat(reset_record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password
    new_hash = hash_password(request.new_password)
    await db.users.update_one(
        {"id": reset_record["user_id"]},
        {"$set": {"password_hash": new_hash, "hashed_password": new_hash}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": request.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}

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
        "type": type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category)
    return category

# ==================== COUNTRIES ====================

@api_router.get("/countries")
async def get_countries():
    """Get all African countries"""
    countries = await db.countries.find({}, {"_id": 0}).to_list(100)
    return countries

@api_router.get("/countries/{country_code}")
async def get_country(country_code: str):
    """Get country by code"""
    country = await db.countries.find_one({"code": country_code.upper()}, {"_id": 0})
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return country

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
        query["country_code"] = country.upper()
    
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
    country: str = None,
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
    if country:
        query["country_code"] = country.upper()
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
    
    # Batch fetch vendor info to avoid N+1 queries
    if products:
        vendor_ids = list(set(p["vendor_id"] for p in products if p.get("vendor_id")))
        vendors = await db.vendors.find(
            {"id": {"$in": vendor_ids}}, 
            {"_id": 0, "id": 1, "store_name": 1, "country": 1, "is_verified": 1}
        ).to_list(len(vendor_ids))
        vendor_map = {v["id"]: v for v in vendors}
        
        for product in products:
            vendor = vendor_map.get(product.get("vendor_id"))
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
    
    # Batch fetch vendor info to avoid N+1 queries
    if services:
        vendor_ids = list(set(s["vendor_id"] for s in services if s.get("vendor_id")))
        vendors = await db.vendors.find(
            {"id": {"$in": vendor_ids}}, 
            {"_id": 0, "id": 1, "store_name": 1}
        ).to_list(len(vendor_ids))
        vendor_map = {v["id"]: v for v in vendors}
        
        for service in services:
            vendor = vendor_map.get(service.get("vendor_id"))
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
async def create_booking(booking_data: BookingCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
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
    
    # Send booking confirmation email
    background_tasks.add_task(
        email_service.send_booking_confirmation,
        user.get("email"),
        booking
    )
    
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
    
    # Batch fetch product details to avoid N+1 queries
    cart_items = cart.get("items", [])
    if not cart_items:
        return {"items": [], "total": 0}
    
    product_ids = [item["product_id"] for item in cart_items]
    products = await db.products.find(
        {"id": {"$in": product_ids}}, 
        {"_id": 0}
    ).to_list(len(product_ids))
    product_map = {p["id"]: p for p in products}
    
    items = []
    total = 0
    for item in cart_items:
        product = product_map.get(item["product_id"])
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
async def create_order(order_data: OrderCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
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
    
    # Send order confirmation email
    background_tasks.add_task(
        email_service.send_order_confirmation,
        user.get("email"),
        order
    )
    
    return OrderResponse(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, tracking_number: str = None, background_tasks: BackgroundTasks = None, user: dict = Depends(get_current_user)):
    """Update order status (vendor/admin)"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    if user.get("role") != "admin":
        vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
        if not vendor or not any(item["vendor_id"] == vendor["id"] for item in order["items"]):
            raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {"status": status}
    if tracking_number:
        update_data["tracking_number"] = tracking_number
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    # Send shipping notification email if status is shipped
    if status == "shipped" and background_tasks:
        order_user = await db.users.find_one({"id": order["user_id"]}, {"_id": 0, "email": 1})
        if order_user:
            background_tasks.add_task(
                email_service.send_order_shipped,
                order_user["email"],
                order,
                tracking_number
            )
    
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
    """Handle Stripe webhooks for orders, bookings, and subscriptions"""
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
                elif transaction.get("type") == "subscription":
                    # Handle subscription activation
                    plan_id = transaction.get("plan_id", "starter")
                    plan = SUBSCRIPTION_PLANS.get(plan_id, SUBSCRIPTION_PLANS["starter"])
                    
                    await db.subscriptions.update_one(
                        {"vendor_id": transaction["vendor_id"]},
                        {"$set": {
                            "plan_id": plan_id,
                            "status": "active",
                            "price": plan["price"],
                            "stripe_subscription_id": session.subscription,
                            "stripe_customer_id": session.customer,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }},
                        upsert=True
                    )
                    
                    await db.vendors.update_one(
                        {"id": transaction["vendor_id"]},
                        {"$set": {
                            "subscription_plan": plan_id,
                            "commission_rate": plan["commission_rate"],
                            "max_products": plan["max_products"],
                            "is_verified": plan_id in ["growth", "pro"]
                        }}
                    )
        
        elif event.type == "customer.subscription.deleted":
            # Handle subscription cancellation from Stripe
            subscription = event.data.object
            await db.subscriptions.update_one(
                {"stripe_subscription_id": subscription.id},
                {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            # Find vendor and downgrade
            sub_record = await db.subscriptions.find_one({"stripe_subscription_id": subscription.id})
            if sub_record:
                await db.vendors.update_one(
                    {"id": sub_record["vendor_id"]},
                    {"$set": {"subscription_plan": "starter", "commission_rate": 20, "max_products": 5}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ==================== VENDOR SUBSCRIPTIONS ====================

# Subscription Plans - Server-side definition (security: never accept prices from frontend)
SUBSCRIPTION_PLANS = {
    "starter": {
        "name": "Starter",
        "price": 0.00,
        "commission_rate": 20,
        "max_products": 5,
        "features": ["Vendor profile", "Up to 5 products", "Standard placement", "Email support"]
    },
    "growth": {
        "name": "Growth",
        "price": 25.00,
        "commission_rate": 15,
        "max_products": 50,
        "features": ["Up to 50 products", "15% commission", "Boosted visibility", "Analytics", "Verified badge"]
    },
    "pro": {
        "name": "Pro Vendor",
        "price": 50.00,
        "commission_rate": 10,
        "max_products": -1,  # unlimited
        "features": ["Unlimited products", "10% commission", "Featured placement", "Homepage promotion", "Advanced analytics", "Priority support"]
    }
}

class SubscriptionRequest(BaseModel):
    plan_id: str
    origin_url: str

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    return SUBSCRIPTION_PLANS

@api_router.get("/subscription/current")
async def get_current_subscription(user: dict = Depends(get_current_user)):
    """Get current user's subscription"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    subscription = await db.subscriptions.find_one(
        {"vendor_id": vendor["id"], "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        # Default to starter plan
        return {
            "plan_id": "starter",
            "plan": SUBSCRIPTION_PLANS["starter"],
            "status": "active",
            "is_free": True
        }
    
    return {
        **subscription,
        "plan": SUBSCRIPTION_PLANS.get(subscription["plan_id"], SUBSCRIPTION_PLANS["starter"])
    }

@api_router.post("/subscription/checkout")
async def create_subscription_checkout(sub_request: SubscriptionRequest, request: Request, user: dict = Depends(get_current_user)):
    """Create checkout session for subscription"""
    
    plan_id = sub_request.plan_id.lower()
    if plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription plan")
    
    plan = SUBSCRIPTION_PLANS[plan_id]
    
    # Check if vendor exists
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=400, detail="You must have a vendor profile to subscribe")
    
    # Starter is free - just update the subscription
    if plan["price"] == 0:
        await db.subscriptions.update_one(
            {"vendor_id": vendor["id"]},
            {"$set": {
                "plan_id": plan_id,
                "status": "active",
                "price": 0,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        await db.vendors.update_one(
            {"id": vendor["id"]},
            {"$set": {
                "subscription_plan": plan_id,
                "commission_rate": plan["commission_rate"],
                "max_products": plan["max_products"]
            }}
        )
        return {"status": "activated", "plan": plan_id, "message": "Free plan activated"}
    
    origin_url = sub_request.origin_url.rstrip("/")
    
    # Check if we have a valid Stripe API key (not the test placeholder)
    if STRIPE_API_KEY and STRIPE_API_KEY.startswith("sk_") and STRIPE_API_KEY != "sk_test_emergent":
        try:
            stripe.api_key = STRIPE_API_KEY
            # Create Stripe Checkout Session for subscription
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"AfroVending {plan['name']} Plan",
                            "description": f"Monthly subscription - {plan['commission_rate']}% commission rate"
                        },
                        "unit_amount": int(plan["price"] * 100),
                        "recurring": {"interval": "month"}
                    },
                    "quantity": 1,
                }],
                mode="subscription",
                success_url=f"{origin_url}/vendor/subscription?session_id={{CHECKOUT_SESSION_ID}}&success=true",
                cancel_url=f"{origin_url}/pricing?cancelled=true",
                metadata={
                    "vendor_id": vendor["id"],
                    "user_id": user["id"],
                    "plan_id": plan_id,
                    "type": "subscription"
                },
                customer_email=user["email"]
            )
            
            # Create pending subscription transaction
            await db.payment_transactions.insert_one({
                "id": str(uuid.uuid4()),
                "session_id": session.id,
                "vendor_id": vendor["id"],
                "user_id": user["id"],
                "plan_id": plan_id,
                "amount": plan["price"],
                "currency": "usd",
                "type": "subscription",
                "payment_status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            return {"checkout_url": session.url, "session_id": session.id}
        except Exception as e:
            logger.error(f"Stripe subscription error: {e}")
            # Fall through to test mode
    
    # TEST MODE: Activate subscription directly for demo purposes
    # In production, a valid Stripe API key is required
    logger.info(f"TEST MODE: Activating {plan_id} subscription for vendor {vendor['id']}")
    
    test_session_id = f"test_sub_{uuid.uuid4().hex[:16]}"
    
    await db.subscriptions.update_one(
        {"vendor_id": vendor["id"]},
        {"$set": {
            "plan_id": plan_id,
            "status": "active",
            "price": plan["price"],
            "test_mode": True,
            "current_period_start": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": {
            "subscription_plan": plan_id,
            "commission_rate": plan["commission_rate"],
            "max_products": plan["max_products"],
            "is_verified": plan_id in ["growth", "pro"]
        }}
    )
    
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": test_session_id,
        "vendor_id": vendor["id"],
        "user_id": user["id"],
        "plan_id": plan_id,
        "amount": plan["price"],
        "currency": "usd",
        "type": "subscription",
        "payment_status": "paid",
        "test_mode": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "status": "activated",
        "plan": plan_id,
        "message": f"TEST MODE: {plan['name']} plan activated. In production, Stripe payment would be required.",
        "test_mode": True
    }

@api_router.get("/subscription/status/{session_id}")
async def get_subscription_status(session_id: str, user: dict = Depends(get_current_user)):
    """Get subscription checkout status and activate if paid"""
    stripe.api_key = STRIPE_API_KEY
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid session: {str(e)}")
    
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id, "type": "subscription"},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    payment_status = "paid" if session.payment_status == "paid" else "pending"
    
    # Update transaction and activate subscription if paid
    if transaction["payment_status"] != payment_status:
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": payment_status, "stripe_subscription_id": session.subscription}}
        )
        
        if payment_status == "paid":
            plan_id = transaction["plan_id"]
            plan = SUBSCRIPTION_PLANS.get(plan_id, SUBSCRIPTION_PLANS["starter"])
            
            # Create/update subscription record
            await db.subscriptions.update_one(
                {"vendor_id": transaction["vendor_id"]},
                {"$set": {
                    "plan_id": plan_id,
                    "status": "active",
                    "price": plan["price"],
                    "stripe_subscription_id": session.subscription,
                    "stripe_customer_id": session.customer,
                    "current_period_start": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
            
            # Update vendor with subscription benefits
            await db.vendors.update_one(
                {"id": transaction["vendor_id"]},
                {"$set": {
                    "subscription_plan": plan_id,
                    "commission_rate": plan["commission_rate"],
                    "max_products": plan["max_products"],
                    "is_verified": plan_id in ["growth", "pro"]  # Verified badge for paid plans
                }}
            )
    
    return {
        "status": session.status,
        "payment_status": payment_status,
        "plan_id": transaction["plan_id"],
        "amount": transaction["amount"],
        "subscription_active": payment_status == "paid"
    }

@api_router.post("/subscription/cancel")
async def cancel_subscription(user: dict = Depends(get_current_user)):
    """Cancel current subscription"""
    stripe.api_key = STRIPE_API_KEY
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    subscription = await db.subscriptions.find_one(
        {"vendor_id": vendor["id"], "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        raise HTTPException(status_code=400, detail="No active subscription found")
    
    if subscription.get("stripe_subscription_id"):
        try:
            stripe.Subscription.cancel(subscription["stripe_subscription_id"])
        except Exception as e:
            logger.error(f"Failed to cancel Stripe subscription: {e}")
    
    # Downgrade to starter
    await db.subscriptions.update_one(
        {"vendor_id": vendor["id"]},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": {
            "subscription_plan": "starter",
            "commission_rate": 20,
            "max_products": 5
        }}
    )
    
    return {"status": "cancelled", "message": "Subscription cancelled. Downgraded to Starter plan."}

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
    
    # Update average rating using MongoDB aggregation (efficient for any number of reviews)
    if review_data.product_id:
        pipeline = [
            {"$match": {"product_id": review_data.product_id}},
            {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
        ]
        result = await db.reviews.aggregate(pipeline).to_list(1)
        if result:
            await db.products.update_one(
                {"id": review_data.product_id},
                {"$set": {"average_rating": round(result[0]["avg_rating"], 1), "review_count": result[0]["count"]}}
            )
    elif review_data.service_id:
        pipeline = [
            {"$match": {"service_id": review_data.service_id}},
            {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
        ]
        result = await db.reviews.aggregate(pipeline).to_list(1)
        if result:
            await db.services.update_one(
                {"id": review_data.service_id},
                {"$set": {"average_rating": round(result[0]["avg_rating"], 1), "review_count": result[0]["count"]}}
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
    
    # Calculate revenue using aggregation (optimized for large datasets)
    order_revenue_result = await db.orders.aggregate([
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]).to_list(1)
    order_revenue = order_revenue_result[0]["total"] if order_revenue_result else 0
    
    booking_revenue_result = await db.bookings.aggregate([
        {"$match": {"payment_status": {"$in": ["paid", "released"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}}}
    ]).to_list(1)
    booking_revenue = booking_revenue_result[0]["total"] if booking_revenue_result else 0
    
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

@api_router.put("/admin/vendors/{vendor_id}/deactivate")
async def deactivate_vendor(vendor_id: str, reason: str = "", background_tasks: BackgroundTasks = None, user: dict = Depends(get_current_user)):
    """Deactivate a vendor for non-compliance (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    await db.vendors.update_one(
        {"id": vendor_id}, 
        {"$set": {
            "is_active": False,
            "deactivated_at": datetime.now(timezone.utc).isoformat(),
            "deactivation_reason": reason,
            "deactivated_by": user["id"]
        }}
    )
    
    # Also deactivate all vendor's products and services
    await db.products.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": False}})
    await db.services.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": False}})
    
    # Send deactivation email notification
    vendor_user = await db.users.find_one({"id": vendor.get("user_id")}, {"_id": 0, "email": 1})
    if vendor_user and background_tasks:
        background_tasks.add_task(
            email_service.send_vendor_deactivation,
            vendor_user["email"],
            vendor.get("store_name", "Vendor"),
            reason or "Policy violation"
        )
    
    return {"message": "Vendor deactivated successfully", "reason": reason}

@api_router.put("/admin/vendors/{vendor_id}/activate")
async def activate_vendor(vendor_id: str, background_tasks: BackgroundTasks = None, user: dict = Depends(get_current_user)):
    """Reactivate a deactivated vendor (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    vendor = await db.vendors.find_one({"id": vendor_id})
    
    await db.vendors.update_one(
        {"id": vendor_id}, 
        {"$set": {"is_active": True}, "$unset": {"deactivated_at": "", "deactivation_reason": "", "deactivated_by": ""}}
    )
    
    # Reactivate all vendor's products and services
    await db.products.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": True}})
    await db.services.update_many({"vendor_id": vendor_id}, {"$set": {"is_active": True}})
    
    # Send reactivation email notification
    if vendor:
        vendor_user = await db.users.find_one({"id": vendor.get("user_id")}, {"_id": 0, "email": 1})
        if vendor_user and background_tasks:
            background_tasks.add_task(
                email_service.send_vendor_reactivation,
                vendor_user["email"],
                vendor.get("store_name", "Vendor")
            )
    
    return {"message": "Vendor reactivated successfully"}

@api_router.get("/admin/analytics")
async def get_admin_analytics(
    period: str = Query("30d", description="Time period: 7d, 30d, 90d, 1y"),
    user: dict = Depends(get_current_user)
):
    """Get comprehensive platform analytics for admin dashboard"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}.get(period, 30)
    start_date = datetime.now(timezone.utc) - timedelta(days=period_days)
    prev_start = start_date - timedelta(days=period_days)
    
    # User Stats
    total_users = await db.users.count_documents({})
    new_users = await db.users.count_documents({"created_at": {"$gte": start_date.isoformat()}})
    prev_new_users = await db.users.count_documents({
        "created_at": {"$gte": prev_start.isoformat(), "$lt": start_date.isoformat()}
    })
    
    # Vendor Stats
    total_vendors = await db.vendors.count_documents({})
    active_vendors = await db.vendors.count_documents({"is_active": {"$ne": False}, "is_approved": True})
    pending_vendors = await db.vendors.count_documents({"is_approved": False})
    deactivated_vendors = await db.vendors.count_documents({"is_active": False})
    verified_vendors = await db.vendors.count_documents({"is_verified": True})
    
    # Product Stats
    total_products = await db.products.count_documents({})
    active_products = await db.products.count_documents({"is_active": True})
    
    # Service Stats
    total_services = await db.services.count_documents({})
    active_services = await db.services.count_documents({"is_active": True})
    
    # Order Stats
    total_orders = await db.orders.count_documents({})
    period_orders = await db.orders.count_documents({"created_at": {"$gte": start_date.isoformat()}})
    prev_period_orders = await db.orders.count_documents({
        "created_at": {"$gte": prev_start.isoformat(), "$lt": start_date.isoformat()}
    })
    
    # Revenue calculation using aggregation
    revenue_pipeline = [
        {"$match": {"payment_status": "paid", "created_at": {"$gte": start_date.isoformat()}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    current_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    prev_revenue_pipeline = [
        {"$match": {"payment_status": "paid", "created_at": {"$gte": prev_start.isoformat(), "$lt": start_date.isoformat()}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    prev_revenue_result = await db.orders.aggregate(prev_revenue_pipeline).to_list(1)
    prev_revenue = prev_revenue_result[0]["total"] if prev_revenue_result else 0
    
    # Booking Stats
    total_bookings = await db.bookings.count_documents({})
    period_bookings = await db.bookings.count_documents({"created_at": {"$gte": start_date.isoformat()}})
    
    # Daily stats for charts (last 30 days)
    daily_stats = {}
    for i in range(30):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_stats[day] = {"orders": 0, "revenue": 0, "users": 0}
    
    # Get daily orders
    orders = await db.orders.find(
        {"created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()}},
        {"_id": 0, "created_at": 1, "total": 1, "payment_status": 1}
    ).to_list(10000)
    
    for order in orders:
        day = order.get("created_at", "")[:10]
        if day in daily_stats:
            daily_stats[day]["orders"] += 1
            if order.get("payment_status") == "paid":
                daily_stats[day]["revenue"] += order.get("total", 0)
    
    # Get daily new users
    users = await db.users.find(
        {"created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()}},
        {"_id": 0, "created_at": 1}
    ).to_list(10000)
    
    for u in users:
        day = u.get("created_at", "")[:10]
        if day in daily_stats:
            daily_stats[day]["users"] += 1
    
    # Top vendors by revenue
    top_vendors_pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": "$vendor_id", "revenue": {"$sum": "$total"}, "orders": {"$sum": 1}}},
        {"$sort": {"revenue": -1}},
        {"$limit": 10}
    ]
    top_vendors_result = await db.orders.aggregate(top_vendors_pipeline).to_list(10)
    
    top_vendors = []
    for v in top_vendors_result:
        vendor = await db.vendors.find_one({"id": v["_id"]}, {"_id": 0, "store_name": 1, "is_verified": 1})
        if vendor:
            top_vendors.append({
                "vendor_id": v["_id"],
                "store_name": vendor.get("store_name", "Unknown"),
                "is_verified": vendor.get("is_verified", False),
                "revenue": v["revenue"],
                "orders": v["orders"]
            })
    
    # Top products by sales
    top_products_pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product_id", "quantity": {"$sum": "$items.quantity"}, "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}}},
        {"$sort": {"revenue": -1}},
        {"$limit": 10}
    ]
    top_products_result = await db.orders.aggregate(top_products_pipeline).to_list(10)
    
    top_products = []
    for p in top_products_result:
        product = await db.products.find_one({"id": p["_id"]}, {"_id": 0, "name": 1})
        if product:
            top_products.append({
                "product_id": p["_id"],
                "name": product.get("name", "Unknown"),
                "quantity_sold": p["quantity"],
                "revenue": p["revenue"]
            })
    
    # Country breakdown
    country_pipeline = [
        {"$group": {"_id": "$shipping_address.country", "orders": {"$sum": 1}}},
        {"$sort": {"orders": -1}},
        {"$limit": 10}
    ]
    country_result = await db.orders.aggregate(country_pipeline).to_list(10)
    country_breakdown = {c["_id"] or "Unknown": c["orders"] for c in country_result}
    
    # Calculate growth percentages
    def calc_growth(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 1)
    
    return {
        "period": period,
        "summary": {
            "total_users": total_users,
            "new_users": new_users,
            "total_vendors": total_vendors,
            "active_vendors": active_vendors,
            "pending_vendors": pending_vendors,
            "deactivated_vendors": deactivated_vendors,
            "verified_vendors": verified_vendors,
            "total_products": total_products,
            "active_products": active_products,
            "total_services": total_services,
            "active_services": active_services,
            "total_orders": total_orders,
            "period_orders": period_orders,
            "total_bookings": total_bookings,
            "period_bookings": period_bookings,
            "revenue": round(current_revenue, 2)
        },
        "growth": {
            "users": calc_growth(new_users, prev_new_users),
            "orders": calc_growth(period_orders, prev_period_orders),
            "revenue": calc_growth(current_revenue, prev_revenue)
        },
        "daily_stats": [{"date": k, **v} for k, v in sorted(daily_stats.items())],
        "top_vendors": top_vendors,
        "top_products": top_products,
        "country_breakdown": country_breakdown
    }

@api_router.get("/admin/vendors")
async def get_all_vendors(
    user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
    status: str = Query(None, description="Filter: all, pending, active, deactivated, verified")
):
    """Get all vendors with filters (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status == "pending":
        query["is_approved"] = False
    elif status == "active":
        query["is_approved"] = True
        query["is_active"] = {"$ne": False}
    elif status == "deactivated":
        query["is_active"] = False
    elif status == "verified":
        query["is_verified"] = True
    
    vendors = await db.vendors.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.vendors.count_documents(query)
    
    # Add user email and product/order counts
    for vendor in vendors:
        user_doc = await db.users.find_one({"id": vendor.get("user_id")}, {"_id": 0, "email": 1})
        vendor["email"] = user_doc.get("email") if user_doc else None
        vendor["product_count"] = await db.products.count_documents({"vendor_id": vendor["id"]})
        vendor["service_count"] = await db.services.count_documents({"vendor_id": vendor["id"]})
        vendor["order_count"] = await db.orders.count_documents({"vendor_id": vendor["id"]})
    
    return {"vendors": vendors, "total": total}

@api_router.get("/admin/orders")
async def get_all_orders(user: dict = Depends(get_current_user), skip: int = 0, limit: int = 50):
    """Get all orders (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return orders

# ==================== VENDOR ANALYTICS ====================

@api_router.get("/vendor/analytics")
async def get_vendor_analytics(
    period: str = Query("30d", description="Time period: 7d, 30d, 90d, 1y"),
    user: dict = Depends(get_current_user)
):
    """Get comprehensive vendor analytics"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    vendor_id = vendor["id"]
    
    # Calculate date range
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}.get(period, 30)
    start_date = datetime.now(timezone.utc) - timedelta(days=period_days)
    prev_start = start_date - timedelta(days=period_days)
    
    # Current period orders
    orders = await db.orders.find({
        "vendor_id": vendor_id,
        "created_at": {"$gte": start_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Previous period orders (for comparison)
    prev_orders = await db.orders.find({
        "vendor_id": vendor_id,
        "created_at": {"$gte": prev_start.isoformat(), "$lt": start_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Current period bookings
    bookings = await db.bookings.find({
        "vendor_id": vendor_id,
        "created_at": {"$gte": start_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Previous period bookings
    prev_bookings = await db.bookings.find({
        "vendor_id": vendor_id,
        "created_at": {"$gte": prev_start.isoformat(), "$lt": start_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Calculate revenue
    current_revenue = sum(o.get("total", 0) for o in orders if o.get("payment_status") == "paid")
    current_revenue += sum(b.get("price", 0) for b in bookings if b.get("payment_status") == "paid")
    prev_revenue = sum(o.get("total", 0) for o in prev_orders if o.get("payment_status") == "paid")
    prev_revenue += sum(b.get("price", 0) for b in prev_bookings if b.get("payment_status") == "paid")
    
    # Calculate growth
    def calc_growth(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 1)
    
    # Product analytics
    products = await db.products.find({"vendor_id": vendor_id}, {"_id": 0}).to_list(100)
    total_views = sum(p.get("view_count", 0) for p in products)
    
    # Top products by orders
    product_order_counts = {}
    for order in orders:
        for item in order.get("items", []):
            pid = item.get("product_id")
            if pid:
                product_order_counts[pid] = product_order_counts.get(pid, 0) + item.get("quantity", 1)
    
    top_products = []
    for pid, count in sorted(product_order_counts.items(), key=lambda x: -x[1])[:5]:
        product = next((p for p in products if p["id"] == pid), None)
        if product:
            top_products.append({
                "id": pid,
                "name": product["name"],
                "orders": count,
                "revenue": count * product["price"]
            })
    
    # Geographic breakdown
    geo_breakdown = {}
    for order in orders:
        country = order.get("shipping_address", {}).get("country", "Unknown")
        geo_breakdown[country] = geo_breakdown.get(country, 0) + 1
    
    # Daily revenue for charts (last 30 days regardless of period)
    daily_revenue = {}
    for i in range(30):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_revenue[day] = 0
    
    for order in orders:
        if order.get("payment_status") == "paid":
            day = order.get("created_at", "")[:10]
            if day in daily_revenue:
                daily_revenue[day] += order.get("total", 0)
    
    for booking in bookings:
        if booking.get("payment_status") == "paid":
            day = booking.get("created_at", "")[:10]
            if day in daily_revenue:
                daily_revenue[day] += booking.get("price", 0)
    
    # Conversion rate (views to orders)
    conversion_rate = round((len(orders) / total_views * 100), 2) if total_views > 0 else 0
    
    # Customer insights
    unique_customers = set()
    repeat_customers = set()
    customer_order_counts = {}
    
    for order in orders:
        cid = order.get("user_id")
        if cid:
            if cid in unique_customers:
                repeat_customers.add(cid)
            unique_customers.add(cid)
            customer_order_counts[cid] = customer_order_counts.get(cid, 0) + 1
    
    avg_order_value = current_revenue / len(orders) if orders else 0
    
    return {
        "period": period,
        "summary": {
            "total_orders": len(orders),
            "total_bookings": len(bookings),
            "revenue": round(current_revenue, 2),
            "total_views": total_views,
            "conversion_rate": conversion_rate,
            "avg_order_value": round(avg_order_value, 2)
        },
        "growth": {
            "orders": calc_growth(len(orders), len(prev_orders)),
            "bookings": calc_growth(len(bookings), len(prev_bookings)),
            "revenue": calc_growth(current_revenue, prev_revenue)
        },
        "top_products": top_products,
        "geographic_breakdown": geo_breakdown,
        "daily_revenue": [{"date": k, "revenue": v} for k, v in sorted(daily_revenue.items())],
        "customer_insights": {
            "total_customers": len(unique_customers),
            "repeat_customers": len(repeat_customers),
            "repeat_rate": round(len(repeat_customers) / len(unique_customers) * 100, 1) if unique_customers else 0,
            "avg_orders_per_customer": round(sum(customer_order_counts.values()) / len(customer_order_counts), 1) if customer_order_counts else 0
        }
    }

@api_router.get("/vendor/analytics/products")
async def get_product_analytics(user: dict = Depends(get_current_user)):
    """Get detailed product-level analytics"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    products = await db.products.find({"vendor_id": vendor["id"]}, {"_id": 0}).to_list(100)
    
    # Get order data for each product
    orders = await db.orders.find({"vendor_id": vendor["id"]}, {"_id": 0}).to_list(1000)
    
    product_stats = {}
    for product in products:
        pid = product["id"]
        product_stats[pid] = {
            "id": pid,
            "name": product["name"],
            "price": product["price"],
            "stock": product.get("stock", 0),
            "views": product.get("view_count", 0),
            "rating": product.get("average_rating", 0),
            "reviews": product.get("review_count", 0),
            "orders": 0,
            "units_sold": 0,
            "revenue": 0
        }
    
    for order in orders:
        if order.get("payment_status") == "paid":
            for item in order.get("items", []):
                pid = item.get("product_id")
                if pid in product_stats:
                    product_stats[pid]["orders"] += 1
                    product_stats[pid]["units_sold"] += item.get("quantity", 1)
                    product_stats[pid]["revenue"] += item.get("price", 0) * item.get("quantity", 1)
    
    # Sort by revenue
    sorted_products = sorted(product_stats.values(), key=lambda x: -x["revenue"])
    
    return {
        "products": sorted_products,
        "summary": {
            "total_products": len(products),
            "total_views": sum(p["views"] for p in sorted_products),
            "total_revenue": sum(p["revenue"] for p in sorted_products),
            "avg_rating": round(sum(p["rating"] for p in sorted_products) / len(sorted_products), 1) if sorted_products else 0
        }
    }

# ==================== MONITORING ENDPOINTS ====================

@api_router.get("/monitoring/metrics")
async def get_monitoring_metrics(user: dict = Depends(get_current_user)):
    """Get system performance metrics (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return metrics.get_metrics()

@api_router.get("/monitoring/errors")
async def get_recent_errors(user: dict = Depends(get_current_user)):
    """Get recent error logs (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {"errors": metrics.errors, "total": len(metrics.errors)}

@api_router.get("/monitoring/slow-queries")
async def get_slow_queries(
    threshold_ms: float = Query(100, description="Threshold in milliseconds"),
    user: dict = Depends(get_current_user)
):
    """Get slow database queries (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {"slow_queries": metrics.get_slow_queries(threshold_ms)}

@api_router.get("/monitoring/health-detailed")
async def detailed_health_check():
    """Detailed health check with component status"""
    health = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {}
    }
    
    # Check MongoDB
    try:
        await db.command("ping")
        health["components"]["database"] = {"status": "healthy", "type": "mongodb"}
    except Exception as e:
        health["status"] = "degraded"
        health["components"]["database"] = {"status": "unhealthy", "error": str(e)}
    
    # System metrics
    metrics_data = metrics.get_metrics()
    health["metrics"] = {
        "uptime_seconds": metrics_data["uptime_seconds"],
        "total_requests": metrics_data["total_requests"],
        "total_errors": metrics_data["total_errors"],
        "error_rate": round(metrics_data["total_errors"] / max(metrics_data["total_requests"], 1) * 100, 2)
    }
    
    return health

# ==================== MISC ====================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "disconnected"
    }
    
    if db is not None:
        try:
            await client.admin.command('ping')
            health_status["database"] = "connected"
        except Exception as e:
            health_status["status"] = "degraded"
            health_status["database"] = f"error: {str(e)[:100]}"
    else:
        health_status["status"] = "degraded"
    
    return health_status

@api_router.get("/stats/platform")
async def get_platform_stats():
    """Get public platform stats"""
    if db is None:
        return {"total_vendors": 0, "total_products": 0, "total_countries": 0}
    
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

# Mount router with /api prefix for ingress routing
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
