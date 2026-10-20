from flask import Blueprint, request, jsonify
from app.services.validation import validate_upload
from app.services.storage import generate_token, create_session
from app.services.metadata import extract_metadata
from app.services.risk import evaluate
from app.utils.errors import NoFileError

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.route("/analyze", methods=["POST"])
def post_analyze():
    """
    POST /api/analyze
    Upload, validate, extract metadata, evaluate risk, and store in ephemeral token dir.
    Strictly follows PRD Section 5.3, 5.4, 5.5, and 6.2 schema.
    """
    if "image" not in request.files:
        raise NoFileError("No image file provided in multipart field 'image'.")

    file_storage = request.files["image"]

    # 1. Sequential validation (FR-UP-01 .. FR-UP-09)
    file_bytes, image_info, segments = validate_upload(file_storage)

    # 2. Ephemeral session directory creation (FR-UP-10, FR-DL-01..02)
    token = generate_token()
    token_dir, state = create_session(token, file_bytes, original_filename=file_storage.filename)

    # 3. Metadata extraction (FR-META-01 .. FR-META-10)
    meta_result = extract_metadata(file_bytes, image_info)

    # 4. Deterministic risk engine scoring (FR-RISK-01 .. FR-RISK-07)
    risk_result = evaluate(
        metadata=meta_result["metadata"],
        gps=meta_result["gps"],
        thumbnail=meta_result["thumbnail"],
        segments=segments,
    )

    # 5. Build canonical JSON envelope per PRD Section 6.2
    response_payload = {
        "ok": True,
        "token": token,
        "created_at": state["created_at"],
        "expires_at": state["expires_at"],
        "ttl_seconds": state["ttl_seconds"],
        "file": {
            "size_bytes": image_info["size_bytes"],
            "width": image_info["width"],
            "height": image_info["height"],
            "megapixels": image_info["megapixels"],
            "format": "JPEG",
        },
        "risk": risk_result,
        "metadata": meta_result["metadata"],
        "gps": meta_result["gps"],
        "segments": segments,
        "orientation": meta_result["orientation"],
        "thumbnail": meta_result["thumbnail"],
        "warnings": meta_result["warnings"],
        "previews": {
            "original": f"/api/preview/{token}/original"
        },
    }

    return jsonify(response_payload), 200
