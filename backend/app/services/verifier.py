"""
Verifier module alias mapping to verification.py per PRD Section 5.6.3.
"""
from app.services.verification import (
    verify_cleaned_image,
    FORBIDDEN_RAW_PATTERNS,
)

__all__ = ["verify_cleaned_image", "FORBIDDEN_RAW_PATTERNS"]
