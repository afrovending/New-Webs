"""
AfroVending - File Upload Routes
Handles image and video uploads for products and services
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from fastapi.responses import FileResponse
from datetime import datetime, timezone
from typing import List, Optional
import uuid
import os
import shutil

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/upload", tags=["Upload"])

# Upload directory
UPLOAD_DIR = "/app/backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/mpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB for images
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB for videos


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload a single image file"""
    
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Read file to check size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # Return the URL
    return {
        "success": True,
        "filename": filename,
        "url": f"/uploads/{filename}",
        "size": len(contents),
        "content_type": file.content_type
    }


@router.post("/images")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload multiple image files"""
    
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed")
    
    uploaded = []
    errors = []
    
    for file in files:
        try:
            # Validate file type
            if file.content_type not in ALLOWED_IMAGE_TYPES:
                errors.append(f"{file.filename}: Invalid file type")
                continue
            
            # Read file
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE:
                errors.append(f"{file.filename}: File too large")
                continue
            
            # Generate unique filename
            ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            
            # Save file
            with open(filepath, "wb") as f:
                f.write(contents)
            
            uploaded.append({
                "filename": filename,
                "url": f"/uploads/{filename}",
                "original_name": file.filename
            })
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
    
    return {
        "success": True,
        "uploaded": uploaded,
        "errors": errors,
        "count": len(uploaded)
    }


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload a video file"""
    
    # Validate file type
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_VIDEO_TYPES)}"
        )
    
    # Read file to check size
    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size is {MAX_VIDEO_SIZE // (1024*1024)}MB"
        )
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    with open(filepath, "wb") as f:
        f.write(contents)
    
    return {
        "success": True,
        "filename": filename,
        "url": f"/uploads/{filename}",
        "size": len(contents),
        "content_type": file.content_type
    }


@router.delete("/{filename}")
async def delete_file(
    filename: str,
    user: dict = Depends(get_current_user)
):
    """Delete an uploaded file"""
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        os.remove(filepath)
        return {"success": True, "message": "File deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")
