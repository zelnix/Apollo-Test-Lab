"""Apollo Threat Lab backend tests.

Covers:
  * Un-prefixed GET /health (platform probe) — tested against the backend
    directly (http://localhost:8001) because the public ingress only routes
    /api/* to the backend container.
  * GET /api/health and GET /api/ — tested against the public preview URL
    exactly like a real client would reach them.
"""
import os
from datetime import datetime

import pytest
import requests

PUBLIC_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://apollo-test-bench.preview.emergentagent.com",
).rstrip("/")
LOCAL_URL = os.environ.get("BACKEND_LOCAL_URL", "http://localhost:8001").rstrip("/")


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Platform probe: un-prefixed /health (served at backend root) ---
class TestPlatformHealth:
    """GET /health (NO /api prefix) — the platform health probe path.

    Ingress on the public preview routes only /api/* to port 8001, so we
    verify this endpoint against the backend directly on localhost:8001.
    """

    def test_platform_health_status(self, api_client):
        r = api_client.get(f"{LOCAL_URL}/health", timeout=10)
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text!r}"

    def test_platform_health_payload(self, api_client):
        r = api_client.get(f"{LOCAL_URL}/health", timeout=10)
        data = r.json()
        assert data == {"status": "ok", "service": "apollo-threat-lab"}, data

    def test_platform_health_content_type_json(self, api_client):
        r = api_client.get(f"{LOCAL_URL}/health", timeout=10)
        assert r.headers.get("content-type", "").startswith("application/json")

    def test_platform_health_public_ingress_behavior(self, api_client):
        """Documents that the public ingress does NOT route /health to the backend.

        On the public preview, /health falls through to the Expo frontend
        (HTML). This test asserts the observed behavior rather than failing,
        so platform operators know to configure the probe against the
        backend's own hostname/port.
        """
        r = api_client.get(f"{PUBLIC_URL}/health", timeout=10)
        # 200 (HTML fallthrough) is acceptable; what matters is the backend
        # itself answers correctly on localhost (covered above).
        assert r.status_code in (200, 404), r.status_code


# --- /api/ root ---
class TestApiRoot:
    def test_root_status(self, api_client):
        r = api_client.get(f"{PUBLIC_URL}/api/", timeout=10)
        assert r.status_code == 200

    def test_root_payload(self, api_client):
        r = api_client.get(f"{PUBLIC_URL}/api/", timeout=10)
        data = r.json()
        assert data.get("app") == "Apollo Threat Lab"
        assert isinstance(data.get("message"), str) and data["message"]


# --- /api/health ---
class TestApiHealth:
    def test_health_status(self, api_client):
        r = api_client.get(f"{PUBLIC_URL}/api/health", timeout=10)
        assert r.status_code == 200

    def test_health_fields(self, api_client):
        r = api_client.get(f"{PUBLIC_URL}/api/health", timeout=10)
        data = r.json()
        assert data.get("status") == "ok"
        assert data.get("service") == "apollo-threat-lab"
        assert data.get("database") == "connected"
        assert isinstance(data.get("time"), str)
        # ISO-8601 parseable
        datetime.fromisoformat(data["time"])

    def test_health_cors_headers(self, api_client):
        r = api_client.get(
            f"{PUBLIC_URL}/api/health",
            headers={"Origin": "https://example.com"},
            timeout=10,
        )
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-origin") in {"*", "https://example.com"}


# --- Unknown routes ---
class TestNotFound:
    def test_unknown_api_returns_404(self, api_client):
        r = api_client.get(f"{PUBLIC_URL}/api/does-not-exist", timeout=10)
        assert r.status_code == 404
