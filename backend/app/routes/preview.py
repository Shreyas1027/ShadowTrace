import io
from flask import Blueprint, Response, jsonify
from PIL import Image, ImageOps
from app.services.storage import validate_token, get_token_dir, get_session
from app.utils.errors import InvalidTokenError, TokenNotFoundError

preview_bp = Blueprint("preview", __name__)


@preview_bp.route("/preview/<token>/<which>", methods=["GET"])
def get_preview(token, which):
    """
    GET /api/preview/<token>/<which>
    Serves metadata-free display preview per PRD Section 5.7 (FR-DL-08) and Section 6.5.
    which: 'original' | 'cleaned' (strict allow-list; anything else -> 404).
    """
    if not validate_token(token):
        return jsonify({
            "ok": False,
            "error": {"code": "INVALID_TOKEN", "message": "Invalid session token."}
        }), 400

    if which not in ("original", "cleaned"):
        return jsonify({
            "ok": False,
            "error": {"code": "NOT_FOUND", "message": "Preview target must be 'original' or 'cleaned'."}
        }), 404

    # Verify session is live
    get_session(token)

    token_dir = get_token_dir(token)
    target_filename = "original.jpg" if which == "original" else "cleaned.jpg"
    target_path = token_dir / target_filename

    if not target_path.exists():
        return jsonify({
            "ok": False,
            "error": {"code": "TOKEN_NOT_FOUND", "message": f"{which.capitalize()} image not found."}
        }), 404

    try:
        img = Image.open(target_path)
        img = ImageOps.exif_transpose(img)
        img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        preview_bytes = buf.getvalue()

        response = Response(preview_bytes, mimetype="image/jpeg")
        response.headers["Content-Disposition"] = "inline"
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response
    except Exception:
        return jsonify({
            "ok": False,
            "error": {"code": "INTERNAL_ERROR", "message": "Failed to generate image preview."}
        }), 500
