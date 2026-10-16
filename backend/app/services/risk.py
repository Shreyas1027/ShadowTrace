def evaluate(metadata: dict, gps: dict, thumbnail: dict = None, segments: list = None) -> dict:
    """
    Deterministic risk evaluation engine strictly conforming to PRD Section 5.5 (FR-RISK).
    Returns pure evaluation dictionary: {level, score, flags, reasons}.
    """
    location_tags = metadata.get("location", [])
    capture_tags = metadata.get("capture", [])
    device_tags = metadata.get("device", [])
    image_tags = metadata.get("image", [])

    # Flags evaluation
    flags = {
        "gps": False,
        "timestamp": False,
        "device": False,
        "serial": False,
        "software": False,
        "thumbnail": False,
        "author": False,
        "comment": False,
        "technical_only": False,
    }

    # Helper maps for quick lookup
    device_map = {item.get("tag"): item.get("value") for item in device_tags}
    capture_map = {item.get("tag"): item.get("value") for item in capture_tags}

    # 1. GPS Flag
    has_gps = bool(gps.get("present"))
    if has_gps:
        flags["gps"] = True

    # 2. Timestamp Flag
    time_keys = [
        "DateTimeOriginal", "DateTimeDigitized", "DateTime",
        "SubSecTime", "SubSecTimeOriginal", "OffsetTime", "OffsetTimeOriginal",
    ]
    timestamp_val = None
    for k in time_keys:
        if k in capture_map:
            flags["timestamp"] = True
            if not timestamp_val:
                timestamp_val = capture_map[k]

    # 3. Device Flag
    make_val = device_map.get("Make", "")
    model_val = device_map.get("Model", "")
    if make_val or model_val or "HostComputer" in device_map:
        flags["device"] = True

    # 4. Serial Flag
    serial_keys = ["BodySerialNumber", "LensSerialNumber", "SerialNumber", "CameraSerialNumber", "ImageUniqueID"]
    if any(k in device_map for k in serial_keys):
        flags["serial"] = True

    # 5. Software Flag
    if "Software" in device_map:
        flags["software"] = True

    # 6. Thumbnail Flag
    if thumbnail and thumbnail.get("present"):
        flags["thumbnail"] = True

    # 7. Author Flag
    author_keys = ["Artist", "Copyright", "CameraOwnerName", "OwnerName"]
    if any(k in device_map for k in author_keys):
        flags["author"] = True

    # 8. Comment Flag
    if segments:
        for seg in segments:
            if seg.get("name") == "Comment" or seg.get("marker") == "COM":
                flags["comment"] = True
                break

    # 9. Technical Only Flag
    has_medium = (
        flags["timestamp"] or flags["device"] or flags["serial"] or
        flags["software"] or flags["thumbnail"] or flags["author"] or flags["comment"]
    )
    if not has_gps and not has_medium and len(capture_tags) > 0:
        flags["technical_only"] = True

    # Determine Level and Score per FR-RISK-01..04
    reasons = []

    # Reason: GPS
    if flags["gps"]:
        lat = gps.get("latitude")
        lon = gps.get("longitude")
        if lat is not None and lon is not None:
            coord_str = f"({lat:.6f}, {lon:.6f})"
        else:
            coord_str = "(exact coordinates embedded)"

        reasons.append({
            "code": "GPS_PRESENT",
            "severity": "high",
            "title": "Exact location found",
            "plain_text": f"This photo contains the exact GPS location where it was taken {coord_str}. Anyone who receives the original file could find this place.",
        })

    # Reason: Timestamp
    if flags["timestamp"]:
        display_time = timestamp_val or "capture timestamp"
        reasons.append({
            "code": "TIMESTAMP_PRESENT",
            "severity": "medium",
            "title": "Date and time found",
            "plain_text": f"The photo records when it was taken ({display_time}), which can reveal your daily routines.",
        })

    # Reason: Device
    if flags["device"]:
        device_name = f"{make_val} {model_val}".strip() or "Device metadata"
        reasons.append({
            "code": "DEVICE_ID_PRESENT",
            "severity": "medium",
            "title": "Device identified",
            "plain_text": f"The camera make and model ({device_name}) are embedded in this image.",
        })

    # Reason: Serial
    if flags["serial"]:
        reasons.append({
            "code": "SERIAL_PRESENT",
            "severity": "medium",
            "title": "Hardware serial number found",
            "plain_text": "A hardware serial identifier is embedded that could link this photo to other pictures taken on the same device.",
        })

    # Reason: Software
    if flags["software"]:
        software_name = device_map.get("Software", "Editing software")
        reasons.append({
            "code": "SOFTWARE_PRESENT",
            "severity": "medium",
            "title": "Software signature found",
            "plain_text": f"Software identifiers ({software_name}) are embedded in the image headers.",
        })

    # Reason: Thumbnail
    if flags["thumbnail"]:
        reasons.append({
            "code": "THUMBNAIL_PRESENT",
            "severity": "medium",
            "title": "Embedded preview thumbnail",
            "plain_text": "An embedded preview thumbnail was found, which might retain pre-cropped or unedited image content.",
        })

    # Reason: Comment
    if flags["comment"]:
        reasons.append({
            "code": "COMMENT_PRESENT",
            "severity": "medium",
            "title": "Embedded text comment",
            "plain_text": "A JPEG text comment segment is embedded inside the photo structure.",
        })

    # Hierarchical determination: High -> Medium -> Low -> None
    if flags["gps"]:
        level = "high"
        score = 100
    elif has_medium:
        level = "medium"
        score = 60
    elif flags["technical_only"]:
        level = "low"
        score = 25
        reasons.append({
            "code": "TECHNICAL_ONLY",
            "severity": "low",
            "title": "Technical camera settings",
            "plain_text": "Harmless technical settings like ISO and aperture were found, but no personal location or device identifiers.",
        })
    else:
        level = "none"
        score = 0
        reasons.append({
            "code": "NO_METADATA",
            "severity": "none",
            "title": "Nothing sensitive found",
            "plain_text": "Zero privacy-sensitive metadata tags found in this image.",
        })

    return {
        "level": level,
        "score": score,
        "flags": flags,
        "reasons": reasons,
    }
