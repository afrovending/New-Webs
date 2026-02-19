"""
AfroVending - Authentication Routes
"""
from fastapi import APIRouter, HTTPException, Request, Response, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from datetime import datetime, timezone, timedelta
import uuid
import httpx
import os

from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user
from models import UserCreate, UserLogin, UserResponse, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest
from email_service import email_service

# Frontend URL for password reset links
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://afrovending.com')

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    db = get_db()
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    vendor_id = None
    
    # If registering as vendor, create a vendor profile
    if user_data.role == "vendor":
        vendor_id = str(uuid.uuid4())
        vendor_doc = {
            "id": vendor_id,
            "user_id": user_id,
            "store_name": f"{user_data.first_name}'s Store",
            "description": "Welcome to my African marketplace store!",
            "country": "Nigeria",
            "country_code": "NG",
            "is_approved": True,  # Auto-approve for now
            "is_verified": False,
            "subscription_plan": "free",
            "commission_rate": 15,
            "max_products": 10,
            "product_count": 0,
            "total_sales": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.vendors.insert_one(vendor_doc)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "vendor_id": vendor_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_access_token({"sub": user_id})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(**{k: v for k, v in user_doc.items() if k != "password_hash"})
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email/password"""
    db = get_db()
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
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


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Request password reset - sends email with reset link"""
    db = get_db()
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    # Always return same message to prevent email enumeration
    response_msg = "If this email exists, a password reset link has been sent"
    
    if not user:
        return {"message": response_msg}
    
    # Check if user has a password (not Google-only account)
    if not user.get("password_hash") and not user.get("hashed_password"):
        return {"message": response_msg}
    
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
    
    # Send password reset email in background
    reset_url = f"{FRONTEND_URL}/reset-password"
    background_tasks.add_task(
        email_service.send_password_reset,
        request.email,
        reset_token,
        reset_url
    )
    
    return {"message": response_msg}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password with token"""
    db = get_db()
    reset_record = await db.password_resets.find_one({
        "token": request.token,
        "used": False
    }, {"_id": 0})
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    expires_at = datetime.fromisoformat(reset_record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    new_hash = hash_password(request.new_password)
    await db.users.update_one(
        {"id": reset_record["user_id"]},
        {"$set": {"password_hash": new_hash, "hashed_password": new_hash}}
    )
    
    await db.password_resets.update_one(
        {"token": request.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}


@router.post("/google/session")
async def process_google_session(request: Request, response: Response):
    """Process Google OAuth session"""
    db = get_db()
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


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {k: v for k, v in user.items() if k != "password_hash"}


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    db = get_db()
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.google_sessions.delete_one({"session_token": session_token})
    
    json_response = JSONResponse(content={"success": True})
    json_response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return json_response
