"""
backend/common/utils/id_generator.py
─────────────────────────────────────────────────────────────────────────────
Deterministic and cryptographic identifier generation utilities.
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import time
import secrets


def generate_uuid() -> str:
    """Generates a standard 36-character UUIDv4 string."""
    return str(uuid.uuid4())


def generate_short_id(length: int = 8) -> str:
    """Generates a URL-safe, compact hex string identifier."""
    return secrets.token_hex(length // 2)


def generate_project_id(prefix: str = "proj") -> str:
    """
    Generates a unique project identifier prefixed with timestamp and random entropy.
    Format: 'proj_<timestamp_hex>_<random_hex>'
    """
    ts = hex(int(time.time()))[2:]
    rnd = secrets.token_hex(4)
    if prefix:
        return f"{prefix}_{ts}_{rnd}"
    return f"{ts}_{rnd}"


def generate_timestamp_id(prefix: str = "") -> str:
    """Generates an ID based on millisecond timestamp + random suffix."""
    ms = int(time.time() * 1000)
    rnd = secrets.token_hex(3)
    if prefix:
        return f"{prefix}_{ms}_{rnd}"
    return f"{ms}_{rnd}"


__all__ = [
    "generate_uuid",
    "generate_short_id",
    "generate_project_id",
    "generate_timestamp_id",
]
