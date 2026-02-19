"""
Backend API Tests for Payout Scheduling Feature
Tests the following endpoints:
- /api/stripe-connect/earnings-summary
- /api/stripe-connect/payout-settings (GET and PUT)
- /api/stripe-connect/payout-history
- /api/stripe-connect/request-payout
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Vendor test credentials
VENDOR_EMAIL = "vendor@afrovending.com"
VENDOR_PASSWORD = "AfroVendor2024!"


@pytest.fixture(scope="module")
def vendor_token():
    """Get vendor authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": VENDOR_EMAIL, "password": VENDOR_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip("Vendor login failed")
    return response.json()["access_token"]


@pytest.fixture
def vendor_headers(vendor_token):
    """Headers with vendor auth token"""
    return {
        "Authorization": f"Bearer {vendor_token}",
        "Content-Type": "application/json"
    }


class TestEarningsSummary:
    """Tests for /api/stripe-connect/earnings-summary endpoint"""
    
    def test_earnings_summary_returns_200(self, vendor_headers):
        """Test earnings summary endpoint returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/earnings-summary",
            headers=vendor_headers
        )
        assert response.status_code == 200
        
    def test_earnings_summary_has_required_fields(self, vendor_headers):
        """Test earnings summary contains all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/earnings-summary",
            headers=vendor_headers
        )
        data = response.json()
        
        # Verify all required fields exist
        required_fields = [
            "available_balance",
            "pending_balance",
            "total_paid_out",
            "total_sales",
            "commission_rate",
            "currency"
        ]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            
    def test_earnings_summary_has_payout_settings(self, vendor_headers):
        """Test earnings summary includes payout configuration"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/earnings-summary",
            headers=vendor_headers
        )
        data = response.json()
        
        # Payout-related fields
        assert "auto_payout_enabled" in data
        assert "payout_threshold" in data
        assert "payout_frequency" in data
        assert "next_payout_eligible" in data
        
    def test_earnings_summary_values_are_numbers(self, vendor_headers):
        """Test that balance values are numeric"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/earnings-summary",
            headers=vendor_headers
        )
        data = response.json()
        
        # Verify numeric types
        assert isinstance(data["available_balance"], (int, float))
        assert isinstance(data["pending_balance"], (int, float))
        assert isinstance(data["total_paid_out"], (int, float))
        assert isinstance(data["total_sales"], (int, float))
        assert isinstance(data["commission_rate"], (int, float))
        
    def test_earnings_summary_requires_auth(self):
        """Test that earnings summary requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/earnings-summary"
        )
        assert response.status_code == 401


class TestPayoutSettingsGet:
    """Tests for GET /api/stripe-connect/payout-settings endpoint"""
    
    def test_get_payout_settings_returns_200(self, vendor_headers):
        """Test GET payout settings returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/payout-settings",
            headers=vendor_headers
        )
        assert response.status_code == 200
        
    def test_get_payout_settings_has_required_fields(self, vendor_headers):
        """Test payout settings contains all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/payout-settings",
            headers=vendor_headers
        )
        data = response.json()
        
        required_fields = [
            "auto_payout_enabled",
            "payout_threshold",
            "payout_frequency",
            "payout_day",
            "minimum_payout",
            "currency"
        ]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            
    def test_payout_settings_default_values(self, vendor_headers):
        """Test payout settings default values are correct"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/payout-settings",
            headers=vendor_headers
        )
        data = response.json()
        
        # Check default values
        assert data["minimum_payout"] == 10.0
        assert data["currency"] == "usd"
        assert data["payout_frequency"] in ["weekly", "biweekly", "monthly"]
        
    def test_get_payout_settings_requires_auth(self):
        """Test that payout settings requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/payout-settings"
        )
        assert response.status_code == 401


class TestPayoutSettingsPut:
    """Tests for PUT /api/stripe-connect/payout-settings endpoint"""
    
    def test_put_payout_settings_requires_stripe_setup(self, vendor_headers):
        """Test PUT payout settings requires Stripe payouts enabled"""
        response = requests.put(
            f"{BASE_URL}/api/stripe-connect/payout-settings",
            headers=vendor_headers,
            json={
                "auto_payout_enabled": True,
                "payout_threshold": 100,
                "payout_frequency": "monthly",
                "payout_day": "friday"
            }
        )
        # Since vendor doesn't have Stripe payouts enabled, should return 400
        assert response.status_code == 400
        data = response.json()
        assert "Stripe setup" in data.get("detail", "")
        
    def test_put_payout_settings_validates_threshold(self, vendor_headers):
        """Test PUT payout settings validates minimum threshold"""
        response = requests.put(
            f"{BASE_URL}/api/stripe-connect/payout-settings",
            headers=vendor_headers,
            json={
                "auto_payout_enabled": False,
                "payout_threshold": 5,  # Below minimum of $10
                "payout_frequency": "weekly"
            }
        )
        # Should fail with validation or Stripe setup error
        assert response.status_code == 400
        
    def test_put_payout_settings_requires_auth(self):
        """Test that PUT payout settings requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/stripe-connect/payout-settings",
            json={"auto_payout_enabled": True}
        )
        assert response.status_code == 401


class TestPayoutHistory:
    """Tests for /api/stripe-connect/payout-history endpoint"""
    
    def test_payout_history_returns_200(self, vendor_headers):
        """Test payout history endpoint returns 200 OK"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/payout-history",
            headers=vendor_headers
        )
        assert response.status_code == 200
        
    def test_payout_history_has_required_fields(self, vendor_headers):
        """Test payout history contains required response structure"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/payout-history",
            headers=vendor_headers
        )
        data = response.json()
        
        required_fields = ["payouts", "total_count", "total_paid", "has_more"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            
    def test_payout_history_payouts_is_list(self, vendor_headers):
        """Test payout history payouts field is a list"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/payout-history",
            headers=vendor_headers
        )
        data = response.json()
        
        assert isinstance(data["payouts"], list)
        assert isinstance(data["total_count"], int)
        assert isinstance(data["has_more"], bool)
        
    def test_payout_history_supports_pagination(self, vendor_headers):
        """Test payout history supports limit and skip parameters"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/payout-history?limit=5&skip=0",
            headers=vendor_headers
        )
        assert response.status_code == 200
        
    def test_payout_history_requires_auth(self):
        """Test that payout history requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/stripe-connect/payout-history"
        )
        assert response.status_code == 401


class TestRequestPayout:
    """Tests for /api/stripe-connect/request-payout endpoint"""
    
    def test_request_payout_requires_stripe_payouts_enabled(self, vendor_headers):
        """Test request payout requires Stripe payouts enabled"""
        response = requests.post(
            f"{BASE_URL}/api/stripe-connect/request-payout",
            headers=vendor_headers,
            json={"amount": 50}
        )
        # Should fail since payouts not enabled
        assert response.status_code == 400
        data = response.json()
        assert "payout" in data.get("detail", "").lower() or "account" in data.get("detail", "").lower()
        
    def test_request_payout_requires_auth(self):
        """Test that request payout requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/stripe-connect/request-payout",
            json={"amount": 50}
        )
        assert response.status_code == 401


class TestIntegration:
    """Integration tests for payout scheduling feature"""
    
    def test_earnings_and_settings_consistency(self, vendor_headers):
        """Test that earnings summary and payout settings are consistent"""
        earnings_response = requests.get(
            f"{BASE_URL}/api/stripe-connect/earnings-summary",
            headers=vendor_headers
        )
        settings_response = requests.get(
            f"{BASE_URL}/api/stripe-connect/payout-settings",
            headers=vendor_headers
        )
        
        earnings = earnings_response.json()
        settings = settings_response.json()
        
        # Verify consistency
        assert earnings["auto_payout_enabled"] == settings["auto_payout_enabled"]
        assert earnings["payout_threshold"] == settings["payout_threshold"]
        assert earnings["payout_frequency"] == settings["payout_frequency"]
        
    def test_earnings_payout_eligibility(self, vendor_headers):
        """Test next_payout_eligible is calculated correctly"""
        earnings_response = requests.get(
            f"{BASE_URL}/api/stripe-connect/earnings-summary",
            headers=vendor_headers
        )
        earnings = earnings_response.json()
        
        # If available balance >= threshold, should be eligible
        expected_eligible = earnings["available_balance"] >= earnings["payout_threshold"]
        assert earnings["next_payout_eligible"] == expected_eligible


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
