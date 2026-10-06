"""
backend/features/admin/finance/router.py
─────────────────────────────────────────────────────────────────────────────
Admin Finance & Billing Router:
- Dynamic credit transaction ledger with real balance statistics
- Platform user invoices, payment status, and revenue breakdown
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies.auth import get_admin_user
from features.admin.services import admin_finance_service

logger = logging.getLogger("sonikoma.admin.finance")
router = APIRouter()


@router.get('/admin/credits/transactions', summary="Get admin credit transactions ledger with real stats")
async def admin_get_credit_transactions(
    user_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    filter_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user)
):
    """Retrieves dynamic credit transaction ledger records from the database."""
    try:
        return admin_finance_service.get_credit_transactions(
            user_id=user_id,
            search=search,
            filter_type=filter_type,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        logger.error(f"Failed to fetch credit transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/admin/finance/invoices', summary="Get admin finance ledger and real revenue metrics")
async def admin_get_finance_invoices(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user)
):
    """Retrieves dynamic billing invoices from the database."""
    try:
        return admin_finance_service.get_finance_invoices(status=status, limit=limit, offset=offset)
    except Exception as e:
        logger.error(f"Failed to fetch finance invoices: {e}")
        raise HTTPException(status_code=500, detail=str(e))
