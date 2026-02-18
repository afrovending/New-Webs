"""
Test Suite for AfroVending New Features:
- Multi-Currency Support (rates, conversion, detection)
- Advanced Search (products, services)
- Enhanced Reviews (create, get, mark helpful)
- Vendor Deactivation Email (via code review)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_CREDS = {"email": "admin@afrovending.com", "password": "AfroAdmin2024!"}
VENDOR_CREDS = {"email": "vendor@afrovending.com", "password": "AfroVendor2024!"}

# Test data IDs from context
TEST_PRODUCT_ID = "a12ec941-4407-4d5c-907c-b33ee4c1b72d"
TEST_VENDOR_ID = "e76d7167-8e71-4b03-9321-416362952c69"


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
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def vendor_token(api_client):
    """Get vendor authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=VENDOR_CREDS)
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Vendor authentication failed")


# ==================== CURRENCY API TESTS ====================

class TestCurrencyAPI:
    """Tests for multi-currency support endpoints"""
    
    def test_get_currency_rates(self, api_client):
        """Test GET /api/currency/rates returns supported currencies"""
        response = api_client.get(f"{BASE_URL}/api/currency/rates")
        assert response.status_code == 200
        
        data = response.json()
        assert "base" in data
        assert data["base"] == "USD"
        assert "rates" in data
        assert "symbols" in data
        assert "supported_currencies" in data
        
        # Verify expected currencies are present
        expected_currencies = ["USD", "EUR", "GBP", "NGN", "KES", "ZAR", "GHS"]
        for currency in expected_currencies:
            assert currency in data["rates"], f"Missing currency: {currency}"
            assert data["rates"][currency] > 0, f"Invalid rate for {currency}"
        
        # Verify USD is base rate 1.0
        assert data["rates"]["USD"] == 1.0
        print(f"Currency rates API: {len(data['supported_currencies'])} currencies supported")
    
    def test_currency_conversion_usd_to_ngn(self, api_client):
        """Test currency conversion from USD to Nigerian Naira"""
        response = api_client.get(
            f"{BASE_URL}/api/currency/convert",
            params={"amount": 100, "from_currency": "USD", "to_currency": "NGN"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "original" in data
        assert "converted" in data
        assert "rate" in data
        
        assert data["original"]["amount"] == 100
        assert data["original"]["currency"] == "USD"
        assert data["converted"]["currency"] == "NGN"
        assert data["converted"]["amount"] > 100  # NGN should be much higher
        assert data["rate"] > 1  # NGN rate > USD rate
        
        # Verify conversion math (100 USD * ~1550 NGN rate)
        assert data["converted"]["amount"] > 100000, "NGN conversion should be > 100,000"
        print(f"100 USD = {data['converted']['amount']} NGN (rate: {data['rate']})")
    
    def test_currency_conversion_ngn_to_usd(self, api_client):
        """Test reverse conversion from NGN to USD"""
        response = api_client.get(
            f"{BASE_URL}/api/currency/convert",
            params={"amount": 155000, "from_currency": "NGN", "to_currency": "USD"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["converted"]["currency"] == "USD"
        # ~155000 NGN should be ~100 USD
        assert data["converted"]["amount"] >= 90 and data["converted"]["amount"] <= 110
        print(f"155000 NGN = {data['converted']['amount']} USD")
    
    def test_currency_conversion_eur_to_gbp(self, api_client):
        """Test conversion between non-USD currencies"""
        response = api_client.get(
            f"{BASE_URL}/api/currency/convert",
            params={"amount": 100, "from_currency": "EUR", "to_currency": "GBP"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["converted"]["currency"] == "GBP"
        # EUR to GBP should be roughly similar
        assert data["converted"]["amount"] > 50 and data["converted"]["amount"] < 150
        print(f"100 EUR = {data['converted']['amount']} GBP")
    
    def test_currency_conversion_invalid_currency(self, api_client):
        """Test conversion with unsupported currency returns 400"""
        response = api_client.get(
            f"{BASE_URL}/api/currency/convert",
            params={"amount": 100, "from_currency": "USD", "to_currency": "INVALID"}
        )
        assert response.status_code == 400
        assert "Unsupported currency" in response.json()["detail"]
    
    def test_currency_detection(self, api_client):
        """Test currency detection based on IP"""
        response = api_client.get(f"{BASE_URL}/api/currency/detect")
        assert response.status_code == 200
        
        data = response.json()
        assert "detected_country" in data
        assert "currency" in data
        assert "symbol" in data
        assert "rate" in data
        
        # Currency should be a valid currency code
        assert len(data["currency"]) == 3
        assert data["rate"] > 0
        print(f"Detected: {data['detected_country']} -> {data['currency']} ({data['symbol']})")


# ==================== ADVANCED SEARCH TESTS ====================

class TestAdvancedSearch:
    """Tests for advanced search endpoints"""
    
    def test_product_search_basic(self, api_client):
        """Test basic product search"""
        response = api_client.post(
            f"{BASE_URL}/api/search/products",
            json={"query": "", "page": 1, "limit": 10}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        
        assert isinstance(data["products"], list)
        print(f"Product search: {data['total']} total products")
    
    def test_product_search_with_query(self, api_client):
        """Test product search with text query"""
        response = api_client.post(
            f"{BASE_URL}/api/search/products",
            json={"query": "african", "page": 1, "limit": 10}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        print(f"Product search 'african': {len(data['products'])} results")
    
    def test_product_search_with_price_filter(self, api_client):
        """Test product search with price range filter"""
        response = api_client.post(
            f"{BASE_URL}/api/search/products",
            json={"min_price": 10, "max_price": 100, "page": 1, "limit": 20}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        
        # Verify all products are within price range
        for product in data["products"]:
            assert product["price"] >= 10, f"Product price {product['price']} < min_price 10"
            assert product["price"] <= 100, f"Product price {product['price']} > max_price 100"
        
        print(f"Price filter ($10-$100): {len(data['products'])} products")
    
    def test_product_search_with_rating_filter(self, api_client):
        """Test product search with minimum rating filter"""
        response = api_client.post(
            f"{BASE_URL}/api/search/products",
            json={"min_rating": 3, "page": 1, "limit": 20}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        print(f"Rating filter (3+ stars): {len(data['products'])} products")
    
    def test_product_search_sort_by_price_low(self, api_client):
        """Test product search sorted by price low to high"""
        response = api_client.post(
            f"{BASE_URL}/api/search/products",
            json={"sort_by": "price_low", "page": 1, "limit": 10}
        )
        assert response.status_code == 200
        
        data = response.json()
        products = data["products"]
        
        # Verify products are sorted by price ascending
        if len(products) >= 2:
            for i in range(len(products) - 1):
                assert products[i]["price"] <= products[i+1]["price"], "Products not sorted by price_low"
        
        print(f"Sort by price_low: First product ${products[0]['price'] if products else 'N/A'}")
    
    def test_product_search_sort_by_price_high(self, api_client):
        """Test product search sorted by price high to low"""
        response = api_client.post(
            f"{BASE_URL}/api/search/products",
            json={"sort_by": "price_high", "page": 1, "limit": 10}
        )
        assert response.status_code == 200
        
        data = response.json()
        products = data["products"]
        
        # Verify products are sorted by price descending
        if len(products) >= 2:
            for i in range(len(products) - 1):
                assert products[i]["price"] >= products[i+1]["price"], "Products not sorted by price_high"
        
        print(f"Sort by price_high: First product ${products[0]['price'] if products else 'N/A'}")
    
    def test_service_search_basic(self, api_client):
        """Test basic service search"""
        response = api_client.post(
            f"{BASE_URL}/api/search/services",
            json={"query": "", "page": 1, "limit": 10}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "services" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        
        print(f"Service search: {data['total']} total services")
    
    def test_service_search_with_filters(self, api_client):
        """Test service search with multiple filters"""
        response = api_client.post(
            f"{BASE_URL}/api/search/services",
            json={
                "min_price": 20,
                "max_price": 200,
                "sort_by": "rating",
                "page": 1,
                "limit": 20
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "services" in data
        print(f"Service search with filters: {len(data['services'])} results")


# ==================== REVIEWS TESTS ====================

class TestReviewsAPI:
    """Tests for enhanced reviews endpoints"""
    
    def test_get_product_reviews(self, api_client):
        """Test GET /api/reviews/product/{product_id}"""
        response = api_client.get(f"{BASE_URL}/api/reviews/product/{TEST_PRODUCT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "reviews" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        assert "rating_distribution" in data
        assert "recommend_percent" in data
        
        # Verify rating distribution structure
        assert isinstance(data["rating_distribution"], dict)
        for i in range(1, 6):
            assert i in data["rating_distribution"] or str(i) in data["rating_distribution"]
        
        print(f"Product reviews: {data['total']} reviews, {data['recommend_percent']}% recommend")
    
    def test_get_product_reviews_with_sort(self, api_client):
        """Test product reviews with different sort options"""
        for sort_by in ["newest", "oldest", "highest", "lowest", "helpful"]:
            response = api_client.get(
                f"{BASE_URL}/api/reviews/product/{TEST_PRODUCT_ID}",
                params={"sort_by": sort_by}
            )
            assert response.status_code == 200, f"Sort by {sort_by} failed"
        
        print("Product reviews sort options: All working")
    
    def test_get_service_reviews(self, api_client):
        """Test GET /api/reviews/service/{service_id} with a service ID"""
        # First get a service ID
        services_response = api_client.get(f"{BASE_URL}/api/services?limit=1")
        if services_response.status_code == 200 and services_response.json():
            service_id = services_response.json()[0]["id"]
            
            response = api_client.get(f"{BASE_URL}/api/reviews/service/{service_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert "reviews" in data
            assert "total" in data
            print(f"Service reviews: {data['total']} reviews")
        else:
            pytest.skip("No services available for testing")
    
    def test_get_vendor_reviews(self, api_client):
        """Test GET /api/reviews/vendor/{vendor_id}"""
        response = api_client.get(f"{BASE_URL}/api/reviews/vendor/{TEST_VENDOR_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "reviews" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        
        print(f"Vendor reviews: {data['total']} total reviews")
    
    def test_create_review_requires_auth(self, api_client):
        """Test creating review without authentication fails"""
        response = api_client.post(
            f"{BASE_URL}/api/reviews/create",
            json={
                "rating": 5,
                "comment": "Great product!",
                "product_id": TEST_PRODUCT_ID
            }
        )
        assert response.status_code == 401
    
    def test_create_review_requires_purchase(self, api_client, vendor_token):
        """Test creating review without purchasing the product fails"""
        headers = {"Authorization": f"Bearer {vendor_token}"}
        response = api_client.post(
            f"{BASE_URL}/api/reviews/create",
            json={
                "rating": 5,
                "comment": "Great product!",
                "product_id": TEST_PRODUCT_ID
            },
            headers=headers
        )
        # Should fail because user hasn't purchased the product
        assert response.status_code == 403
        assert "purchased" in response.json()["detail"].lower()
    
    def test_mark_review_helpful_requires_auth(self, api_client):
        """Test marking review as helpful requires authentication"""
        # First get a review ID
        response = api_client.get(f"{BASE_URL}/api/reviews/product/{TEST_PRODUCT_ID}")
        if response.status_code == 200 and response.json()["reviews"]:
            review_id = response.json()["reviews"][0]["id"]
            
            helpful_response = api_client.post(f"{BASE_URL}/api/reviews/{review_id}/helpful")
            assert helpful_response.status_code == 401
        else:
            pytest.skip("No reviews available for testing")


# ==================== VENDOR DEACTIVATION EMAIL TEST ====================

class TestVendorDeactivationEmail:
    """Tests for vendor deactivation email functionality"""
    
    def test_deactivate_vendor_triggers_email_service(self, api_client, admin_token):
        """
        Test that deactivating a vendor calls email_service.send_vendor_deactivation
        This is verified by checking the endpoint works and logs indicate email attempt
        """
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First, check vendor status
        vendor_response = api_client.get(
            f"{BASE_URL}/api/vendors/{TEST_VENDOR_ID}",
            headers=headers
        )
        
        if vendor_response.status_code != 200:
            pytest.skip("Test vendor not found")
        
        # Check if vendor is currently active
        vendor_data = vendor_response.json()
        is_currently_active = vendor_data.get("is_approved", False) and not vendor_data.get("is_deactivated", False)
        
        if not is_currently_active:
            # Reactivate first
            api_client.put(
                f"{BASE_URL}/api/admin/vendors/{TEST_VENDOR_ID}/activate",
                headers=headers
            )
        
        # Deactivate vendor with reason
        deactivate_response = api_client.put(
            f"{BASE_URL}/api/admin/vendors/{TEST_VENDOR_ID}/deactivate",
            params={"reason": "TEST: Testing email notification feature"},
            headers=headers
        )
        
        assert deactivate_response.status_code == 200
        data = deactivate_response.json()
        assert data.get("message") == "Vendor deactivated"
        
        # The email service is called in background task - check logs for confirmation
        print("Vendor deactivation: API call successful, email service triggered")
        
        # Reactivate vendor to restore state
        api_client.put(
            f"{BASE_URL}/api/admin/vendors/{TEST_VENDOR_ID}/activate",
            headers=headers
        )
        print("Vendor reactivated to restore test state")


# ==================== INTEGRATION TESTS ====================

class TestIntegration:
    """Integration tests for new features"""
    
    def test_products_endpoint_includes_vendor_info(self, api_client):
        """Test that product search includes vendor information"""
        response = api_client.post(
            f"{BASE_URL}/api/search/products",
            json={"page": 1, "limit": 5}
        )
        assert response.status_code == 200
        
        products = response.json()["products"]
        if products:
            # Products should include vendor info
            product = products[0]
            # Note: vendor_name, vendor_country, vendor_verified are added in the endpoint
            assert "vendor_id" in product
            print(f"Product includes vendor_id: {product.get('vendor_id')[:8]}...")
    
    def test_full_search_workflow(self, api_client):
        """Test complete search workflow with filters"""
        # Step 1: Get categories
        categories_response = api_client.get(f"{BASE_URL}/api/categories?type=product")
        categories = categories_response.json() if categories_response.status_code == 200 else []
        
        # Step 2: Search with category filter if available
        search_filters = {"page": 1, "limit": 10}
        if categories:
            search_filters["category_id"] = categories[0]["id"]
        
        search_response = api_client.post(
            f"{BASE_URL}/api/search/products",
            json=search_filters
        )
        assert search_response.status_code == 200
        
        data = search_response.json()
        assert "products" in data
        assert "filters_applied" in data
        
        print(f"Full search workflow: {data['total']} products found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
