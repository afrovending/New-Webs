"""
AfroVending - Cloudinary Integration Routes
Handles signed uploads to Cloudinary for images and videos
"""
from fastapi import APIRouter, HTTPException, Query, Depends
import cloudinary
import cloudinary.utils
import cloudinary.uploader
import time
import os

from auth import get_current_user

router = APIRouter(prefix="/cloudinary", tags=["Cloudinary"])

# Initialize Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# Allowed folders for uploads
ALLOWED_FOLDERS = ("products", "services", "vendors", "users", "uploads")


@router.get("/signature")
async def generate_signature(
    resource_type: str = Query("image", enum=["image", "video"]),
    folder: str = Query("products"),
    user: dict = Depends(get_current_user)
):
    """
    Generate a signed upload signature for Cloudinary.
    Frontend uses this to upload directly to Cloudinary.
    """
    # Validate folder
    if not any(folder.startswith(f) for f in ALLOWED_FOLDERS):
        raise HTTPException(status_code=400, detail="Invalid folder path")
    
    timestamp = int(time.time())
    
    # Parameters to sign
    params = {
        "timestamp": timestamp,
        "folder": f"afrovending/{folder}",
    }
    
    # Generate signature
    signature = cloudinary.utils.api_sign_request(
        params,
        os.getenv("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME", "").lower(),  # Cloudinary uses lowercase
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "folder": f"afrovending/{folder}",
        "resource_type": resource_type
    }


@router.delete("/delete")
async def delete_asset(
    public_id: str = Query(...),
    resource_type: str = Query("image", enum=["image", "video"]),
    user: dict = Depends(get_current_user)
):
    """
    Delete an asset from Cloudinary.
    Only authenticated users can delete assets.
    """
    # Validate public_id starts with afrovending folder
    if not public_id.startswith("afrovending/"):
        raise HTTPException(status_code=400, detail="Invalid asset")
    
    try:
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type,
            invalidate=True
        )
        
        if result.get("result") == "ok":
            return {"success": True, "message": "Asset deleted"}
        else:
            return {"success": False, "message": "Asset not found or already deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete: {str(e)}")


@router.get("/config")
async def get_cloudinary_config():
    """
    Get public Cloudinary config (cloud name only).
    Used by frontend to construct URLs.
    """
    return {
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME", "").lower()
    }
