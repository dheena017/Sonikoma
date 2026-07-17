"""
backend/app/repositories/user/__init__.py
─────────────────────────────────────────────────────────────────────────────
Public interface for user repository package.
─────────────────────────────────────────────────────────────────────────────
"""

from repositories.user.queries import (
    get_user_by_email,
    get_user_by_id,
    get_all_users,
)
from repositories.user.commands import (
    create_user,
    update_user,
    delete_user,
    create_user_relational,
)
from repositories.user.credits import (
    LowCreditBalanceError,
    get_available_credits,
    record_credit_transaction,
    check_credits,
    deduct_credits,
    get_credit_transactions,
)
from repositories.user.session import (
    create_user_session,
    get_user_sessions,
    terminate_user_session,
    write_audit_log,
    get_audit_logs,
)
from repositories.user.profile import (
    get_creator_analytics,
    get_user_achievements_and_points,
)
from repositories.user.invoices import (
    get_user_invoices,
    seed_default_invoices_if_empty,
    create_user_invoice,
)
from repositories.user.api_keys import (
    get_user_api_keys,
    get_user_by_api_key,
    create_user_api_key,
    delete_user_api_key,
)

__all__ = [
    "LowCreditBalanceError",
    "create_user",
    "get_user_by_email",
    "get_user_by_id",
    "get_all_users",
    "update_user",
    "get_available_credits",
    "record_credit_transaction",
    "check_credits",
    "deduct_credits",
    "delete_user",
    "create_user_session",
    "get_user_sessions",
    "terminate_user_session",
    "write_audit_log",
    "get_audit_logs",
    "get_creator_analytics",
    "get_user_achievements_and_points",
    "get_user_invoices",
    "get_credit_transactions",
    "seed_default_invoices_if_empty",
    "create_user_invoice",
    "get_user_api_keys",
    "get_user_by_api_key",
    "create_user_api_key",
    "delete_user_api_key",
    "create_user_relational",
]
