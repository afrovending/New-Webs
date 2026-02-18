"""
AfroVending - Database Connection
MongoDB connection and shared database instance
"""
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', '')
if not mongo_url:
    logger.error("MONGO_URL environment variable is not set!")
    mongo_url = 'mongodb://localhost:27017'

try:
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[os.environ.get('DB_NAME', 'afrovending_db')]
    logger.info(f"MongoDB client initialized for database: {os.environ.get('DB_NAME', 'afrovending_db')}")
except Exception as e:
    logger.error(f"Failed to initialize MongoDB client: {e}")
    client = None
    db = None


def get_db():
    """Get database instance"""
    return db
