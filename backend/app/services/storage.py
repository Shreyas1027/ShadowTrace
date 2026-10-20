import re
import os
import json
import shutil
import secrets
from pathlib import Path
from datetime import datetime, timezone, timedelta
from app.config import config
from app.utils.errors import InvalidTokenError, TokenNotFoundError, TokenExpiredError

TOKEN_REGEX = re.compile(r"^[A-Za-z0-9_-]{43}$")


def generate_token() -> str:
    """Generate a cryptographically secure 256-bit URL-safe session token (43 chars)."""
    return secrets.token_urlsafe(32)


def validate_token(token: str) -> bool:
    """Validate token format against strict regex per PRD FR-DL-01."""
    if not token or not isinstance(token, str):
        return False
    return bool(TOKEN_REGEX.match(token))


def get_token_dir(token: str) -> Path:
    """
    Resolve and security-check session directory path.
    Guards against path traversal attacks (T2) per PRD Section 7.1.
    """
    if not validate_token(token):
        raise InvalidTokenError("Invalid session token format.")

    tmp_root_resolved = config.TMP_ROOT.resolve()
    token_dir = (tmp_root_resolved / token).resolve()

    # Enforce that resolved path is strictly inside TMP_ROOT
    if not str(token_dir).startswith(str(tmp_root_resolved) + os.sep):
        raise InvalidTokenError("Path traversal detected in session token.")

    return token_dir


def create_session(token: str, original_bytes: bytes, original_filename: str = "image.jpg") -> tuple[Path, dict]:
    """
    Create ephemeral session directory, write original.jpg and state.json.
    Enforces mode 0700/0600 permissions per PRD FR-DL-02.
    """
    token_dir = get_token_dir(token)
    token_dir.mkdir(parents=True, exist_ok=True)

    # Best-effort POSIX permission setting
    try:
        os.chmod(token_dir, 0o700)
    except Exception:
        pass

    original_file = token_dir / "original.jpg"
    with open(original_file, "wb") as f:
        f.write(original_bytes)

    try:
        os.chmod(original_file, 0o600)
    except Exception:
        pass

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=config.TOKEN_TTL_SECONDS)

    clean_filename = Path(original_filename).name if original_filename else "image.jpg"
    # Basic sanitize
    clean_filename = re.sub(r'[^A-Za-z0-9_.-]', '_', clean_filename) or "image.jpg"

    state = {
        "token": token,
        "original_filename": clean_filename,
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "ttl_seconds": config.TOKEN_TTL_SECONDS,
        "status": "analyzed",
        "verified": False,
        "method": "lossless",
        "downloaded": False,
    }

    state_file = token_dir / "state.json"
    with open(state_file, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

    try:
        os.chmod(state_file, 0o600)
    except Exception:
        pass

    return token_dir, state


def save_cleaned_image(token: str, cleaned_bytes: bytes, filename: str = None) -> Path:
    """
    Save sanitized output file atomically per PRD FR-CLEAN-06.
    Writes cleaned.jpg and <filename>_clean.jpg inside tmp/<token>/.
    """
    token_dir = get_token_dir(token)
    if not token_dir.exists():
        raise TokenNotFoundError("Session directory not found.")

    cleaned_file = token_dir / "cleaned.jpg"
    temp_file = token_dir / "cleaned.tmp"

    with open(temp_file, "wb") as f:
        f.write(cleaned_bytes)

    os.replace(temp_file, cleaned_file)

    try:
        os.chmod(cleaned_file, 0o600)
    except Exception:
        pass

    # Also save as <filename>_clean.jpg per prompt specification
    if filename:
        clean_stem = Path(filename).stem or "image"
        clean_named_file = token_dir / f"{clean_stem}_clean.jpg"
        try:
            with open(clean_named_file, "wb") as f:
                f.write(cleaned_bytes)
            os.chmod(clean_named_file, 0o600)
        except Exception:
            pass

    return cleaned_file


def update_session_state(token: str, updates: dict) -> dict:
    """Update fields in session state.json atomically."""
    token_dir = get_token_dir(token)
    state_file = token_dir / "state.json"

    if not token_dir.exists() or not state_file.exists():
        raise TokenNotFoundError("Session token not found or already consumed.")

    with open(state_file, "r", encoding="utf-8") as f:
        state = json.load(f)

    state.update(updates)

    temp_state_file = token_dir / "state.tmp"
    with open(temp_state_file, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

    os.replace(temp_state_file, state_file)

    try:
        os.chmod(state_file, 0o600)
    except Exception:
        pass

    return state


def get_session(token: str) -> dict:
    """Retrieve session state; purges and raises if expired."""
    token_dir = get_token_dir(token)
    state_file = token_dir / "state.json"

    if not token_dir.exists() or not state_file.exists():
        raise TokenNotFoundError("Session token not found or already consumed.")

    try:
        with open(state_file, "r", encoding="utf-8") as f:
            state = json.load(f)
    except Exception:
        raise TokenNotFoundError("Unable to read session state.")

    # Check expiration
    expires_at_str = state.get("expires_at")
    if expires_at_str:
        expires_at = datetime.fromisoformat(expires_at_str)
        if datetime.now(timezone.utc) > expires_at:
            delete_session(token)
            raise TokenExpiredError("Session token has expired. Files have been purged.")

    return state


def delete_session(token: str) -> bool:
    """Explicitly purge session files and directory."""
    try:
        token_dir = get_token_dir(token)
        if token_dir.exists():
            shutil.rmtree(token_dir, ignore_errors=True)
            return True
    except Exception:
        pass
    return False


def count_active_sessions() -> int:
    """Count number of active session directories in TMP_ROOT."""
    if not config.TMP_ROOT.exists():
        return 0
    try:
        return sum(1 for item in config.TMP_ROOT.iterdir() if item.is_dir() and validate_token(item.name))
    except Exception:
        return 0
