"""
AfroVending - Product Detail Page P0 Bug Fix Tests
Tests for the P0 bug fix: Product detail page not loading due to reviews API mismatch
Frontend called GET /api/reviews?product_id=xxx but backend only had GET /api/reviews/product/{product_id}
Fix: Added new endpoint that accepts query parameters
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_PRODUCT_ID = "1678be5e-23af-4ac6-b6b0-f5303695b97e"


class TestProductDetailEndpoints:
    """Tests for product detail page endpoints (P0 fix)"""

    def test_get_product_by_id(self):
        """GET /api/products/{product_id} - Should return product with vendor info"""
        response = requests.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain 'id' field"
        assert data["id"] == TEST_PRODUCT_ID, f"Product ID mismatch"
        assert "name" in data, "Response should contain 'name' field"
        assert "price" in data, "Response should contain 'price' field"
        assert "vendor" in data, "Response should contain 'vendor' field"
        assert data["vendor"] is not None, "Vendor should not be null"
        
    def test_get_product_not_found(self):
        """GET /api/products/{product_id} - Should return 404 for non-existent product"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BASE_URL}/api/products/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
    def test_reviews_query_param_endpoint(self):
        """GET /api/reviews?product_id=xxx - NEW ENDPOINT - Should return reviews data"""
        response = requests.get(f"{BASE_URL}/api/reviews?product_id={TEST_PRODUCT_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "reviews" in data, "Response should contain 'reviews' field"
        assert "total" in data, "Response should contain 'total' field"
        assert "distribution" in data, "Response should contain 'distribution' field"
        assert isinstance(data["reviews"], list), "Reviews should be a list"
        
    def test_reviews_query_param_no_product_id(self):
        """GET /api/reviews - Without product_id should return empty result"""
        response = requests.get(f"{BASE_URL}/api/reviews")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("reviews") == [], "Reviews should be empty list without product_id"
        assert data.get("total") == 0, "Total should be 0 without product_id"
        
    def test_reviews_path_param_endpoint(self):
        """GET /api/reviews/product/{product_id} - Original endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/reviews/product/{TEST_PRODUCT_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "reviews" in data, "Response should contain 'reviews' field"
        assert "total" in data, "Response should contain 'total' field"
        
    def test_get_products_list(self):
        """GET /api/products - Should return list of products"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
    def test_get_products_by_category(self):
        """GET /api/products?category_id=xxx - Filter by category works"""
        # First get a product to get its category
        product_response = requests.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        assert product_response.status_code == 200
        
        category_id = product_response.json().get("category_id")
        if category_id:
            response = requests.get(f"{BASE_URL}/api/products?category_id={category_id}&limit=5")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestCartEndpoints:
    """Tests for cart functionality"""
    
    def test_cart_add_unauthenticated(self):
        """POST /api/cart/add - Should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            json={"product_id": TEST_PRODUCT_ID, "quantity": 1}
        )
        
        # Should return 401 for unauthenticated users
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
    def test_get_cart_unauthenticated(self):
        """GET /api/cart - Should require authentication"""
        response = requests.get(f"{BASE_URL}/api/cart")
        
        # Should return 401 for unauthenticated users
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestAuthenticatedCartFlow:
    """Tests for authenticated cart functionality"""
    
    @pytest.fixture
    def auth_headers(self):
        """Login and get auth headers"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@afrovending.com",
                "password": "AfroAdmin2024!"
            }
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
            
        token = login_response.json().get("token")
        if not token:
            pytest.skip("No token in login response")
            
        return {"Authorization": f"Bearer {token}"}
        
    def test_add_to_cart_authenticated(self, auth_headers):
        """POST /api/cart/add - Add product to cart for authenticated user"""
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            json={"product_id": TEST_PRODUCT_ID, "quantity": 1},
            headers=auth_headers
        )
        
        # Should succeed for authenticated users
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
    def test_get_cart_authenticated(self, auth_headers):
        """GET /api/cart - Get cart for authenticated user"""
        response = requests.get(f"{BASE_URL}/api/cart", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "items" in data, "Response should contain 'items' field"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
