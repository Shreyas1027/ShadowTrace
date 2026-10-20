import io
import pytest
from PIL import Image
from app.services.cleaner import strip_jpeg_metadata
from app.services.verification import verify_cleaned_image
from app.utils.errors import VerificationFailedError


def create_jpeg_with_metadata() -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (160, 120), color=(10, 150, 70))
    exif = img.getexif()
    exif[0x010F] = "Sony"
    exif[0x0110] = "Alpha 7"
    exif[0x0112] = 1

    gps_ifd = exif.get_ifd(0x8825)
    gps_ifd[1] = "N"
    gps_ifd[2] = (51, 30, 0.0)
    gps_ifd[3] = "W"
    gps_ifd[4] = (0, 7, 0.0)

    img.save(buf, format="JPEG", exif=exif, comment=b"GPS Test Photo")
    return buf.getvalue()


def test_uncleaned_image_fails_verification():
    """Uncleaned JPEG with EXIF must fail verification checks."""
    dirty_bytes = create_jpeg_with_metadata()

    with pytest.raises(VerificationFailedError) as exc_info:
        verify_cleaned_image(dirty_bytes)

    err = exc_info.value
    checks = err.details.get("checks", [])
    # At least V1, V2, V3 or V4 should fail
    failed_check_ids = [c["id"] for c in checks if not c["passed"]]
    assert len(failed_check_ids) > 0


def test_cleaned_image_passes_all_four_checks():
    """Properly cleaned JPEG passes V1, V2, V3, and V4 with 0 sensitive tags remaining."""
    dirty_bytes = create_jpeg_with_metadata()
    cleaned_bytes, _, _ = strip_jpeg_metadata(dirty_bytes)

    result = verify_cleaned_image(
        cleaned_bytes=cleaned_bytes,
        original_bytes=dirty_bytes,
        expected_orientation=1,
    )

    assert result["verified"] is True
    assert len(result["checks"]) == 4

    # All checks passed
    for c in result["checks"]:
        assert c["passed"] is True, f"Check {c['id']} failed: {c['name']}"

    # Proof fields per prompt requirement
    proof = result["proof"]
    assert proof["sensitive_tags_remaining"] == 0
    assert proof["risk_score"] == 0
    assert proof["dimensions_match"] is True
    assert proof["breakdown"]["exif"] == 0
    assert proof["breakdown"]["gps"] == 0
    assert proof["breakdown"]["device_ids"] == 0
