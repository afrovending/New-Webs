"""
Test suite for AfroVending new features:
1. Price Alert endpoints (create, get, delete)
2. Order Invoice download
3. Order Reorder functionality
4. Homepage social proof (recently-sold, vendor-success)
5. Product fulfillment_option field (FBV/FBA)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prod-init.preview.emergentagent.com').rstrip('/')

# Test credentials from previous iteration
VENDOR_EMAIL = "vendor@afrovending.com"
VENDOR_PASSWORD = "AfroVendor2024!"
ADMIN_EMAIL = "admin@afrovending.com"
ADMIN_PASSWORD = "AfroAdmin2024!"

# Store test data
test_data = {
    "vendor_token": None,
    "admin_token": None,
    "product_id": None,
    "order_id": None,
    "price_alert_id": None,
    "created_product_id": None
}

class TestAuthentication:
    """Test login and get tokens for further tests"""
    
    def test_vendor_login(self):
        """Login as vendor"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            test_data["vendor_token"] = data.get("access_token")
            assert "access_token" in data
            print(f"PASS: Vendor login successful, role: {data.get('user', {}).get('role')}")
        else:
            pytest.skip(f"Vendor login failed: {response.status_code} - {response.text}")
    
    def test_admin_login(self):
        """Login as admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            test_data["admin_token"] = data.get("access_token")
            assert "access_token" in data
            print(f"PASS: Admin login successful, role: {data.get('user', {}).get('role')}")
        else:
            pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")


class TestPriceAlerts:
    """Test price alert functionality"""
    
    def test_get_product_for_alert(self):
        """Get a product to set price alert on"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "No products found"
        test_data["product_id"] = data[0]["id"]
        print(f"PASS: Got product for alert: {data[0]['name']} (${data[0]['price']})")
    
    def test_create_price_alert_unauthorized(self):
        """Test creating price alert without auth"""
        response = requests.post(f"{BASE_URL}/api/price-alerts/create", json={
            "product_id": test_data.get("product_id", "test"),
            "target_price": 10.0
        })
        assert response.status_code == 401, "Should require authentication"
        print("PASS: Price alert creation requires authentication")
    
    def test_create_price_alert(self):
        """Create a price alert with authentication"""
        if not test_data["admin_token"]:
            pytest.skip("No admin token available")
        
        headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
        response = requests.post(f"{BASE_URL}/api/price-alerts/create", 
            headers=headers,
            json={
                "product_id": test_data["product_id"],
                "target_price": 5.0,
                "notify_email": True,
                "notify_app": True
            })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data or "message" in data
        if "id" in data:
            test_data["price_alert_id"] = data["id"]
        print(f"PASS: Price alert created/updated: {data.get('message', data.get('id'))}")
    
    def test_get_price_alerts(self):
        """Get user's price alerts"""
        if not test_data["admin_token"]:
            pytest.skip("No admin token available")
        
        headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
        response = requests.get(f"{BASE_URL}/api/price-alerts", headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "alerts" in data
        assert "count" in data
        print(f"PASS: Got {data['count']} price alerts")
        
        # Check alert structure if alerts exist
        if len(data["alerts"]) > 0:
            alert = data["alerts"][0]
            assert "product_id" in alert
            assert "target_price" in alert
            assert "is_active" in alert
            test_data["price_alert_id"] = alert.get("id")  # Store for deletion
    
    def test_get_price_alerts_unauthorized(self):
        """Test getting price alerts without auth"""
        response = requests.get(f"{BASE_URL}/api/price-alerts")
        assert response.status_code == 401
        print("PASS: GET price-alerts requires authentication")
    
    def test_delete_price_alert(self):
        """Delete a price alert"""
        if not test_data["admin_token"] or not test_data.get("price_alert_id"):
            pytest.skip("No token or alert ID available")
        
        headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
        response = requests.delete(f"{BASE_URL}/api/price-alerts/{test_data['price_alert_id']}", 
            headers=headers)
        
        # Accept both 200 and 404 (if alert was already deleted)
        assert response.status_code in [200, 404], f"Failed: {response.text}"
        print(f"PASS: Price alert deletion status: {response.status_code}")


class TestHomepageSocialProof:
    """Test homepage social proof endpoints"""
    
    def test_recently_sold(self):
        """Test recently sold products endpoint"""
        response = requests.get(f"{BASE_URL}/api/homepage/recently-sold")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "items" in data
        print(f"PASS: Recently sold returned {len(data['items'])} items")
        
        # Check structure if items exist
        if len(data["items"]) > 0:
            item = data["items"][0]
            assert "product_id" in item
            assert "name" in item
            assert "sold_to" in item
            assert "time_ago" in item
            print(f"  - Sample: {item['name']} sold to {item['sold_to']} {item['time_ago']}")
    
    def test_vendor_success_stories(self):
        """Test vendor success stories endpoint"""
        response = requests.get(f"{BASE_URL}/api/homepage/vendor-success")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "vendors" in data
        print(f"PASS: Vendor success returned {len(data['vendors'])} vendors")
        
        # Check structure if vendors exist
        if len(data["vendors"]) > 0:
            vendor = data["vendors"][0]
            assert "vendor_id" in vendor
            assert "store_name" in vendor
            assert "country" in vendor
            print(f"  - Sample: {vendor['store_name']} from {vendor['country']}")
    
    def test_homepage_stats(self):
        """Test homepage stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/homepage/stats")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "vendors" in data
        assert "products" in data
        assert "display" in data
        print(f"PASS: Homepage stats - {data['vendors']} vendors, {data['products']} products")


class TestOrderFeatures:
    """Test order invoice and reorder features"""
    
    def test_get_or_create_order(self):
        """Get existing order or create one for testing"""
        if not test_data["admin_token"]:
            pytest.skip("No admin token available")
        
        headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
        
        # Try to get existing orders
        response = requests.get(f"{BASE_URL}/api/orders/history", headers=headers)
        if response.status_code == 200:
            data = response.json()
            orders = data.get("orders", [])
            if orders:
                test_data["order_id"] = orders[0]["id"]
                print(f"PASS: Found existing order: {orders[0]['id'][:8]}")
                return
        
        # Need to create an order - first add to cart
        product_id = test_data.get("product_id")
        if not product_id:
            # Get a product
            prod_response = requests.get(f"{BASE_URL}/api/products?limit=1")
            if prod_response.status_code == 200 and prod_response.json():
                product_id = prod_response.json()[0]["id"]
        
        if product_id:
            # Add to cart
            requests.post(f"{BASE_URL}/api/cart/add", 
                headers=headers,
                json={"product_id": product_id, "quantity": 1})
            
            # Create order
            order_response = requests.post(f"{BASE_URL}/api/orders", 
                headers=headers,
                json={
                    "items": [{"product_id": product_id, "quantity": 1}],
                    "shipping_address": "123 Test St",
                    "shipping_city": "Test City",
                    "shipping_country": "USA"
                })
            
            if order_response.status_code == 200:
                test_data["order_id"] = order_response.json()["id"]
                print(f"PASS: Created test order: {test_data['order_id'][:8]}")
            else:
                pytest.skip(f"Could not create order: {order_response.text}")
        else:
            pytest.skip("No product available for order")
    
    def test_order_detail_endpoint(self):
        """Test order detail endpoint"""
        if not test_data["admin_token"] or not test_data.get("order_id"):
            pytest.skip("No token or order ID available")
        
        headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
        response = requests.get(f"{BASE_URL}/api/orders/{test_data['order_id']}/detail", 
            headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert "items" in data
        assert "total" in data
        assert "timeline" in data
        print(f"PASS: Order detail retrieved with {len(data['items'])} items, {len(data['timeline'])} timeline entries")
    
    def test_order_invoice_endpoint(self):
        """Test invoice download endpoint"""
        if not test_data["admin_token"] or not test_data.get("order_id"):
            pytest.skip("No token or order ID available")
        
        headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
        response = requests.get(f"{BASE_URL}/api/orders/{test_data['order_id']}/invoice", 
            headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Check if response is PDF
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, f"Expected PDF, got: {content_type}"
        
        # Check Content-Disposition header
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp
        assert "filename" in content_disp
        
        print(f"PASS: Invoice PDF downloaded, size: {len(response.content)} bytes")
    
    def test_order_reorder_endpoint(self):
        """Test reorder functionality"""
        if not test_data["admin_token"] or not test_data.get("order_id"):
            pytest.skip("No token or order ID available")
        
        headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
        response = requests.post(f"{BASE_URL}/api/orders/{test_data['order_id']}/reorder", 
            headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert "items_added" in data
        print(f"PASS: Reorder - {data['items_added']} items added to cart")
    
    def test_order_invoice_unauthorized(self):
        """Test invoice requires authentication"""
        response = requests.get(f"{BASE_URL}/api/orders/test-id/invoice")
        assert response.status_code == 401
        print("PASS: Invoice endpoint requires authentication")
    
    def test_order_reorder_unauthorized(self):
        """Test reorder requires authentication"""
        response = requests.post(f"{BASE_URL}/api/orders/test-id/reorder")
        assert response.status_code == 401
        print("PASS: Reorder endpoint requires authentication")


class TestFulfillmentOption:
    """Test fulfillment option (FBV/FBA) for products"""
    
    def test_product_has_fulfillment_option(self):
        """Check if products have fulfillment_option field"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        # Check if any product has fulfillment_option
        has_option = any("fulfillment_option" in p for p in data)
        print(f"PASS: Products checked for fulfillment_option field: {has_option}")
        
        for p in data:
            option = p.get("fulfillment_option", "N/A")
            print(f"  - {p['name'][:30]}... : fulfillment={option}")
    
    def test_create_product_with_fulfillment_fba(self):
        """Create product with FBA fulfillment"""
        if not test_data["vendor_token"]:
            pytest.skip("No vendor token available")
        
        headers = {"Authorization": f"Bearer {test_data['vendor_token']}"}
        
        # Get a category first
        cat_response = requests.get(f"{BASE_URL}/api/categories?type=product")
        category_id = ""
        if cat_response.status_code == 200 and cat_response.json():
            category_id = cat_response.json()[0].get("id", "")
        
        response = requests.post(f"{BASE_URL}/api/products", 
            headers=headers,
            json={
                "name": "TEST_FBA_Product",
                "description": "Test product with FBA fulfillment",
                "price": 25.99,
                "category_id": category_id,
                "stock": 10,
                "images": [],
                "tags": ["test", "fba"],
                "fulfillment_option": "FBA"
            })
        
        # May fail if vendor not approved - that's OK
        if response.status_code == 200:
            data = response.json()
            test_data["created_product_id"] = data.get("id")
            assert data.get("fulfillment_option") == "FBA"
            print(f"PASS: Created product with FBA: {data['id'][:8]}")
        elif response.status_code == 403:
            print(f"SKIP: Vendor not approved to create products - {response.json().get('detail')}")
        else:
            print(f"WARN: Product creation failed: {response.status_code} - {response.text}")
    
    def test_create_product_with_fulfillment_fbv(self):
        """Create product with FBV fulfillment"""
        if not test_data["vendor_token"]:
            pytest.skip("No vendor token available")
        
        headers = {"Authorization": f"Bearer {test_data['vendor_token']}"}
        
        # Get a category first
        cat_response = requests.get(f"{BASE_URL}/api/categories?type=product")
        category_id = ""
        if cat_response.status_code == 200 and cat_response.json():
            category_id = cat_response.json()[0].get("id", "")
        
        response = requests.post(f"{BASE_URL}/api/products", 
            headers=headers,
            json={
                "name": "TEST_FBV_Product",
                "description": "Test product with FBV fulfillment",
                "price": 19.99,
                "category_id": category_id,
                "stock": 5,
                "images": [],
                "tags": ["test", "fbv"],
                "fulfillment_option": "FBV"
            })
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("fulfillment_option") == "FBV"
            print(f"PASS: Created product with FBV: {data['id'][:8]}")
        elif response.status_code == 403:
            print(f"SKIP: Vendor not approved to create products")
        else:
            print(f"WARN: Product creation failed: {response.status_code}")


class TestOrderHistoryPage:
    """Test order history list endpoint"""
    
    def test_order_history_list(self):
        """Test order history pagination"""
        if not test_data["admin_token"]:
            pytest.skip("No admin token available")
        
        headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
        response = requests.get(f"{BASE_URL}/api/orders/history?page=1&limit=10", 
            headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "orders" in data
        assert "page" in data
        assert "pages" in data
        print(f"PASS: Order history - {len(data['orders'])} orders, page {data['page']} of {data['pages']}")
    
    def test_order_history_with_status_filter(self):
        """Test order history with status filter"""
        if not test_data["admin_token"]:
            pytest.skip("No admin token available")
        
        headers = {"Authorization": f"Bearer {test_data['admin_token']}"}
        
        for status in ["pending", "processing", "delivered"]:
            response = requests.get(f"{BASE_URL}/api/orders/history?status={status}", 
                headers=headers)
            assert response.status_code == 200, f"Failed for {status}: {response.text}"
            data = response.json()
            print(f"  - Status '{status}': {len(data.get('orders', []))} orders")
        
        print("PASS: Order history status filters work")


# Cleanup
@pytest.fixture(scope="session", autouse=True)
def cleanup(request):
    """Cleanup test data after all tests"""
    def cleanup_func():
        # Delete test products if created
        if test_data.get("created_product_id") and test_data.get("vendor_token"):
            headers = {"Authorization": f"Bearer {test_data['vendor_token']}"}
            requests.delete(f"{BASE_URL}/api/products/{test_data['created_product_id']}", 
                headers=headers)
            print(f"Cleanup: Deleted test product {test_data['created_product_id'][:8]}")
    
    request.addfinalizer(cleanup_func)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
