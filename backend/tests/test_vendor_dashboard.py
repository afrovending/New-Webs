"""
AfroVending - Vendor Dashboard Features Tests
Tests vendor login, products, store settings, and recently sold features
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
VENDOR_EMAIL = "vendor@afrovending.com"
VENDOR_PASSWORD = "AfroVendor2024!"

class TestVendorAuth:
    """Test vendor authentication"""
    
    def test_vendor_login_success(self):
        """Test vendor can login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == VENDOR_EMAIL
        assert data["user"]["role"] == "vendor"
        assert "vendor_id" in data["user"]
        print(f"Vendor login successful - vendor_id: {data['user']['vendor_id']}")
    
    def test_vendor_login_invalid_password(self):
        """Test login fails with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400], f"Expected auth error, got: {response.status_code}"


class TestVendorProducts:
    """Test vendor products endpoint"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Vendor login failed")
    
    def test_get_vendor_products(self, vendor_token):
        """Test /api/vendor/products returns vendor's products"""
        response = requests.get(
            f"{BASE_URL}/api/vendor/products",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert response.status_code == 200, f"Failed to get vendor products: {response.text}"
        
        products = response.json()
        assert isinstance(products, list), "Products should be a list"
        
        if len(products) > 0:
            product = products[0]
            # Verify product structure
            assert "id" in product
            assert "name" in product
            assert "price" in product
            assert "vendor_id" in product
            print(f"Vendor has {len(products)} products")
            
            # Check if products have images
            products_with_images = [p for p in products if p.get("images") and len(p["images"]) > 0]
            print(f"{len(products_with_images)} products have images")
            
            # Check if products have categories
            products_with_category = [p for p in products if p.get("category_id")]
            print(f"{len(products_with_category)} products have categories")
    
    def test_vendor_products_requires_auth(self):
        """Test vendor products endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/vendor/products")
        assert response.status_code in [401, 403], "Endpoint should require authentication"


class TestVendorProfile:
    """Test vendor profile endpoints (/api/vendors/me)"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Vendor login failed")
    
    def test_get_vendor_profile(self, vendor_token):
        """Test GET /api/vendors/me returns vendor profile"""
        response = requests.get(
            f"{BASE_URL}/api/vendors/me",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert response.status_code == 200, f"Failed to get vendor profile: {response.text}"
        
        vendor = response.json()
        # Verify vendor profile structure
        assert "id" in vendor
        assert "store_name" in vendor
        assert "description" in vendor
        assert "country" in vendor or "country_code" in vendor
        
        print(f"Vendor profile: {vendor.get('store_name')}, {vendor.get('country')}")
        
        # Check for optional fields that Store Settings page uses
        optional_fields = ["city", "phone", "email", "website", "cultural_story", 
                         "shipping_policy", "return_policy", "logo_url", "banner_url"]
        present_fields = [f for f in optional_fields if f in vendor]
        print(f"Optional fields present: {present_fields}")
    
    def test_update_vendor_profile(self, vendor_token):
        """Test PUT /api/vendors/me can update vendor profile"""
        # First get current profile
        get_response = requests.get(
            f"{BASE_URL}/api/vendors/me",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert get_response.status_code == 200
        original = get_response.json()
        
        # Update with test data
        update_data = {
            "store_name": original.get("store_name", "Test Store"),
            "description": original.get("description", "Test description"),
            "city": "TEST_Lagos_City"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/vendors/me",
            headers={"Authorization": f"Bearer {vendor_token}"},
            json=update_data
        )
        assert update_response.status_code == 200, f"Failed to update profile: {update_response.text}"
        
        # Verify update
        updated = update_response.json()
        assert updated.get("city") == "TEST_Lagos_City", "City should be updated"
        print("Vendor profile update successful")
        
        # Restore original city if it existed
        if original.get("city"):
            restore_data = {
                "store_name": original.get("store_name"),
                "description": original.get("description"),
                "city": original.get("city")
            }
            requests.put(
                f"{BASE_URL}/api/vendors/me",
                headers={"Authorization": f"Bearer {vendor_token}"},
                json=restore_data
            )
    
    def test_vendor_profile_requires_auth(self):
        """Test vendor profile endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/vendors/me")
        assert response.status_code in [401, 403], "Endpoint should require authentication"


class TestCategories:
    """Test categories endpoint for product form"""
    
    def test_get_product_categories(self):
        """Test /api/categories?type=product returns categories"""
        response = requests.get(f"{BASE_URL}/api/categories?type=product")
        assert response.status_code == 200, f"Failed to get categories: {response.text}"
        
        categories = response.json()
        assert isinstance(categories, list), "Categories should be a list"
        assert len(categories) > 0, "Should have at least one category"
        
        # Verify category structure
        cat = categories[0]
        assert "id" in cat
        assert "name" in cat
        
        print(f"Found {len(categories)} product categories")
        category_names = [c.get("name") for c in categories[:5]]
        print(f"Sample categories: {category_names}")


class TestRecentlySold:
    """Test recently sold endpoint for homepage"""
    
    def test_recently_sold_has_product_images(self):
        """Test /api/homepage/recently-sold returns items with product images"""
        response = requests.get(f"{BASE_URL}/api/homepage/recently-sold")
        assert response.status_code == 200, f"Failed to get recently sold: {response.text}"
        
        data = response.json()
        assert "items" in data, "Response should have 'items' key"
        
        items = data["items"]
        if len(items) > 0:
            # Check first item has product_image field (not just 'image')
            item = items[0]
            assert "product_image" in item, "Item should have 'product_image' field"
            assert "product_name" in item
            assert "price" in item
            
            # Count items with actual images
            items_with_images = [i for i in items if i.get("product_image")]
            print(f"Recently sold: {len(items)} items, {len(items_with_images)} with images")
            
            if items_with_images:
                print(f"Sample image URL: {items_with_images[0]['product_image'][:80]}...")
        else:
            print("No recently sold items found")


class TestProductCRUD:
    """Test product create/update/delete operations"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Vendor login failed")
    
    @pytest.fixture
    def category_id(self):
        """Get a valid category ID"""
        response = requests.get(f"{BASE_URL}/api/categories?type=product")
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]["id"]
        pytest.skip("No categories available")
    
    def test_create_product_with_all_fields(self, vendor_token, category_id):
        """Test creating a product with all fields including category and fulfillment"""
        product_data = {
            "name": "TEST_Dashboard_Product",
            "description": "Test product created by dashboard test",
            "price": 29.99,
            "compare_price": 39.99,
            "category_id": category_id,
            "stock": 10,
            "tags": ["test", "dashboard"],
            "fulfillment_option": "FBV",
            "sku": "TEST-SKU-001",
            "weight": "500g",
            "dimensions": "10x10x5cm"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {vendor_token}"},
            json=product_data
        )
        assert response.status_code in [200, 201], f"Failed to create product: {response.text}"
        
        product = response.json()
        assert product.get("name") == "TEST_Dashboard_Product"
        assert product.get("category_id") == category_id
        assert product.get("fulfillment_option") == "FBV"
        print(f"Created product with ID: {product.get('id')}")
        
        # Cleanup - delete the test product
        product_id = product.get("id")
        if product_id:
            delete_response = requests.delete(
                f"{BASE_URL}/api/products/{product_id}",
                headers={"Authorization": f"Bearer {vendor_token}"}
            )
            if delete_response.status_code in [200, 204]:
                print("Test product cleaned up")
    
    def test_create_product_requires_auth(self, category_id):
        """Test product creation requires authentication"""
        product_data = {
            "name": "Unauthorized Product",
            "description": "Should fail",
            "price": 10.00,
            "category_id": category_id,
            "stock": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/products", json=product_data)
        assert response.status_code in [401, 403], "Should require authentication"


class TestCloudinaryIntegration:
    """Test Cloudinary upload endpoint"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Vendor login failed")
    
    def test_cloudinary_signature_endpoint(self, vendor_token):
        """Test cloudinary signature endpoint exists"""
        # Check if cloudinary signature endpoint is available
        response = requests.post(
            f"{BASE_URL}/api/cloudinary/signature",
            headers={"Authorization": f"Bearer {vendor_token}"},
            json={"folder": "products"}
        )
        # Should either return 200 with signature or a specific error
        # Not a 404 (route not found)
        assert response.status_code != 404, "Cloudinary signature endpoint should exist"
        print(f"Cloudinary signature endpoint status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
