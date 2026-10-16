from flask import Flask, request
from flask_cors import CORS
from app.config import config
from app.utils.logging_safe import setup_safe_logging
from app.utils.errors import register_error_handlers
from app.routes.health import health_bp
from app.routes.analyze import analyze_bp
from app.routes.session import session_bp


def create_app(config_override=None):
    """Flask application factory for ShadowTrace API."""
    app = Flask(__name__)

    # Apply configuration
    app.config.from_object(config)
    if config_override:
        app.config.update(config_override)

    # Set content length limit
    app.config["MAX_CONTENT_LENGTH"] = config.MAX_UPLOAD_BYTES

    # Ensure tmp root exists
    config.TMP_ROOT.mkdir(parents=True, exist_ok=True)

    # Configure safe logging
    setup_safe_logging(app)

    # Configure CORS with strict origin allowlist
    CORS(
        app,
        resources={r"/api/*": {"origins": config.CORS_ORIGINS}},
        supports_credentials=False
    )

    # Security headers middleware
    @app.after_request
    def set_security_headers(response):
        # Baseline headers per PRD Section 7.2
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cross-Origin-Resource-Policy"] = "same-site"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"

        # API-specific security headers
        if request.path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store, max-age=0"
            if "Content-Security-Policy" not in response.headers:
                response.headers["Content-Security-Policy"] = "default-src 'none'"

        # Production HSTS
        if config.IS_PRODUCTION:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"

        return response

    # Register global error handlers
    register_error_handlers(app)

    # Register blueprints
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(analyze_bp, url_prefix="/api")
    app.register_blueprint(session_bp, url_prefix="/api")

    return app
