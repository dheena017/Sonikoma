"""
backend/common/schemas/pagination.py
─────────────────────────────────────────────────────────────────────────────
Pagination parameters, metadata, and generic paginated responses.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Generic, TypeVar, Optional
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Common pagination query parameters."""
    page: int = Field(1, ge=1, description="1-indexed page number")
    limit: int = Field(20, ge=1, le=500, description="Items per page")
    offset: int = Field(0, ge=0, description="Zero-indexed item offset")


class PageMetadata(BaseModel):
    """Pagination status indicators."""
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic envelope for paginated collection endpoints."""
    success: bool = True
    items: List[T]
    total: int
    page: int
    limit: int
    total_pages: Optional[int] = None


__all__ = [
    "PaginationParams",
    "PageMetadata",
    "PaginatedResponse",
]
