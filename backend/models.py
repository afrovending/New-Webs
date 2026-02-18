"""
AfroVending - Pydantic Models
All request/response models for the API
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# ==================== USER MODELS ====================
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


# ==================== VENDOR MODELS ====================
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


# ==================== PRODUCT MODELS ====================
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    compare_price: Optional[float] = None
    category_id: str
    images: List[str] = []
    stock: int = 0
    tags: List[str] = []
    fulfillment_option: str = "FBV"


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
    fulfillment_option: str = "FBV"
    average_rating: float = 0
    review_count: int = 0
    created_at: str


# ==================== SERVICE MODELS ====================
class ServiceCreate(BaseModel):
    name: str
    description: str
    price: float
    price_type: str = "fixed"
    duration_minutes: int = 60
    location_type: str = "both"
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


# ==================== BOOKING MODELS ====================
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


# ==================== ORDER MODELS ====================
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


# ==================== REVIEW MODELS ====================
class ReviewCreate(BaseModel):
    rating: int
    comment: str
    product_id: Optional[str] = None
    service_id: Optional[str] = None


# ==================== MESSAGE MODELS ====================
class MessageCreate(BaseModel):
    recipient_id: str
    content: str


# ==================== AUTH MODELS ====================
class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ==================== PRICE ALERT MODELS ====================
class PriceAlertCreate(BaseModel):
    product_id: str
    target_price: float
    notify_email: bool = True
    notify_app: bool = True
