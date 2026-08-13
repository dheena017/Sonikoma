"""
backend/app/core/utils/id_utils.py
─────────────────────────────────────────────────────────────────────────────
Standardized Project ID and UUID generator utilities.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import uuid


def generate_project_id() -> str:
    """
    Format: proj_${Date.now()}_${uuid_part}
    Guarantees uniqueness and preserves chronological sortability.
    """
    timestamp = int(time.time() * 1000)
    uuid_part = str(uuid.uuid4()).split('-')[0]
    return f"proj_{timestamp}_{uuid_part}"


def generate_uuid() -> str:
    """Returns a standard string representation of UUIDv4."""
    return str(uuid.uuid4())
