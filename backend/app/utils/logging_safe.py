import logging
import re

# Regex to strip control characters and newlines for anti-log injection
CONTROL_CHAR_REGEX = re.compile(r"[\r\n\x00-\x1f\x7f-\x9f]")
# Regex to match 43-character URL-safe tokens
TOKEN_REGEX = re.compile(r"\b([A-Za-z0-9_-]{6})[A-Za-z0-9_-]{37}\b")


def sanitize_string(val: str) -> str:
    """Strip control characters, newlines, and truncate tokens."""
    if not isinstance(val, str):
        val = str(val)
    # Strip control chars
    clean = CONTROL_CHAR_REGEX.sub(" ", val)
    # Truncate tokens to first 6 chars
    clean = TOKEN_REGEX.sub(r"\1...", clean)
    return clean.strip()


class SafeLogFilter(logging.Filter):
    """
    Ensures that log records never leak sensitive metadata,
    coordinates, full tokens, client-provided filenames, or raw parser exceptions.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = sanitize_string(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: sanitize_string(v) if isinstance(v, str) else v for k, v in record.args.items()}
            elif isinstance(record.args, (list, tuple)):
                record.args = tuple(sanitize_string(v) if isinstance(v, str) else v for v in record.args)
        return True


def setup_safe_logging(app):
    """Configures application logger with safe filtering and standard format."""
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [ShadowTrace] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    handler.addFilter(SafeLogFilter())

    # Replace root and app handlers
    app.logger.handlers.clear()
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
    app.logger.propagate = False

    # Also sanitize werkzeug logger
    werkzeug_logger = logging.getLogger("werkzeug")
    werkzeug_logger.handlers.clear()
    werkzeug_logger.addHandler(handler)
    werkzeug_logger.setLevel(logging.WARNING)
