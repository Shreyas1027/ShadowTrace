import os
import json
import time
import shutil
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from app.config import config
from app.services.storage import validate_token

logger = logging.getLogger(__name__)

_janitor_started = False
_janitor_lock = threading.Lock()


def purge_expired_sessions():
    """Sweep TMP_ROOT for expired or corrupted session directories."""
    tmp_root = config.TMP_ROOT
    if not tmp_root.exists():
        return

    now = datetime.now(timezone.utc)
    for token_dir in list(tmp_root.iterdir()):
        if not token_dir.is_dir():
            continue
        token = token_dir.name
        if not validate_token(token):
            continue

        state_file = token_dir / "state.json"
        should_delete = False

        if not state_file.exists():
            # Directory with no state file older than 60s
            try:
                mtime = os.path.getmtime(token_dir)
                if time.time() - mtime > 60:
                    should_delete = True
            except Exception:
                pass
        else:
            try:
                with open(state_file, "r", encoding="utf-8") as f:
                    state = json.load(f)
                expires_at_str = state.get("expires_at")
                if expires_at_str:
                    expires_at = datetime.fromisoformat(expires_at_str)
                    if now > expires_at:
                        should_delete = True
            except Exception:
                should_delete = True

        if should_delete:
            try:
                shutil.rmtree(token_dir, ignore_errors=True)
                logger.info(f"Janitor purged expired session {token[:6]}...")
            except Exception as e:
                logger.warning(f"Janitor failed to purge {token[:6]}...: {e}")


def purge_all_sessions():
    """Boot-time purge of all pre-existing ephemeral directories per PRD FR-DL-04."""
    tmp_root = config.TMP_ROOT
    if not tmp_root.exists():
        return

    for token_dir in list(tmp_root.iterdir()):
        if token_dir.is_dir() and validate_token(token_dir.name):
            try:
                shutil.rmtree(token_dir, ignore_errors=True)
            except Exception:
                pass


def _janitor_loop():
    """Continuous background janitor sweep loop."""
    interval = config.JANITOR_INTERVAL_SECONDS
    while True:
        try:
            purge_expired_sessions()
        except Exception as e:
            logger.error(f"Janitor loop error: {e}")
        time.sleep(interval)


def start_janitor(app=None):
    """Start background janitor thread once per process."""
    global _janitor_started
    with _janitor_lock:
        if _janitor_started:
            return

        # Do not start loop during unit testing runs unless explicitly configured
        if app and app.config.get("TESTING"):
            return

        # Boot-time purge of existing sessions
        try:
            purge_all_sessions()
        except Exception:
            pass

        janitor_thread = threading.Thread(target=_janitor_loop, daemon=True, name="ShadowTrace-Janitor")
        janitor_thread.start()
        _janitor_started = True
        logger.info("Janitor background thread started.")
