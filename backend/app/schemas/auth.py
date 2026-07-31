"""
backend/app/schemas/auth.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for auth.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    rememberMe: Optional[bool] = False


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class AdminUpdateUser(BaseModel):
    creator_role: Optional[str] = None
    credits: Optional[int] = None
    is_locked: Optional[bool] = None
    reason: Optional[str] = None


class AdminAddCreditsRequest(BaseModel):
    amount: int
    reason: Optional[str] = "Manual admin credit grant"


class AdminBulkAction(BaseModel):
    user_ids: list[str]
    action: str  # 'add_credits', 'set_role', 'delete'
    value: Optional[str] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    creator_role: Optional[str] = None
    bio: Optional[str] = None
    newsletter: Optional[bool] = None
    language: Optional[str] = None
    portfolio_links: Optional[list[str]] = None
    social_connections: Optional[dict[str, bool]] = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class RedeemPointsRequest(BaseModel):
    points: int
    reward_type: str
    reward_value: str


class MfaUpdate(BaseModel):
    mfa_enabled: bool


class ApiKeyCreate(BaseModel):
    name: str


class SaveCardRequest(BaseModel):
    cardHolder: str
    cardNo: str
    cardExpiry: str
    cardCvv: str


class PurchaseCreditsRequest(BaseModel):
    credits: int
    amount: float


class AdminUpdateSettings(BaseModel):
    settings: dict[str, str]


class AdminUpdateProject(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    is_flagged: Optional[int] = None
    reason: Optional[str] = None


class AnnouncementCreateRequest(BaseModel):
    title: str
    message: str
    type: Optional[str] = 'info'

