import pytest
from app.services.risk import evaluate


def test_risk_evaluation_high_gps():
    """GPS present must evaluate to HIGH risk (score 100) and include all other reasons."""
    metadata = {
        "location": [
            {"tag": "GPSLatitude", "value": "47.620422"},
            {"tag": "GPSLongitude", "value": "-122.349358"},
        ],
        "capture": [
            {"tag": "DateTimeOriginal", "value": "2026-10-12 18:41:07"},
            {"tag": "ISOSpeedRatings", "value": "64"},
        ],
        "device": [
            {"tag": "Make", "value": "Apple"},
            {"tag": "Model", "value": "iPhone 15 Pro"},
        ],
        "image": [],
    }
    gps = {
        "present": True,
        "valid": True,
        "latitude": 47.620422,
        "longitude": -122.349358,
    }

    result = evaluate(metadata, gps)

    assert result["level"] == "high"
    assert result["score"] == 100
    assert result["flags"]["gps"] is True
    assert result["flags"]["timestamp"] is True
    assert result["flags"]["device"] is True

    codes = [r["code"] for r in result["reasons"]]
    assert "GPS_PRESENT" in codes
    assert "TIMESTAMP_PRESENT" in codes
    assert "DEVICE_ID_PRESENT" in codes


def test_risk_evaluation_medium_device_and_timestamp_no_gps():
    """No GPS but Make/Model or DateTimeOriginal must evaluate to MEDIUM risk (score 60)."""
    metadata = {
        "location": [],
        "capture": [
            {"tag": "DateTimeOriginal", "value": "2026-10-12 18:41:07"},
        ],
        "device": [
            {"tag": "Make", "value": "Sony"},
            {"tag": "Model", "value": "ILCE-7M4"},
        ],
        "image": [],
    }
    gps = {"present": False, "valid": False}

    result = evaluate(metadata, gps)

    assert result["level"] == "medium"
    assert result["score"] == 60
    assert result["flags"]["gps"] is False
    assert result["flags"]["timestamp"] is True
    assert result["flags"]["device"] is True

    codes = [r["code"] for r in result["reasons"]]
    assert "GPS_PRESENT" not in codes
    assert "TIMESTAMP_PRESENT" in codes
    assert "DEVICE_ID_PRESENT" in codes


def test_risk_evaluation_low_technical_only():
    """No GPS, no timestamp, no device identity, only ISO/shutter must evaluate to LOW risk (score 25)."""
    metadata = {
        "location": [],
        "capture": [
            {"tag": "ExposureTime", "value": "1/250 s"},
            {"tag": "FNumber", "value": "f/2.8"},
            {"tag": "ISOSpeedRatings", "value": "100"},
        ],
        "device": [],
        "image": [
            {"tag": "ImageWidth", "value": "1920 px"},
        ],
    }
    gps = {"present": False, "valid": False}

    result = evaluate(metadata, gps)

    assert result["level"] == "low"
    assert result["score"] == 25
    assert result["flags"]["gps"] is False
    assert result["flags"]["technical_only"] is True

    codes = [r["code"] for r in result["reasons"]]
    assert codes == ["TECHNICAL_ONLY"]


def test_risk_evaluation_clean_none():
    """Pre-cleaned image with zero metadata tags must evaluate to NONE / Clean (score 0)."""
    metadata = {
        "location": [],
        "capture": [],
        "device": [],
        "image": [
            {"tag": "ImageWidth", "value": "800 px"},
            {"tag": "ImageLength", "value": "600 px"},
        ],
    }
    gps = {"present": False, "valid": False}

    result = evaluate(metadata, gps)

    assert result["level"] == "none"
    assert result["score"] == 0
    assert result["flags"]["gps"] is False
    assert result["flags"]["technical_only"] is False

    codes = [r["code"] for r in result["reasons"]]
    assert codes == ["NO_METADATA"]


def test_risk_precedence_table():
    """Table-driven test confirming FR-RISK-07 precedence rules."""
    test_cases = [
        # (has_gps, has_time, has_device, has_tech, expected_level, expected_score)
        (True, True, True, True, "high", 100),
        (True, False, False, False, "high", 100),
        (False, True, True, True, "medium", 60),
        (False, True, False, False, "medium", 60),
        (False, False, True, False, "medium", 60),
        (False, False, False, True, "low", 25),
        (False, False, False, False, "none", 0),
    ]

    for has_gps, has_time, has_device, has_tech, exp_level, exp_score in test_cases:
        meta = {"location": [], "capture": [], "device": [], "image": []}
        if has_time:
            meta["capture"].append({"tag": "DateTimeOriginal", "value": "2026-01-01"})
        if has_device:
            meta["device"].append({"tag": "Make", "value": "CameraBrand"})
        if has_tech:
            meta["capture"].append({"tag": "FNumber", "value": "f/2.8"})

        gps_data = {"present": has_gps, "valid": has_gps, "latitude": 10.0, "longitude": 20.0} if has_gps else {"present": False}
        res = evaluate(meta, gps_data)
        assert res["level"] == exp_level, f"Failed level for case {has_gps}, {has_time}, {has_device}, {has_tech}"
        assert res["score"] == exp_score, f"Failed score for case {has_gps}, {has_time}, {has_device}, {has_tech}"
