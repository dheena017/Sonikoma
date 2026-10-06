"""
backend/features/profile/router/preferences.py
─────────────────────────────────────────────────────────────────────────────
User settings, preferences, credits, billing, and gamification endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, Request

from app.core.dependencies.auth import get_current_user
from common import get_client_ip
from features.profile.schemas import (
    RedeemPointsRequest,
    MfaUpdate,
    SaveCardRequest,
    PurchaseCreditsRequest,
    CreditsBalanceResponse,
)
from features.profile.services.preference_service import (
    redeem_points,
    toggle_mfa,
    save_card,
    upgrade_plan,
)
from features.profile.services.credit_service import (
    purchase_credits,
    get_credit_balance,
    get_credit_transactions,
)
from features.profile.services.profile_service import get_creator_analytics

logger = logging.getLogger("sonikoma.features.profile.preferences")
router = APIRouter()


@router.post("/redeem-points", summary="Redeem achievement points for credits or badges")
async def redeem_points_endpoint(
    body: RedeemPointsRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return redeem_points(
        user_id=current_user["user_id"],
        current_user=current_user,
        reward_type=body.reward_type,
        reward_value=body.reward_value,
        ip_addr=ip_addr,
    )


@router.put("/mfa", summary="Toggle Two-Factor Authentication (2FA/MFA)")
async def toggle_mfa_endpoint(
    body: MfaUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return toggle_mfa(
        user_id=current_user["user_id"],
        mfa_enabled=body.mfa_enabled,
        ip_addr=ip_addr,
    )


@router.post("/save-card", summary="Save credit card payment details")
async def save_card_endpoint(
    body: SaveCardRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return save_card(
        user_id=current_user["user_id"],
        current_user=current_user,
        body=body,
        ip_addr=ip_addr,
    )


@router.post("/upgrade-plan", summary="Upgrade creator account to Studio Pro tier")
async def upgrade_plan_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return upgrade_plan(
        user_id=current_user["user_id"],
        current_user=current_user,
        ip_addr=ip_addr,
    )


@router.post("/purchase-credits", summary="Purchase additional compute credits")
async def purchase_credits_endpoint(
    body: PurchaseCreditsRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return purchase_credits(
        user_id=current_user["user_id"],
        credits=body.credits,
        amount=body.amount,
        ip_addr=ip_addr,
    )


@router.get(
    "/credits",
    response_model=CreditsBalanceResponse,
    operation_id="get_credit_balance",
    summary="Get remaining compute credit balance",
)
async def get_credits_endpoint(current_user: dict = Depends(get_current_user)):
    return get_credit_balance(current_user["user_id"])


@router.get("/transactions", summary="Get recent credit transaction history")
async def get_transactions_endpoint(
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
):
    limit = min(max(1, limit), 500)
    txs = get_credit_transactions(current_user["user_id"], limit=limit)
    return {"success": True, "transactions": txs, "count": len(txs)}


@router.get("/analytics", summary="Get creator performance analytics")
async def get_creator_analytics_endpoint(current_user: dict = Depends(get_current_user)):
    data = get_creator_analytics(current_user["user_id"])
    return {"success": True, "analytics": data}


__all__ = ["router"]
