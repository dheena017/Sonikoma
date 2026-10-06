"""
backend/features/admin/services/job_service.py
─────────────────────────────────────────────────────────────────────────────
Admin Background Jobs Service:
- List, filter, and inspect background jobs across all users
- Cancel running jobs, delete jobs, purge completed jobs, emergency stop
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional

from features.auth.repositories import write_audit_log
from features.platform.jobs import job_manager

logger = logging.getLogger("sonikoma.admin.job_service")


class AdminJobService:
    """Specialized service for background job administration."""

    def list_jobs(
        self,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        chapter_id: Optional[str] = None,
        status: Optional[str] = None,
        job_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ):
        return job_manager.list_all_jobs_admin(
            user_id=user_id,
            project_id=project_id,
            chapter_id=chapter_id,
            status=status,
            job_type=job_type,
            limit=limit,
            offset=offset
        )

    def cancel_job(self, job_id: str, current_admin_id: str, ip_addr: str = "127.0.0.1"):
        job = job_manager.cancel_job(job_id)
        if not job:
            raise KeyError(f"Job '{job_id}' not found.")
        write_audit_log(current_admin_id, f"Admin cancelled job {job_id}", ip_addr, "Success")
        return job

    def delete_job(self, job_id: str, current_admin_id: str, ip_addr: str = "127.0.0.1"):
        success = job_manager.delete_job_admin(job_id)
        if not success:
            raise KeyError(f"Job '{job_id}' not found.")
        write_audit_log(current_admin_id, f"Admin deleted job {job_id}", ip_addr, "Success")
        return {"success": True, "message": f"Job '{job_id}' deleted successfully"}

    def purge_completed_jobs(self, current_admin_id: str, ip_addr: str = "127.0.0.1"):
        count = job_manager.purge_completed_jobs_admin()
        write_audit_log(current_admin_id, f"Admin purged {count} completed/failed jobs", ip_addr, "Success")
        return {"success": True, "purged_count": count, "message": f"Successfully purged {count} finished jobs."}

    def cancel_all_active_jobs(self, current_admin_id: str, ip_addr: str = "127.0.0.1"):
        count = job_manager.cancel_all_active_admin()
        write_audit_log(current_admin_id, f"Admin cancelled all {count} active jobs", ip_addr, "Success")
        return {"success": True, "cancelled_count": count, "message": f"Successfully cancelled {count} active jobs."}


admin_job_service = AdminJobService()
