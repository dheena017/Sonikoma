"""
backend/app/features/platform/dashboard/service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for compiling dashboard statistics, resource metrics, and activity.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import os
import logging
from typing import Dict, Any, List

from app.core.config import NODE_ENV, STORAGE_DIR
from features.platform.dashboard.services_system.status_service import get_backend_status
from features.platform.jobs import job_manager
from database.engine import get_db_connection
from .schemas import (
    DashboardOverviewResponse,
    DashboardQuickStats,
    SystemQuickHealth,
    DashboardRecentItem,
)
from common.utils.formatting import format_bytes

logger = logging.getLogger("sonikoma.features.platform.dashboard")


class DashboardService:
    @staticmethod
    def get_overview(user_id: str = "anonymous") -> DashboardOverviewResponse:
        """Aggregates authentic system telemetry and project data for dashboard."""
        # 1. Fetch system status
        try:
            status = get_backend_status()
            health = SystemQuickHealth(
                status=status.status,
                uptime_seconds=status.runtime.uptime_seconds,
                cpu_percent=status.resources.cpu.current_load_percent,
                memory_percent=status.resources.memory.percent_used,
                disk_percent=status.storage.primary_disk.percent_used if status.storage.primary_disk else 0.0,
                ai_available=status.ai_providers.available_providers_count > 0,
                gpu_available=status.resources.gpu.available
            )
        except Exception as e:
            logger.error(f"[DashboardService] Failed to gather system health: {e}")
            health = SystemQuickHealth(status="degraded")

        # 2. Query project counts and recent projects
        total_projects = 0
        recent_activity: List[DashboardRecentItem] = []
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM projects")
                row = cursor.fetchone()
                if row:
                    total_projects = row[0]

                cursor.execute(
                    "SELECT id, name, updated_at FROM projects ORDER BY updated_at DESC LIMIT 5"
                )
                for p_id, p_name, p_updated in cursor.fetchall():
                    recent_activity.append(
                        DashboardRecentItem(
                            id=str(p_id),
                            title=p_name or "Untitled Project",
                            type="project",
                            updated_at=str(p_updated or "")
                        )
                    )
        except Exception as e:
            logger.warning(f"[DashboardService] DB query failed: {e}")

        # 3. Query active jobs
        active_jobs_count = 0
        recent_jobs_list: List[Dict[str, Any]] = []
        try:
            jobs = job_manager.list_jobs(user_id=user_id, limit=10)
            for j in jobs:
                if j.status in ("RUNNING", "QUEUED"):
                    active_jobs_count += 1
                recent_jobs_list.append(j.to_status_response().dict())
        except Exception as e:
            logger.warning(f"[DashboardService] Job retrieval failed: {e}")

        # 4. Compute storage size
        storage_bytes = 0
        if os.path.exists(STORAGE_DIR):
            try:
                for root, _, files in os.walk(STORAGE_DIR):
                    for f in files:
                        fp = os.path.join(root, f)
                        if os.path.isfile(fp):
                            storage_bytes += os.path.getsize(fp)
            except Exception:
                pass

        stats = DashboardQuickStats(
            total_projects=total_projects,
            active_jobs=active_jobs_count,
            total_images_processed=0,
            total_videos_rendered=0,
            storage_used_bytes=storage_bytes,
            storage_used_formatted=format_bytes(storage_bytes)
        )

        return DashboardOverviewResponse(
            success=True,
            stats=stats,
            health=health,
            recent_activity=recent_activity,
            recent_jobs=recent_jobs_list[:5],
            environment=NODE_ENV
        )


dashboard_service = DashboardService()
