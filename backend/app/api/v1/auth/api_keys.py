"""
backend/app/api/v1/auth/api_keys.py
─────────────────────────────────────────────────────────────────────────────
Developer API key management endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import secrets
import logging
from fastapi import APIRouter, Depends, Request

from api.dependencies.auth import get_current_user
from schemas.auth import ApiKeyCreate
from repositories.user_repository import (
    get_user_api_keys,
    create_user_api_key,
    delete_user_api_key,
    write_audit_log
)

logger = logging.getLogger("sonikoma.auth.api_keys")
router = APIRouter()


@router.get("/api-keys")
async def get_keys(current_user: dict = Depends(get_current_user)):
    keys = get_user_api_keys(current_user["user_id"])
    return {"success": True, "keys": keys}


@router.post("/api-keys")
async def generate_key(body: ApiKeyCreate, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    hex_str = secrets.token_hex(24)
    raw_key = f"av_live_{hex_str}"
    masked_key = f"av_live_{hex_str[:4]}...{hex_str[-4:]}"

    new_key = create_user_api_key(current_user["user_id"], body.name, raw_key)
    write_audit_log(current_user["user_id"], f"Generated Developer API Key: {body.name}", ip_addr, "Success")

    return {
        "success": True,
        "key": {
            "id": new_key["id"],
            "name": body.name,
            "key": masked_key,
            "created": new_key["created"]
        },
        "raw_key": raw_key
    }


@router.delete("/api-keys/{key_id}")
async def revoke_key(key_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    delete_user_api_key(current_user["user_id"], key_id)
    write_audit_log(current_user["user_id"], f"Revoked Developer API Key: {key_id}", ip_addr, "Success")
    return {"success": True, "message": "API Key revoked successfully."}
