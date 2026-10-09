"""Apollo Threat Lab backend tests - exercises /api/ and /api/health."""
import os
from datetime import datetime

import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://apollo-test-bench.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Root endpoint ---
class TestRoot:
    def test_root_status(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/", timeout=10)
        assert r.status_code == 200

    def test_root_payload(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/", timeout=10)
        data = r.json()
        assert data.get("app") == "Apollo Threat Lab"
        assert isinstance(data.get("message"), str) and data["message"]


# --- Health endpoint ---
class TestHealth:
    def test_health_status(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200

    def test_health_fields(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/health", timeout=10)
        data = r.json()
        assert data.get("status") == "ok"
        assert data.get("service") == "apollo-threat-lab"
        assert data.get("database") == "connected"
        assert isinstance(data.get("time"), str)
        # ISO-8601 parseable
        datetime.fromisoformat(data["time"])

    def test_health_cors_headers(self, api_client):
        r = api_client.get(
            f"{BASE_URL}/api/health",
            headers={"Origin": "https://example.com"},
            timeout=10,
        )
        assert r.status_code == 200
        # CORS allow-origin should be present (wildcard or echo)
        assert r.headers.get("access-control-allow-origin") in {"*", "https://example.com"}


# --- Unknown API routes ---
class TestNotFound:
    def test_unknown_api_returns_404(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/does-not-exist", timeout=10)
        assert r.status_code == 404
