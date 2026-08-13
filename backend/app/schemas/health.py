"""
backend/app/schemas/health.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for system health, status, and logging.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel


# =============================================================================
# 1. System & Health
# =============================================================================

class CustomLogPayload(BaseModel):
    """Client-side custom logging payload."""
    message: str
    level: str = "info"
