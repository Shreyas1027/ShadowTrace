import io
import pytest
from PIL import Image
from app.services.jpeg_segments import parse_header_dimensions, scan_segments
from app.utils.errors import InvalidSignatureError, TruncatedJpegError


def test_scan_segments_standard_jpeg():
    """Verify scanning standard JPEG segments (JFIF, DQT, SOF, DHT, SOS, EOI)."""
    buf = io.BytesIO()
    img = Image.new("RGB", (640, 480), color=(50, 100, 150))
    img.save(buf, format="JPEG")
    data = buf.getvalue()

    segments, image_info = scan_segments(data)

    assert image_info["width"] == 640
    assert image_info["height"] == 480
    assert image_info["megapixels"] == 0.31
    assert image_info["format"] == "JPEG"

    # Should detect JFIF APP0 segment
    segment_names = [s["name"] for s in segments]
    assert "JFIF" in segment_names or "APP0" in segment_names


def test_parse_header_dimensions():
    """Verify header dimensions parsed without decoding full raster pixels."""
    buf = io.BytesIO()
    img = Image.new("RGB", (1280, 720), color=(10, 20, 30))
    img.save(buf, format="JPEG")
    data = buf.getvalue()

    dims = parse_header_dimensions(data)
    assert dims["width"] == 1280
    assert dims["height"] == 720
    assert dims["megapixels"] == 0.92


def test_scan_segments_invalid_signature():
    """Non-JPEG header raises InvalidSignatureError."""
    with pytest.raises(InvalidSignatureError):
        scan_segments(b"PNG\r\n\x1a\n...")
