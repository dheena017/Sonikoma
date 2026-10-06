"""
backend/features/auth/password.py
─────────────────────────────────────────────────────────────────────────────
Password reset and credential modification routes:
- POST /forgot-password: Initiate password reset flow
- PUT /password: Update current user account password
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.dependencies.auth import get_current_user
from common import get_client_ip
from features.auth.schemas import ForgotPasswordRequest, PasswordUpdate
from features.auth.service import auth_service

logger = logging.getLogger("sonikoma.auth.password")
router = APIRouter()


@router.post("/forgot-password", summary="Initiate password reset email request")
async def forgot_password(
    request: ForgotPasswordRequest, req: Request = None
):
    ip_addr = get_client_ip(req)
    return auth_service.request_password_reset(request.email, ip_addr)


@router.put("/password", summary="Update authenticated user password")
async def update_password(
    body: PasswordUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    ip_addr = get_client_ip(request)
    try:
        return auth_service.change_password(
            user_id=current_user["user_id"],
            current_password=body.current_password,
            new_password=body.new_password,
            ip_addr=ip_addr,
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
