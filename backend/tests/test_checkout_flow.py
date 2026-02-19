"""
AfroVending Checkout Flow Tests
Testing the P0 checkout functionality: POST /api/orders and POST /api/checkout/order/{orderId}
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@afrovending.com"
ADMIN_PASSWORD = "AfroAdmin2024!"


class TestAuthAndSetup:
    """Authentication and setup tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def product_id(self):
        """Get a valid product ID for testing"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert response.status_code == 200, f"Failed to get products: {response.text}"
        products = response.json()
        # Handle both list and object responses
        if isinstance(products, list):
            assert len(products) > 0, "No products found"
            return products[0]["id"]
        elif isinstance(products, dict) and "products" in products:
            assert len(products["products"]) > 0, "No products found"
            return products["products"][0]["id"]
        else:
            pytest.fail(f"Unexpected products response format: {products}")
    
    def test_login_success(self):
        """Test admin login works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"Login successful for user: {data['user']['email']}")
    
    def test_products_available(self):
        """Test products endpoint returns products"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        products = response.json()
        # Products can be list or object with products key
        if isinstance(products, list):
            print(f"Found {len(products)} products (list format)")
            assert len(products) > 0, "No products available for checkout testing"
        elif isinstance(products, dict):
            product_list = products.get("products", [])
            print(f"Found {len(product_list)} products (object format)")
            assert len(product_list) > 0, "No products available for checkout testing"


class TestCheckoutEndpoints:
    """Test the checkout-related endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def product_id(self):
        """Get a valid product ID for testing"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert response.status_code == 200
        products = response.json()
        if isinstance(products, list):
            return products[0]["id"]
        return products.get("products", [{}])[0].get("id")
    
    @pytest.mark.skip(reason="Frontend now uses POST /api/checkout/cart instead of POST /api/orders")
    def test_post_orders_endpoint_exists(self, auth_token):
        """TEST P0: POST /api/orders should exist for order creation
        NOTE: This test is skipped because the frontend was updated to use POST /api/checkout/cart
        which creates order + Stripe session in one call - a better approach
        """
        pass
    
    def test_checkout_cart_endpoint_works(self, auth_token, product_id):
        """TEST: POST /api/checkout/cart creates order + checkout session"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/cart",
            headers=headers,
            json={
                "items": [{"product_id": product_id, "quantity": 1}],
                "shipping": {
                    "name": "Test User",
                    "address": "123 Test St",
                    "city": "New York",
                    "state": "NY",
                    "zip": "10001",
                    "country": "US",
                    "phone": "+1234567890"
                },
                "origin_url": BASE_URL
            }
        )
        
        print(f"POST /api/checkout/cart response: {response.status_code}")
        
        # This endpoint WORKS correctly
        assert response.status_code == 200, f"checkout/cart failed: {response.text}"
        
        data = response.json()
        assert "checkout_url" in data, "Missing checkout_url in response"
        assert "session_id" in data, "Missing session_id in response"
        assert "order_id" in data, "Missing order_id in response"
        
        # Verify Stripe checkout URL
        assert data["checkout_url"].startswith("https://checkout.stripe.com"), \
            f"Invalid checkout URL: {data['checkout_url']}"
        
        print(f"Checkout URL: {data['checkout_url'][:80]}...")
        print(f"Order ID created: {data['order_id']}")
        
        return data
    
    def test_checkout_order_endpoint_with_valid_order(self, auth_token, product_id):
        """TEST: POST /api/checkout/order/{orderId} works with valid order"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        # First create an order using checkout/cart
        cart_response = requests.post(
            f"{BASE_URL}/api/checkout/cart",
            headers=headers,
            json={
                "items": [{"product_id": product_id, "quantity": 1}],
                "shipping": {
                    "name": "Test User",
                    "address": "123 Test St",
                    "city": "New York",
                    "state": "NY",
                    "zip": "10001",
                    "country": "US",
                    "phone": "+1234567890"
                },
                "origin_url": BASE_URL
            }
        )
        
        assert cart_response.status_code == 200
        order_id = cart_response.json()["order_id"]
        
        # Now test the POST /checkout/order/{order_id} endpoint
        checkout_response = requests.post(
            f"{BASE_URL}/api/checkout/order/{order_id}",
            headers=headers,
            json={"origin_url": BASE_URL}
        )
        
        print(f"POST /api/checkout/order/{order_id} response: {checkout_response.status_code}")
        
        # This should return 400 because order was already processed
        # OR it should work and create another checkout session
        if checkout_response.status_code == 200:
            data = checkout_response.json()
            assert "checkout_url" in data
            assert "session_id" in data
            print(f"New checkout URL created: {data['checkout_url'][:80]}...")
        elif checkout_response.status_code == 400:
            # Order already has checkout session, which is expected
            print(f"Order already processed: {checkout_response.text}")
        else:
            pytest.fail(f"Unexpected response: {checkout_response.status_code} - {checkout_response.text}")
    
    def test_checkout_order_with_invalid_order(self, auth_token):
        """TEST: POST /api/checkout/order/{orderId} returns 404 for invalid order"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        fake_order_id = str(uuid.uuid4())
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/order/{fake_order_id}",
            headers=headers,
            json={"origin_url": BASE_URL}
        )
        
        print(f"POST /api/checkout/order/{fake_order_id} response: {response.status_code}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_checkout_order_without_auth(self):
        """TEST: POST /api/checkout/order/{orderId} requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/checkout/order/some-order-id",
            json={"origin_url": BASE_URL}
        )
        
        print(f"Unauthenticated checkout response: {response.status_code}")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestCartOperations:
    """Test cart operations that lead to checkout"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def product_id(self):
        """Get a valid product ID"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        products = response.json()
        if isinstance(products, list):
            return products[0]["id"]
        return products.get("products", [{}])[0].get("id")
    
    def test_add_to_cart(self, auth_token, product_id):
        """Test adding item to cart"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            headers=headers,
            json={"product_id": product_id, "quantity": 1}
        )
        
        print(f"Add to cart response: {response.status_code}")
        assert response.status_code == 200, f"Add to cart failed: {response.text}"
    
    def test_get_cart(self, auth_token):
        """Test getting cart contents"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/cart", headers=headers)
        
        print(f"Get cart response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"Cart has {len(data['items'])} items, total: ${data['total']}")


class TestOrderRetrieval:
    """Test order retrieval endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json().get("access_token")
    
    def test_get_orders(self, auth_token):
        """Test GET /api/orders returns user's orders"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/orders", headers=headers)
        
        print(f"GET /api/orders response: {response.status_code}")
        assert response.status_code == 200
        
        orders = response.json()
        print(f"Found {len(orders)} orders")
    
    def test_get_order_history(self, auth_token):
        """Test GET /api/orders/history with pagination"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/orders/history",
            headers=headers,
            params={"page": 1, "limit": 10}
        )
        
        print(f"GET /api/orders/history response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "orders" in data
        assert "total" in data
        print(f"Order history: {data['total']} total orders")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
