"""
backend/features/profile/services/preference_service.py
─────────────────────────────────────────────────────────────────────────────
User preferences, points redemption, MFA settings, and billing methods.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from typing import Any, Dict
from fastapi import HTTPException

from features.profile.schemas import SaveCardRequest
from features.auth.repositories import (
    update_user,
    create_user_invoice,
    write_audit_log,
)
from features.profile.services.credit_service import record_credit_transaction

logger = logging.getLogger("sonikoma.features.profile.services.preferences")


def redeem_points(
    user_id: str,
    current_user: dict,
    reward_type: str,
    reward_value: str,
    ip_addr: str = "127.0.0.1",
) -> Dict[str, Any]:
    """Redeem achievement points for credits or badges."""
    if reward_type == "credits":
        credits_to_add = int(reward_value)
        new_credits = record_credit_transaction(user_id, credits_to_add, "points_redemption")

        try:
            rewards = json.loads(current_user.get("unlocked_rewards") or "[]")
        except Exception:
            rewards = []

        reward_name = f"+{credits_to_add} AI Credits"
        if reward_name not in rewards:
            rewards.append(reward_name)

        update_user(user_id, {"unlocked_rewards": json.dumps(rewards)})
        write_audit_log(user_id, f"Exchanged points for +{credits_to_add} compute credits", ip_addr, "Success")
        return {
            "success": True,
            "credits": new_credits,
            "message": f"Successfully exchanged points for +{credits_to_add} credits!",
        }

    elif reward_type == "badge":
        try:
            badges = json.loads(current_user.get("unlocked_rewards") or "[]")
        except Exception:
            badges = []
        if reward_value not in badges:
            badges.append(reward_value)
            update_user(user_id, {"unlocked_rewards": json.dumps(badges)})
        write_audit_log(user_id, f"Unlocked achievement badge: {reward_value}", ip_addr, "Success")
        return {"success": True, "badges": badges, "message": f"Badge '{reward_value}' unlocked!"}

    raise HTTPException(status_code=400, detail="Invalid reward type specified.")


def toggle_mfa(user_id: str, mfa_enabled: bool, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
    """Toggle multi-factor authentication (MFA)."""
    val = 1 if mfa_enabled else 0
    update_user(user_id, {"mfa_enabled": val})
    event_name = (
        "Activated Two-Factor Authentication (2FA)"
        if mfa_enabled
        else "Deactivated Two-Factor Authentication (2FA)"
    )
    write_audit_log(user_id, event_name, ip_addr, "Success")
    return {"success": True, "mfa_enabled": mfa_enabled, "message": f"2FA status set to {mfa_enabled}"}


def save_card(
    user_id: str,
    current_user: dict,
    body: SaveCardRequest,
    ip_addr: str = "127.0.0.1",
) -> Dict[str, Any]:
    """Save billing card details."""
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
        "isCardSaved": True,
    }

    update_user(user_id, {"preferences": json.dumps(prefs)})
    write_audit_log(user_id, "Saved payment method", ip_addr, "Success")
    return {"success": True, "message": "Card details saved successfully."}


def upgrade_plan(user_id: str, current_user: dict, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
    """Upgrade user to Studio Pro subscription tier."""
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

    update_user(user_id, {
        "creator_role": "pro",
        "credits": new_credits,
        "preferences": json.dumps(prefs),
    })

    create_user_invoice(user_id, 19.00, "Paid")
    write_audit_log(user_id, "Upgraded subscription to Studio Pro", ip_addr, "Success")
    return {"success": True, "message": "Successfully upgraded to Studio Pro."}
