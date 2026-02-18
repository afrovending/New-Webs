"""
AfroVending - Review Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
import uuid

from database import get_db
from auth import get_current_user
from models import ReviewCreate

router = APIRouter(prefix="/reviews", tags=["Reviews"])
db = get_db()


@router.get("/product/{product_id}")
async def get_product_reviews(product_id: str, skip: int = 0, limit: int = 20):
    """Get reviews for a product"""
    reviews = await db.reviews.find(
        {"product_id": product_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Get total count and rating distribution
    total = await db.reviews.count_documents({"product_id": product_id})
    
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": "$rating", "count": {"$sum": 1}}}
    ]
    rating_dist = await db.reviews.aggregate(pipeline).to_list(10)
    distribution = {str(r["_id"]): r["count"] for r in rating_dist}
    
    return {
        "reviews": reviews,
        "total": total,
        "distribution": distribution
    }


@router.get("/service/{service_id}")
async def get_service_reviews(service_id: str, skip: int = 0, limit: int = 20):
    """Get reviews for a service"""
    reviews = await db.reviews.find(
        {"service_id": service_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.reviews.count_documents({"service_id": service_id})
    
    return {"reviews": reviews, "total": total}


@router.post("/product/{product_id}")
async def create_product_review(
    product_id: str,
    review_data: ReviewCreate,
    user: dict = Depends(get_current_user)
):
    """Create a review for a product"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user already reviewed
    existing = await db.reviews.find_one({
        "product_id": product_id,
        "user_id": user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    review = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "user_id": user["id"],
        "user_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "Anonymous",
        "rating": review_data.rating,
        "title": review_data.title,
        "comment": review_data.comment,
        "images": review_data.images,
        "would_recommend": review_data.would_recommend,
        "helpful_votes": 0,
        "verified_purchase": False,  # Check order history in production
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review)
    
    # Update product rating
    await update_product_rating(product_id)
    
    return {k: v for k, v in review.items() if k != "_id"}


@router.post("/service/{service_id}")
async def create_service_review(
    service_id: str,
    review_data: ReviewCreate,
    user: dict = Depends(get_current_user)
):
    """Create a review for a service"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    existing = await db.reviews.find_one({
        "service_id": service_id,
        "user_id": user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this service")
    
    review = {
        "id": str(uuid.uuid4()),
        "service_id": service_id,
        "user_id": user["id"],
        "user_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "Anonymous",
        "rating": review_data.rating,
        "title": review_data.title,
        "comment": review_data.comment,
        "images": review_data.images,
        "would_recommend": review_data.would_recommend,
        "helpful_votes": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review)
    
    # Update service rating
    await update_service_rating(service_id)
    
    return {k: v for k, v in review.items() if k != "_id"}


@router.post("/{review_id}/helpful")
async def mark_review_helpful(review_id: str, user: dict = Depends(get_current_user)):
    """Mark a review as helpful"""
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if user already voted
    existing_vote = await db.review_votes.find_one({
        "review_id": review_id,
        "user_id": user["id"]
    })
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted on this review")
    
    await db.review_votes.insert_one({
        "review_id": review_id,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.reviews.update_one(
        {"id": review_id},
        {"$inc": {"helpful_votes": 1}}
    )
    
    return {"message": "Vote recorded"}


async def update_product_rating(product_id: str):
    """Recalculate and update product rating"""
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "count": {"$sum": 1}
        }}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    
    if result:
        await db.products.update_one(
            {"id": product_id},
            {"$set": {
                "average_rating": round(result[0]["avg_rating"], 1),
                "review_count": result[0]["count"]
            }}
        )


async def update_service_rating(service_id: str):
    """Recalculate and update service rating"""
    pipeline = [
        {"$match": {"service_id": service_id}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "count": {"$sum": 1}
        }}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    
    if result:
        await db.services.update_one(
            {"id": service_id},
            {"$set": {
                "average_rating": round(result[0]["avg_rating"], 1),
                "review_count": result[0]["count"]
            }}
        )
