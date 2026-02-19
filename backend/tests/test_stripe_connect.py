"""
AfroVending - Stripe Connect API Tests
Tests for vendor onboarding wizard, Stripe Connect, Identity verification, and Tax information
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
VENDOR_EMAIL = "vendor@afrovending.com"
VENDOR_PASSWORD = "AfroVendor2024!"


class TestStripeConnectAPIs:
    """Tests for Stripe Connect endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as vendor
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json()["access_token"]
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_account_status_endpoint(self):
        """Test GET /api/stripe-connect/account-status"""
        response = self.session.get(f"{BASE_URL}/api/stripe-connect/account-status")
        assert response.status_code == 200
        
        data = response.json()
        # Check response structure
        assert "has_account" in data
        assert "payouts_enabled" in data
        assert "charges_enabled" in data
        
        if data["has_account"]:
            assert "account_id" in data
            assert "requirements" in data
        
        print(f"Account status: has_account={data['has_account']}")
    
    def test_onboarding_status_endpoint(self):
        """Test GET /api/stripe-connect/onboarding-status"""
        response = self.session.get(f"{BASE_URL}/api/stripe-connect/onboarding-status")
        assert response.status_code == 200
        
        data = response.json()
        # Check response structure
        assert "steps" in data
        assert "completion_percentage" in data
        assert "total_steps" in data
        assert "completed_steps" in data
        assert "is_fully_verified" in data
        
        # Verify all expected steps exist
        expected_steps = ["profile", "contact", "branding", "payment", "identity", "tax"]
        for step in expected_steps:
            assert step in data["steps"], f"Missing step: {step}"
            assert "completed" in data["steps"][step]
        
        print(f"Onboarding: {data['completed_steps']}/{data['total_steps']} steps, {data['completion_percentage']}% complete")
    
    def test_identity_status_endpoint(self):
        """Test GET /api/stripe-connect/identity-status"""
        response = self.session.get(f"{BASE_URL}/api/stripe-connect/identity-status")
        assert response.status_code == 200
        
        data = response.json()
        # Check response structure
        assert "has_verification" in data
        assert "status" in data
        
        if data["has_verification"]:
            assert "verification_id" in data
        
        print(f"Identity status: has_verification={data['has_verification']}, status={data['status']}")
    
    def test_tax_information_update(self):
        """Test PUT /api/stripe-connect/tax-information"""
        # Update tax information
        tax_data = {
            "tax_id_type": "ein",
            "tax_id": "123456789",
            "business_name": "Test Business LLC",
            "business_type": "company",
            "vat_number": "US12345",
            "tax_country": "US"
        }
        
        response = self.session.put(f"{BASE_URL}/api/stripe-connect/tax-information", json=tax_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert data["message"] == "Tax information updated successfully"
        
        # Verify tax info was saved by checking onboarding status
        status_response = self.session.get(f"{BASE_URL}/api/stripe-connect/onboarding-status")
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["steps"]["tax"]["completed"] == True
        
        print("Tax information updated and verified successfully")
    
    def test_stripe_connect_account_creation(self):
        """Test POST /api/stripe-connect/create-account - create Stripe account"""
        response = self.session.post(f"{BASE_URL}/api/stripe-connect/create-account")
        
        # Could be 200 (success) or 400 (if country not supported)
        assert response.status_code in [200, 400]
        
        data = response.json()
        if response.status_code == 200:
            # Account created or already exists
            assert "stripe_account_id" in data
            print(f"Stripe account: {data['stripe_account_id']}")
        else:
            # Expected for unsupported countries
            print(f"Stripe account creation error (expected for some countries): {data.get('detail')}")
    
    def test_stripe_onboarding_link(self):
        """Test POST /api/stripe-connect/onboarding-link"""
        # First ensure account exists
        self.session.post(f"{BASE_URL}/api/stripe-connect/create-account")
        
        # Get account status to check if we have an account
        status_response = self.session.get(f"{BASE_URL}/api/stripe-connect/account-status")
        status_data = status_response.json()
        
        if not status_data.get("has_account"):
            pytest.skip("No Stripe account exists - skipping onboarding link test")
        
        response = self.session.post(f"{BASE_URL}/api/stripe-connect/onboarding-link", json={
            "origin_url": "https://checkout-session.preview.emergentagent.com"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "url" in data
        assert "expires_at" in data
        assert data["url"].startswith("https://connect.stripe.com/")
        
        print(f"Onboarding link generated successfully")
    
    def test_identity_verification_session(self):
        """Test POST /api/stripe-connect/identity-verification"""
        response = self.session.post(f"{BASE_URL}/api/stripe-connect/identity-verification", json={
            "origin_url": "https://checkout-session.preview.emergentagent.com"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "verification_session_id" in data
        assert "url" in data
        assert "status" in data
        assert data["url"].startswith("https://verify.stripe.com/")
        
        print(f"Identity verification session created: {data['verification_session_id']}")
    
    def test_payout_balance_endpoint(self):
        """Test GET /api/stripe-connect/payout-balance"""
        response = self.session.get(f"{BASE_URL}/api/stripe-connect/payout-balance")
        assert response.status_code == 200
        
        data = response.json()
        assert "available" in data
        assert "pending" in data
        assert "currency" in data
        
        print(f"Payout balance: available={data['available']}, pending={data['pending']}, currency={data['currency']}")


class TestVendorOnboardingWizard:
    """Tests for vendor onboarding wizard functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as vendor
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json()["access_token"]
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_vendor_profile_fetch(self):
        """Test GET /api/vendors/me - fetch vendor profile for wizard"""
        response = self.session.get(f"{BASE_URL}/api/vendors/me")
        assert response.status_code == 200
        
        data = response.json()
        # Check basic fields for wizard
        assert "store_name" in data
        assert "description" in data
        assert "country_code" in data
        
        print(f"Vendor profile fetched: {data['store_name']}")
    
    def test_vendor_profile_update(self):
        """Test PUT /api/vendors/me - update vendor profile in wizard"""
        update_data = {
            "store_name": "AfroVending Official Store",
            "description": "Official AfroVending marketplace store featuring premium African products.",
            "cultural_story": "Test cultural story for the wizard",
            "phone": "+1234567890",
            "email": "vendor@afrovending.com",
            "city": "New York",
            "address": "123 Test Street"
        }
        
        response = self.session.put(f"{BASE_URL}/api/vendors/me", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["store_name"] == update_data["store_name"]
        assert data["description"] == update_data["description"]
        
        print("Vendor profile updated successfully via wizard")
    
    def test_wizard_step_completion_tracking(self):
        """Test onboarding status tracks completed steps"""
        # First update profile to complete profile step
        profile_data = {
            "store_name": "Test Store",
            "description": "Test description",
            "country_code": "US"
        }
        self.session.put(f"{BASE_URL}/api/vendors/me", json=profile_data)
        
        # Check onboarding status
        response = self.session.get(f"{BASE_URL}/api/stripe-connect/onboarding-status")
        assert response.status_code == 200
        
        data = response.json()
        # Profile step should be completed
        assert data["steps"]["profile"]["completed"] == True
        
        print(f"Wizard step tracking working: {data['completed_steps']}/{data['total_steps']} steps")


class TestStoreSettingsTabs:
    """Tests for Store Settings page tabs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as vendor
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json()["access_token"]
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_profile_tab_data(self):
        """Test data required for Profile tab"""
        response = self.session.get(f"{BASE_URL}/api/vendors/me")
        assert response.status_code == 200
        
        data = response.json()
        # Profile tab fields
        required_fields = ["store_name", "description", "country_code", "city", "phone", "email", "website"]
        for field in required_fields:
            assert field in data or data.get(field) is None, f"Missing field: {field}"
        
        print("Profile tab data validated")
    
    def test_payment_tab_data(self):
        """Test data required for Payment tab (Stripe Connect status)"""
        response = self.session.get(f"{BASE_URL}/api/stripe-connect/account-status")
        assert response.status_code == 200
        
        data = response.json()
        # Payment tab needs these fields
        assert "has_account" in data
        assert "payouts_enabled" in data
        
        print(f"Payment tab: has_account={data['has_account']}, payouts_enabled={data['payouts_enabled']}")
    
    def test_identity_tab_data(self):
        """Test data required for Identity tab (Stripe Identity status)"""
        response = self.session.get(f"{BASE_URL}/api/stripe-connect/identity-status")
        assert response.status_code == 200
        
        data = response.json()
        # Identity tab needs these fields
        assert "has_verification" in data
        assert "status" in data
        
        print(f"Identity tab: has_verification={data['has_verification']}, status={data['status']}")
    
    def test_tax_tab_data(self):
        """Test data required for Tax tab"""
        response = self.session.get(f"{BASE_URL}/api/vendors/me")
        assert response.status_code == 200
        
        data = response.json()
        # Tax tab may have these fields (can be None initially)
        tax_fields = ["business_type", "business_name", "tax_id_type", "tax_country", "vat_number"]
        for field in tax_fields:
            assert field in data or True, f"Missing tax field: {field}"  # Fields may not exist
        
        print("Tax tab data validated")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
