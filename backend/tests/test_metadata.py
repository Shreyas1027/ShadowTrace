import io
import pytest
from PIL import Image
from app.services.metadata import parse_dms, extract_metadata
from app.services.jpeg_segments import scan_segments


def test_gps_dms_to_decimal_conversion():
    """Verify conversion of DMS rationals with North/South/East/West reference."""
    # Seattle coordinates: 47 deg 37' 13.52" N, 122 deg 20' 57.69" W
    lat_dms = [(47, 1), (37, 1), (1352, 100)]
    lon_dms = [(122, 1), (20, 1), (5769, 100)]

    lat_dec = parse_dms(lat_dms, "N")
    lon_dec = parse_dms(lon_dms, "W")

    assert lat_dec == 47.620422
    assert lon_dec == -122.349358

    # Southern hemisphere test: 33 deg 51' S => -33.85
    s_lat = parse_dms([(33, 1), (51, 1), (0, 1)], "S")
    assert s_lat == -33.85


def test_metadata_extraction_clean_image():
    """Clean generated image has no GPS, returns present=False and none risk image properties."""
    buf = io.BytesIO()
    img = Image.new("RGB", (320, 240), color=(100, 150, 200))
    img.save(buf, format="JPEG")
    data = buf.getvalue()

    segments, image_info = scan_segments(data)
    result = extract_metadata(data, image_info)

    assert result["gps"]["present"] is False
    assert result["gps"]["valid"] is False
    assert len(result["metadata"]["location"]) == 0
    assert any(item["tag"] == "ImageWidth" and "320" in item["value"] for item in result["metadata"]["image"])
    assert any(item["tag"] == "ImageLength" and "240" in item["value"] for item in result["metadata"]["image"])
