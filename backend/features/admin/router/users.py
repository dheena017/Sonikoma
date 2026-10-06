"""
backend/features/admin/users/router.py
─────────────────────────────────────────────────────────────────────────────
Admin User Management Router:
- User listing, filtering, pagination
- Role updates, account locking/unlocking
- Credit balance grants
- User deletion & audit log review
- Bulk actions & Superuser Impersonation
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query

from app.core.dependencies.auth import get_admin_user
from features.admin.schemas import (
    AdminUpdateUser,
    AdminAddCreditsRequest,
    AdminBulkAction,
)
from features.admin.services import admin_user_service
from common import get_client_ip

logger = logging.getLogger("sonikoma.admin.users")
router = APIRouter()


@router.get("/admin/users", summary="Get all platform users with filtering and pagination")
async def get_admin_users(
    search: Optional[str] = Query(None, description="Search users by email, username, or full name"),
    role: Optional[str] = Query(None, description="Filter by creator role (e.g. admin, creator, pro)"),
    is_locked: Optional[bool] = Query(None, description="Filter by account lock state"),
    limit: int = Query(50, ge=1, le=500, description="Max users to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_admin_user),
):
    return admin_user_service.list_users(search=search, role=role, is_locked=is_locked, limit=limit, offset=offset)


@router.put("/admin/users/{user_id}", summary="Update user role, lock state, or credits")
async def admin_update_user(
    user_id: str,
    body: AdminUpdateUser,
    request: Request,
    current_user: dict = Depends(get_admin_user)
):
    ip_addr = get_client_ip(request)
    try:
        return admin_user_service.update_user(
            user_id=user_id,
            creator_role=body.creator_role,
            credits=body.credits,
            is_locked=body.is_locked,
            current_admin_id=current_user["user_id"],
            ip_addr=ip_addr
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/users/{user_id}/add-credits", summary="Grant credits to a user")
async def admin_add_credits(
    user_id: str,
    body: AdminAddCreditsRequest,
    request: Request,
    current_user: dict = Depends(get_admin_user)
):
    ip_addr = get_client_ip(request)
    try:
        return admin_user_service.add_user_credits(
            user_id=user_id,
            amount=body.amount,
            reason=body.reason,
            current_admin_id=current_user["user_id"],
            ip_addr=ip_addr
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to add credits to {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/users/{user_id}", summary="Delete user account")
async def admin_delete_user(
    user_id: str,
    request: Request,
    current_user: dict = Depends(get_admin_user)
):
    ip_addr = get_client_ip(request)
    try:
        return admin_user_service.delete_user(
            user_id=user_id,
            current_admin_id=current_user["user_id"],
            ip_addr=ip_addr
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to delete user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/users/{user_id}/logs", summary="Get audit logs for a specific user")
async def admin_get_user_logs(
    user_id: str,
    query: str = "",
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_admin_user)
):
    return admin_user_service.get_user_logs(user_id=user_id, query=query, page=page, limit=limit)


@router.post("/admin/users/bulk", summary="Execute bulk actions on multiple users")
async def admin_bulk_action(
    body: AdminBulkAction,
    request: Request,
    current_user: dict = Depends(get_admin_user)
):
    ip_addr = get_client_ip(request)
    return admin_user_service.bulk_action(
        user_ids=body.user_ids,
        action=body.action,
        value=body.value,
        current_admin_id=current_user["user_id"],
        ip_addr=ip_addr
    )


@router.post("/admin/impersonate/{user_id}", summary="Generate impersonation token for user")
async def admin_impersonate_user(
    user_id: str,
    request: Request,
    current_user: dict = Depends(get_admin_user)
):
    ip_addr = get_client_ip(request)
    try:
        return admin_user_service.impersonate_user(
            user_id=user_id,
            current_admin_id=current_user["user_id"],
            ip_addr=ip_addr
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"Failed to impersonate {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
