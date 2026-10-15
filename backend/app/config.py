import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
base_dir = Path(__file__).resolve().parent.parent
dotenv_path = base_dir / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path)


class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    IS_PRODUCTION = FLASK_ENV.lower() == "production"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-32bytes-min")

    # CORS allow-list
    cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    CORS_ORIGINS = [origin.strip() for origin in cors_raw.split(",") if origin.strip()]

    # Limits
    MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", 10 * 1024 * 1024))  # 10 MB
    MAX_MEGAPIXELS = int(os.getenv("MAX_MEGAPIXELS", 50))                    # 50 MP
    TOKEN_TTL_SECONDS = int(os.getenv("TOKEN_TTL_SECONDS", 600))             # 10 min
    JANITOR_INTERVAL_SECONDS = int(os.getenv("JANITOR_INTERVAL_SECONDS", 30))
    RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", 30))
    MAX_LIVE_SESSIONS = int(os.getenv("MAX_LIVE_SESSIONS", 200))

    # Storage
    tmp_root_env = os.getenv("TMP_ROOT", "./tmp")
    if os.path.isabs(tmp_root_env):
        TMP_ROOT = Path(tmp_root_env)
    else:
        TMP_ROOT = (base_dir / tmp_root_env).resolve()


config = Config()
