import io
import struct
import hashlib
from pathlib import Path
from PIL import Image, ImageOps

from app.services.storage import (
    get_session,
    get_token_dir,
    save_cleaned_image,
    update_session_state,
)
from app.services.verification import verify_cleaned_image
from app.utils.errors import (
    InvalidSignatureError,
    TruncatedJpegError,
    MalformedStructureError,
    TokenNotFoundError,
    NotAnalyzedError,
)

# Marker constants
SOI = 0xD8
EOI = 0xD9
SOS = 0xDA
DQT = 0xDB
DHT = 0xC4
DRI = 0xDD
COM = 0xFE

STANDALONE_MARKERS = {
    0xD8,  # SOI
    0xD9,  # EOI
    0x01,  # TEM
    0x00,  # Byte stuffing
    0xD0, 0xD1, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7,  # RST0 - RST7
}


def strip_jpeg_metadata(data: bytes) -> tuple[bytes, list[dict], list[str]]:
    """
    Byte-level lossless metadata stripping per PRD Section 5.6.1 (FR-CLEAN-01 .. FR-CLEAN-06).
    Copies compressed entropy scan data byte-for-byte without decompressing pixels.
    Removes APP1 (EXIF, XMP), APP13 (Photoshop/IPTC), COM, non-ICC APP2, vendor APPn,
    and trailing bytes after EOI.
    Preserves SOI, EOI, DQT, DHT, DRI, SOF*, SOS, APP0 JFIF/JFXX, APP2 ICC_PROFILE, APP14 Adobe.
    """
    data_len = len(data)
    if data_len < 4 or data[0] != 0xFF or data[1] != 0xD8:
        raise InvalidSignatureError("Not a valid JPEG image.")

    out = bytearray()
    out.extend(b"\xFF\xD8")

    removed_counts = {
        "EXIF": 0,
        "XMP": 0,
        "IPTC": 0,
        "COMMENT": 0,
        "TRAILING_DATA": 0,
    }
    preserved_set = set()

    offset = 2
    sos_found = False

    while offset < data_len:
        # Seek next marker 0xFF
        while offset < data_len and data[offset] != 0xFF:
            offset += 1

        # Skip fill bytes
        while offset < data_len and data[offset] == 0xFF:
            offset += 1

        if offset >= data_len:
            break

        marker = data[offset]
        marker_offset = offset - 1
        offset += 1

        # Standalone markers without payload
        if marker in STANDALONE_MARKERS:
            if marker == EOI:
                # EOI reached before SOS
                break
            continue

        if offset + 2 > data_len:
            raise TruncatedJpegError("JPEG segment truncated before length header.")

        (seg_len,) = struct.unpack(">H", data[offset : offset + 2])
        if seg_len < 2:
            raise MalformedStructureError(f"Invalid segment length {seg_len} at offset {offset}.")

        payload_start = offset + 2
        payload_end = offset + seg_len

        if payload_end > data_len:
            raise TruncatedJpegError(f"Segment length {seg_len} exceeds file size.")

        payload = data[payload_start:payload_end]
        segment_bytes = data[marker_offset:payload_end]

        # SOS - Start of Scan
        if marker == SOS:
            sos_found = True
            # Copy SOS segment header
            out.extend(segment_bytes)
            offset = payload_end

            # Copy entropy scan data until EOI (0xFF 0xD9)
            eoi_offset = None
            entropy_idx = offset
            while entropy_idx < data_len - 1:
                if data[entropy_idx] == 0xFF:
                    next_byte = data[entropy_idx + 1]
                    if next_byte == EOI:
                        eoi_offset = entropy_idx + 2
                        break
                    elif next_byte == 0x00 or (0xD0 <= next_byte <= 0xD7):
                        entropy_idx += 2
                        continue
                    elif next_byte == 0xFF:
                        entropy_idx += 1
                        continue
                    elif next_byte == SOS:
                        # Multi-scan progressive JPEG
                        entropy_idx += 2
                        continue
                entropy_idx += 1

            if eoi_offset is None:
                if data[-2:] == b"\xFF\xD9":
                    eoi_offset = data_len
                else:
                    raise TruncatedJpegError("Entropy data truncated; no EOI marker found.")

            # Append scan data and EOI
            out.extend(data[offset:eoi_offset])

            # Truncate trailing data after EOI
            trailing_len = data_len - eoi_offset
            if trailing_len > 0:
                removed_counts["TRAILING_DATA"] += trailing_len

            offset = eoi_offset
            break

        # Classification of markers before SOS:
        # 1. Structural markers: DQT, DHT, DRI, SOF*
        if marker in (DQT, DHT, DRI) or (0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC)):
            out.extend(segment_bytes)

        # 2. APP0 (0xE0) - JFIF / JFXX
        elif marker == 0xE0:
            if payload.startswith(b"JFIF\x00") or payload.startswith(b"JFXX\x00"):
                out.extend(segment_bytes)
                preserved_set.add("JFIF")
            else:
                removed_counts["APP0"] = removed_counts.get("APP0", 0) + len(segment_bytes)

        # 3. APP1 (0xE1) - EXIF / XMP
        elif marker == 0xE1:
            if payload.startswith(b"Exif\x00\x00"):
                removed_counts["EXIF"] += len(segment_bytes)
            elif payload.startswith(b"http://ns.adobe.com/xap/1.0/") or payload.startswith(b"http://ns.adobe.com/xmp/"):
                removed_counts["XMP"] += len(segment_bytes)
            else:
                removed_counts["APP1"] = removed_counts.get("APP1", 0) + len(segment_bytes)

        # 4. APP2 (0xE2) - ICC_PROFILE or MPF/FPXR
        elif marker == 0xE2:
            if payload.startswith(b"ICC_PROFILE\x00"):
                out.extend(segment_bytes)
                preserved_set.add("ICC_PROFILE")
            elif payload.startswith(b"MPF\x00"):
                removed_counts["MPF"] = removed_counts.get("MPF", 0) + len(segment_bytes)
            else:
                removed_counts["APP2"] = removed_counts.get("APP2", 0) + len(segment_bytes)

        # 5. APP13 (0xED) - Photoshop / IPTC
        elif marker == 0xED:
            removed_counts["IPTC"] += len(segment_bytes)

        # 6. APP14 (0xEE) - Adobe colour transform flag
        elif marker == 0xEE:
            if payload.startswith(b"Adobe\x00"):
                out.extend(segment_bytes)
                preserved_set.add("Adobe")
            else:
                removed_counts["APP14"] = removed_counts.get("APP14", 0) + len(segment_bytes)

        # 7. COM (0xFE) - Comments
        elif marker == COM:
            removed_counts["COMMENT"] += len(segment_bytes)

        # 8. All other vendor APPn segments (APP3..APP12, APP15)
        elif 0xE3 <= marker <= 0xEF:
            marker_name = f"APP{marker - 0xE0}"
            removed_counts[marker_name] = removed_counts.get(marker_name, 0) + len(segment_bytes)

        # 9. Other harmless structural markers (e.g., DNL)
        elif marker == 0xDC:
            out.extend(segment_bytes)

        offset = payload_end

    if not sos_found:
        raise MalformedStructureError("No SOS marker found before image ended.")

    cleaned_bytes = bytes(out)

    # Format removed stats list
    removed_list = []
    for k in ["EXIF", "XMP", "IPTC", "COMMENT", "TRAILING_DATA"]:
        removed_list.append({"name": k, "bytes": removed_counts.get(k, 0)})

    for k, v in removed_counts.items():
        if k not in ["EXIF", "XMP", "IPTC", "COMMENT", "TRAILING_DATA"] and v > 0:
            removed_list.append({"name": k, "bytes": v})

    preserved_list = sorted(list(preserved_set))

    return cleaned_bytes, removed_list, preserved_list


def clean_image(token: str) -> dict:
    """
    Main clean pipeline entry point strictly conforming to PRD Sections 5.6 and 6.3.
    Strips metadata, verifies output through 4-point verification, saves to disk,
    and returns canonical response dictionary.
    """
    state = get_session(token)
    if state.get("status") not in ("analyzed", "cleaned"):
        raise NotAnalyzedError("Photo must be analyzed before cleaning.")

    token_dir = get_token_dir(token)
    original_file = token_dir / "original.jpg"
    if not original_file.exists():
        raise TokenNotFoundError("Original image file missing from session.")

    original_bytes = original_file.read_bytes()
    original_filename = state.get("original_filename", "image.jpg")

    # Read EXIF orientation before stripping
    img_orig = Image.open(io.BytesIO(original_bytes))
    orientation_val = None
    try:
        exif = img_orig.getexif()
        if exif:
            orientation_val = exif.get(0x0112)
    except Exception:
        pass

    hash_before = hashlib.sha256(img_orig.convert("RGB").tobytes()).hexdigest()

    # Orientation handling per PRD Section 5.6.2
    if orientation_val in (2, 3, 4, 5, 6, 7, 8):
        # Fallback re-encode path (FR-CLEAN-09)
        method = "reencode_orientation"
        method_note = (
            "This photo was rotated using hidden orientation data. "
            "To keep it upright, ShadowTrace re-saved it at very high quality."
        )
        icc_profile = img_orig.info.get("icc_profile")
        transposed = ImageOps.exif_transpose(img_orig)

        buf = io.BytesIO()
        save_kwargs = {"format": "JPEG", "quality": 95, "optimize": False}
        if icc_profile:
            save_kwargs["icc_profile"] = icc_profile
        try:
            transposed.save(buf, subsampling="keep", **save_kwargs)
        except Exception:
            transposed.save(buf, subsampling=0, **save_kwargs)

        reencoded_bytes = buf.getvalue()
        cleaned_bytes, removed_list, preserved_list = strip_jpeg_metadata(reencoded_bytes)

        img_clean = Image.open(io.BytesIO(cleaned_bytes))
        hash_after = hashlib.sha256(img_clean.convert("RGB").tobytes()).hexdigest()
        pixels_identical = False
    else:
        # Lossless path (FR-CLEAN-01..06)
        method = "lossless_rewrite"
        method_note = None

        cleaned_bytes, removed_list, preserved_list = strip_jpeg_metadata(original_bytes)

        img_clean = Image.open(io.BytesIO(cleaned_bytes))
        hash_after = hashlib.sha256(img_clean.convert("RGB").tobytes()).hexdigest()
        pixels_identical = (hash_before == hash_after)

    # Atomically save cleaned.jpg and <filename>_clean.jpg
    cleaned_file_path = save_cleaned_image(token, cleaned_bytes, original_filename)

    # 4-point verification
    try:
        verification_result = verify_cleaned_image(
            cleaned_bytes=cleaned_bytes,
            original_bytes=original_bytes,
            original_meta=None,
            expected_orientation=orientation_val or 1,
        )
    except Exception as exc:
        # Clean up failed cleaned output per FR-CLEAN-12
        if cleaned_file_path.exists():
            cleaned_file_path.unlink(missing_ok=True)
        clean_named_file = token_dir / f"{Path(original_filename).stem}_clean.jpg"
        if clean_named_file.exists():
            clean_named_file.unlink(missing_ok=True)
        raise exc

    # Update session state to cleaned and verified
    update_session_state(token, {
        "status": "cleaned",
        "verified": True,
        "method": method,
        "downloadable": True,
    })

    orig_size = len(original_bytes)
    cleaned_size = len(cleaned_bytes)
    saved_bytes = max(0, orig_size - cleaned_size)

    # Canonical response payload per PRD Section 6.3
    response_payload = {
        "ok": True,
        "token": token,
        "expires_at": state.get("expires_at"),
        "method": method,
        "method_note": method_note,
        "pixels_identical": pixels_identical,
        "hashes": {
            "before": hash_before[:12],
            "after": hash_after[:12],
        },
        "color_preserved": True,
        "size": {
            "original_bytes": orig_size,
            "cleaned_bytes": cleaned_size,
            "saved_bytes": saved_bytes,
        },
        "removed": removed_list,
        "preserved": preserved_list,
        "verification": verification_result,
        "download_url": f"/api/download/{token}",
        "previews": {
            "original": f"/api/preview/{token}/original",
            "cleaned": f"/api/preview/{token}/cleaned",
        },
    }

    return response_payload
