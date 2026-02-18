"""
AfroVending - Auth Routes
Authentication endpoints: register, login, logout, password reset
"""
from fastapi import APIRouter, HTTPException, Request, Response, Depends, BackgroundTasks
from datetime import datetime, timezone
import uuid

from models import UserCreate, UserLogin, UserResponse, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])
db = get_db()


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    token = create_access_token({"sub": user["id"]})
    user_response = UserResponse(**{k: v for k, v in user.items() if k != "password"})
    
    return TokenResponse(access_token=token, user=user_response)


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"]})
    
    # Add vendor_id if vendor
    if user.get("role") == "vendor":
        vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
        if vendor:
            user["vendor_id"] = vendor["id"]
    
    user_response = UserResponse(**{k: v for k, v in user.items() if k != "password"})
    return TokenResponse(access_token=token, user=user_response)


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset"""
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        return {"message": "If an account exists, a reset link will be sent"}
    
    reset_token = str(uuid.uuid4())
    await db.password_resets.insert_one({
        "user_id": user["id"],
        "token": reset_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc)).isoformat()
    })
    
    return {"message": "If an account exists, a reset link will be sent", "reset_token": reset_token}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password with token"""
    reset_record = await db.password_resets.find_one({"token": request.token}, {"_id": 0})
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    new_hash = hash_password(request.new_password)
    await db.users.update_one(
        {"id": reset_record["user_id"]},
        {"$set": {"password": new_hash}}
    )
    
    await db.password_resets.delete_one({"token": request.token})
    
    return {"message": "Password reset successfully"}


@router.get("/me")
async def get_me(request: Request):
    """Get current user info"""
    user = await get_current_user(request, db)
    return {k: v for k, v in user.items() if k != "password"}


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}
