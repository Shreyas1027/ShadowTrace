from flask import Blueprint, jsonify
from app.services.storage import delete_session, get_session, validate_token

session_bp = Blueprint("session", __name__)


@session_bp.route("/session/<token>", methods=["GET"])
def get_session_status(token):
    """GET /api/session/<token> — session status per PRD Section 6.6."""
    if not validate_token(token):
        return jsonify({"ok": False, "error": {"code": "INVALID_TOKEN", "message": "Invalid session token."}}), 400

    state = get_session(token)
    return jsonify({
        "ok": True,
        "token": state["token"],
        "status": state["status"],
        "verified": state.get("verified", False),
        "created_at": state["created_at"],
        "expires_at": state["expires_at"],
    }), 200


@session_bp.route("/session/<token>", methods=["DELETE"])
def delete_session_route(token):
    """
    DELETE /api/session/<token> — purge now per PRD Section 6.6.
    Idempotent: an unknown/already-purged token also returns 200 with "deleted": false.
    """
    if not validate_token(token):
        return jsonify({"ok": True, "deleted": False}), 200

    deleted = delete_session(token)
    return jsonify({"ok": True, "deleted": deleted}), 200
