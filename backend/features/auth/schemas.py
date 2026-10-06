"""
backend/features/auth/schemas.py
─────────────────────────────────────────────────────────────────────────────
Canonical Pydantic request/response schemas for:
- User registration, login, and bearer tokens
- Password reset, forgot password, and credential rotation
- User profile, creator settings, MFA, and portfolio links
- Developer API keys and billing/credits operations
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, EmailStr, Field


# ─────────────────────────────────────────────────────────────────────────────
# 1. User Authentication & Session Schemas
# ─────────────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    """Registration payload (email, password, optional full name)."""
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
    token_type: str = "bearer"
    user: Dict[str, Any]


class ForgotPasswordRequest(BaseModel):
    """Password reset initiation request."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset completion request."""
    token: str
    new_password: str


class PasswordUpdate(BaseModel):
    """Current and new password modification payload."""
    current_password: str
    new_password: str


__all__ = [
    "UserRegister",
    "UserLogin",
    "Token",
    "ForgotPasswordRequest",
    "PasswordResetConfirm",
    "PasswordUpdate",
]

