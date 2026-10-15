from flask import jsonify, request
from werkzeug.exceptions import HTTPException


class AppError(Exception):
    """Base application exception following PRD Section 6.0 schema."""

    def __init__(self, code: str, message: str, status_code: int = 400, details: dict = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self):
        return {
            "ok": false if False else False,
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details if self.details else None
            }
        }


# Concrete exceptions
class NoFileError(AppError):
    def __init__(self, message="No image file provided in request."):
        super().__init__("NO_FILE", message, 400)


class InvalidTokenError(AppError):
    def __init__(self, message="Invalid session token format."):
        super().__init__("INVALID_TOKEN", message, 400)


class FileTooLargeError(AppError):
    def __init__(self, message="That photo is larger than 10 MB. Please choose a smaller JPEG.", max_bytes=10485760):
        super().__init__("FILE_TOO_LARGE", message, 413, {"max_bytes": max_bytes})


class ImageTooLargeError(AppError):
    def __init__(self, message="Image resolution exceeds the 50 megapixel limit.", max_mp=50):
        super().__init__("IMAGE_TOO_LARGE", message, 413, {"max_megapixels": max_mp})


class InvalidSignatureError(AppError):
    def __init__(self, message="File does not have a valid JPEG signature."):
        super().__init__("INVALID_SIGNATURE", message, 415)


class UnsupportedTypeError(AppError):
    def __init__(self, message="Only JPEG images (.jpg, .jpeg) are supported."):
        super().__init__("UNSUPPORTED_TYPE", message, 415)


class CorruptImageError(AppError):
    def __init__(self, message="The image file appears corrupted and cannot be decoded."):
        super().__init__("CORRUPT_IMAGE", message, 422)


class TruncatedJpegError(AppError):
    def __init__(self, message="JPEG image data is incomplete or truncated."):
        super().__init__("TRUNCATED_JPEG", message, 422)


class MalformedStructureError(AppError):
    def __init__(self, message="JPEG segment marker chain is malformed."):
        super().__init__("MALFORMED_STRUCTURE", message, 422)


class TokenNotFoundError(AppError):
    def __init__(self, message="Session token not found or already consumed."):
        super().__init__("TOKEN_NOT_FOUND", message, 404)


class TokenExpiredError(AppError):
    def __init__(self, message="Session token has expired. Files have been purged."):
        super().__init__("TOKEN_EXPIRED", message, 410)


class NotAnalyzedError(AppError):
    def __init__(self, message="Photo must be analyzed before cleaning."):
        super().__init__("NOT_ANALYZED", message, 409)


class NotVerifiedError(AppError):
    def __init__(self, message="Photo cleaning has not been verified yet."):
        super().__init__("NOT_VERIFIED", message, 409)


class VerificationFailedError(AppError):
    def __init__(self, message="Post-cleaning verification checks failed. No download issued.", checks=None):
        super().__init__("VERIFICATION_FAILED", message, 500, {"checks": checks or []})


class RateLimitedError(AppError):
    def __init__(self, message="Too many requests. Please slow down."):
        super().__init__("RATE_LIMITED", message, 429)


class ServerBusyError(AppError):
    def __init__(self, message="Server capacity reached. Please try again shortly."):
        super().__init__("SERVER_BUSY", message, 503)


class InternalError(AppError):
    def __init__(self, message="An unexpected error occurred. Please try again."):
        super().__init__("INTERNAL_ERROR", message, 500)


def register_error_handlers(app):
    """Registers global JSON error handlers conforming to PRD Section 6.0."""

    @app.errorhandler(AppError)
    def handle_app_error(err):
        return jsonify(err.to_dict()), err.status_code

    @app.errorhandler(400)
    def handle_400(err):
        return jsonify({
            "ok": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": getattr(err, "description", "Bad request."),
                "details": None
            }
        }), 400

    @app.errorhandler(404)
    def handle_404(err):
        return jsonify({
            "ok": False,
            "error": {
                "code": "TOKEN_NOT_FOUND" if request.path.startswith("/api/download") or request.path.startswith("/api/session") else "NOT_FOUND",
                "message": getattr(err, "description", "The requested API endpoint was not found."),
                "details": None
            }
        }), 404

    @app.errorhandler(405)
    def handle_405(err):
        return jsonify({
            "ok": False,
            "error": {
                "code": "METHOD_NOT_ALLOWED",
                "message": "Method not allowed for this endpoint.",
                "details": None
            }
        }), 405

    @app.errorhandler(413)
    def handle_413(err):
        return jsonify({
            "ok": False,
            "error": {
                "code": "FILE_TOO_LARGE",
                "message": "That photo is larger than 10 MB. Please choose a smaller JPEG.",
                "details": {"max_bytes": app.config.get("MAX_CONTENT_LENGTH", 10485760)}
            }
        }), 413

    @app.errorhandler(415)
    def handle_415(err):
        return jsonify({
            "ok": False,
            "error": {
                "code": "UNSUPPORTED_TYPE",
                "message": "Only JPEG images are supported.",
                "details": None
            }
        }), 415

    @app.errorhandler(429)
    def handle_429(err):
        return jsonify({
            "ok": False,
            "error": {
                "code": "RATE_LIMITED",
                "message": "Too many requests. Please slow down.",
                "details": None
            }
        }), 429

    @app.errorhandler(500)
    @app.errorhandler(Exception)
    def handle_500(err):
        if isinstance(err, HTTPException):
            return jsonify({
                "ok": False,
                "error": {
                    "code": "HTTP_ERROR",
                    "message": err.description,
                    "details": None
                }
            }), err.code

        # Log safe error without leaking client data or stack trace
        app.logger.error("Unhandled server exception: %s", type(err).__name__)
        return jsonify({
            "ok": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected server error occurred. Please try again later.",
                "details": None
            }
        }), 500
