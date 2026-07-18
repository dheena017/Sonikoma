"""
api/v1/projects/settings.py
─────────────────────────────────────────────────────────────────────────────
Series management, bulk operations, and token analytics routes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException, Path, Depends

from api.dependencies.auth import get_current_user
from schemas.project import BatchDeleteRequest
from repositories.project_repository import (
    get_project,
    delete_project,
    get_token_logs,
)
from database.engine import get_db_connection

logger = logging.getLogger("sonikoma.routes.projects.settings")
router = APIRouter()


@router.get("/series/{series_id_or_slug}", summary="Get series details")
async def get_series_route(
    series_id_or_slug: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        conn = get_db_connection()
        row = conn.execute(
            "SELECT * FROM series WHERE id = ?", (series_id_or_slug,)
        ).fetchone()
        if not row:
            row = conn.execute(
                "SELECT * FROM series WHERE slug = ?", (series_id_or_slug,)
            ).fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Series not found.")

        series = dict(row)
        if series["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")

        return {"success": True, "series": series}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch series: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/series/{seriesId}", summary="Delete a series and all its chapters")
async def delete_series_route(
    seriesId: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(f"[Database] Deleting series for: {seriesId}")
        conn = get_db_connection()
        row = conn.execute(
            "SELECT user_id FROM series WHERE id = ?", (seriesId,)
        ).fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Series not found.")

        if row["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")

        delete_project(seriesId)
        logger.info(f"[Database] Deleted series successfully: {seriesId}")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete series: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to delete series: {e}"
        )


@router.post("/batch-delete", summary="Bulk delete multiple projects")
async def batch_delete_projects(
    body: BatchDeleteRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Bulk deleting {len(body.project_ids)} projects "
            f"for user {current_user['user_id']}..."
        )
        deleted_count = 0
        for pid in body.project_ids:
            project = get_project(pid)
            if project and project.get("user_id") == current_user["user_id"]:
                delete_project(pid)
                deleted_count += 1
        logger.info(
            f"[Database] Successfully deleted {deleted_count} of "
            f"{len(body.project_ids)} requested projects."
        )
        return {"success": True, "deleted_count": deleted_count}
    except Exception as e:
        logger.error(f"Failed to batch delete projects: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to batch delete projects: {e}"
        )


@router.get("/analytics/tokens", summary="Get token usage history for user's projects")
async def get_token_analytics(current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"Fetching token analytics for user: {current_user['user_id']}")
        logs = get_token_logs(current_user["user_id"])
        return {"success": True, "token_logs": logs}
    except Exception as e:
        logger.error(f"Failed to fetch token analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch token analytics")
