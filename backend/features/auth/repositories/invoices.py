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
        rows = conn.execute("SELECT * FROM profile_invoices WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def create_user_invoice(user_id: str, amount: float, status: str) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        suffix = user_id.split('_')[-1] if '_' in user_id else user_id
        invoice_id = f"INV-2026-{random.randint(100, 999)}-{suffix}"
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        conn.execute("""
            INSERT INTO profile_invoices (invoice_id, user_id, amount, status, created_at)
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
