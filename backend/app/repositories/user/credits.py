"""
backend/app/repositories/user/credits.py
─────────────────────────────────────────────────────────────────────────────
Credits and transaction history operations.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any

from services.user.credit_service import (
    LowCreditBalanceError,
    check_credits,
    deduct_credits,
    get_available_credits,
    get_credit_transactions,
    record_credit_transaction,
)

logger = logging.getLogger("sonikoma.repositories.user.credits")

__all__ = [
    "LowCreditBalanceError",
    "get_available_credits",
    "record_credit_transaction",
    "check_credits",
    "deduct_credits",
    "get_credit_transactions",
]
