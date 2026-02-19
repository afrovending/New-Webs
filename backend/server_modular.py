"""
AfroVending - African Marketplace Backend
Modular FastAPI Application
"""
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
import os

from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import database
from database import get_db, client

# Import routers
from routes import auth, products, vendors, services, categories, bookings, orders, reviews, wishlist, price_alerts, notifications, homepage, admin

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


# Health check
@app.get("/api/health")
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


# Include all routers with /api prefix
# Note: Some routers have their own prefixes (e.g., /auth, /products) so final path is /api/auth, /api/products
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api/products")
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

# Also include without /api prefix for DigitalOcean routing
app.include_router(auth.router, prefix="/auth", tags=["Auth-DO"])
app.include_router(products.router, prefix="/products", tags=["Products-DO"])
app.include_router(vendors.router, prefix="/vendors", tags=["Vendors-DO"])
app.include_router(services.router, prefix="/services", tags=["Services-DO"])
app.include_router(categories.router, tags=["Categories-DO"])
app.include_router(bookings.router, prefix="/bookings", tags=["Bookings-DO"])
app.include_router(orders.router, prefix="/orders", tags=["Orders-DO"])
app.include_router(reviews.router, prefix="/reviews", tags=["Reviews-DO"])
app.include_router(wishlist.router, prefix="/wishlist", tags=["Wishlist-DO"])
app.include_router(price_alerts.router, prefix="/price-alerts", tags=["Alerts-DO"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notif-DO"])
app.include_router(homepage.router, tags=["Homepage-DO"])
app.include_router(admin.router, prefix="/admin", tags=["Admin-DO"])


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
