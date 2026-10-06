"""
backend/features/profile/router/api_keys.py
─────────────────────────────────────────────────────────────────────────────
Developer API key management endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Request, Query, Path

from app.core.dependencies.auth import get_current_user
from common import get_client_ip
from features.profile.schemas import ApiKeyCreate
from features.profile.services.api_key_service import (
    list_api_keys,
    generate_api_key,
    revoke_api_key,
)

logger = logging.getLogger("sonikoma.features.profile.api_keys")
router = APIRouter()


@router.get("/api-keys", summary="List developer API keys with filtering and pagination")
async def get_api_keys_endpoint(
    search: Optional[str] = Query(None, description="Search API keys by name"),
    limit: int = Query(50, ge=1, le=200, description="Max keys to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_current_user),
):
    return list_api_keys(
        user_id=current_user["user_id"],
        search=search,
        limit=limit,
        offset=offset,
    )


@router.post("/api-keys", summary="Generate a new developer API key")
async def generate_api_key_endpoint(
    body: ApiKeyCreate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return generate_api_key(
        user_id=current_user["user_id"],
        name=body.name,
        ip_addr=ip_addr,
    )


@router.delete("/api-keys/{key_id}", summary="Revoke a developer API key by ID")
async def revoke_api_key_endpoint(
    key_id: str = Path(..., description="Unique developer API Key ID to revoke"),
    request: Request = None,
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    return revoke_api_key(
        user_id=current_user["user_id"],
        key_id=key_id,
        ip_addr=ip_addr,
    )


__all__ = ["router"]
