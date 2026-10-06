"""
backend/features/profile/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for creator profile, avatar, preferences, and developer API keys.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# 1. Profile & Portfolio Schemas
# ─────────────────────────────────────────────────────────────────────────────

class PortfolioLink(BaseModel):
    """A creator portfolio entry shown on the public profile."""
    id: Optional[str] = None
    site: str
    url: str


class ProfileUpdate(BaseModel):
    """User profile parameters (avatar, bio, role, social links, preferences)."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    creator_role: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    timezone: Optional[str] = None
    newsletter: Optional[bool] = None
    language: Optional[str] = None
    portfolio_links: Optional[List[PortfolioLink]] = None
    social_connections: Optional[Dict[str, bool]] = None
    preferences: Optional[Dict[str, Any]] = None


class MfaUpdate(BaseModel):
    """Multi-factor authentication toggle payload."""
    mfa_enabled: bool


class UserProfileResponse(BaseModel):
    """Detailed authenticated user profile response."""
    user_id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    creator_role: Optional[str] = "creator"
    bio: Optional[str] = ""
    location: Optional[str] = ""
    website: Optional[str] = ""
    timezone: Optional[str] = "UTC"
    newsletter: Optional[bool] = False
    language: Optional[str] = "en"
    portfolio_links: Optional[List[PortfolioLink]] = []
    credits: Optional[int] = 0
    unlocked_rewards: Optional[List[str]] = []
    mfa_enabled: Optional[bool] = False
    social_connections: Optional[Dict[str, bool]] = None
    has_claimed_today: Optional[bool] = False
    streak_days: Optional[int] = 1
    subscription_tier: Optional[str] = "free"
    preferences: Optional[Dict[str, Any]] = None
    unlocked_achievements: Optional[List[str]] = []
    achievement_points: Optional[int] = 0


# ─────────────────────────────────────────────────────────────────────────────
# 2. Preferences & User Settings
# ─────────────────────────────────────────────────────────────────────────────

class UserPreferences(BaseModel):
    """User workspace UI and editor preferences."""
    theme_mode: Optional[str] = "dark"
    auto_save_interval: Optional[int] = 30
    preferred_voice_model: Optional[str] = "kokoro"
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Credits, Gamification & Billing
# ─────────────────────────────────────────────────────────────────────────────

class StandardMessageResponse(BaseModel):
    """Standard success/message response."""
    success: bool
    message: str


class ClaimDailyCreditsResponse(BaseModel):
    """Daily bonus claim transaction response."""
    success: bool
    message: str
    new_balance: Optional[int] = None
    streak_days: Optional[int] = 1


class CreditsBalanceResponse(BaseModel):
    """User credit balance response schema."""
    success: bool
    credits: int
    low_balance: bool = False
    threshold: int = 20


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


# ─────────────────────────────────────────────────────────────────────────────
# 4. Developer API Keys
# ─────────────────────────────────────────────────────────────────────────────

class ApiKeyCreate(BaseModel):
    """Payload to generate a new developer API key."""
    name: str = Field(..., description="Descriptive name/label for the API key")
    scopes: Optional[List[str]] = Field(default_factory=lambda: ["read", "write"])


class ApiKeyResponse(BaseModel):
    """Response payload returning active API key metadata."""
    id: str
    key_prefix: str
    label: str
    created_at: str
    last_used_at: Optional[str] = None


__all__ = [
    # Profile & Portfolio
    "PortfolioLink",
    "ProfileUpdate",
    "MfaUpdate",
    "UserProfileResponse",
    # Preferences & Settings
    "UserPreferences",
    # Credits & Billing
    "StandardMessageResponse",
    "ClaimDailyCreditsResponse",
    "CreditsBalanceResponse",
    "RedeemPointsRequest",
    "SaveCardRequest",
    "PurchaseCreditsRequest",
    # API Keys
    "ApiKeyCreate",
    "ApiKeyResponse",
]
