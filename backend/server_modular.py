"""
AfroVending - African Marketplace Backend
Modular FastAPI Application
"""
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
import os

from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create uploads directory
UPLOAD_DIR = "/app/backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Import database
from database import get_db, client

# Import routers
from routes import auth, products, vendors, services, categories, bookings, orders, reviews, wishlist, price_alerts, notifications, homepage, admin, currency, upload

db = get_db()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    logger.info("Starting AfroVending API...")
    
    # Test database connection
    try:
        await client.admin.command('ping')
        logger.info("MongoDB connection successful")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
    
    yield
    
    logger.info("Shutting down AfroVending API...")


# Create FastAPI app
app = FastAPI(
    title="AfroVending API",
    description="African Marketplace Backend API",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "https://afrovending.com",
    "https://www.afrovending.com",
    os.environ.get("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# Health check - accessible at /health (DigitalOcean adds /api prefix)
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        await client.admin.command('ping')
        db_status = "connected"
    except:
        db_status = "disconnected"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status
    }


# Include all routers
# Note: DigitalOcean forwards /api/* to backend, keeping the /api prefix
# So we should NOT add /api prefix here - the routes already handle the paths
app.include_router(auth.router)  # Routes at /auth/*
app.include_router(products.router)  # Routes at /products/*
app.include_router(vendors.router)  # Routes at /vendors/*
app.include_router(services.router)  # Routes at /services/*
app.include_router(categories.router)  # Routes at /categories/*
app.include_router(bookings.router)  # Routes at /bookings/*
app.include_router(orders.router)  # Routes at /orders/*
app.include_router(reviews.router)  # Routes at /reviews/*
app.include_router(wishlist.router)  # Routes at /wishlist/*
app.include_router(price_alerts.router)  # Routes at /price-alerts/*
app.include_router(notifications.router)  # Routes at /notifications/*
app.include_router(homepage.router)  # Routes at /stats/* and /homepage/*
app.include_router(admin.router)  # Routes at /admin/*
app.include_router(currency.router)  # Routes at /currency/*
app.include_router(upload.router)  # Routes at /upload/*

# Remove the duplicate DO routes - not needed


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
