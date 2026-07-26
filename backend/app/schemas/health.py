"""
backend/app/schemas/health.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for health.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel

class CustomLogPayload(BaseModel):
    message: str
    level: str = "info"

