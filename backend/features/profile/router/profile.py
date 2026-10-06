"""
backend/features/profile/router/profile.py
─────────────────────────────────────────────────────────────────────────────
User Profile, Sessions, Invoices, and Account Deletion endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Request, Query, Path

from app.core.dependencies.auth import get_current_user
from common import get_client_ip
from features.profile.schemas import (
    ProfileUpdate,
    UserProfileResponse,
    StandardMessageResponse,
    ClaimDailyCreditsResponse,
)
from features.profile.services.profile_service import (
    get_user_profile,
    update_user_profile,
    delete_account,
    get_user_sessions_service,
    terminate_session,
    get_user_audit_logs,
    get_user_invoices_service,
)
from features.profile.services.credit_service import claim_daily_credits

logger = logging.getLogger("sonikoma.features.profile.details")
router = APIRouter()


@router.get(
    "/me",
    response_model=UserProfileResponse,
    operation_id="get_my_profile",
    summary="Get authenticated user profile details",
)
async def get_current_user_profile_endpoint(current_user: dict = Depends(get_current_user)):
    return get_user_profile(current_user["user_id"], current_user)


@router.put("/profile", summary="Update user profile metadata")
async def update_user_profile_endpoint(
    body: ProfileUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return update_user_profile(current_user["user_id"], current_user, body, ip_addr)


@router.post(
    "/claim-daily-credits",
    response_model=ClaimDailyCreditsResponse,
    operation_id="claim_daily_credits",
    summary="Claim daily login streak bonus credits",
)
async def claim_daily_credits_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return claim_daily_credits(current_user["user_id"], current_user, ip_addr)


@router.delete(
    "/me",
    response_model=StandardMessageResponse,
    operation_id="delete_my_account",
    summary="Permanently delete current user account",
)
async def delete_user_account_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return delete_account(current_user["user_id"], ip_addr)


@router.get("/sessions", summary="Get active device sessions for current user")
async def get_user_sessions_endpoint(
    limit: int = Query(20, ge=1, le=100, description="Max sessions to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_current_user),
):
    return get_user_sessions_service(current_user["user_id"], limit=limit, offset=offset)


@router.delete("/sessions/{session_id}", summary="Terminate a specific device session")
async def delete_user_session_endpoint(
    session_id: str = Path(..., description="Unique device session ID to terminate"),
    request: Request = None,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return terminate_session(current_user["user_id"], session_id, ip_addr)


@router.get("/audit-logs", summary="Get personal security audit logs with pagination")
async def get_user_audit_logs_endpoint(
    query: Optional[str] = Query("", description="Search term for action log entries"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Page size limit"),
    current_user: dict = Depends(get_current_user),
):
    return get_user_audit_logs(
        current_user["user_id"],
        query=query or "",
        page=page,
        limit=limit,
    )


@router.get("/invoices", summary="Get billing invoices and receipt history")
async def get_user_invoices_endpoint(
    limit: int = Query(20, ge=1, le=100, description="Max invoices to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_current_user),
):
    return get_user_invoices_service(current_user["user_id"], limit=limit, offset=offset)


__all__ = ["router"]
