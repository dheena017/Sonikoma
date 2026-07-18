"""
backend/app/api/v1/auth/password.py
─────────────────────────────────────────────────────────────────────────────
Password reset and password change routes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request

from core.security import verify_password, get_password_hash
from api.dependencies.auth import get_current_user
from repositories.user import get_user_by_email, update_user, write_audit_log
from backend.schemas.auth import ForgotPasswordRequest, PasswordUpdate

logger = logging.getLogger("sonikoma.auth.password")
router = APIRouter()


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = get_user_by_email(request.email)
    if not user:
        return {"message": "If an account exists for this email, you will receive a reset link shortly."}

    logger.info(f"[Auth] Forgot password request for {request.email}. Reset link would be sent.")
    return {"message": "If an account exists for this email, you will receive a reset link shortly."}


@router.put("/password")
async def update_password(body: PasswordUpdate, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    if not current_user["hashed_password"] or not verify_password(body.current_password, current_user["hashed_password"]):
        write_audit_log(current_user["user_id"], "Change Password Attempt", ip_addr, "Failed")
        raise HTTPException(status_code=400, detail="Incorrect current password")

    hashed = get_password_hash(body.new_password)
    update_user(current_user["user_id"], {"hashed_password": hashed})
    write_audit_log(current_user["user_id"], "Changed Account Password", ip_addr, "Success")

    return {"success": True, "message": "Password updated successfully."}
