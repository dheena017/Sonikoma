"""
backend/app/schemas/auth.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for authentication, profile, billing, and admin operations.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional, Any


# =============================================================================
# 1. User Authentication & Profile
# =============================================================================

class UserRegister(BaseModel):
    """Registration payload (email, password, name)."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Authentication credentials and persistent session flags."""
    email: EmailStr
    password: str
    rememberMe: Optional[bool] = False


class Token(BaseModel):
    """Bearer token response schema."""
    access_token: str
    token_type: str
    user: dict


class ForgotPasswordRequest(BaseModel):
    """Password reset initiation request."""
    email: EmailStr


class PasswordUpdate(BaseModel):
    """Current and new password modification payload."""
    current_password: str
    new_password: str


class ProfileUpdate(BaseModel):
    """User profile parameters (avatar, bio, role, social links)."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    creator_role: Optional[str] = None
    bio: Optional[str] = None
    newsletter: Optional[bool] = None
    language: Optional[str] = None
    portfolio_links: Optional[List[str]] = None
    social_connections: Optional[Dict[str, bool]] = None
    preferences: Optional[Dict[str, Any]] = None


class MfaUpdate(BaseModel):
    """Multi-factor authentication toggle."""
    mfa_enabled: bool


# =============================================================================
# 2. Billing, Credits & API Keys
# =============================================================================

class ApiKeyCreate(BaseModel):
    """Generates a new developer API key."""
    name: str


class RedeemPointsRequest(BaseModel):
    """Points redemption payload."""
    points: int
    reward_type: str
    reward_value: str


class SaveCardRequest(BaseModel):
    """Billing card details schema."""
    cardHolder: str
    cardNo: str
    cardExpiry: str
    cardCvv: str


class PurchaseCreditsRequest(BaseModel):
    """Credit purchase transaction schema."""
    credits: int
    amount: float


# =============================================================================
# 3. Admin Operations
# =============================================================================

class AdminUpdateUser(BaseModel):
    """Admin-level user modifications (role, lock status, credits)."""
    creator_role: Optional[str] = None
    credits: Optional[int] = None
    is_locked: Optional[bool] = None
    reason: Optional[str] = None


class AdminAddCreditsRequest(BaseModel):
    """Manual credit allocation."""
    amount: int
    reason: Optional[str] = "Manual admin credit grant"


class AdminBulkAction(BaseModel):
    """Performs bulk user actions (role changes, credit grants, deletions)."""
    user_ids: List[str]
    action: str  # 'add_credits', 'set_role', 'delete'
    value: Optional[str] = None


class AdminUpdateSettings(BaseModel):
    """Updates global application configuration settings."""
    settings: Dict[str, str]


class AdminUpdateProject(BaseModel):
    """Admin overrides for project statuses and flags."""
    status: Optional[str] = None
    title: Optional[str] = None
    is_flagged: Optional[int] = None
    reason: Optional[str] = None


class AnnouncementCreateRequest(BaseModel):
    """System-wide announcement creation."""
    title: str
    message: str
    type: Optional[str] = "info"
