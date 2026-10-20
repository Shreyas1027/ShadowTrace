import io
import hashlib
import pytest
from PIL import Image, ImageOps
from app.services.cleaner import strip_jpeg_metadata, clean_image
from app.services.storage import create_session, get_session, get_token_dir, generate_token
from app.services.jpeg_segments import scan_segments


def create_jpeg_with_exif_and_comment() -> bytes:
    """Helper to create a JPEG containing real EXIF data and Comment markers."""
    buf = io.BytesIO()
    img = Image.new("RGB", (200, 150), color=(120, 80, 200))

    # Add EXIF
    exif = img.getexif()
    exif[0x010F] = "Nikon"       # Make
    exif[0x0110] = "D850"        # Model
    exif[0x0112] = 1             # Orientation normal
    exif[0x9003] = "2026:10:20 18:00:00"

    # Add GPS IFD (0x8825)
    gps_ifd = exif.get_ifd(0x8825)
    gps_ifd[1] = "N"
    gps_ifd[2] = (40, 42, 46.1)
    gps_ifd[3] = "W"
    gps_ifd[4] = (74, 0, 21.4)

    # Save with comment and exif
    img.save(buf, format="JPEG", exif=exif, comment=b"Confidential internal comment")
    return buf.getvalue()


def test_strip_jpeg_metadata_lossless():
    """Verify byte-level stripping removes EXIF and COM while preserving RGB pixel hash."""
    orig_bytes = create_jpeg_with_exif_and_comment()

    # Original has segments
    segments_before, info_before = scan_segments(orig_bytes)
    marker_names_before = [s["name"] for s in segments_before]
    assert "EXIF" in marker_names_before
    assert "Comment" in marker_names_before

    # Calculate pixel hash of original
    img_orig = Image.open(io.BytesIO(orig_bytes))
    orig_pixel_hash = hashlib.sha256(img_orig.convert("RGB").tobytes()).hexdigest()

    # Strip metadata
    cleaned_bytes, removed_list, preserved_list = strip_jpeg_metadata(orig_bytes)

    # Verify segments after
    segments_after, info_after = scan_segments(cleaned_bytes)
    marker_names_after = [s["name"] for s in segments_after]
    assert "EXIF" not in marker_names_after
    assert "Comment" not in marker_names_after
    assert "JFIF" in preserved_list or "JFIF" in marker_names_after

    # Guarantee zero pixel quality loss: SHA-256 before == after (FR-CLEAN-05)
    img_clean = Image.open(io.BytesIO(cleaned_bytes))
    clean_pixel_hash = hashlib.sha256(img_clean.convert("RGB").tobytes()).hexdigest()
    assert orig_pixel_hash == clean_pixel_hash

    # Output size is smaller than original
    assert len(cleaned_bytes) < len(orig_bytes)


def test_strip_jpeg_metadata_truncates_trailing_data():
    """Verify cleaner truncates any hidden/malicious payload appended after EOI (FR-CLEAN-04, T3)."""
    orig_bytes = create_jpeg_with_exif_and_comment()
    appended_payload = b"MALICIOUS_ZIP_OR_PAYLOAD_AFTER_EOI" * 20
    polyglot_bytes = orig_bytes + appended_payload

    cleaned_bytes, removed_list, preserved_list = strip_jpeg_metadata(polyglot_bytes)

    # Cleaned image must end strictly with EOI 0xFF 0xD9
    assert cleaned_bytes.endswith(b"\xFF\xD9")
    assert appended_payload not in cleaned_bytes

    trailing_stats = next((r for r in removed_list if r["name"] == "TRAILING_DATA"), None)
    assert trailing_stats is not None
    assert trailing_stats["bytes"] == len(appended_payload)


def test_clean_image_orientation_handling():
    """Verify orientation 6 triggers fallback re-encode per FR-CLEAN-09."""
    buf = io.BytesIO()
    img = Image.new("RGB", (300, 200), color=(50, 100, 150))
    exif = img.getexif()
    exif[0x0112] = 6  # Rotate 90 CW
    img.save(buf, format="JPEG", exif=exif)
    orig_bytes = buf.getvalue()

    token = generate_token()
    token_dir, state = create_session(token, orig_bytes, original_filename="rotated_sample.jpg")

    result = clean_image(token)

    assert result["ok"] is True
    assert result["method"] == "reencode_orientation"
    assert result["pixels_identical"] is False
    assert result["method_note"] is not None
    assert "rotated" in result["method_note"]

    # Check that cleaned.jpg and rotated_sample_clean.jpg exist on disk
    assert (token_dir / "cleaned.jpg").exists()
    assert (token_dir / "rotated_sample_clean.jpg").exists()
