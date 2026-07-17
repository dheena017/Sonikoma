"""
backend/app/repositories/user/credits.py
─────────────────────────────────────────────────────────────────────────────
Credits and transaction history operations.
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import logging
from typing import List, Dict, Any

from database.connection import get_db_connection, _is_postgres

logger = logging.getLogger("sonikoma.repositories.user.credits")


class LowCreditBalanceError(ValueError):
    """Raised when credit balance falls below LOW_BALANCE_THRESHOLD."""
    def __init__(self, message, balance):
        super().__init__(message)
        self.balance = balance


def get_available_credits(user_id: str) -> int:
    """
    Return the current credit balance for a user.
    Reads from credit_balance first; falls back to credits for legacy rows.
    """
    conn = get_db_connection()
    try:
        row = conn.execute(
            'SELECT credits, credit_balance FROM users WHERE id = ?', (user_id,)
        ).fetchone()
        if row is None:
            return 0
        bal = row['credit_balance'] if row['credit_balance'] is not None else row['credits']
        return bal if bal is not None else 840
    except Exception:
        try:
            row = conn.execute('SELECT credits FROM users WHERE id = ?', (user_id,)).fetchone()
            return (row['credits'] if row and row['credits'] is not None else 840)
        except Exception:
            return 0
    finally:
        conn.close()


def record_credit_transaction(user_id: str, amount: int, feature_name: str) -> int:
    """
    Record a credit change (positive = addition, negative = deduction).
    """
    conn = get_db_connection()
    try:
        # Write lock
        if not _is_postgres:
            try:
                conn.execute("BEGIN IMMEDIATE")
            except Exception:
                pass  # already in a transaction

        query = 'SELECT credits, credit_balance, creator_role FROM users WHERE id = ?'
        if _is_postgres:
            query += ' FOR UPDATE'

        row = conn.execute(query, (user_id,)).fetchone()
        if row is None:
            raise ValueError("User not found")

        is_admin = row['creator_role'] == 'admin'

        try:
            current = row['credit_balance'] if row['credit_balance'] is not None else row['credits']
        except Exception:
            current = row['credits']
        current = current if current is not None else 840

        # Balance validation
        if amount < 0 and current < abs(amount) and not is_admin:
            raise ValueError(
                f"Insufficient credits: need {abs(amount)}, have {current}"
            )

        new_balance = current + amount

        # Balance update
        try:
            conn.execute(
                "UPDATE users SET credits = ?, credit_balance = ?, updated_at = datetime('now') WHERE id = ?",
                (new_balance, new_balance, user_id)
            )
        except Exception:
            conn.execute(
                "UPDATE users SET credits = ?, updated_at = datetime('now') WHERE id = ?",
                (new_balance, user_id)
            )

        tx_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO credit_transactions (id, user_id, amount, feature_name) VALUES (?, ?, ?, ?)",
            (tx_id, user_id, amount, feature_name)
        )

        conn.commit()
        logger.debug(
            f"[Credits] user={user_id} amount={amount:+d} "
            f"feature={feature_name} new_balance={new_balance}"
        )
        return new_balance
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        conn.close()


def check_credits(user_id: str) -> int:
    """Alias for get_available_credits for backward compatibility."""
    return get_available_credits(user_id)


def deduct_credits(user_id: str, amount: int) -> int:
    """
    Atomically deduct credits. Backward-compatible wrapper around
    record_credit_transaction.
    """
    return record_credit_transaction(user_id, -amount, "deduction")


def get_credit_transactions(user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Return up to `limit` credit transactions for user, newest first.
    Each row is enriched with a `balance_after` field representing the
    running account balance immediately after that transaction was applied.
    """
    conn = get_db_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit)
        ).fetchall()
        txs = [dict(r) for r in rows]

        current_balance = get_available_credits(user_id)
        for tx in txs:
            tx["balance_after"] = current_balance
            current_balance -= tx["amount"]

        return txs
    finally:
        conn.close()
