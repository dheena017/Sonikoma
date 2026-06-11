"""
backend/python/utils/id_utils.py
─────────────────────────────────────────────────────────────────────────────
Standardized Project ID generator.
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
