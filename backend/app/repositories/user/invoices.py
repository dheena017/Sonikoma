"""
backend/app/repositories/user/invoices.py
─────────────────────────────────────────────────────────────────────────────
User billing and invoice records.
─────────────────────────────────────────────────────────────────────────────
"""

import random
from datetime import datetime
from typing import List, Dict, Any

from database.engine import get_db_connection


def get_user_invoices(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM user_invoices WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def seed_default_invoices_if_empty(user_id: str) -> None:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as c FROM user_invoices WHERE user_id = ?", (user_id,))
        count = cursor.fetchone()[0]
        if count == 0:
            suffix = user_id.split('_')[-1] if '_' in user_id else user_id
            invoices = [
                (f"INV-2026-004-{suffix}", 19.00, "Paid", "2026-06-15 14:30:00"),
                (f"INV-2026-003-{suffix}", 19.00, "Paid", "2026-05-15 10:15:00"),
                (f"INV-2026-002-{suffix}", 19.00, "Paid", "2026-04-15 11:20:00")
            ]
            for inv_id, amt, stat, dt in invoices:
                conn.execute("""
                    INSERT INTO user_invoices (invoice_id, user_id, amount, status, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (inv_id, user_id, amt, stat, dt))
            conn.commit()
    finally:
        conn.close()


def create_user_invoice(user_id: str, amount: float, status: str) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        suffix = user_id.split('_')[-1] if '_' in user_id else user_id
        invoice_id = f"INV-2026-{random.randint(100, 999)}-{suffix}"
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        conn.execute("""
            INSERT INTO user_invoices (invoice_id, user_id, amount, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (invoice_id, user_id, amount, status, created_at))
        conn.commit()
        return {
            "invoice_id": invoice_id,
            "user_id": user_id,
            "amount": amount,
            "status": status,
            "created_at": created_at
        }
    finally:
        conn.close()
