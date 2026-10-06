"""
backend/features/admin/services/project_service.py
─────────────────────────────────────────────────────────────────────────────
Admin Projects & Series Moderation Service:
- Global series/projects listing, filtering, pagination
- Status updates, content flagging/unflagging
- Deletion of inappropriate or violating projects
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, Dict, Any

from features.auth.repositories import write_audit_log
from features.platform.projects.repositories import (
    get_all_projects_admin,
    update_series_admin,
    delete_series_admin,
)

logger = logging.getLogger("sonikoma.admin.project_service")


class AdminProjectService:
    """Specialized service for global project moderation."""

    def list_projects(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        is_flagged: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        projects = get_all_projects_admin()
        if search:
            q = search.lower()
            projects = [
                p for p in projects
                if q in (p.get("title") or "").lower()
                or q in (p.get("author") or "").lower()
                or q in (p.get("genre") or "").lower()
            ]
        if status:
            projects = [p for p in projects if (p.get("status") or "").lower() == status.lower()]
        if is_flagged is not None:
            target_flagged = 1 if is_flagged else 0
            projects = [p for p in projects if p.get("is_flagged", 0) == target_flagged]

        total = len(projects)
        paginated = projects[offset:offset + limit]
        return {"success": True, "total": total, "projects": paginated}

    def update_project(
        self,
        project_id: str,
        updates: Dict[str, Any],
        reason: Optional[str],
        current_admin_id: str,
        ip_addr: str = "127.0.0.1",
    ) -> Dict[str, Any]:
        if "reason" in updates:
            del updates["reason"]

        update_series_admin(project_id, updates)

        log_msg = f"Admin updated project {project_id}"
        if "is_flagged" in updates:
            action = "flagged" if updates["is_flagged"] else "unflagged"
            log_msg = f"Admin {action} project {project_id}"
        elif "status" in updates:
            log_msg = f"Admin set status of project {project_id} to {updates['status']}"

        if reason:
            log_msg += f" (Reason: {reason})"

        write_audit_log(current_admin_id, log_msg, ip_addr, "Success")
        return {"success": True, "message": "Project updated successfully"}

    def delete_project(self, project_id: str, current_admin_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
        delete_series_admin(project_id)
        write_audit_log(current_admin_id, f"Admin deleted project {project_id}", ip_addr, "Success")
        return {"success": True, "message": "Project deleted successfully"}


admin_project_service = AdminProjectService()
