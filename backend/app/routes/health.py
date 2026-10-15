from flask import Blueprint, jsonify
from app.config import config

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def get_health():
    """Liveness/readiness check returning API status and limits per PRD Section 6.1."""
    # Count active sessions in TMP_ROOT
    active_sessions = 0
    if config.TMP_ROOT.exists():
        try:
            active_sessions = sum(1 for item in config.TMP_ROOT.iterdir() if item.is_dir())
        except Exception:
            active_sessions = 0

    return jsonify({
        "ok": True,
        "service": "shadowtrace-api",
        "version": "1.0.0",
        "status": "healthy",
        "limits": {
            "max_upload_bytes": config.MAX_UPLOAD_BYTES,
            "max_megapixels": config.MAX_MEGAPIXELS,
            "token_ttl_seconds": config.TOKEN_TTL_SECONDS
        },
        "supported_formats": ["image/jpeg"],
        "active_sessions": active_sessions
    }), 200
