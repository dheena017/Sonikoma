"""
backend/features/admin/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for superuser admin console, settings, user management,
telemetry, scraping rules, and financial ledger audits.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# 1. User Management Schemas
# ─────────────────────────────────────────────────────────────────────────────

class AdminUpdateUser(BaseModel):
    """Admin-level user modifications (role, lock status, credits)."""
    creator_role: Optional[str] = None
    credits: Optional[int] = None
    is_locked: Optional[bool] = None
    reason: Optional[str] = None


class AdminAddCreditsRequest(BaseModel):
    """Manual credit allocation for a specific user."""
    amount: int
    reason: Optional[str] = "Manual admin credit grant"


class AdminBulkAction(BaseModel):
    """Performs bulk user actions (role changes, credit grants, deletions)."""
    user_ids: List[str]
    action: str  # 'add_credits', 'set_role', 'delete'
    value: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# 2. Platform Settings & Announcements Schemas
# ─────────────────────────────────────────────────────────────────────────────

class AdminUpdateSettings(BaseModel):
    """Updates global application configuration settings."""
    settings: Dict[str, str]


class AnnouncementCreateRequest(BaseModel):
    """System-wide announcement creation."""
    title: str
    message: str
    type: Optional[str] = "info"


# ─────────────────────────────────────────────────────────────────────────────
# 3. Project & Content Moderation Schemas
# ─────────────────────────────────────────────────────────────────────────────

class AdminUpdateProject(BaseModel):
    """Admin overrides for project statuses and flags."""
    status: Optional[str] = None
    title: Optional[str] = None
    is_flagged: Optional[int] = None
    reason: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# 4. Standard Responses
# ─────────────────────────────────────────────────────────────────────────────

class AdminStandardResponse(BaseModel):
    success: bool
    message: Optional[str] = None


class AdminUserListResponse(BaseModel):
    success: bool
    total: int
    users: List[Dict[str, Any]]


class AdminProjectListResponse(BaseModel):
    success: bool
    total: int
    projects: List[Dict[str, Any]]


class AdminFinanceLedgerResponse(BaseModel):
    success: bool
    total: int
    transactions: List[Dict[str, Any]]
    stats: Dict[str, Any]
