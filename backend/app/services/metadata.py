import io
import re
from fractions import Fraction
from PIL import Image, ExifTags
import exifread
import defusedxml.minidom

# Category tag classifications per PRD Section 5.4.1
LOCATION_TAGS = {
    "GPSLatitude", "GPSLongitude", "GPSAltitude", "GPSLatitudeRef", "GPSLongitudeRef",
    "GPSAltitudeRef", "GPSTimeStamp", "GPSDateStamp", "GPSProcessingMethod", "GPSAreaInformation",
    "GPSDestLatitude", "GPSDestLongitude", "GPSImgDirection", "GPSSpeed", "GPSMapDatum",
}

CAPTURE_TAGS = {
    "DateTime", "DateTimeOriginal", "DateTimeDigitized", "SubSecTime", "SubSecTimeOriginal",
    "SubSecTimeDigitized", "OffsetTime", "OffsetTimeOriginal", "OffsetTimeDigitized",
    "ExposureTime", "FNumber", "ISOSpeedRatings", "ISO", "PhotographicSensitivity",
    "FocalLength", "FocalLengthIn35mmFilm", "FocalLengthIn35mm", "Flash", "WhiteBalance",
    "MeteringMode", "ExposureProgram", "ExposureBiasValue", "MaxApertureValue",
    "LightSource", "SensingMethod", "CustomRendered", "ExposureMode", "DigitalZoomRatio",
    "SceneCaptureType", "GainControl", "Contrast", "Saturation", "Sharpness", "LensModel",
    "LensMake", "LensSpecification", "LensSerialNumber",
}

DEVICE_TAGS = {
    "Make", "Model", "Software", "BodySerialNumber", "SerialNumber", "CameraSerialNumber",
    "CameraOwnerName", "OwnerName", "ImageUniqueID", "HostComputer", "MakerNote",
    "DeviceSettingDescription",
}

IMAGE_TAGS = {
    "ImageWidth", "ImageLength", "ExifImageWidth", "ExifImageHeight", "Orientation",
    "ColorSpace", "XResolution", "YResolution", "ResolutionUnit", "YCbCrPositioning",
    "Compression", "BitsPerSample", "SamplesPerPixel", "PlanarConfiguration",
}

FRIENDLY_LABELS = {
    "GPSLatitude": "Latitude",
    "GPSLongitude": "Longitude",
    "GPSAltitude": "Altitude",
    "GPSLatitudeRef": "Latitude Direction",
    "GPSLongitudeRef": "Longitude Direction",
    "GPSAltitudeRef": "Altitude Reference",
    "GPSTimeStamp": "GPS Timestamp",
    "GPSDateStamp": "GPS Date",
    "DateTime": "File Modified Date",
    "DateTimeOriginal": "Taken on",
    "DateTimeDigitized": "Digitized on",
    "ExposureTime": "Shutter speed",
    "FNumber": "Aperture",
    "ISOSpeedRatings": "ISO",
    "ISO": "ISO",
    "FocalLength": "Focal length",
    "FocalLengthIn35mmFilm": "Focal length (35mm equiv)",
    "Flash": "Flash mode",
    "WhiteBalance": "White balance",
    "MeteringMode": "Metering mode",
    "ExposureProgram": "Exposure program",
    "LensModel": "Lens model",
    "Make": "Camera make",
    "Model": "Camera model",
    "Software": "Software",
    "BodySerialNumber": "Body serial number",
    "LensSerialNumber": "Lens serial number",
    "CameraOwnerName": "Camera owner name",
    "HostComputer": "Host computer",
    "ImageUniqueID": "Image unique ID",
    "Orientation": "Orientation",
    "ImageWidth": "Width",
    "ImageLength": "Height",
    "ExifImageWidth": "Exif Width",
    "ExifImageHeight": "Exif Height",
    "ColorSpace": "Color space",
    "ICCProfile": "Colour profile",
}


def sanitize_string(val, max_len=1000) -> str:
    """Safely decode and sanitize text per FR-META-09."""
    if val is None:
        return ""
    if isinstance(val, bytes):
        val = val.decode("utf-8", errors="replace")
    elif not isinstance(val, str):
        val = str(val)

    # Strip control characters and NUL bytes
    cleaned = "".join(ch for ch in val if ch == " " or not (ord(ch) < 32 or 127 <= ord(ch) <= 159))
    cleaned = cleaned.strip()
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len] + "…"
    return cleaned


def to_float(val) -> float:
    """Convert rational or numeric value to float."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, Fraction):
        return float(val)
    if isinstance(val, tuple) and len(val) == 2:
        return float(val[0]) / float(val[1]) if val[1] != 0 else 0.0
    try:
        # Check if fraction string like "1/120"
        s = str(val).strip()
        if "/" in s:
            parts = s.split("/")
            return float(parts[0]) / float(parts[1]) if float(parts[1]) != 0 else 0.0
        return float(s)
    except Exception:
        return 0.0


def parse_dms(dms_values, ref: str) -> float:
    """Convert GPS (degrees, minutes, seconds) rationals to signed decimal degrees."""
    if not dms_values or len(dms_values) < 2:
        return None

    try:
        deg = to_float(dms_values[0])
        minutes = to_float(dms_values[1])
        seconds = to_float(dms_values[2]) if len(dms_values) > 2 else 0.0

        decimal = deg + (minutes / 60.0) + (seconds / 3600.0)
        ref_upper = str(ref).strip().upper() if ref else ""
        if ref_upper in ("S", "W"):
            decimal = -abs(decimal)

        return round(decimal, 6)
    except Exception:
        return None


def format_tag_value(tag_name: str, raw_val) -> tuple[str, str]:
    """Format raw EXIF value into human-readable display string."""
    raw_str = sanitize_string(str(raw_val))

    if tag_name == "ExposureTime":
        flt = to_float(raw_val)
        if 0 < flt < 1:
            denom = round(1.0 / flt)
            return f"1/{denom} s", raw_str
        return f"{flt} s", raw_str

    if tag_name == "FNumber":
        flt = to_float(raw_val)
        return f"f/{flt:.1f}" if flt else raw_str, raw_str

    if tag_name in ("FocalLength", "FocalLengthIn35mmFilm"):
        flt = to_float(raw_val)
        return f"{round(flt, 1)} mm", raw_str

    if tag_name == "GPSAltitude":
        flt = to_float(raw_val)
        return f"{flt:.1f} m", raw_str

    if tag_name in ("ImageWidth", "ExifImageWidth"):
        return f"{raw_val} px", raw_str

    if tag_name in ("ImageLength", "ExifImageHeight"):
        return f"{raw_val} px", raw_str

    if tag_name == "Orientation":
        orientations = {
            1: "1 (Normal)",
            2: "2 (Flip horizontal)",
            3: "3 (Rotate 180°)",
            4: "4 (Flip vertical)",
            5: "5 (Transpose)",
            6: "6 (Rotate 90° CW)",
            7: "7 (Transverse)",
            8: "8 (Rotate 270° CW)",
        }
        return orientations.get(raw_val, str(raw_val)), raw_str

    if tag_name == "ColorSpace":
        if raw_val == 1:
            return "sRGB", raw_str
        elif raw_val == 65535 or raw_val == 0xFFFF:
            return "Uncalibrated", raw_str
        return str(raw_val), raw_str

    return raw_str, raw_str


def extract_metadata(data: bytes, image_info: dict) -> dict:
    """
    Extract EXIF, GPS, and image properties using Pillow and exifread per PRD Section 5.4.
    Returns dictionary with structured metadata, gps info, orientation, and thumbnail info.
    """
    warnings = []
    metadata = {
        "location": [],
        "capture": [],
        "device": [],
        "image": [],
    }

    gps_info = {
        "present": False,
        "valid": False,
        "latitude": None,
        "longitude": None,
        "altitude_m": None,
    }

    orientation_val = 1
    thumbnail_info = {
        "present": False,
        "size_bytes": 0,
        "width": None,
        "height": None,
    }

    # 1. Image Properties from segment scanner / Pillow
    width = image_info.get("width")
    height = image_info.get("height")
    if width:
        metadata["image"].append({
            "tag": "ImageWidth",
            "label": "Width",
            "value": f"{width} px",
            "raw": str(width),
            "source": "file",
            "risk": "none",
        })
    if height:
        metadata["image"].append({
            "tag": "ImageLength",
            "label": "Height",
            "value": f"{height} px",
            "raw": str(height),
            "source": "file",
            "risk": "none",
        })

    # 2. Extract using Pillow
    pillow_exif = {}
    pillow_gps = {}
    try:
        img = Image.open(io.BytesIO(data))
        raw_exif = img._getexif() or {}

        for tag_id, val in raw_exif.items():
            tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
            if tag_name == "GPSInfo" and isinstance(val, dict):
                for gps_id, gps_val in val.items():
                    gps_name = ExifTags.GPSTAGS.get(gps_id, str(gps_id))
                    pillow_gps[gps_name] = gps_val
            elif tag_name == "MakerNote":
                byte_count = len(val) if isinstance(val, (bytes, bytearray)) else 0
                pillow_exif["MakerNote"] = f"MakerNote ({byte_count} bytes)"
            else:
                pillow_exif[tag_name] = val

        # Orientation
        if "Orientation" in pillow_exif:
            try:
                orientation_val = int(pillow_exif["Orientation"])
            except Exception:
                orientation_val = 1

        # Check ICC Profile
        icc_profile = img.info.get("icc_profile")
        if icc_profile:
            metadata["image"].append({
                "tag": "ICCProfile",
                "label": "Colour profile",
                "value": "Embedded ICC Profile",
                "raw": f"{len(icc_profile)} bytes",
                "source": "icc",
                "risk": "none",
            })
    except Exception as e:
        warnings.append(f"Pillow EXIF extraction notice: {str(e)}")

    # 3. Extract and supplement using exifread for detailed tags & GPS
    exifread_tags = {}
    try:
        exifread_tags = exifread.process_file(io.BytesIO(data), details=True)
    except Exception as e:
        warnings.append(f"ExifRead tag extraction notice: {str(e)}")

    # Check for IFD1 thumbnail
    if "JPEGThumbnail" in exifread_tags:
        thumb_bytes = exifread_tags["JPEGThumbnail"]
        thumbnail_info["present"] = True
        thumbnail_info["size_bytes"] = len(thumb_bytes)
        try:
            thumb_img = Image.open(io.BytesIO(thumb_bytes))
            thumbnail_info["width"], thumbnail_info["height"] = thumb_img.size
        except Exception:
            pass

    # 4. GPS Extraction
    raw_lat = pillow_gps.get("GPSLatitude") or exifread_tags.get("GPS GPSLatitude")
    lat_ref = pillow_gps.get("GPSLatitudeRef") or exifread_tags.get("GPS GPSLatitudeRef")
    raw_lon = pillow_gps.get("GPSLongitude") or exifread_tags.get("GPS GPSLongitude")
    lon_ref = pillow_gps.get("GPSLongitudeRef") or exifread_tags.get("GPS GPSLongitudeRef")
    raw_alt = pillow_gps.get("GPSAltitude") or exifread_tags.get("GPS GPSAltitude")
    alt_ref = pillow_gps.get("GPSAltitudeRef") or exifread_tags.get("GPS GPSAltitudeRef")

    if raw_lat is not None and raw_lon is not None:
        gps_info["present"] = True

        # Parse DMS to decimal
        lat_values = getattr(raw_lat, "values", raw_lat)
        lon_values = getattr(raw_lon, "values", raw_lon)

        lat_ref_str = str(getattr(lat_ref, "values", lat_ref) or "N")
        lon_ref_str = str(getattr(lon_ref, "values", lon_ref) or "W")

        dec_lat = parse_dms(lat_values, lat_ref_str)
        dec_lon = parse_dms(lon_values, lon_ref_str)

        if dec_lat is not None and dec_lon is not None and -90 <= dec_lat <= 90 and -180 <= dec_lon <= 180:
            gps_info["valid"] = True
            gps_info["latitude"] = dec_lat
            gps_info["longitude"] = dec_lon

            metadata["location"].append({
                "tag": "GPSLatitude",
                "label": "Latitude",
                "value": f"{dec_lat:.6f}",
                "raw": str(raw_lat),
                "source": "exif",
                "risk": "high",
            })
            metadata["location"].append({
                "tag": "GPSLongitude",
                "label": "Longitude",
                "value": f"{dec_lon:.6f}",
                "raw": str(raw_lon),
                "source": "exif",
                "risk": "high",
            })

            if raw_alt is not None:
                alt_val = to_float(getattr(raw_alt, "values", raw_alt))
                if alt_ref and str(alt_ref).strip() == "1":
                    alt_val = -abs(alt_val)
                gps_info["altitude_m"] = round(alt_val, 1)

                metadata["location"].append({
                    "tag": "GPSAltitude",
                    "label": "Altitude",
                    "value": f"{alt_val:.1f} m",
                    "raw": str(raw_alt),
                    "source": "exif",
                    "risk": "high",
                })
        else:
            gps_info["valid"] = False
            warnings.append("GPS coordinates found but out-of-range or malformed.")

    # 5. Populate Metadata categories from combined Pillow & ExifRead tags
    combined_tags = {}
    # Pillow tags
    for k, v in pillow_exif.items():
        combined_tags[k] = v

    # Exifread tags (normalize keys like "EXIF DateTimeOriginal" -> "DateTimeOriginal")
    for k, v in exifread_tags.items():
        clean_k = k.split()[-1]
        if clean_k not in combined_tags and clean_k not in ("JPEGThumbnail", "TIFFThumbnail"):
            combined_tags[clean_k] = v.values if hasattr(v, "values") else v

    # Add Orientation to Image metadata
    if orientation_val != 1 or "Orientation" in combined_tags:
        val_str, raw_str = format_tag_value("Orientation", orientation_val)
        metadata["image"].append({
            "tag": "Orientation",
            "label": "Orientation",
            "value": val_str,
            "raw": raw_str,
            "source": "exif",
            "risk": "none",
        })

    # Sort remaining tags into respective categories
    for tag_name, raw_val in combined_tags.items():
        if tag_name in ("GPSInfo", "Orientation", "ImageWidth", "ImageLength"):
            continue

        val_str, raw_str = format_tag_value(tag_name, raw_val)
        label = FRIENDLY_LABELS.get(tag_name, tag_name)

        if tag_name in CAPTURE_TAGS:
            risk_level = "medium" if "Date" in tag_name or "Time" in tag_name else "low"
            metadata["capture"].append({
                "tag": tag_name,
                "label": label,
                "value": val_str,
                "raw": raw_str,
                "source": "exif",
                "risk": risk_level,
            })
        elif tag_name in DEVICE_TAGS:
            metadata["device"].append({
                "tag": tag_name,
                "label": label,
                "value": val_str,
                "raw": raw_str,
                "source": "exif",
                "risk": "medium",
            })
        elif tag_name in IMAGE_TAGS:
            metadata["image"].append({
                "tag": tag_name,
                "label": label,
                "value": val_str,
                "raw": raw_str,
                "source": "exif",
                "risk": "none",
            })

    orientation_info = {
        "value": orientation_val,
        "requires_reencode": orientation_val in (2, 3, 4, 5, 6, 7, 8),
    }

    return {
        "metadata": metadata,
        "gps": gps_info,
        "orientation": orientation_info,
        "thumbnail": thumbnail_info,
        "warnings": warnings,
    }
