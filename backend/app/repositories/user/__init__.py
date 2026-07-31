"""User repository package."""

from .api_keys import get_user_by_api_key, get_user_api_keys, create_user_api_key, delete_user_api_key
from .queries import get_user_by_id, get_user_by_email, get_all_users
from .session import create_user_session, write_audit_log, get_user_sessions, terminate_user_session, get_audit_logs
from .commands import create_user, update_user, delete_user, create_user_relational
from .invoices import get_user_invoices, seed_default_invoices_if_empty, create_user_invoice
from .profile import get_user_achievements_and_points, get_creator_analytics
from .credits import get_available_credits, record_credit_transaction, get_credit_transactions

__all__ = [
    "get_user_by_api_key", "get_user_by_id", "get_user_by_email", "get_all_users",
    "create_user_session", "write_audit_log", "create_user", "create_user_relational",
    "update_user", "get_user_sessions", "terminate_user_session",
    "get_user_invoices", "seed_default_invoices_if_empty",
    "get_user_achievements_and_points", "delete_user", "get_audit_logs",
    "get_creator_analytics", "get_user_api_keys", "create_user_api_key",
    "delete_user_api_key", "get_available_credits", "record_credit_transaction",
    "get_credit_transactions", "create_user_invoice"
]
