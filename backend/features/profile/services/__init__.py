"""
backend/features/profile/services/__init__.py
─────────────────────────────────────────────────────────────────────────────
Profile services package exporting modular domain services:
- credit_service: credit balances, ledgers, streak claims, purchasing
- profile_service: profile metadata, sessions, invoices, audit logs, analytics, achievements
- avatar_service: image upload and external YouTube OAuth sync
- preference_service: points redemption, MFA toggling, payment cards, tier upgrades
- api_key_service: developer key lifecycle
─────────────────────────────────────────────────────────────────────────────
"""

from features.profile.services.credit_service import (
    LOW_BALANCE_THRESHOLD,
    LowCreditBalanceError,
    get_available_credits,
    record_credit_transaction,
    check_credits,
    deduct_credits,
    get_credit_transactions,
    get_credit_balance,
    claim_daily_credits,
    purchase_credits,
)
from features.profile.services.profile_service import (
    get_user_profile,
    update_user_profile,
    delete_account,
    get_user_sessions_service,
    terminate_session,
    get_user_audit_logs,
    get_user_invoices_service,
    get_creator_analytics,
    get_user_achievements_and_points,
)
from features.profile.services.avatar_service import (
    upload_avatar,
    refresh_youtube_avatar,
)
from features.profile.services.preference_service import (
    redeem_points,
    toggle_mfa,
    save_card,
    upgrade_plan,
)
from features.profile.services.api_key_service import (
    list_api_keys,
    generate_api_key,
    revoke_api_key,
)

__all__ = [
    # Credits
    "LOW_BALANCE_THRESHOLD",
    "LowCreditBalanceError",
    "get_available_credits",
    "record_credit_transaction",
    "check_credits",
    "deduct_credits",
    "get_credit_transactions",
    "get_credit_balance",
    "claim_daily_credits",
    "purchase_credits",
    # Profile & Account
    "get_user_profile",
    "update_user_profile",
    "delete_account",
    "get_user_sessions_service",
    "terminate_session",
    "get_user_audit_logs",
    "get_user_invoices_service",
    "get_creator_analytics",
    "get_user_achievements_and_points",
    # Avatar
    "upload_avatar",
    "refresh_youtube_avatar",
    # Preferences & Billing
    "redeem_points",
    "toggle_mfa",
    "save_card",
    "upgrade_plan",
    # API Keys
    "list_api_keys",
    "generate_api_key",
    "revoke_api_key",
]
