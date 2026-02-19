"""
Iteration 14 - Testing shipping features, country detection, and admin notifications
Tests:
- Shipping countries API (66+ worldwide countries)
- Shipping estimate API with regional rates
- Country auto-detection by IP
- Admin notification center
- Mark notification as read
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://checkout-session.preview.emergentagent.com').rstrip('/')


class TestShippingCountries:
    """Shipping countries API tests"""
    
    def test_get_all_countries(self):
        """Verify shipping countries API returns 66+ countries"""
        response = requests.get(f"{BASE_URL}/api/shipping/countries")
        assert response.status_code == 200
        
        data = response.json()
        assert "countries" in data
        assert "by_region" in data
        assert "total" in data
        
        # Verify 66+ countries
        assert data["total"] >= 66, f"Expected 66+ countries, got {data['total']}"
        assert len(data["countries"]) >= 66
        
        # Verify regions are grouped
        regions = data["by_region"]
        expected_regions = ["Africa", "North America", "Europe", "Asia", "South America", "Oceania", "Caribbean"]
        for region in expected_regions:
            assert region in regions, f"Missing region: {region}"
        
        print(f"PASS: {data['total']} countries returned across {len(regions)} regions")
    
    def test_get_countries_by_region(self):
        """Verify filtering countries by region works"""
        response = requests.get(f"{BASE_URL}/api/shipping/countries?region=Africa")
        assert response.status_code == 200
        
        data = response.json()
        # All returned countries should be Africa
        for country in data["countries"]:
            assert country["region"] == "Africa", f"Country {country['name']} is not in Africa"
        
        # Africa should have 20 countries
        assert data["total"] >= 20, f"Expected 20+ African countries, got {data['total']}"
        print(f"PASS: {data['total']} African countries returned")
    
    def test_country_data_structure(self):
        """Verify country data has required fields"""
        response = requests.get(f"{BASE_URL}/api/shipping/countries")
        assert response.status_code == 200
        
        data = response.json()
        for country in data["countries"][:5]:  # Check first 5
            assert "code" in country, "Missing code field"
            assert "name" in country, "Missing name field"
            assert "region" in country, "Missing region field"
            assert "flag" in country, "Missing flag field"
            assert len(country["code"]) == 2, f"Country code should be 2 chars: {country['code']}"
        
        print("PASS: Country data structure is correct")


class TestShippingEstimates:
    """Shipping estimate API tests"""
    
    def test_estimate_africa_region(self):
        """Test shipping estimate for Africa (Nigeria)"""
        response = requests.post(f"{BASE_URL}/api/shipping/estimate?country_code=NG&weight_kg=1.0")
        assert response.status_code == 200
        
        data = response.json()
        assert "country" in data
        assert data["country"]["code"] == "NG"
        assert data["country"]["region"] == "Africa"
        assert "estimated_cost" in data
        assert "delivery_days" in data
        assert "currency" in data
        
        # Africa base: $15 + $5/kg = $20 for 1kg
        assert data["estimated_cost"] == 20, f"Expected $20, got {data['estimated_cost']}"
        assert data["delivery_days"] == "5-10"
        assert data["currency"] == "USD"
        print(f"PASS: Nigeria (Africa) shipping estimate: ${data['estimated_cost']}")
    
    def test_estimate_north_america_region(self):
        """Test shipping estimate for North America (USA)"""
        response = requests.post(f"{BASE_URL}/api/shipping/estimate?country_code=US&weight_kg=2.0")
        assert response.status_code == 200
        
        data = response.json()
        # North America base: $25 + $8*2 = $41 for 2kg
        assert data["estimated_cost"] == 41, f"Expected $41, got {data['estimated_cost']}"
        assert data["delivery_days"] == "3-7"
        print(f"PASS: USA (North America) shipping estimate: ${data['estimated_cost']}")
    
    def test_estimate_europe_region(self):
        """Test shipping estimate for Europe (UK)"""
        response = requests.post(f"{BASE_URL}/api/shipping/estimate?country_code=GB&weight_kg=1.5")
        assert response.status_code == 200
        
        data = response.json()
        # Europe base: $30 + $10*1.5 = $45 for 1.5kg
        assert data["estimated_cost"] == 45, f"Expected $45, got {data['estimated_cost']}"
        assert data["delivery_days"] == "5-10"
        print(f"PASS: UK (Europe) shipping estimate: ${data['estimated_cost']}")
    
    def test_estimate_asia_region(self):
        """Test shipping estimate for Asia (Japan)"""
        response = requests.post(f"{BASE_URL}/api/shipping/estimate?country_code=JP&weight_kg=1.0")
        assert response.status_code == 200
        
        data = response.json()
        # Asia base: $35 + $12*1 = $47 for 1kg
        assert data["estimated_cost"] == 47, f"Expected $47, got {data['estimated_cost']}"
        assert data["delivery_days"] == "7-14"
        print(f"PASS: Japan (Asia) shipping estimate: ${data['estimated_cost']}")
    
    def test_estimate_unsupported_country(self):
        """Test shipping estimate for unsupported country"""
        response = requests.post(f"{BASE_URL}/api/shipping/estimate?country_code=XX&weight_kg=1.0")
        assert response.status_code == 400
        
        data = response.json()
        assert "detail" in data
        print(f"PASS: Unsupported country returns 400 error")


class TestShippingRegions:
    """Shipping regions API tests"""
    
    def test_get_regions_with_rates(self):
        """Test getting all regions with their rates"""
        response = requests.get(f"{BASE_URL}/api/shipping/regions")
        assert response.status_code == 200
        
        data = response.json()
        assert "regions" in data
        
        regions = data["regions"]
        expected_rates = {
            "Africa": {"base": 15, "per_kg": 5, "delivery_days": "5-10"},
            "North America": {"base": 25, "per_kg": 8, "delivery_days": "3-7"},
            "Europe": {"base": 30, "per_kg": 10, "delivery_days": "5-10"},
            "Asia": {"base": 35, "per_kg": 12, "delivery_days": "7-14"},
            "South America": {"base": 40, "per_kg": 15, "delivery_days": "10-20"},
            "Oceania": {"base": 45, "per_kg": 15, "delivery_days": "10-15"},
            "Caribbean": {"base": 30, "per_kg": 10, "delivery_days": "7-14"},
        }
        
        for region, rates in expected_rates.items():
            assert region in regions, f"Missing region: {region}"
            assert regions[region]["base"] == rates["base"], f"Wrong base rate for {region}"
            assert regions[region]["per_kg"] == rates["per_kg"], f"Wrong per_kg rate for {region}"
        
        print("PASS: All regional rates are correct")


class TestCountryDetection:
    """Country detection by IP tests"""
    
    def test_detect_country_default(self):
        """Test country auto-detection returns valid country"""
        response = requests.get(f"{BASE_URL}/api/shipping/detect-country")
        assert response.status_code == 200
        
        data = response.json()
        assert "detected_country" in data
        
        country = data["detected_country"]
        assert "code" in country
        assert "name" in country
        assert "region" in country
        assert "flag" in country
        
        print(f"PASS: Detected country: {country['name']} ({country['code']})")
    
    def test_detect_country_with_ip(self):
        """Test country detection with specific IP"""
        # Test with a Google DNS IP (typically US)
        response = requests.get(f"{BASE_URL}/api/shipping/detect-country?ip=8.8.8.8")
        assert response.status_code == 200
        
        data = response.json()
        assert "detected_country" in data
        print(f"PASS: IP detection returned country: {data['detected_country']['name']}")


class TestAdminNotificationCenter:
    """Admin notification center tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@afrovending.com", "password": "AfroAdmin2024!"}
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]
    
    def test_get_notifications(self, admin_token):
        """Test getting admin notifications"""
        response = requests.get(
            f"{BASE_URL}/api/admin/notification-center",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "notifications" in data
        assert "summary" in data
        assert "timestamp" in data
        
        summary = data["summary"]
        assert "total_notifications" in summary
        assert "high_priority" in summary
        assert "new_orders_24h" in summary
        assert "pending_vendors" in summary
        assert "low_stock_products" in summary
        assert "out_of_stock_count" in summary
        
        print(f"PASS: Notification center returned {summary['total_notifications']} notifications")
        print(f"  - High priority: {summary['high_priority']}")
        print(f"  - New orders (24h): {summary['new_orders_24h']}")
        print(f"  - Low stock products: {summary['low_stock_products']}")
    
    def test_notification_structure(self, admin_token):
        """Test notification data structure"""
        response = requests.get(
            f"{BASE_URL}/api/admin/notification-center",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        if len(data["notifications"]) > 0:
            notification = data["notifications"][0]
            assert "id" in notification
            assert "type" in notification
            assert "priority" in notification
            assert "title" in notification
            assert "message" in notification
            assert "link" in notification
            assert "created_at" in notification
            
            # Verify priority is valid
            assert notification["priority"] in ["high", "medium", "low"]
            
            # Verify type is valid
            valid_types = ["new_order", "vendor_application", "low_stock", "out_of_stock", "new_users", "payout"]
            assert notification["type"] in valid_types
        
        print("PASS: Notification data structure is correct")
    
    def test_mark_notification_read(self, admin_token):
        """Test marking notification as read"""
        response = requests.post(
            f"{BASE_URL}/api/admin/notification-center/mark-read?notification_id=test_notification",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["notification_id"] == "test_notification"
        
        print("PASS: Mark notification as read works")
    
    def test_notification_center_requires_auth(self):
        """Test notification center requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/notification-center")
        assert response.status_code == 401
        print("PASS: Notification center requires authentication")
    
    def test_notification_center_requires_admin(self):
        """Test notification center requires admin role"""
        # Login as regular user (vendor)
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "vendor@afrovending.com", "password": "AfroVendor2024!"}
        )
        if login_response.status_code != 200:
            pytest.skip("Vendor login failed")
        
        vendor_token = login_response.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/notification-center",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert response.status_code == 403
        print("PASS: Notification center requires admin role")


class TestAddressVerification:
    """Address verification API tests (EasyPost integration)"""
    
    def test_verify_address_basic(self):
        """Test basic address verification"""
        address = {
            "name": "John Doe",
            "street1": "123 Main Street",
            "city": "New York",
            "state": "NY",
            "zip": "10001",
            "country": "US"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/shipping/verify-address",
            json=address
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "verified" in data
        assert "original" in data
        
        print(f"PASS: Address verification returned verified={data['verified']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
