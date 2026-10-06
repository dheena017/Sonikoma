"""
backend/features/profile/__init__.py
─────────────────────────────────────────────────────────────────────────────
Profile Feature Module:
Exports canonical router, services, and Pydantic schemas for creator profile,
avatar assets, workspace preferences, credit balance, and developer API keys.
─────────────────────────────────────────────────────────────────────────────
"""

from .router import (
    router,
    profile_router,
    profile_details_router,
    avatar_router,
    preferences_router,
    api_keys_router,
)
from .services import (
    get_creator_analytics,
    get_user_achievements_and_points,
    get_available_credits,
    record_credit_transaction,
    check_credits,
    deduct_credits,
    get_credit_transactions,
    LowCreditBalanceError,
)
from .schemas import (
    PortfolioLink,
    ProfileUpdate,
    MfaUpdate,
    UserProfileResponse,
    UserPreferences,
    StandardMessageResponse,
    ClaimDailyCreditsResponse,
    CreditsBalanceResponse,
    RedeemPointsRequest,
    SaveCardRequest,
    PurchaseCreditsRequest,
    ApiKeyCreate,
    ApiKeyResponse,
)
from . import services

__all__ = [
    # Routers
    "router",
    "profile_router",
    "profile_details_router",
    "avatar_router",
    "preferences_router",
    "api_keys_router",
    # Services
    "get_creator_analytics",
    "get_user_achievements_and_points",
    "get_available_credits",
    "record_credit_transaction",
    "check_credits",
    "deduct_credits",
    "get_credit_transactions",
    "LowCreditBalanceError",
    "services",
    # Schemas
    "PortfolioLink",
    "ProfileUpdate",
    "MfaUpdate",
    "UserProfileResponse",
    "UserPreferences",
    "StandardMessageResponse",
    "ClaimDailyCreditsResponse",
    "CreditsBalanceResponse",
    "RedeemPointsRequest",
    "SaveCardRequest",
    "PurchaseCreditsRequest",
    "ApiKeyCreate",
    "ApiKeyResponse",
]
