"""
backend/features/admin/services/user_service.py
─────────────────────────────────────────────────────────────────────────────
Admin User Management Service:
- User lifecycle, listing, role modification, account locking
- Credit allocation & transaction auditing
- Account deletion & per-user activity logs
- Bulk administrative actions
- Superuser impersonation token issuance
─────────────────────────────────────────────────────────────────────────────
"""

import os
import datetime
from datetime import timedelta
import logging
from typing import Optional, List, Dict, Any
import jwt

from app.core.security import SECRET_KEY
from features.auth.repositories import (
    get_user_by_id,
    update_user as repo_update_user,
    delete_user as repo_delete_user,
    get_audit_logs as repo_get_audit_logs,
    write_audit_log,
    get_all_users,
)
from features.profile.services.credit_service import record_credit_transaction

logger = logging.getLogger("sonikoma.admin.user_service")


class AdminUserService:
    """Specialized service for user administration and moderation."""

    def list_users(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_locked: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        users = get_all_users()
        if search:
            q = search.lower()
            users = [
                u for u in users
                if q in (u.get("email") or "").lower()
                or q in (u.get("username") or "").lower()
                or q in (u.get("full_name") or "").lower()
            ]
        if role:
            users = [u for u in users if (u.get("creator_role") or "").lower() == role.lower()]
        if is_locked is not None:
            target_locked = 1 if is_locked else 0
            users = [u for u in users if u.get("is_locked", 0) == target_locked]

        total = len(users)
        paginated = users[offset:offset + limit]
        return {"success": True, "total": total, "users": paginated}

    def update_user(
        self,
        user_id: str,
        creator_role: Optional[str],
        credits: Optional[int],
        is_locked: Optional[bool],
        current_admin_id: str,
        ip_addr: str = "127.0.0.1",
    ) -> Dict[str, Any]:
        if user_id == current_admin_id:
            if is_locked is True:
                raise ValueError("Admins cannot lock their own account.")
            if creator_role and creator_role != "admin":
                raise ValueError("Admins cannot downgrade their own role.")

        updates = {}
        if creator_role is not None:
            updates["creator_role"] = creator_role
        if credits is not None:
            updates["credits"] = credits
        if is_locked is not None:
            updates["is_locked"] = 1 if is_locked else 0

        if updates:
            repo_update_user(user_id, updates)
            log_msg = f"Admin updated user {user_id} settings"
            if "is_locked" in updates:
                action = "locked" if updates["is_locked"] else "unlocked"
                log_msg = f"Admin {action} account of user {user_id}"
            write_audit_log(current_admin_id, log_msg, ip_addr, "Success")

        return {"success": True, "message": "User updated successfully."}

    def add_user_credits(
        self,
        user_id: str,
        amount: int,
        reason: Optional[str],
        current_admin_id: str,
        ip_addr: str = "127.0.0.1",
    ) -> Dict[str, Any]:
        desc = f"admin_grant: {reason}" if reason else "admin_grant"
        new_balance = record_credit_transaction(user_id, amount, desc)
        log_msg = f"Admin granted {amount} credits to user {user_id}. New balance: {new_balance}"
        write_audit_log(current_admin_id, log_msg, ip_addr, "Success")
        return {
            "success": True,
            "new_balance": new_balance,
            "message": f"Successfully updated user credits by {amount}."
        }

    def delete_user(self, user_id: str, current_admin_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
        if user_id == current_admin_id:
            raise ValueError("Admins cannot delete their own account.")
        repo_delete_user(user_id)
        write_audit_log(current_admin_id, f"Admin deleted user {user_id}", ip_addr, "Success")
        return {"success": True, "message": "User deleted successfully."}

    def get_user_logs(self, user_id: str, query: str = "", page: int = 1, limit: int = 20) -> Dict[str, Any]:
        offset = (page - 1) * limit
        logs, total = repo_get_audit_logs(user_id, query=query, limit=limit, offset=offset)
        return {"success": True, "logs": logs, "total": total, "page": page, "limit": limit}

    def bulk_action(
        self,
        user_ids: List[str],
        action: str,
        value: Optional[str],
        current_admin_id: str,
        ip_addr: str = "127.0.0.1",
    ) -> Dict[str, Any]:
        success_count = 0
        for uid in user_ids:
            if action == "delete":
                repo_delete_user(uid)
                success_count += 1
            elif action == "set_role" and value:
                repo_update_user(uid, {"creator_role": value})
                success_count += 1
            elif action == "add_credits" and value:
                try:
                    u = get_user_by_id(uid)
                    if u:
                        curr = u.get("credits") if u.get("credits") is not None else 840
                        repo_update_user(uid, {"credits": curr + int(value)})
                        success_count += 1
                except Exception as e:
                    logger.error(f"Failed to add credits to {uid}: {e}")

        write_audit_log(current_admin_id, f"Admin performed bulk '{action}' on {success_count} users", ip_addr, "Success")
        return {"success": True, "message": f"Successfully applied {action} to {success_count} users."}

    def impersonate_user(self, user_id: str, current_admin_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
        target_user = get_user_by_id(user_id)
        if not target_user:
            raise KeyError("User not found")

        access_token_expires = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")))
        expire = datetime.datetime.utcnow() + access_token_expires
        to_encode = {
            "sub": target_user["email"],
            "user_id": target_user["id"],
            "exp": expire,
            "is_impersonation": True,
        }
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
        write_audit_log(current_admin_id, f"Admin impersonated user {user_id}", ip_addr, "Success")
        return {
            "success": True,
            "access_token": encoded_jwt,
            "token_type": "bearer",
            "impersonated_user": target_user,
        }


admin_user_service = AdminUserService()
