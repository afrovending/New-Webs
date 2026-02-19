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
from routes import auth, products, vendors, services, categories, bookings, orders, reviews, wishlist, price_alerts, notifications, homepage, admin, currency, upload, cloudinary_routes, stripe_connect, webhooks, shipping, checkout
from routes.products import vendor_router as vendor_products_router

# Import scheduler
from scheduler import start_scheduler, stop_scheduler

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
    
    # Start the scheduler for background jobs
    try:
        start_scheduler()
        logger.info("Payout scheduler started")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
    
    yield
    
    # Stop the scheduler
    try:
        stop_scheduler()
        logger.info("Payout scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping scheduler: {e}")
    
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
# Mount routes with /api prefix for Emergent preview environment
# And without prefix for DigitalOcean (which strips /api before forwarding)
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(vendors.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(wishlist.router, prefix="/api")
app.include_router(price_alerts.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(homepage.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(currency.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(cloudinary_routes.router, prefix="/api")
app.include_router(vendor_products_router, prefix="/api")
app.include_router(stripe_connect.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")
app.include_router(shipping.router, prefix="/api")
app.include_router(checkout.router, prefix="/api")

# Also mount without prefix for DigitalOcean production
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(vendors.router)
app.include_router(services.router)
app.include_router(categories.router)
app.include_router(bookings.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(wishlist.router)
app.include_router(price_alerts.router)
app.include_router(notifications.router)
app.include_router(homepage.router)
app.include_router(admin.router)
app.include_router(currency.router)
app.include_router(upload.router)
app.include_router(cloudinary_routes.router)
app.include_router(vendor_products_router)
app.include_router(stripe_connect.router)
app.include_router(webhooks.router)
app.include_router(shipping.router)
app.include_router(checkout.router)

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
