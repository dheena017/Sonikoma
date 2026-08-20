"""
backend/app/api/v1/auth/preferences.py
─────────────────────────────────────────────────────────────────────────────
User settings, preferences, credits, billing, and gamification endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Request

from api.dependencies.auth import get_current_user
from database.config import LOW_BALANCE_THRESHOLD
from schemas.auth import (
    RedeemPointsRequest,
    MfaUpdate,
    SaveCardRequest,
    PurchaseCreditsRequest,
    CreditsBalanceResponse
)
from repositories.user import (
    update_user,
    get_creator_analytics,
    create_user_invoice,
    get_available_credits,
    record_credit_transaction,
    get_credit_transactions,
    write_audit_log
)

logger = logging.getLogger("sonikoma.auth.preferences")
router = APIRouter()

LOW_BALANCE_THRESHOLD = 100


@router.post("/redeem-points", summary="Redeem achievement points for credits or badges")
async def redeem_points_endpoint(body: RedeemPointsRequest, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    if body.reward_type == "credits":
        credits_to_add = int(body.reward_value)
        new_credits = record_credit_transaction(current_user["user_id"], credits_to_add, "points_redemption")

        try:
            rewards = json.loads(current_user.get("unlocked_rewards") or "[]")
        except Exception:
            rewards = []

        reward_name = f"+{credits_to_add} AI Credits"
        if reward_name not in rewards:
            rewards.append(reward_name)

        update_user(current_user["user_id"], {
            "unlocked_rewards": json.dumps(rewards)
        })
        write_audit_log(current_user["user_id"], f"Exchanged points for +{credits_to_add} compute credits", ip_addr, "Success")
        return {"success": True, "credits": new_credits, "message": f"Successfully exchanged points for +{credits_to_add} credits!"}

    elif body.reward_type == "badge":
        try:
            badges = json.loads(current_user.get("unlocked_rewards") or "[]")
        except Exception:
            badges = []
        if body.reward_value not in badges:
            badges.append(body.reward_value)
            update_user(current_user["user_id"], {"unlocked_rewards": json.dumps(badges)})
        write_audit_log(current_user["user_id"], f"Unlocked achievement badge: {body.reward_value}", ip_addr, "Success")
        return {"success": True, "badges": badges, "message": f"Badge '{body.reward_value}' unlocked!"}

    raise HTTPException(status_code=400, detail="Invalid reward type specified.")


@router.put("/mfa", summary="Toggle Two-Factor Authentication (2FA/MFA)")
async def toggle_mfa_endpoint(body: MfaUpdate, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    val = 1 if body.mfa_enabled else 0
    update_user(current_user["user_id"], {"mfa_enabled": val})

    event_name = "Activated Two-Factor Authentication (2FA)" if body.mfa_enabled else "Deactivated Two-Factor Authentication (2FA)"
    write_audit_log(current_user["user_id"], event_name, ip_addr, "Success")

    return {"success": True, "mfa_enabled": body.mfa_enabled, "message": f"2FA status set to {body.mfa_enabled}"}


@router.post("/save-card", summary="Save credit card payment details")
async def save_card_endpoint(body: SaveCardRequest, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    pref_str = current_user.get("preferences") or "{}"
    try:
        prefs = json.loads(pref_str)
    except Exception:
        prefs = {}

    prefs["card_info"] = {
        "cardHolder": body.cardHolder,
        "cardNo": body.cardNo,
        "cardExpiry": body.cardExpiry,
        "cardCvv": body.cardCvv,
        "isCardSaved": True
    }

    update_user(current_user["user_id"], {"preferences": json.dumps(prefs)})
    write_audit_log(current_user["user_id"], "Saved payment method", ip_addr, "Success")
    return {"success": True, "message": "Card details saved successfully."}


@router.post("/upgrade-plan", summary="Upgrade creator account to Studio Pro tier")
async def upgrade_plan_endpoint(request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    pref_str = current_user.get("preferences") or "{}"
    try:
        prefs = json.loads(pref_str)
    except Exception:
        prefs = {}

    if prefs.get("subscription_tier") == "pro":
        raise HTTPException(status_code=400, detail="Account is already upgraded to Studio Pro.")

    prefs["subscription_tier"] = "pro"

    current_credits = current_user.get("credits") if current_user.get("credits") is not None else 840
    new_credits = min(5000, current_credits + 1000)

    update_user(current_user["user_id"], {
        "creator_role": "pro",
        "credits": new_credits,
        "preferences": json.dumps(prefs)
    })

    create_user_invoice(current_user["user_id"], 19.00, "Paid")
    write_audit_log(current_user["user_id"], "Upgraded subscription to Studio Pro", ip_addr, "Success")
    return {"success": True, "message": "Successfully upgraded to Studio Pro."}


@router.post("/purchase-credits", summary="Purchase additional compute credits")
async def purchase_credits_endpoint(body: PurchaseCreditsRequest, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    new_credits = record_credit_transaction(current_user["user_id"], body.credits, "purchase")
    create_user_invoice(current_user["user_id"], body.amount, "Paid")

    write_audit_log(current_user["user_id"], f"Purchased {body.credits} compute credits", ip_addr, "Success")
    return {
        "success": True,
        "credits": new_credits,
        "message": f"Successfully purchased {body.credits} credits."
    }


@router.get("/credits", response_model=CreditsBalanceResponse, operation_id="get_credit_balance", summary="Get remaining compute credit balance")
async def get_credits_endpoint(current_user: dict = Depends(get_current_user)):
    balance = get_available_credits(current_user["user_id"])
    return {
        "success": True,
        "credits": balance,
        "low_balance": balance < LOW_BALANCE_THRESHOLD,
        "threshold": LOW_BALANCE_THRESHOLD,
    }


@router.get("/transactions", summary="Get recent credit transaction history")
async def get_transactions_endpoint(
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    limit = min(max(1, limit), 500)
    txs = get_credit_transactions(current_user["user_id"], limit=limit)
    return {"success": True, "transactions": txs, "count": len(txs)}


@router.get("/analytics", summary="Get creator performance analytics")
async def get_creator_analytics_endpoint(current_user: dict = Depends(get_current_user)):
    data = get_creator_analytics(current_user["user_id"])
    return {"success": True, "analytics": data}
