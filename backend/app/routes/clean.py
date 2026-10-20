from pathlib import Path
from flask import Blueprint, request, jsonify, Response
from app.services.storage import (
    validate_token,
    get_session,
    get_token_dir,
    delete_session,
)
from app.services.cleaner import clean_image
from app.utils.errors import (
    InvalidTokenError,
    TokenNotFoundError,
    NotVerifiedError,
)

clean_bp = Blueprint("clean", __name__)


@clean_bp.route("/clean", methods=["POST"])
def post_clean():
    """
    POST /api/clean
    Trigger lossless metadata stripping and independent 4-point verification.
    Strictly conforms to PRD Section 6.3.
    """
    body = request.get_json(silent=True) or {}
    token = body.get("token")

    if not token or not validate_token(token):
        raise InvalidTokenError("A valid 43-character session token is required.")

    result = clean_image(token)
    return jsonify(result), 200


@clean_bp.route("/download/<token>", methods=["GET"])
def download_clean_image(token):
    """
    GET /api/download/<token>
    Stream sanitized JPEG and consume token ephemeral lifecycle per PRD Section 5.7 (FR-DL-05)
    and Section 6.4.
    """
    if not validate_token(token):
        raise InvalidTokenError("Invalid session token format.")

    state = get_session(token)
    if not state.get("verified"):
        raise NotVerifiedError("Image cleaning has not passed verification yet.")

    token_dir = get_token_dir(token)
    cleaned_file = token_dir / "cleaned.jpg"

    if not cleaned_file.exists():
        raise TokenNotFoundError("Sanitized image file not found or already consumed.")

    file_bytes = cleaned_file.read_bytes()
    file_size = len(file_bytes)

    # Ephemeral consume-on-download: purge entire session on download per PRD FR-DL-05
    delete_session(token)

    # Derive safe download filename per prompt and PRD specs: <original_name>_clean.jpg
    orig_name = state.get("original_filename", "image.jpg")
    clean_stem = Path(orig_name).stem or "image"
    download_filename = f"{clean_stem}_clean.jpg"

    response = Response(file_bytes, mimetype="image/jpeg")
    response.headers["Content-Disposition"] = f'attachment; filename="{download_filename}"'
    response.headers["Content-Length"] = str(file_size)
    response.headers["Cache-Control"] = "no-store, max-age=0"
    response.headers["X-Content-Type-Options"] = "nosniff"

    return response


@clean_bp.route("/session/<token>", methods=["DELETE"])
def delete_session_clean_route(token):
    """
    DELETE /api/session/<token>
    Explicitly purge session directory per PRD Section 5.7 (FR-DL-09) and Section 6.6.
    Idempotent.
    """
    if not validate_token(token):
        return jsonify({"ok": True, "deleted": False}), 200

    deleted = delete_session(token)
    return jsonify({"ok": True, "deleted": deleted}), 200
