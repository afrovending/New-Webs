"""
Update products with African images
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# Image mappings
PRODUCT_IMAGES = {
    "Moringa Powder": "https://static.prod-images.emergentagent.com/jobs/54dd1b4f-e2a6-479b-856b-fd34b195f9d5/images/64e263012d922ad73463903998aa945be6381bdd64c789cbc4364507861a6504.png",
    "Maasai Beaded": "https://static.prod-images.emergentagent.com/jobs/54dd1b4f-e2a6-479b-856b-fd34b195f9d5/images/339e5ecf09287983649272233f77aac8bfa3549f223c2637be4f64d274206593.png",
    "Ethiopian Coffee": "https://static.prod-images.emergentagent.com/jobs/54dd1b4f-e2a6-479b-856b-fd34b195f9d5/images/35921531e84c92b0c11d37b071dae79700bf5487ea316e97209757b3d213b526.png",
    "Kente": "https://static.prod-images.emergentagent.com/jobs/54dd1b4f-e2a6-479b-856b-fd34b195f9d5/images/921a99676188c06510effdd6c627dd1fb7d5771552781b05c239a1a6f9e0ab28.png",
    "Shea Butter": "https://static.prod-images.emergentagent.com/jobs/54dd1b4f-e2a6-479b-856b-fd34b195f9d5/images/2b96dae2f1021abb05c4758fc90895fab0176c191d278e69252c430dd8c1a11f.png",
    "Ankara": "https://static.prod-images.emergentagent.com/jobs/54dd1b4f-e2a6-479b-856b-fd34b195f9d5/images/96806d8ebea53613173c79d59119cc02005a1fa4a728d40d4ea54aa167af4d77.png",
    "Mask": "https://static.prod-images.emergentagent.com/jobs/54dd1b4f-e2a6-479b-856b-fd34b195f9d5/images/64c478844a044a2a014abdf1ad25792ab8c5bb601ff5bd1eaeff67700d62f6ba.png",
    "Basket": "https://static.prod-images.emergentagent.com/jobs/54dd1b4f-e2a6-479b-856b-fd34b195f9d5/images/9e44435bab2d37dbc562fbb36501d312aca4a671ab5a9e1e1b66e4fc0f5a1e40.png",
    "Jewelry": "https://static.prod-images.emergentagent.com/jobs/54dd1b4f-e2a6-479b-856b-fd34b195f9d5/images/339e5ecf09287983649272233f77aac8bfa3549f223c2637be4f64d274206593.png",
    "African Black Soap": "https://static.prod-images.emergentagent.com/jobs/a59af3ee-cb70-4fe2-b0fa-3dfc34b374c7/images/8f4a38ea54ea349f52c16f1dc5fd46b15bbaf6f89bc58d87d2ec53b5dd6b3f0f.png",
    "Skincare": "https://static.prod-images.emergentagent.com/jobs/a59af3ee-cb70-4fe2-b0fa-3dfc34b374c7/images/83040dbb33da3add83f811386dd8ff8f0a20694c0708ccc205b7d60d9fdb52f2.png",
}

# Default image for products without a specific match
DEFAULT_IMAGE = "https://static.prod-images.emergentagent.com/jobs/54dd1b4f-e2a6-479b-856b-fd34b195f9d5/images/96806d8ebea53613173c79d59119cc02005a1fa4a728d40d4ea54aa167af4d77.png"


async def update_products():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'afrovending_db')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get products without images
    products = await db.products.find(
        {"$or": [{"images": {"$exists": False}}, {"images": []}, {"images": None}]},
        {"_id": 0, "id": 1, "name": 1}
    ).to_list(100)
    
    print(f"Found {len(products)} products without images")
    
    updated = 0
    for product in products:
        name = product.get("name", "")
        image_url = None
        
        # Match product name to image
        for keyword, url in PRODUCT_IMAGES.items():
            if keyword.lower() in name.lower():
                image_url = url
                break
        
        if not image_url:
            image_url = DEFAULT_IMAGE
        
        # Update product
        await db.products.update_one(
            {"id": product["id"]},
            {"$set": {"images": [image_url]}}
        )
        print(f"Updated: {name} with image")
        updated += 1
    
    print(f"\nUpdated {updated} products with images")
    client.close()


if __name__ == "__main__":
    asyncio.run(update_products())
