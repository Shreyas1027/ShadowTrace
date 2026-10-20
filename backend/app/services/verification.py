import io
from PIL import Image
import exifread
from app.services.jpeg_segments import scan_segments, parse_header_dimensions
from app.services.metadata import extract_metadata
from app.services.risk import evaluate
from app.utils.errors import VerificationFailedError

# Forbidden byte patterns in raw binary scan per PRD Section 5.6.3 (V4)
FORBIDDEN_RAW_PATTERNS = [
    b"Exif\x00\x00",
    b"http://ns.adobe.com/xap/1.0/",
    b"http://ns.adobe.com/xmp/",
    b"Photoshop 3.0",
    b"8BIM",
]


def verify_cleaned_image(
    cleaned_bytes: bytes,
    original_bytes: bytes = None,
    original_meta: dict = None,
    expected_orientation: int = 1,
) -> dict:
    """
    Independent 4-Point Verification Engine strictly conforming to PRD Section 5.6.3.
    Runs V1 (Segment audit), V2 (exifread scan), V3 (Pillow scan), V4 (Raw byte-pattern scan),
    and re-runs the metadata extractor and deterministic risk engine.
    """
    checks = []

    # ---------------------------------------------------------
    # V1: Segment audit
    # ---------------------------------------------------------
    v1_passed = True
    clean_segments = []
    clean_img_info = {}
    try:
        clean_segments, clean_img_info = scan_segments(cleaned_bytes)
        for s in clean_segments:
            if s.get("removable") is True:
                v1_passed = False
                break
            if s.get("marker") in ("APP1", "APP13", "COM"):
                v1_passed = False
                break
            if s.get("name") in ("EXIF", "XMP", "IPTC", "Comment", "MPF", "FPXR"):
                v1_passed = False
                break

        eoi_offset = clean_img_info.get("eoi_offset")
        if eoi_offset is not None and eoi_offset < len(cleaned_bytes):
            # Trailing data remains after EOI
            v1_passed = False
    except Exception:
        v1_passed = False

    checks.append({
        "id": "V1",
        "name": "Segment audit",
        "passed": v1_passed,
    })

    # ---------------------------------------------------------
    # V2: exifread scan
    # ---------------------------------------------------------
    v2_passed = True
    try:
        tags = exifread.process_file(io.BytesIO(cleaned_bytes), details=True)
        # Pass condition: zero tags (and no thumbnail)
        if len(tags) > 0:
            v2_passed = False
    except Exception:
        v2_passed = False

    checks.append({
        "id": "V2",
        "name": "exifread scan",
        "passed": v2_passed,
    })

    # ---------------------------------------------------------
    # V3: Pillow scan
    # ---------------------------------------------------------
    v3_passed = True
    try:
        img = Image.open(io.BytesIO(cleaned_bytes))
        exif = img.getexif()
        has_exif = bool(exif and len(exif) > 0)

        has_gps = False
        if exif:
            try:
                gps_ifd = exif.get_ifd(0x8825)
                if gps_ifd and len(gps_ifd) > 0:
                    has_gps = True
            except Exception:
                pass

        info = img.info or {}
        has_info_metadata = any(k in info for k in ("exif", "xmp", "comment", "photoshop"))

        has_xmp = False
        if hasattr(img, "getxmp"):
            try:
                xmp_data = img.getxmp()
                if xmp_data and len(xmp_data) > 0:
                    has_xmp = True
            except Exception:
                pass

        if has_exif or has_gps or has_info_metadata or has_xmp:
            v3_passed = False
    except Exception:
        v3_passed = False

    checks.append({
        "id": "V3",
        "name": "Pillow scan",
        "passed": v3_passed,
    })

    # ---------------------------------------------------------
    # V4: Raw byte-pattern scan
    # ---------------------------------------------------------
    v4_passed = True
    for pattern in FORBIDDEN_RAW_PATTERNS:
        if pattern in cleaned_bytes:
            v4_passed = False
            break

    # Also check that harvested original metadata strings are absent from pre-SOS headers
    if v4_passed and original_meta:
        sos_idx = cleaned_bytes.find(b"\xFF\xDA")
        pre_sos_headers = cleaned_bytes[:sos_idx] if sos_idx != -1 else cleaned_bytes

        harvested_strings = []
        for cat in ("device", "location"):
            for item in original_meta.get(cat, []):
                val = str(item.get("value", "")).strip()
                if len(val) >= 4 and val not in ("None", "true", "false", "N/A"):
                    harvested_strings.append(val.encode("utf-8", errors="ignore"))

        for s in harvested_strings:
            if s in pre_sos_headers:
                v4_passed = False
                break

    checks.append({
        "id": "V4",
        "name": "Raw byte-pattern scan",
        "passed": v4_passed,
    })

    # ---------------------------------------------------------
    # Re-scan with segment scanner, metadata extractor & risk engine
    # ---------------------------------------------------------
    meta_result = extract_metadata(cleaned_bytes, clean_img_info)
    clean_meta = meta_result.get("metadata", {})
    clean_gps = meta_result.get("gps", {})
    clean_thumb = meta_result.get("thumbnail", {})

    risk_result = evaluate(
        metadata=clean_meta,
        gps=clean_gps,
        thumbnail=clean_thumb,
        segments=clean_segments,
    )

    location_tags = clean_meta.get("location", [])
    device_tags = clean_meta.get("device", [])
    capture_tags = [
        t for t in clean_meta.get("capture", [])
        if "Date" in t.get("tag", "") or "Time" in t.get("tag", "")
    ]
    exif_count = len(location_tags) + len(capture_tags)
    gps_count = 1 if clean_gps.get("present") else 0
    device_id_count = len(device_tags)
    sensitive_tags_remaining = exif_count + gps_count + device_id_count
    risk_score = risk_result.get("score", 0)

    # Pixel dimensions check
    dims_match = True
    try:
        clean_dims = parse_header_dimensions(cleaned_bytes)
        if original_bytes:
            orig_dims = parse_header_dimensions(original_bytes)
            if expected_orientation in (5, 6, 7, 8):
                # Transposed 90 or 270 deg
                dims_match = (
                    clean_dims["width"] == orig_dims["height"] and
                    clean_dims["height"] == orig_dims["width"]
                )
            else:
                dims_match = (
                    clean_dims["width"] == orig_dims["width"] and
                    clean_dims["height"] == orig_dims["height"]
                )
    except Exception:
        dims_match = False

    all_verified = all(c["passed"] for c in checks) and sensitive_tags_remaining == 0

    verification_data = {
        "verified": all_verified,
        "checks": checks,
        "proof": {
            "sensitive_tags_remaining": sensitive_tags_remaining,
            "breakdown": {
                "exif": exif_count,
                "gps": gps_count,
                "device_ids": device_id_count,
            },
            "risk_score": risk_score,
            "dimensions_match": dims_match,
        },
        "sensitive_tags_remaining": sensitive_tags_remaining,
        "risk_score": risk_score,
        "dimensions_match": dims_match,
    }

    if not all_verified:
        failed_checks = [c for c in checks if not c["passed"]]
        raise VerificationFailedError(
            message="Post-cleaning verification checks failed. No download issued.",
            checks=failed_checks,
        )

    return verification_data
