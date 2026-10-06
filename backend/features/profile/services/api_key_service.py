"""
backend/features/profile/services/api_key_service.py
─────────────────────────────────────────────────────────────────────────────
Developer API key generation, listing, and revocation services.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import secrets
from typing import Any, Dict, Optional

from features.auth.repositories import (
    get_user_api_keys,
    create_user_api_key,
    delete_user_api_key,
    write_audit_log,
)

logger = logging.getLogger("sonikoma.features.profile.services.api_keys")


def list_api_keys(
    user_id: str,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    """List active developer API keys with optional search and pagination."""
    keys = get_user_api_keys(user_id)
    if search:
        q = search.lower()
        keys = [k for k in keys if q in (k.get("name") or "").lower()]
    total = len(keys)
    paginated = keys[offset:offset + limit]
    return {"success": True, "total": total, "keys": paginated}


def generate_api_key(
    user_id: str,
    name: str,
    ip_addr: str = "127.0.0.1",
) -> Dict[str, Any]:
    """Generate a new secure developer API key."""
    hex_str = secrets.token_hex(24)
    raw_key = f"av_live_{hex_str}"
    masked_key = f"av_live_{hex_str[:4]}...{hex_str[-4:]}"

    new_key = create_user_api_key(user_id, name, raw_key)
    write_audit_log(user_id, f"Generated Developer API Key: {name}", ip_addr, "Success")

    return {
        "success": True,
        "key": {
            "id": new_key["id"],
            "name": name,
            "key": masked_key,
            "created": new_key["created"],
        },
        "raw_key": raw_key,
    }


def revoke_api_key(
    user_id: str,
    key_id: str,
    ip_addr: str = "127.0.0.1",
) -> Dict[str, Any]:
    """Revoke a developer API key."""
    delete_user_api_key(user_id, key_id)
    write_audit_log(user_id, f"Revoked Developer API Key: {key_id}", ip_addr, "Success")
    return {"success": True, "message": "API Key revoked successfully."}
