"""
backend/features/admin/services/finance_service.py
─────────────────────────────────────────────────────────────────────────────
Admin Finance & Revenue Service:
- Credit transactions ledger, additions, deductions
- User invoices inspection and revenue calculation
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, Dict, Any

from database.engine import get_db_connection

logger = logging.getLogger("sonikoma.admin.finance_service")


class AdminFinanceService:
    """Specialized service for administrative financial ledgers and metrics."""

    def get_credit_transactions(
        self,
        user_id: Optional[str] = None,
        search: Optional[str] = None,
        filter_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        conn = get_db_connection()
        try:
            query = """
                SELECT ct.*, u.email as user_email, u.username as creator_username
                FROM profile_credit_transactions ct
                LEFT JOIN auth_users u ON ct.user_id = u.id
                WHERE 1=1
            """
            params = []
            if user_id:
                query += " AND ct.user_id = ?"
                params.append(user_id)
            if filter_type == "additions":
                query += " AND ct.amount > 0"
            elif filter_type == "deductions":
                query += " AND ct.amount < 0"
            if search:
                query += " AND (u.email LIKE ? OR ct.feature_name LIKE ? OR ct.user_id LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

            query += " ORDER BY ct.created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            rows = conn.execute(query, tuple(params)).fetchall()
            transactions = [dict(r) for r in rows]

            stat_row = conn.execute("""
                SELECT 
                    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_added,
                    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_deducted,
                    COUNT(*) as total_count
                FROM profile_credit_transactions
            """).fetchone()

            stats = {
                "total_transactions": stat_row["total_count"] if stat_row else 0,
                "total_added": stat_row["total_added"] or 0 if stat_row else 0,
                "total_deducted": stat_row["total_deducted"] or 0 if stat_row else 0,
            }

            return {"success": True, "total": len(transactions), "transactions": transactions, "stats": stats}
        finally:
            conn.close()

    def get_finance_invoices(
        self,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        conn = get_db_connection()
        try:
            query = """
                SELECT inv.*, u.email as user_email, u.full_name as user_full_name
                FROM profile_invoices inv
                LEFT JOIN auth_users u ON inv.user_id = u.id
                WHERE 1=1
            """
            params = []
            if status:
                query += " AND LOWER(inv.status) = LOWER(?)"
                params.append(status)

            query += " ORDER BY inv.created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            rows = conn.execute(query, tuple(params)).fetchall()
            invoices = [dict(r) for r in rows]

            rev_row = conn.execute("""
                SELECT 
                    SUM(CASE WHEN LOWER(status) = 'paid' THEN amount ELSE 0 END) as total_revenue,
                    COUNT(CASE WHEN LOWER(status) = 'paid' THEN 1 END) as paid_count,
                    COUNT(CASE WHEN LOWER(status) = 'pending' THEN 1 END) as pending_count
                FROM profile_invoices
            """).fetchone()

            summary = {
                "total_revenue": rev_row["total_revenue"] or 0.0 if rev_row else 0.0,
                "paid_count": rev_row["paid_count"] if rev_row else 0,
                "pending_count": rev_row["pending_count"] if rev_row else 0,
            }

            return {"success": True, "total": len(invoices), "invoices": invoices, "summary": summary}
        finally:
            conn.close()


admin_finance_service = AdminFinanceService()
