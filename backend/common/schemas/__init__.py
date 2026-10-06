"""
backend/common/schemas/__init__.py
─────────────────────────────────────────────────────────────────────────────
Common Pydantic schemas package index.
─────────────────────────────────────────────────────────────────────────────
"""

from .base import (
    StandardMessageResponse,
    SuccessResponse,
    ErrorResponse,
    StatusResponse,
    KeyValuePair,
)
from .pagination import (
    PaginationParams,
    PageMetadata,
    PaginatedResponse,
)

__all__ = [
    "StandardMessageResponse",
    "SuccessResponse",
    "ErrorResponse",
    "StatusResponse",
    "KeyValuePair",
    "PaginationParams",
    "PageMetadata",
    "PaginatedResponse",
]
