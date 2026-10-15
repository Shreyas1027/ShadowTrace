import sys
import logging
from pathlib import Path
import pytest

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app
from app.utils.logging_safe import sanitize_string, SafeLogFilter


@pytest.fixture
def app():
    test_app = create_app({"TESTING": True})
    return test_app


@pytest.fixture
def client(app):
    return app.test_client()


def test_health_endpoint_schema(client):
    """Verify GET /api/health matches PRD Section 6.1 schema."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()

    assert data["ok"] is True
    assert data["service"] == "shadowtrace-api"
    assert data["version"] == "1.0.0"
    assert data["status"] == "healthy"
    assert data["supported_formats"] == ["image/jpeg"]
    assert isinstance(data["active_sessions"], int)

    limits = data["limits"]
    assert limits["max_upload_bytes"] == 10485760
    assert limits["max_megapixels"] == 50
    assert limits["token_ttl_seconds"] == 600


def test_security_headers(client):
    """Verify required security headers per PRD Section 7.2."""
    response = client.get("/api/health")
    assert response.status_code == 200

    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("Referrer-Policy") == "no-referrer"
    assert headers.get("Cross-Origin-Resource-Policy") == "same-site"
    assert "geolocation=()" in headers.get("Permissions-Policy", "")
    assert "no-store" in headers.get("Cache-Control", "")
    assert headers.get("Content-Security-Policy") == "default-src 'none'"


def test_unknown_api_route_json_envelope(client):
    """Verify unknown API route returns PRD Section 6.0 error envelope in JSON (not HTML)."""
    response = client.get("/api/nonexistent-route-for-testing")
    assert response.status_code == 404
    assert response.is_json

    data = response.get_json()
    assert data["ok"] is False
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert isinstance(data["error"]["message"], str)


def test_cors_headers(client):
    """Verify CORS preflight and allowed origins."""
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET"
    }
    response = client.open("/api/health", method="OPTIONS", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


def test_safe_logging_filter():
    """Verify safe logging sanitization per PRD Section 7.1 T4."""
    # Test token truncation (43 chars -> 6 chars + ...)
    sample_token = "q3ZyWb1b0lT9Xx2mRk8nUa5oJcDfVhGeLpIsNtYwMzA"
    sanitized = sanitize_string(f"Processing session {sample_token}")
    assert sample_token not in sanitized
    assert "q3ZyWb..." in sanitized

    # Test newline/control char stripping (anti log injection)
    injected_str = "Status: OK\r\nADMIN_OVERRIDE=true\x00malicious"
    sanitized_injection = sanitize_string(injected_str)
    assert "\r" not in sanitized_injection
    assert "\n" not in sanitized_injection
    assert "\x00" not in sanitized_injection

    # Test SafeLogFilter on LogRecord
    logger = logging.getLogger("test_safe_logger")
    log_filter = SafeLogFilter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="test.py",
        lineno=1,
        msg=f"Token {sample_token}\nInjected line",
        args=(),
        exc_info=None
    )
    assert log_filter.filter(record) is True
    assert sample_token not in record.msg
    assert "\n" not in record.msg
