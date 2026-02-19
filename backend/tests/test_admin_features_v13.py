"""
AfroVending Admin Features Test Suite - Iteration 13
Tests for:
- Admin orders page (was showing blank - fix verified)
- Admin products page with Add Product functionality
- Admin analytics endpoint
- Service categories in homepage
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@afrovending.com"
ADMIN_PASSWORD = "AfroAdmin2024!"


class TestAdminAuth:
    """Test admin authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        return data["access_token"]
    
    def test_admin_login(self, admin_token):
        """Verify admin can login"""
        assert admin_token is not None
        assert len(admin_token) > 0
        print(f"Admin login successful, token length: {len(admin_token)}")


class TestAdminOrders:
    """Test admin orders page functionality (was showing blank)"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_admin_orders_endpoint(self, admin_token):
        """Test GET /api/admin/orders returns orders array"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/orders?limit=100", headers=headers)
        
        assert response.status_code == 200, f"Admin orders failed: {response.text}"
        data = response.json()
        
        # Verify response structure has 'orders' key (fix for blank page)
        assert "orders" in data, "Response missing 'orders' key - this was the bug!"
        assert isinstance(data["orders"], list), "orders should be a list"
        assert "total" in data, "Response missing 'total' key"
        
        print(f"Admin orders endpoint returns {len(data['orders'])} orders, total: {data['total']}")
    
    def test_admin_orders_with_filters(self, admin_token):
        """Test admin orders with status filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/orders?status=pending&limit=10", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"Pending orders count: {len(data['orders'])}")


class TestAdminProducts:
    """Test admin products page with Add Product functionality"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def test_data(self, admin_token):
        """Get test data: vendor_id and category_id"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get a vendor
        vendors_res = requests.get(f"{BASE_URL}/api/admin/vendors?limit=1", headers=headers)
        assert vendors_res.status_code == 200
        vendors_data = vendors_res.json()
        
        if not vendors_data.get("vendors"):
            pytest.skip("No vendors available for testing")
        
        vendor_id = vendors_data["vendors"][0]["id"]
        
        # Get a product category
        cats_res = requests.get(f"{BASE_URL}/api/categories?type=product")
        assert cats_res.status_code == 200
        categories = cats_res.json()
        
        if not categories:
            pytest.skip("No product categories available")
        
        category_id = categories[0]["id"]
        
        return {"vendor_id": vendor_id, "category_id": category_id}
    
    def test_admin_products_list(self, admin_token):
        """Test GET /api/admin/products returns products"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/products?limit=100", headers=headers)
        
        assert response.status_code == 200, f"Admin products failed: {response.text}"
        data = response.json()
        
        assert "products" in data, "Response missing 'products' key"
        assert isinstance(data["products"], list)
        assert "total" in data
        
        # Verify product structure includes vendor_name (for display)
        if data["products"]:
            product = data["products"][0]
            assert "id" in product
            assert "name" in product
            assert "price" in product
            # vendor_name is added by the endpoint
            print(f"First product: {product.get('name')}, vendor: {product.get('vendor_name')}")
        
        print(f"Admin products: {len(data['products'])} products, total: {data['total']}")
    
    def test_admin_create_product(self, admin_token, test_data):
        """Test POST /api/admin/products - Create product as admin"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create product using query parameters (as per AdminProducts.jsx implementation)
        params = {
            "name": "TEST_Admin Created Product",
            "description": "Test product created by admin",
            "price": "29.99",
            "category_id": test_data["category_id"],
            "vendor_id": test_data["vendor_id"],
            "stock": "50",
            "fulfillment_option": "FBV",
            "is_active": "true",
            "is_featured": "false"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/products", params=params, headers=headers)
        
        assert response.status_code == 200, f"Create product failed: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert "product_id" in data
        assert data["message"] == "Product created"
        
        print(f"Created product with ID: {data['product_id']}")
        
        # Clean up - delete the test product
        delete_res = requests.delete(f"{BASE_URL}/api/admin/products/{data['product_id']}", headers=headers)
        assert delete_res.status_code == 200
        print("Test product cleaned up")
    
    def test_admin_update_product(self, admin_token):
        """Test PUT /api/admin/products/{id} - Update product"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get a product to update
        products_res = requests.get(f"{BASE_URL}/api/admin/products?limit=1", headers=headers)
        assert products_res.status_code == 200
        products = products_res.json().get("products", [])
        
        if not products:
            pytest.skip("No products to update")
        
        product_id = products[0]["id"]
        
        # Update featured status
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            params={"is_featured": "true"},
            headers=headers
        )
        
        assert response.status_code == 200
        assert response.json().get("message") == "Product updated"
        
        # Revert
        requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            params={"is_featured": "false"},
            headers=headers
        )
        print(f"Updated product {product_id}")


class TestAdminAnalytics:
    """Test admin analytics endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_analytics_endpoint(self, admin_token):
        """Test GET /api/admin/analytics returns comprehensive data"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/analytics?period=30d", headers=headers)
        
        assert response.status_code == 200, f"Analytics failed: {response.text}"
        data = response.json()
        
        # Verify comprehensive analytics structure
        assert "period" in data
        assert "summary" in data
        assert "growth" in data
        
        # Verify summary fields
        summary = data["summary"]
        expected_fields = [
            "total_users", "new_users", "total_vendors", "active_vendors",
            "pending_vendors", "total_products", "active_products",
            "total_services", "total_orders", "period_orders", "revenue"
        ]
        for field in expected_fields:
            assert field in summary, f"Summary missing field: {field}"
        
        # Verify growth rates
        growth = data["growth"]
        assert "users" in growth
        assert "orders" in growth
        assert "revenue" in growth
        
        # Verify top performers
        assert "top_vendors" in data
        assert "top_products" in data
        assert "daily_stats" in data
        
        print(f"Analytics for period {data['period']}:")
        print(f"  Total users: {summary['total_users']}, New users: {summary['new_users']}")
        print(f"  Total orders: {summary['total_orders']}, Revenue: ${summary['revenue']}")
        print(f"  Daily stats entries: {len(data['daily_stats'])}")
    
    def test_analytics_different_periods(self, admin_token):
        """Test analytics with different periods"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        for period in ["7d", "30d", "90d"]:
            response = requests.get(f"{BASE_URL}/api/admin/analytics?period={period}", headers=headers)
            assert response.status_code == 200, f"Analytics for {period} failed"
            data = response.json()
            assert data["period"] == period
            print(f"Analytics for {period}: {data['summary']['period_orders']} orders")


class TestServiceCategories:
    """Test service categories endpoint for homepage"""
    
    def test_get_service_categories(self):
        """Test GET /api/categories?type=service returns service categories"""
        response = requests.get(f"{BASE_URL}/api/categories?type=service")
        
        assert response.status_code == 200, f"Categories failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        
        if data:
            category = data[0]
            assert "id" in category
            assert "name" in category
            assert "type" in category or category.get("slug")
            print(f"Service categories count: {len(data)}")
            for cat in data[:5]:
                print(f"  - {cat.get('name')}")
        else:
            print("No service categories found - may need seeding")
    
    def test_get_product_categories(self):
        """Test GET /api/categories?type=product returns product categories"""
        response = requests.get(f"{BASE_URL}/api/categories?type=product")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"Product categories count: {len(data)}")


class TestAdminStats:
    """Test admin stats endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_admin_stats(self, admin_token):
        """Test GET /api/admin/stats returns dashboard stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "vendors" in data
        assert "products" in data
        assert "orders" in data
        assert "revenue" in data
        
        print(f"Admin stats: {data['users']['total']} users, {data['vendors']['total']} vendors")


class TestAdminVendors:
    """Test admin vendors management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_all_vendors(self, admin_token):
        """Test GET /api/admin/vendors returns vendors list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/vendors?limit=100", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "vendors" in data
        assert "total" in data
        assert isinstance(data["vendors"], list)
        
        print(f"Admin vendors: {len(data['vendors'])} vendors, total: {data['total']}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
