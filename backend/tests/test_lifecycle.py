import io
import sys
from pathlib import Path
import pytest
from PIL import Image

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app
from app.services.storage import get_token_dir, validate_token


@pytest.fixture
def app():
    test_app = create_app({"TESTING": True})
    return test_app


@pytest.fixture
def client(app):
    return app.test_client()


def create_sample_jpeg_upload(filename="vacation_photo.jpg") -> tuple[io.BytesIO, str]:
    buf = io.BytesIO()
    img = Image.new("RGB", (320, 240), color=(80, 160, 240))
    exif = img.getexif()
    exif[0x010F] = "Canon"
    exif[0x0110] = "EOS R5"
    exif[0x0112] = 1

    gps_ifd = exif.get_ifd(0x8825)
    gps_ifd[1] = "N"
    gps_ifd[2] = (37, 46, 29.8)
    gps_ifd[3] = "W"
    gps_ifd[4] = (122, 25, 9.8)

    img.save(buf, format="JPEG", exif=exif, comment=b"Vacation trip 2026")
    buf.seek(0)
    return buf, filename


def test_clean_and_download_lifecycle(client):
    """
    Test full flow:
    1. Upload image to /api/analyze
    2. Attempt download before clean -> 409 NOT_VERIFIED
    3. Call POST /api/clean -> 200 with verification proof
    4. Call GET /api/download/<token> -> 200 with sanitized JPEG & Content-Disposition
    5. Second call to GET /api/download/<token> -> 404 TOKEN_NOT_FOUND (consumed)
    """
    # 1. Analyze
    upload_buf, upload_name = create_sample_jpeg_upload()
    resp = client.post(
        "/api/analyze",
        data={"image": (upload_buf, upload_name)},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 200
    analyze_data = resp.get_json()
    token = analyze_data["token"]
    assert validate_token(token)

    # 2. Premature download attempt
    dl_early = client.get(f"/api/download/{token}")
    assert dl_early.status_code == 409
    assert dl_early.get_json()["error"]["code"] == "NOT_VERIFIED"

    # 3. Clean
    clean_resp = client.post("/api/clean", json={"token": token})
    assert clean_resp.status_code == 200
    clean_data = clean_resp.get_json()

    assert clean_data["ok"] is True
    assert clean_data["token"] == token
    assert clean_data["method"] == "lossless_rewrite"
    assert clean_data["pixels_identical"] is True
    assert "verification" in clean_data
    assert clean_data["verification"]["verified"] is True

    # Verification proof
    proof = clean_data["verification"]["proof"]
    assert proof["sensitive_tags_remaining"] == 0
    assert proof["risk_score"] == 0
    assert proof["dimensions_match"] is True

    # 4. Download
    dl_resp = client.get(f"/api/download/{token}")
    assert dl_resp.status_code == 200
    assert dl_resp.headers["Content-Type"] == "image/jpeg"
    assert 'attachment; filename="vacation_photo_clean.jpg"' in dl_resp.headers["Content-Disposition"]
    assert len(dl_resp.data) > 0

    # 5. Consume-on-download (FR-DL-05)
    # The session folder has been purged immediately after stream closed
    dl_second = client.get(f"/api/download/{token}")
    assert dl_second.status_code == 404
    assert dl_second.get_json()["error"]["code"] == "TOKEN_NOT_FOUND"


def test_session_delete_endpoint(client):
    """Test explicit DELETE /api/session/<token> purges files immediately."""
    upload_buf, upload_name = create_sample_jpeg_upload("temporary.jpg")
    resp = client.post(
        "/api/analyze",
        data={"image": (upload_buf, upload_name)},
        content_type="multipart/form-data",
    )
    token = resp.get_json()["token"]

    del_resp = client.delete(f"/api/session/{token}")
    assert del_resp.status_code == 200
    assert del_resp.get_json()["deleted"] is True

    # Idempotent second delete returns deleted: False
    del_again = client.delete(f"/api/session/{token}")
    assert del_again.status_code == 200
    assert del_again.get_json()["deleted"] is False


def test_preview_endpoints(client):
    """Test GET /api/preview/<token>/original and /cleaned."""
    upload_buf, upload_name = create_sample_jpeg_upload("preview_test.jpg")
    resp = client.post(
        "/api/analyze",
        data={"image": (upload_buf, upload_name)},
        content_type="multipart/form-data",
    )
    token = resp.get_json()["token"]

    # Original preview
    prev_orig = client.get(f"/api/preview/{token}/original")
    assert prev_orig.status_code == 200
    assert prev_orig.headers["Content-Type"] == "image/jpeg"

    # Cleaned preview before cleaning -> 404
    prev_clean_early = client.get(f"/api/preview/{token}/cleaned")
    assert prev_clean_early.status_code == 404

    # Now clean
    client.post("/api/clean", json={"token": token})

    # Cleaned preview after cleaning -> 200
    prev_clean = client.get(f"/api/preview/{token}/cleaned")
    assert prev_clean.status_code == 200
    assert prev_clean.headers["Content-Type"] == "image/jpeg"

    # Cleanup
    client.delete(f"/api/session/{token}")
