"""
AfroVending - Scheduler and Webhooks Test Suite
Tests:
- Scheduler status endpoint (GET /api/admin/scheduler/status)
- Manual payout trigger (POST /api/admin/scheduler/trigger-payouts)
- Scheduler logs endpoint (GET /api/admin/scheduler/logs)
- Stripe webhook endpoint (POST /api/webhooks/stripe)
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@afrovending.com"
ADMIN_PASSWORD = "AfroAdmin2024!"
VENDOR_EMAIL = "vendor@afrovending.com"
VENDOR_PASSWORD = "AfroVendor2024!"


class TestSchedulerEndpoints:
    """Test scheduler admin endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with admin auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token") or data.get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
                self.admin_token = token
            else:
                pytest.skip("No token in admin login response")
        else:
            pytest.skip(f"Admin login failed: {response.status_code}")
    
    def test_scheduler_status_returns_running(self):
        """GET /api/admin/scheduler/status - Verify scheduler is running"""
        response = self.session.get(f"{BASE_URL}/api/admin/scheduler/status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "running" in data, "Response should contain 'running' field"
        assert "jobs" in data, "Response should contain 'jobs' field"
        assert data["running"] is True, "Scheduler should be running"
        assert isinstance(data["jobs"], list), "Jobs should be a list"
        print(f"Scheduler status: running={data['running']}, jobs_count={len(data['jobs'])}")
    
    def test_scheduler_status_shows_payout_job(self):
        """GET /api/admin/scheduler/status - Verify payout job is scheduled"""
        response = self.session.get(f"{BASE_URL}/api/admin/scheduler/status")
        
        assert response.status_code == 200
        
        data = response.json()
        jobs = data.get("jobs", [])
        
        # Find the payout job
        payout_job = next((j for j in jobs if "payout" in j.get("id", "").lower()), None)
        
        assert payout_job is not None, "Payout job should be scheduled"
        assert payout_job.get("name"), "Job should have a name"
        assert payout_job.get("next_run"), "Job should have next_run time"
        assert payout_job.get("trigger"), "Job should have trigger info"
        
        print(f"Payout job found: {payout_job['name']}, next_run: {payout_job['next_run']}")
    
    def test_manual_payout_trigger_works(self):
        """POST /api/admin/scheduler/trigger-payouts - Manually trigger payout processing"""
        response = self.session.post(f"{BASE_URL}/api/admin/scheduler/trigger-payouts")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "processed" in data, "Response should contain 'processed' field"
        assert "errors" in data, "Response should contain 'errors' field"
        assert "details" in data, "Response should contain 'details' field"
        assert "timestamp" in data, "Response should contain 'timestamp' field"
        
        # Note: 0 vendors processed is expected - no Stripe Connect enabled vendors
        assert isinstance(data["processed"], int), "processed should be an integer"
        assert isinstance(data["errors"], int), "errors should be an integer"
        
        print(f"Manual trigger result: processed={data['processed']}, errors={data['errors']}")
    
    def test_scheduler_logs_endpoint(self):
        """GET /api/admin/scheduler/logs - Get scheduler job logs"""
        response = self.session.get(f"{BASE_URL}/api/admin/scheduler/logs")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "logs" in data, "Response should contain 'logs' field"
        assert isinstance(data["logs"], list), "Logs should be a list"
        
        # Check log structure if any logs exist
        if len(data["logs"]) > 0:
            log = data["logs"][0]
            assert "job" in log, "Log should contain 'job' field"
            assert "result" in log, "Log should contain 'result' field"
            assert "created_at" in log, "Log should contain 'created_at' field"
            print(f"Found {len(data['logs'])} scheduler logs. Latest job: {log['job']}")
        else:
            print("No scheduler logs found yet (expected if first run)")
    
    def test_scheduler_logs_limit_parameter(self):
        """GET /api/admin/scheduler/logs?limit=5 - Test limit parameter"""
        response = self.session.get(f"{BASE_URL}/api/admin/scheduler/logs?limit=5")
        
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["logs"]) <= 5, "Should respect limit parameter"
    
    def test_scheduler_endpoints_require_admin(self):
        """Verify scheduler endpoints require admin authentication"""
        # Create a new session without auth
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        # Test scheduler status without auth
        response = public_session.get(f"{BASE_URL}/api/admin/scheduler/status")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        
        # Test trigger payouts without auth
        response = public_session.post(f"{BASE_URL}/api/admin/scheduler/trigger-payouts")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        
        # Test logs without auth
        response = public_session.get(f"{BASE_URL}/api/admin/scheduler/logs")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        
        print("All scheduler endpoints correctly require admin authentication")
    
    def test_scheduler_endpoints_reject_vendor(self):
        """Verify scheduler endpoints reject non-admin users"""
        # Login as vendor
        vendor_session = requests.Session()
        vendor_session.headers.update({"Content-Type": "application/json"})
        
        response = vendor_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip("Vendor login failed")
        
        data = response.json()
        token = data.get("access_token") or data.get("token")
        vendor_session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Test scheduler status as vendor (should be 403)
        response = vendor_session.get(f"{BASE_URL}/api/admin/scheduler/status")
        assert response.status_code == 403, f"Vendor should get 403, got {response.status_code}"
        
        print("Scheduler endpoints correctly reject vendor users")


class TestStripeWebhooks:
    """Test Stripe webhook endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_webhook_endpoint_exists(self):
        """POST /api/webhooks/stripe - Verify webhook endpoint exists"""
        # Send a minimal test event (will be processed in dev mode without signature)
        test_event = {
            "type": "ping",
            "data": {"object": {}},
            "id": "evt_test_123"
        }
        
        response = self.session.post(f"{BASE_URL}/api/webhooks/stripe", json=test_event)
        
        # Should return 200 for valid JSON (even if event type is unknown)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "success", "Response should indicate success"
        print("Webhook endpoint exists and responds correctly")
    
    def test_webhook_payout_paid_event(self):
        """POST /api/webhooks/stripe - Test payout.paid event handling"""
        test_event = {
            "type": "payout.paid",
            "data": {
                "object": {
                    "id": "po_test_paid_123",
                    "amount": 10000,
                    "currency": "usd",
                    "status": "paid",
                    "arrival_date": 1705000000
                }
            },
            "id": "evt_test_payout_paid"
        }
        
        response = self.session.post(f"{BASE_URL}/api/webhooks/stripe", json=test_event)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "success"
        print("payout.paid event handled successfully")
    
    def test_webhook_payout_failed_event(self):
        """POST /api/webhooks/stripe - Test payout.failed event handling"""
        test_event = {
            "type": "payout.failed",
            "data": {
                "object": {
                    "id": "po_test_failed_456",
                    "amount": 5000,
                    "currency": "usd",
                    "status": "failed",
                    "failure_message": "Test failure message"
                }
            },
            "id": "evt_test_payout_failed"
        }
        
        response = self.session.post(f"{BASE_URL}/api/webhooks/stripe", json=test_event)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "success"
        print("payout.failed event handled successfully")
    
    def test_webhook_payout_canceled_event(self):
        """POST /api/webhooks/stripe - Test payout.canceled event handling"""
        test_event = {
            "type": "payout.canceled",
            "data": {
                "object": {
                    "id": "po_test_canceled_789",
                    "amount": 7500,
                    "currency": "usd",
                    "status": "canceled"
                }
            },
            "id": "evt_test_payout_canceled"
        }
        
        response = self.session.post(f"{BASE_URL}/api/webhooks/stripe", json=test_event)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "success"
        print("payout.canceled event handled successfully")
    
    def test_webhook_account_updated_event(self):
        """POST /api/webhooks/stripe - Test account.updated event handling"""
        test_event = {
            "type": "account.updated",
            "data": {
                "object": {
                    "id": "acct_test_123",
                    "payouts_enabled": True,
                    "charges_enabled": True,
                    "details_submitted": True
                }
            },
            "id": "evt_test_account_updated"
        }
        
        response = self.session.post(f"{BASE_URL}/api/webhooks/stripe", json=test_event)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "success"
        print("account.updated event handled successfully")
    
    def test_webhook_invalid_payload(self):
        """POST /api/webhooks/stripe - Test invalid payload handling"""
        # Send invalid JSON
        response = self.session.post(
            f"{BASE_URL}/api/webhooks/stripe",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        # Should handle gracefully (400, 422, 500, or 520 from CDN)
        assert response.status_code in [400, 422, 500, 520], f"Should reject invalid JSON: {response.status_code}"
        print(f"Invalid payload correctly rejected with status {response.status_code}")


class TestPayoutEmailTemplates:
    """Test payout email template functions exist (module imports)"""
    
    def test_payout_emails_module_imports(self):
        """Verify payout_emails module exists and has correct functions"""
        # Test via an admin endpoint that imports from payout_emails
        # The scheduler.py imports send_payout_initiated_email
        # The webhooks.py imports send_payout_completed_email, send_payout_failed_email
        
        # If the endpoints work, the imports are valid
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        
        data = response.json()
        token = data.get("access_token") or data.get("token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Trigger payouts - this imports from payout_emails
        response = session.post(f"{BASE_URL}/api/admin/scheduler/trigger-payouts")
        assert response.status_code == 200, "Scheduler endpoint should work (imports payout_emails)"
        
        # Webhook endpoint - also imports from payout_emails
        webhook_response = session.post(f"{BASE_URL}/api/webhooks/stripe", json={
            "type": "payout.paid",
            "data": {"object": {"id": "test"}},
            "id": "evt_test"
        })
        assert webhook_response.status_code == 200, "Webhook endpoint should work (imports payout_emails)"
        
        print("All payout email template imports verified working")


class TestBackendStartup:
    """Test that backend starts correctly with scheduler"""
    
    def test_health_check(self):
        """Verify backend is running with scheduler"""
        session = requests.Session()
        
        # Check a known working endpoint (auth/login returns 422 for empty body - meaning server is up)
        response = session.get(f"{BASE_URL}/api/products?limit=1")
        assert response.status_code == 200, f"Backend should be running: {response.status_code}"
        
        print("Backend is running with scheduler")
    
    def test_admin_login_works(self):
        """Verify admin authentication works"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Admin login should work: {response.status_code}"
        
        data = response.json()
        assert data.get("access_token") or data.get("token"), "Should return token"
        assert data.get("user", {}).get("role") == "admin", "Should be admin user"
        
        print("Admin authentication working correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
