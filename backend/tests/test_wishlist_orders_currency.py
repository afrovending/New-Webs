"""
Test Suite for AfroVending New Features - Iteration 4:
- Wishlist API (GET, ADD, REMOVE, CHECK, MOVE-TO-CART)
- Order History with pagination and filters
- Order Timeline and Status Updates
- Live Exchange Rate API Integration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_CREDS = {"email": "admin@afrovending.com", "password": "AfroAdmin2024!"}
VENDOR_CREDS = {"email": "vendor@afrovending.com", "password": "AfroVendor2024!"}

# Test data IDs
TEST_PRODUCT_ID = "a12ec941-4407-4d5c-907c-b33ee4c1b72d"  # Moringa Powder


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Admin authentication failed: {response.status_code}")


@pytest.fixture(scope="module")
def vendor_token(api_client):
    """Get vendor authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=VENDOR_CREDS)
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Vendor authentication failed: {response.status_code}")


# ==================== WISHLIST API TESTS ====================

class TestWishlistAPI:
    """Tests for wishlist functionality - all endpoints require authentication"""
    
    def test_get_wishlist_requires_auth(self, api_client):
        """Test GET /api/wishlist without auth returns 401"""
        response = api_client.get(f"{BASE_URL}/api/wishlist")
        assert response.status_code == 401
        print("GET /api/wishlist requires authentication - PASS")
    
    def test_get_wishlist_authenticated(self, api_client, admin_token):
        """Test GET /api/wishlist returns wishlist items"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = api_client.get(f"{BASE_URL}/api/wishlist", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "count" in data
        assert isinstance(data["items"], list)
        
        print(f"GET /api/wishlist: {data['count']} items in wishlist")
        
        # Check structure of wishlist items if any exist
        if data["items"]:
            item = data["items"][0]
            assert "id" in item
            assert "user_id" in item
            assert "added_at" in item
            # Should have either product or service details
            if item.get("product_id"):
                assert "product" in item, "Wishlist item should include product details"
            print(f"First item: {item.get('id')[:8]}... with product/service enrichment")
    
    def test_add_to_wishlist_requires_auth(self, api_client):
        """Test POST /api/wishlist/add without auth returns 401"""
        response = api_client.post(
            f"{BASE_URL}/api/wishlist/add",
            json={"product_id": TEST_PRODUCT_ID}
        )
        assert response.status_code == 401
        print("POST /api/wishlist/add requires authentication - PASS")
    
    def test_add_to_wishlist_missing_ids(self, api_client, admin_token):
        """Test adding to wishlist without product_id or service_id fails"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = api_client.post(
            f"{BASE_URL}/api/wishlist/add",
            json={},
            headers=headers
        )
        assert response.status_code == 400
        assert "product_id or service_id" in response.json()["detail"].lower()
        print("POST /api/wishlist/add with missing IDs returns 400 - PASS")
    
    def test_add_to_wishlist_nonexistent_product(self, api_client, admin_token):
        """Test adding nonexistent product to wishlist fails"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = api_client.post(
            f"{BASE_URL}/api/wishlist/add",
            json={"product_id": "nonexistent-product-id"},
            headers=headers
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
        print("POST /api/wishlist/add with invalid product returns 404 - PASS")
    
    def test_add_duplicate_to_wishlist(self, api_client, admin_token):
        """Test adding same product twice returns error (product already in wishlist)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First, check if product is already in wishlist
        check_response = api_client.get(
            f"{BASE_URL}/api/wishlist/check/{TEST_PRODUCT_ID}",
            headers=headers
        )
        
        if check_response.status_code == 200 and check_response.json().get("in_wishlist"):
            # Product already in wishlist - try to add again
            response = api_client.post(
                f"{BASE_URL}/api/wishlist/add",
                json={"product_id": TEST_PRODUCT_ID},
                headers=headers
            )
            assert response.status_code == 400
            assert "already in wishlist" in response.json()["detail"].lower()
            print("POST /api/wishlist/add duplicate returns 400 - PASS")
        else:
            # Product not in wishlist - add it first, then try to add again
            api_client.post(
                f"{BASE_URL}/api/wishlist/add",
                json={"product_id": TEST_PRODUCT_ID},
                headers=headers
            )
            # Now try to add again
            response = api_client.post(
                f"{BASE_URL}/api/wishlist/add",
                json={"product_id": TEST_PRODUCT_ID},
                headers=headers
            )
            assert response.status_code == 400
            print("POST /api/wishlist/add duplicate returns 400 - PASS")
    
    def test_check_wishlist_product(self, api_client, admin_token):
        """Test GET /api/wishlist/check/{product_id} returns status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = api_client.get(
            f"{BASE_URL}/api/wishlist/check/{TEST_PRODUCT_ID}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "in_wishlist" in data
        assert "item_id" in data
        assert isinstance(data["in_wishlist"], bool)
        
        print(f"GET /api/wishlist/check: in_wishlist={data['in_wishlist']}, item_id={data['item_id']}")
    
    def test_remove_from_wishlist_by_item_id(self, api_client, admin_token):
        """Test DELETE /api/wishlist/remove/{item_id} removes item"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First check wishlist
        check_response = api_client.get(
            f"{BASE_URL}/api/wishlist/check/{TEST_PRODUCT_ID}",
            headers=headers
        )
        
        if check_response.status_code == 200 and check_response.json().get("in_wishlist"):
            item_id = check_response.json()["item_id"]
            
            # Remove using item_id
            response = api_client.delete(
                f"{BASE_URL}/api/wishlist/remove/{item_id}",
                headers=headers
            )
            assert response.status_code == 200
            assert "removed" in response.json()["message"].lower()
            
            # Verify removal
            verify_response = api_client.get(
                f"{BASE_URL}/api/wishlist/check/{TEST_PRODUCT_ID}",
                headers=headers
            )
            assert verify_response.json()["in_wishlist"] == False
            
            # Add back for future tests
            api_client.post(
                f"{BASE_URL}/api/wishlist/add",
                json={"product_id": TEST_PRODUCT_ID},
                headers=headers
            )
            print("DELETE /api/wishlist/remove/{item_id} - PASS")
        else:
            # Product not in wishlist - add, then remove
            add_response = api_client.post(
                f"{BASE_URL}/api/wishlist/add",
                json={"product_id": TEST_PRODUCT_ID},
                headers=headers
            )
            item_id = add_response.json()["item"]["id"]
            
            response = api_client.delete(
                f"{BASE_URL}/api/wishlist/remove/{item_id}",
                headers=headers
            )
            assert response.status_code == 200
            print("DELETE /api/wishlist/remove/{item_id} - PASS")
    
    def test_remove_from_wishlist_by_product_id(self, api_client, admin_token):
        """Test DELETE /api/wishlist/remove-product/{product_id} removes item"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First ensure product is in wishlist
        check_response = api_client.get(
            f"{BASE_URL}/api/wishlist/check/{TEST_PRODUCT_ID}",
            headers=headers
        )
        
        if not check_response.json().get("in_wishlist"):
            api_client.post(
                f"{BASE_URL}/api/wishlist/add",
                json={"product_id": TEST_PRODUCT_ID},
                headers=headers
            )
        
        # Remove using product_id
        response = api_client.delete(
            f"{BASE_URL}/api/wishlist/remove-product/{TEST_PRODUCT_ID}",
            headers=headers
        )
        assert response.status_code == 200
        assert "removed" in response.json()["message"].lower()
        
        # Verify removal
        verify_response = api_client.get(
            f"{BASE_URL}/api/wishlist/check/{TEST_PRODUCT_ID}",
            headers=headers
        )
        assert verify_response.json()["in_wishlist"] == False
        
        # Add back for other tests
        api_client.post(
            f"{BASE_URL}/api/wishlist/add",
            json={"product_id": TEST_PRODUCT_ID},
            headers=headers
        )
        print("DELETE /api/wishlist/remove-product/{product_id} - PASS")
    
    def test_move_to_cart_from_wishlist(self, api_client, admin_token):
        """Test POST /api/wishlist/move-to-cart/{item_id} moves item to cart"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First ensure product is in wishlist
        check_response = api_client.get(
            f"{BASE_URL}/api/wishlist/check/{TEST_PRODUCT_ID}",
            headers=headers
        )
        
        if not check_response.json().get("in_wishlist"):
            api_client.post(
                f"{BASE_URL}/api/wishlist/add",
                json={"product_id": TEST_PRODUCT_ID},
                headers=headers
            )
            check_response = api_client.get(
                f"{BASE_URL}/api/wishlist/check/{TEST_PRODUCT_ID}",
                headers=headers
            )
        
        item_id = check_response.json()["item_id"]
        
        # Move to cart
        response = api_client.post(
            f"{BASE_URL}/api/wishlist/move-to-cart/{item_id}",
            headers=headers
        )
        assert response.status_code == 200
        assert "moved" in response.json()["message"].lower() or "cart" in response.json()["message"].lower()
        
        # Verify removed from wishlist
        verify_response = api_client.get(
            f"{BASE_URL}/api/wishlist/check/{TEST_PRODUCT_ID}",
            headers=headers
        )
        assert verify_response.json()["in_wishlist"] == False
        
        # Check cart for item
        cart_response = api_client.get(f"{BASE_URL}/api/cart", headers=headers)
        if cart_response.status_code == 200:
            cart = cart_response.json()
            cart_product_ids = [item["product_id"] for item in cart.get("items", [])]
            assert TEST_PRODUCT_ID in cart_product_ids, "Product should be in cart after move"
        
        print("POST /api/wishlist/move-to-cart/{item_id} - PASS")


# ==================== ORDER HISTORY API TESTS ====================

class TestOrderHistoryAPI:
    """Tests for enhanced order history with pagination and filters"""
    
    def test_get_order_history_requires_auth(self, api_client):
        """Test GET /api/orders/history without auth returns 401"""
        response = api_client.get(f"{BASE_URL}/api/orders/history")
        assert response.status_code == 401
        print("GET /api/orders/history requires authentication - PASS")
    
    def test_get_order_history_authenticated(self, api_client, admin_token):
        """Test GET /api/orders/history returns paginated results"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = api_client.get(f"{BASE_URL}/api/orders/history", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "orders" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        
        assert isinstance(data["orders"], list)
        assert isinstance(data["total"], int)
        assert data["page"] >= 1
        
        print(f"GET /api/orders/history: {data['total']} total orders, page {data['page']} of {data['pages']}")
    
    def test_order_history_pagination(self, api_client, admin_token):
        """Test order history pagination parameters"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test with page and limit params
        response = api_client.get(
            f"{BASE_URL}/api/orders/history",
            params={"page": 1, "limit": 5},
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should not return more than limit items
        assert len(data["orders"]) <= 5
        print(f"Order history pagination: {len(data['orders'])} orders (limit=5)")
    
    def test_order_history_status_filter(self, api_client, admin_token):
        """Test order history with status filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test various status filters
        statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
        for status in statuses:
            response = api_client.get(
                f"{BASE_URL}/api/orders/history",
                params={"status": status, "page": 1, "limit": 10},
                headers=headers
            )
            assert response.status_code == 200, f"Status filter '{status}' failed"
        
        print("Order history status filter: All statuses working")


# ==================== ORDER TIMELINE API TESTS ====================

class TestOrderTimelineAPI:
    """Tests for order timeline functionality"""
    
    def test_get_order_timeline_requires_auth(self, api_client):
        """Test GET /api/orders/{order_id}/timeline without auth returns 401"""
        response = api_client.get(f"{BASE_URL}/api/orders/test-order-id/timeline")
        assert response.status_code == 401
        print("GET /api/orders/{order_id}/timeline requires authentication - PASS")
    
    def test_get_order_timeline_not_found(self, api_client, admin_token):
        """Test GET /api/orders/{order_id}/timeline with invalid ID returns 404"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = api_client.get(
            f"{BASE_URL}/api/orders/invalid-order-id/timeline",
            headers=headers
        )
        assert response.status_code == 404
        print("GET /api/orders/invalid-id/timeline returns 404 - PASS")
    
    def test_get_order_detail_requires_auth(self, api_client):
        """Test GET /api/orders/{order_id}/detail without auth returns 401"""
        response = api_client.get(f"{BASE_URL}/api/orders/test-order-id/detail")
        assert response.status_code == 401
        print("GET /api/orders/{order_id}/detail requires authentication - PASS")
    
    def test_get_order_detail_not_found(self, api_client, admin_token):
        """Test GET /api/orders/{order_id}/detail with invalid ID returns 404"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = api_client.get(
            f"{BASE_URL}/api/orders/invalid-order-id/detail",
            headers=headers
        )
        assert response.status_code == 404
        print("GET /api/orders/invalid-id/detail returns 404 - PASS")


# ==================== LIVE CURRENCY API TESTS ====================

class TestLiveCurrencyAPI:
    """Tests for real-time exchange rate API integration"""
    
    def test_get_live_rates(self, api_client):
        """Test GET /api/currency/live-rates returns cached live rates"""
        response = api_client.get(f"{BASE_URL}/api/currency/live-rates")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "base" in data
        assert data["base"] == "USD"
        assert "rates" in data
        assert "symbols" in data
        assert "supported_currencies" in data
        assert "last_updated" in data  # Can be None on first call
        assert "source" in data
        
        # Verify expected currencies are present
        expected_currencies = ["USD", "EUR", "GBP", "NGN", "KES", "ZAR", "GHS"]
        for currency in expected_currencies:
            assert currency in data["rates"], f"Missing currency: {currency}"
            assert data["rates"][currency] > 0, f"Invalid rate for {currency}"
        
        # USD should be 1.0
        assert data["rates"]["USD"] == 1.0
        
        # NGN should be significantly higher than 1
        assert data["rates"]["NGN"] > 100, "NGN rate should be > 100"
        
        print(f"Live rates: {len(data['supported_currencies'])} currencies, source: {data['source']}")
        print(f"Sample rates - USD: {data['rates']['USD']}, NGN: {data['rates']['NGN']:.2f}, EUR: {data['rates']['EUR']:.4f}")
    
    def test_live_currency_conversion_usd_to_ngn(self, api_client):
        """Test GET /api/currency/convert-live USD to NGN"""
        response = api_client.get(
            f"{BASE_URL}/api/currency/convert-live",
            params={"amount": 100, "from_currency": "USD", "to_currency": "NGN"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "original" in data
        assert "converted" in data
        assert "rate" in data
        assert "live" in data
        
        # Verify original data
        assert data["original"]["amount"] == 100
        assert data["original"]["currency"] == "USD"
        
        # Verify converted data
        assert data["converted"]["currency"] == "NGN"
        assert data["converted"]["amount"] > 100000, "100 USD should be > 100,000 NGN"
        
        # Verify it's marked as live
        assert data["live"] == True
        
        print(f"Live conversion: 100 USD = {data['converted']['amount']:,.2f} NGN (rate: {data['rate']:.4f})")
    
    def test_live_currency_conversion_ngn_to_usd(self, api_client):
        """Test GET /api/currency/convert-live NGN to USD (reverse)"""
        response = api_client.get(
            f"{BASE_URL}/api/currency/convert-live",
            params={"amount": 150000, "from_currency": "NGN", "to_currency": "USD"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["converted"]["currency"] == "USD"
        # 150,000 NGN should be approximately 100 USD (with some variance)
        assert data["converted"]["amount"] > 50, "150,000 NGN should be > $50"
        assert data["converted"]["amount"] < 200, "150,000 NGN should be < $200"
        
        print(f"Live conversion: 150,000 NGN = ${data['converted']['amount']:.2f} USD")
    
    def test_live_currency_conversion_eur_to_gbp(self, api_client):
        """Test GET /api/currency/convert-live between non-USD currencies"""
        response = api_client.get(
            f"{BASE_URL}/api/currency/convert-live",
            params={"amount": 100, "from_currency": "EUR", "to_currency": "GBP"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["original"]["currency"] == "EUR"
        assert data["converted"]["currency"] == "GBP"
        # EUR and GBP are similar, so 100 EUR should be roughly 80-120 GBP
        assert 50 < data["converted"]["amount"] < 150
        
        print(f"Live conversion: 100 EUR = {data['converted']['amount']:.2f} GBP")
    
    def test_live_currency_conversion_invalid_currency(self, api_client):
        """Test GET /api/currency/convert-live with invalid currency returns 400"""
        response = api_client.get(
            f"{BASE_URL}/api/currency/convert-live",
            params={"amount": 100, "from_currency": "USD", "to_currency": "INVALID"}
        )
        
        assert response.status_code == 400
        assert "unsupported" in response.json()["detail"].lower() or "invalid" in response.json()["detail"].lower()
        print("Live conversion with invalid currency returns 400 - PASS")
    
    def test_live_rates_caching(self, api_client):
        """Test that live rates are cached (same last_updated on consecutive calls)"""
        response1 = api_client.get(f"{BASE_URL}/api/currency/live-rates")
        response2 = api_client.get(f"{BASE_URL}/api/currency/live-rates")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # last_updated should be the same (cached response)
        if response1.json()["last_updated"] and response2.json()["last_updated"]:
            assert response1.json()["last_updated"] == response2.json()["last_updated"]
            print(f"Live rates caching working - last_updated: {response1.json()['last_updated']}")
        else:
            print("Live rates caching: Cannot verify (no last_updated)")


# ==================== INTEGRATION TESTS ====================

class TestWishlistOrderIntegration:
    """Integration tests for wishlist and order features"""
    
    def test_wishlist_product_enrichment(self, api_client, admin_token):
        """Test that wishlist items include full product details"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get wishlist
        response = api_client.get(f"{BASE_URL}/api/wishlist", headers=headers)
        
        if response.status_code == 200 and response.json()["items"]:
            item = response.json()["items"][0]
            
            # Should have product details
            if item.get("product_id"):
                assert "product" in item, "Wishlist should include product details"
                product = item["product"]
                assert "name" in product
                assert "price" in product
                assert "id" in product
                print(f"Wishlist enrichment: Product '{product['name']}' with price ${product['price']}")
                
                # Should have vendor info
                if "vendor" in item:
                    assert "store_name" in item["vendor"]
                    print(f"Wishlist enrichment: Vendor '{item['vendor']['store_name']}'")
        else:
            print("Wishlist is empty - cannot verify enrichment")
    
    def test_currency_context_integration(self, api_client):
        """Test that currency endpoints work together for frontend integration"""
        # Get live rates
        rates_response = api_client.get(f"{BASE_URL}/api/currency/live-rates")
        assert rates_response.status_code == 200
        rates = rates_response.json()["rates"]
        
        # Convert a product price using rates
        product_price_usd = 15.0  # Example product price
        ngn_rate = rates.get("NGN", 1550)
        
        # Convert using live endpoint
        convert_response = api_client.get(
            f"{BASE_URL}/api/currency/convert-live",
            params={"amount": product_price_usd, "from_currency": "USD", "to_currency": "NGN"}
        )
        assert convert_response.status_code == 200
        
        converted_price = convert_response.json()["converted"]["amount"]
        expected_price = product_price_usd * ngn_rate
        
        # Should be close (within 1% for rate consistency)
        assert abs(converted_price - expected_price) / expected_price < 0.01, \
            f"Currency conversion mismatch: {converted_price} vs {expected_price}"
        
        print(f"Currency integration: ${product_price_usd} = ₦{converted_price:,.2f} NGN")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
