"""
AfroVending - Category & Country Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
import uuid

from database import get_db
from auth import get_current_user

router = APIRouter(tags=["Categories & Countries"])
# db initialized per-request


# ==================== CATEGORIES ====================
@router.get("/categories")
async def get_categories(type: Optional[str] = None):
    """Get all categories, optionally filtered by type"""
    query = {} if not type else {"type": type}
    categories = await db.categories.find(query, {"_id": 0}).to_list(100)
    return categories


@router.post("/categories")
async def create_category(
    name: str, 
    icon: Optional[str] = None, 
    parent_id: Optional[str] = None, 
    type: str = "product",
    user: dict = Depends(get_current_user)
):
    """Create a new category (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = {
        "id": str(uuid.uuid4()),
        "name": name,
        "slug": name.lower().replace(" ", "-"),
        "icon": icon,
        "parent_id": parent_id,
        "type": type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category)
    return {k: v for k, v in category.items() if k != "_id"}


# ==================== COUNTRIES ====================
AFRICAN_COUNTRIES = [
    {"code": "NG", "name": "Nigeria", "flag": "🇳🇬"},
    {"code": "GH", "name": "Ghana", "flag": "🇬🇭"},
    {"code": "KE", "name": "Kenya", "flag": "🇰🇪"},
    {"code": "ZA", "name": "South Africa", "flag": "🇿🇦"},
    {"code": "ET", "name": "Ethiopia", "flag": "🇪🇹"},
    {"code": "TZ", "name": "Tanzania", "flag": "🇹🇿"},
    {"code": "UG", "name": "Uganda", "flag": "🇺🇬"},
    {"code": "SN", "name": "Senegal", "flag": "🇸🇳"},
    {"code": "CI", "name": "Côte d'Ivoire", "flag": "🇨🇮"},
    {"code": "CM", "name": "Cameroon", "flag": "🇨🇲"},
    {"code": "MA", "name": "Morocco", "flag": "🇲🇦"},
    {"code": "EG", "name": "Egypt", "flag": "🇪🇬"},
]


@router.get("/countries")
async def get_countries():
    """Get list of African countries"""
    return AFRICAN_COUNTRIES


@router.get("/countries/{country_code}")
async def get_country(country_code: str):
    """Get country by code"""
    country = next((c for c in AFRICAN_COUNTRIES if c["code"] == country_code.upper()), None)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return country
