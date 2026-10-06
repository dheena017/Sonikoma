"""
backend/features/auth/register.py
─────────────────────────────────────────────────────────────────────────────
Authentication registration routes:
- POST /register: Register a new user account with hashed password and token
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException, status, Request

from common import get_client_ip
from features.auth.schemas import UserRegister
from features.auth.service import auth_service

logger = logging.getLogger("sonikoma.auth.register")
router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Register a new user account")
async def register_endpoint(user_data: UserRegister, request: Request = None):
    ip_addr = get_client_ip(request)
    try:
        return auth_service.register_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            ip_addr=ip_addr,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        logger.error(f"[Auth] Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
