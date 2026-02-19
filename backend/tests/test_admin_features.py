"""
Backend API Tests for Admin Features
- Admin Analytics Dashboard
- Vendor Management (approve, verify, deactivate, activate)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://image-upload-fix-27.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@afrovending.com"
ADMIN_PASSWORD = "AfroAdmin2024!"
VENDOR_EMAIL = "vendor@afrovending.com"
VENDOR_PASSWORD = "AfroVendor2024!"
TEST_VENDOR_ID = "e76d7167-8e71-4b03-9321-416362952c69"


class TestAdminLogin:
    """Test admin login functionality"""
    
    def test_admin_login_success(self):
        """Test admin can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["role"] == "admin", f"Expected admin role, got {data['user']['role']}"
        assert data["user"]["email"] == ADMIN_EMAIL

    def test_admin_login_invalid_password(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_vendor_login_success(self):
        """Test vendor can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "vendor"


class TestAdminAnalytics:
    """Test admin analytics endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, "Admin login failed"
        return response.json()["access_token"]
    
    def test_get_analytics_30d(self, admin_token):
        """Test GET /api/admin/analytics with 30d period"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics?period=30d",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "summary" in data, "Response should contain summary"
        assert "growth" in data, "Response should contain growth"
        assert "daily_stats" in data, "Response should contain daily_stats"
        assert "top_vendors" in data, "Response should contain top_vendors"
        assert "top_products" in data, "Response should contain top_products"
        
        # Verify summary fields
        summary = data["summary"]
        assert "total_users" in summary
        assert "total_vendors" in summary
        assert "total_products" in summary
        assert "pending_vendors" in summary
        assert "deactivated_vendors" in summary
        assert "revenue" in summary
        assert "total_orders" in summary
        assert "total_bookings" in summary
        
        # Verify values are numeric
        assert isinstance(summary["total_users"], int)
        assert isinstance(summary["total_vendors"], int)
        assert isinstance(summary["total_products"], int)
        
        print(f"✓ Analytics summary: {summary['total_users']} users, {summary['total_vendors']} vendors, {summary['total_products']} products")
    
    def test_get_analytics_different_periods(self, admin_token):
        """Test analytics with different time periods"""
        for period in ["7d", "30d", "90d", "1y"]:
            response = requests.get(
                f"{BASE_URL}/api/admin/analytics?period={period}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200, f"Failed for period {period}: {response.text}"
            data = response.json()
            assert data.get("period") == period, f"Expected period {period}"
            print(f"✓ Analytics for {period}: {data['summary'].get('period_orders', 0)} orders in period")
    
    def test_analytics_requires_admin(self):
        """Test that non-admin cannot access analytics"""
        # Login as vendor
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        assert login_response.status_code == 200
        vendor_token = login_response.json()["access_token"]
        
        # Try to access admin analytics
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics?period=30d",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-admin correctly denied access to analytics")
    
    def test_analytics_without_auth(self):
        """Test that unauthenticated user cannot access analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics?period=30d")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Unauthenticated user correctly denied access")


class TestAdminVendorsList:
    """Test admin vendors list endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_all_vendors(self, admin_token):
        """Test GET /api/admin/vendors"""
        response = requests.get(
            f"{BASE_URL}/api/admin/vendors",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "vendors" in data, "Response should contain vendors key"
        assert "total" in data, "Response should contain total count"
        assert isinstance(data["vendors"], list), "vendors should be a list"
        
        if len(data["vendors"]) > 0:
            vendor = data["vendors"][0]
            assert "id" in vendor, "Vendor should have id"
            assert "store_name" in vendor, "Vendor should have store_name"
            assert "is_approved" in vendor, "Vendor should have is_approved status"
        
        print(f"✓ Admin vendors list: {data['total']} vendors total")
    
    def test_filter_vendors_by_status(self, admin_token):
        """Test filtering vendors by status"""
        statuses = ["all", "pending", "active", "deactivated", "verified"]
        
        for status in statuses:
            response = requests.get(
                f"{BASE_URL}/api/admin/vendors?status={status}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200, f"Failed for status {status}: {response.text}"
            data = response.json()
            print(f"✓ Status '{status}': {data['total']} vendors")
    
    def test_vendors_list_requires_admin(self):
        """Test that non-admin cannot access vendor list"""
        # Login as vendor
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        vendor_token = login_response.json()["access_token"]
        
        # Try to access admin vendors list
        response = requests.get(
            f"{BASE_URL}/api/admin/vendors",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


class TestVendorDeactivation:
    """Test vendor deactivation and activation functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def vendor_id(self, admin_token):
        """Get a vendor ID to test with"""
        response = requests.get(
            f"{BASE_URL}/api/admin/vendors",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        if data.get("vendors") and len(data["vendors"]) > 0:
            return data["vendors"][0]["id"]
        return TEST_VENDOR_ID
    
    def test_deactivate_vendor(self, admin_token, vendor_id):
        """Test PUT /api/admin/vendors/{vendor_id}/deactivate"""
        reason = "Test deactivation - non-compliance"
        response = requests.put(
            f"{BASE_URL}/api/admin/vendors/{vendor_id}/deactivate?reason={reason}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        assert "deactivated" in data["message"].lower()
        print(f"✓ Vendor {vendor_id} deactivated with reason: {reason}")
        
        # Verify vendor is now deactivated
        vendors_response = requests.get(
            f"{BASE_URL}/api/admin/vendors",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        vendors = vendors_response.json().get("vendors", [])
        target_vendor = next((v for v in vendors if v["id"] == vendor_id), None)
        if target_vendor:
            assert target_vendor.get("is_active") == False, "Vendor should be deactivated"
            print(f"✓ Verified vendor is_active=False")
    
    def test_activate_vendor(self, admin_token, vendor_id):
        """Test PUT /api/admin/vendors/{vendor_id}/activate"""
        response = requests.put(
            f"{BASE_URL}/api/admin/vendors/{vendor_id}/activate",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        assert "reactivated" in data["message"].lower() or "activated" in data["message"].lower()
        print(f"✓ Vendor {vendor_id} reactivated")
        
        # Verify vendor is now active
        vendors_response = requests.get(
            f"{BASE_URL}/api/admin/vendors",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        vendors = vendors_response.json().get("vendors", [])
        target_vendor = next((v for v in vendors if v["id"] == vendor_id), None)
        if target_vendor:
            assert target_vendor.get("is_active") != False, "Vendor should be active"
            print(f"✓ Verified vendor is now active")
    
    def test_deactivate_nonexistent_vendor(self, admin_token):
        """Test deactivating a vendor that doesn't exist"""
        response = requests.put(
            f"{BASE_URL}/api/admin/vendors/nonexistent-id/deactivate?reason=test",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_deactivate_requires_admin(self):
        """Test that non-admin cannot deactivate vendors"""
        # Login as vendor
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        vendor_token = login_response.json()["access_token"]
        
        response = requests.put(
            f"{BASE_URL}/api/admin/vendors/{TEST_VENDOR_ID}/deactivate?reason=test",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


class TestVendorApprovalAndVerification:
    """Test vendor approval and verification"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_approve_vendor(self, admin_token):
        """Test vendor approval endpoint"""
        # First get a vendor
        vendors_response = requests.get(
            f"{BASE_URL}/api/admin/vendors",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        vendors = vendors_response.json().get("vendors", [])
        if not vendors:
            pytest.skip("No vendors available to test approval")
        
        vendor_id = vendors[0]["id"]
        
        # Approve the vendor
        response = requests.put(
            f"{BASE_URL}/api/admin/vendors/{vendor_id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Vendor {vendor_id} approved")
    
    def test_verify_vendor(self, admin_token):
        """Test vendor verification endpoint"""
        vendors_response = requests.get(
            f"{BASE_URL}/api/admin/vendors",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        vendors = vendors_response.json().get("vendors", [])
        if not vendors:
            pytest.skip("No vendors available to test verification")
        
        vendor_id = vendors[0]["id"]
        
        # Verify the vendor
        response = requests.put(
            f"{BASE_URL}/api/admin/vendors/{vendor_id}/verify",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Vendor {vendor_id} verified")
    
    def test_unverify_vendor(self, admin_token):
        """Test removing vendor verification"""
        vendors_response = requests.get(
            f"{BASE_URL}/api/admin/vendors",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        vendors = vendors_response.json().get("vendors", [])
        if not vendors:
            pytest.skip("No vendors available to test")
        
        vendor_id = vendors[0]["id"]
        
        # Remove verification
        response = requests.put(
            f"{BASE_URL}/api/admin/vendors/{vendor_id}/unverify",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Vendor {vendor_id} unverified")


class TestPublicVendorsEndpoint:
    """Test public vendors page endpoint"""
    
    def test_get_public_vendors(self):
        """Test GET /api/vendors (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/vendors")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list of vendors"
        print(f"✓ Public vendors endpoint returned {len(data)} vendors")
        
        if len(data) > 0:
            vendor = data[0]
            assert "id" in vendor
            assert "store_name" in vendor


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
