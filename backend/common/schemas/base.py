"""
backend/common/schemas/base.py
─────────────────────────────────────────────────────────────────────────────
Standard base responses, error schemas, and key-value schemas.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class StandardMessageResponse(BaseModel):
    """Universal success message response payload."""
    success: bool = True
    message: str


class SuccessResponse(BaseModel):
    """Generic success flag with optional data and message."""
    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standard error response structure."""
    success: bool = False
    detail: str
    error_code: Optional[str] = None


class StatusResponse(BaseModel):
    """Status reporting response."""
    status: str
    success: bool = True
    timestamp: Optional[str] = None


class KeyValuePair(BaseModel):
    """Generic key-value container."""
    key: str
    value: Any


__all__ = [
    "StandardMessageResponse",
    "SuccessResponse",
    "ErrorResponse",
    "StatusResponse",
    "KeyValuePair",
]
