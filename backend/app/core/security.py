"""
backend/core/security.py
─────────────────────────────────────────────────────────────────────────────
Security utility functions (password hashing, JWT verification/generation).
─────────────────────────────────────────────────────────────────────────────
"""

import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
import jwt

from app.core.config import JWT_SECRET_KEY

logger = logging.getLogger("sonikoma.core.security")

ALGORITHM = "HS256"


def _harden_jwt_secret(secret: str) -> tuple[str, bool]:
    if isinstance(secret, str) and len(secret.encode("utf-8")) >= 32:
        return secret, False

    derived = hashlib.sha256(secret.encode("utf-8")).digest()
    return derived.hex(), True


SECRET_KEY, _WAS_DERIVED = _harden_jwt_secret(JWT_SECRET_KEY)
if _WAS_DERIVED:
    logger.warning(
        "[Security] JWT_SECRET_KEY was shorter than 32 bytes; using a hardened SHA256-derived key for HS256. "
        "This removes PyJWT InsecureKeyLengthWarning."
    )

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 365  # 1 year default


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as exc:
        logger.error(f"[Security] Password verification failed: {exc}")
        return False


def get_password_hash(password: str) -> str:
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: Optional[str]) -> Optional[dict[str, Any]]:
    """Decode a JWT and return its payload, or None if invalid/expired."""
    if not token or not isinstance(token, str):
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not isinstance(payload, dict):
            return None
        return payload
    except (jwt.PyJWTError, TypeError, ValueError):
        return None


__all__ = [
    "SECRET_KEY",
    "ALGORITHM",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "decode_access_token",
]
