"""
AfroVending API Tests
Tests for: Health, Categories, Products, Services, Vendors, Auth, Cart, Orders
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://afro-shop-2.preview.emergentagent.com')

# Test credentials
VENDOR_EMAIL = "vendor@afrovending.com"
VENDOR_PASSWORD = "AfroVendor2024!"
ADMIN_EMAIL = "admin@afrovending.com"
ADMIN_PASSWORD = "AfroAdmin2024!"
TEST_CUSTOMER_EMAIL = "testcustomer@test.com"
TEST_CUSTOMER_PASSWORD = "TestPassword123!"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def vendor_token(api_client):
    """Get vendor authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": VENDOR_EMAIL,
        "password": VENDOR_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Vendor authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed - skipping admin tests")


@pytest.fixture(scope="module")
def authenticated_vendor_client(api_client, vendor_token):
    """Session with vendor auth header"""
    api_client.headers.update({"Authorization": f"Bearer {vendor_token}"})
    return api_client


class TestHealthEndpoint:
    """Health check endpoint tests"""

    def test_health_check_returns_200(self, api_client):
        """Test health endpoint returns healthy status"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print(f"✓ Health check passed: {data}")


class TestCategoriesEndpoint:
    """Categories API tests"""

    def test_get_all_categories(self, api_client):
        """Test fetching all categories"""
        response = api_client.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} categories")

    def test_get_product_categories(self, api_client):
        """Test fetching product categories"""
        response = api_client.get(f"{BASE_URL}/api/categories?type=product")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify expected categories exist
        category_names = [c["name"] for c in data]
        expected = ["Fashion", "Art & Crafts", "Jewelry"]
        for cat in expected:
            assert cat in category_names, f"Expected category '{cat}' not found"
        print(f"✓ Product categories: {category_names}")

    def test_get_service_categories(self, api_client):
        """Test fetching service categories"""
        response = api_client.get(f"{BASE_URL}/api/categories?type=service")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Service categories count: {len(data)}")


class TestCountriesEndpoint:
    """Countries API tests"""

    def test_get_all_countries(self, api_client):
        """Test fetching all countries"""
        response = api_client.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} countries")


class TestProductsEndpoint:
    """Products API tests"""

    def test_get_products_list(self, api_client):
        """Test fetching products list"""
        response = api_client.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} products")
        return data

    def test_get_products_with_limit(self, api_client):
        """Test fetching products with limit"""
        response = api_client.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
        print(f"✓ Limited products: {len(data)}")

    def test_get_products_with_search(self, api_client):
        """Test product search functionality"""
        response = api_client.get(f"{BASE_URL}/api/products?search=African")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Search results: {len(data)} products")

    def test_get_products_with_price_filter(self, api_client):
        """Test product price filtering"""
        response = api_client.get(f"{BASE_URL}/api/products?min_price=10&max_price=100")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify price range
        for product in data:
            assert product["price"] >= 10
            assert product["price"] <= 100
        print(f"✓ Price filtered products: {len(data)}")


class TestServicesEndpoint:
    """Services API tests"""

    def test_get_services_list(self, api_client):
        """Test fetching services list"""
        response = api_client.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} services")

    def test_get_services_with_limit(self, api_client):
        """Test fetching services with limit"""
        response = api_client.get(f"{BASE_URL}/api/services?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
        print(f"✓ Limited services: {len(data)}")


class TestVendorsEndpoint:
    """Vendors API tests"""

    def test_get_vendors_list(self, api_client):
        """Test fetching vendors list"""
        response = api_client.get(f"{BASE_URL}/api/vendors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} vendors")
        return data

    def test_get_approved_vendors(self, api_client):
        """Test fetching only approved vendors"""
        response = api_client.get(f"{BASE_URL}/api/vendors?is_approved=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All should be approved
        for vendor in data:
            assert vendor.get("is_approved") == True
        print(f"✓ Approved vendors: {len(data)}")


class TestPlatformStatsEndpoint:
    """Platform stats API tests"""

    def test_get_platform_stats(self, api_client):
        """Test fetching public platform stats"""
        response = api_client.get(f"{BASE_URL}/api/stats/platform")
        assert response.status_code == 200
        data = response.json()
        assert "total_vendors" in data
        assert "total_products" in data
        assert "total_services" in data
        assert "countries_served" in data
        print(f"✓ Platform stats: vendors={data['total_vendors']}, products={data['total_products']}")


class TestAuthEndpoints:
    """Authentication API tests"""

    def test_vendor_login_success(self, api_client):
        """Test vendor login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == VENDOR_EMAIL
        assert data["user"]["role"] == "vendor"
        print(f"✓ Vendor login successful: {data['user']['email']}")

    def test_admin_login_success(self, api_client):
        """Test admin login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['email']}")

    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials returns 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")

    def test_register_new_customer(self, api_client):
        """Test customer registration"""
        import uuid
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "Customer",
            "role": "customer"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["role"] == "customer"
        print(f"✓ New customer registered: {unique_email}")

    def test_register_duplicate_email_fails(self, api_client):
        """Test duplicate email registration fails"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": VENDOR_EMAIL,  # Already exists
            "password": "AnotherPassword123!",
            "first_name": "Duplicate",
            "last_name": "User",
            "role": "customer"
        })
        assert response.status_code == 400
        print("✓ Duplicate email correctly rejected")


class TestAuthenticatedEndpoints:
    """Tests requiring authentication"""

    def test_get_current_user(self, api_client, vendor_token):
        """Test getting current user profile"""
        api_client.headers.update({"Authorization": f"Bearer {vendor_token}"})
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == VENDOR_EMAIL
        assert data["role"] == "vendor"
        print(f"✓ Current user: {data['email']}")

    def test_unauthorized_access(self, api_client):
        """Test accessing protected endpoint without token"""
        # Remove auth header
        api_client.headers.pop("Authorization", None)
        response = api_client.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 401
        print("✓ Unauthorized access correctly rejected")


class TestCartEndpoints:
    """Cart API tests"""

    def test_get_empty_cart(self, api_client, vendor_token):
        """Test getting cart for authenticated user"""
        api_client.headers.update({"Authorization": f"Bearer {vendor_token}"})
        response = api_client.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"✓ Cart retrieved: {len(data['items'])} items, total=${data['total']}")


class TestVendorEndpoints:
    """Vendor-specific API tests"""

    def test_get_vendor_orders(self, api_client, vendor_token):
        """Test getting vendor's orders"""
        api_client.headers.update({"Authorization": f"Bearer {vendor_token}"})
        response = api_client.get(f"{BASE_URL}/api/vendor/orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Vendor orders: {len(data)}")

    def test_get_vendor_bookings(self, api_client, vendor_token):
        """Test getting vendor's bookings"""
        api_client.headers.update({"Authorization": f"Bearer {vendor_token}"})
        response = api_client.get(f"{BASE_URL}/api/vendor/bookings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Vendor bookings: {len(data)}")


class TestAdminEndpoints:
    """Admin-specific API tests"""

    def test_get_admin_stats(self, api_client, admin_token):
        """Test getting admin dashboard stats"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_vendors" in data
        assert "total_products" in data
        assert "total_orders" in data
        print(f"✓ Admin stats: {data['total_users']} users, {data['total_vendors']} vendors")

    def test_get_admin_users(self, api_client, admin_token):
        """Test getting all users as admin"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin users list: {len(data)} users")

    def test_non_admin_cannot_access_admin_stats(self, api_client, vendor_token):
        """Test non-admin cannot access admin endpoints"""
        api_client.headers.update({"Authorization": f"Bearer {vendor_token}"})
        response = api_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 403
        print("✓ Non-admin correctly denied admin access")


class TestReviewsEndpoint:
    """Reviews API tests"""

    def test_get_reviews(self, api_client):
        """Test getting reviews"""
        response = api_client.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Reviews: {len(data)}")


class TestMessagingEndpoints:
    """Messaging API tests"""

    def test_get_conversations(self, api_client, vendor_token):
        """Test getting conversations"""
        api_client.headers.update({"Authorization": f"Bearer {vendor_token}"})
        response = api_client.get(f"{BASE_URL}/api/conversations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Conversations: {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
