from services.project.project_service import ProjectService, sync_project_to_supabase, get_series_details, delete_temp_file
"""
api/v1/projects/router.py
─────────────────────────────────────────────────────────────────────────────
Primary project router — owns all project CRUD routes directly.
Sub-modules (create, update, settings, files) are imported for their logic,
not mounted as sub-routers, because FastAPI disallows include_router when
both the mount prefix and the route path are empty.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException, Path, Body, Depends, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse

from api.dependencies.auth import get_current_user
from schemas.project import (
    ProjectCreateRequest,
    PanelsSaveRequest,
    TokenIncrementRequest,
    ProjectUpdateRequest,
    BatchDeleteRequest,
    DetectPanelsBase64Request,
)
from repositories.project_repository import (
    get_all_projects,
    get_project,
    get_project_by_slug,
    get_panels,
    insert_project,
    insert_panels,
    update_project,
    increment_project_tokens,
    update_project_full,
    delete_panels,
    delete_project,
    get_token_logs,
)
from repositories.user_repository import write_audit_log
from database.connection import get_db_connection, unwrap_proxy_url
from api.v1.projects._helpers import wrap_proxy_url
from api.v1.projects.update import _build_panel_dicts
from api.v1.projects.files import _detect

logger = logging.getLogger("sonikoma.routes.projects.router")

# ── Routers ───────────────────────────────────────────────────────────────
project_router = APIRouter()
panel_router = APIRouter()
project_service = ProjectService()


# ── List & read ───────────────────────────────────────────────────────────

@project_router.get("", summary="Get all projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    try:
        logger.info(
            f"[Database] Fetching project histories for user "
            f"{current_user['user_id']} from local SQLite..."
        )
        projects = get_all_projects(user_id=current_user["user_id"])
        for proj in projects:
            if proj.get("cover_image"):
                proj["cover_image"] = wrap_proxy_url(proj["cover_image"])
            elif proj.get("first_panel_image"):
                proj["cover_image"] = wrap_proxy_url(proj["first_panel_image"])
        logger.info(f"[Database] Retrieved {len(projects)} projects.")
        return {"success": True, "projects": projects}
    except Exception as e:
        logger.error(f"Failed to fetch projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {e}")


@project_router.get("/public/{project_id}", summary="Get a project publicly (no auth)")
async def get_public_project(project_id: str = Path(..., description="Project ID")):
    try:
        project = get_project(project_id) or get_project_by_slug(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("cover_image"):
            project["cover_image"] = wrap_proxy_url(project["cover_image"])
        elif project.get("first_panel_image"):
            project["cover_image"] = wrap_proxy_url(project["first_panel_image"])
        panels = get_panels(project["project_id"])
        for p in panels:
            if p.get("image_url"):
                p["image_url"] = wrap_proxy_url(p["image_url"])
        return {"success": True, "project": project, "panels": panels}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch public project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch public project: {e}")


@project_router.get("/analytics/tokens", summary="Get token usage history")
async def get_token_analytics(current_user: dict = Depends(get_current_user)):
    try:
        logs = get_token_logs(current_user["user_id"])
        return {"success": True, "token_logs": logs}
    except Exception as e:
        logger.error(f"Failed to fetch token analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch token analytics")


@project_router.get("/series/{series_id_or_slug}", summary="Get series details")
async def get_series_route(
    series_id_or_slug: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        try:
            series = get_series_details(series_id_or_slug, current_user["user_id"])
            if not series:
                raise HTTPException(status_code=404, detail="Series not found.")
        except PermissionError:
            raise HTTPException(status_code=403, detail="Access denied.")
        return {"success": True, "series": series}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch series: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Create ────────────────────────────────────────────────────────────────

@project_router.post("", summary="Create a new project entry")
async def create_project(
    body: ProjectCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        result = project_service.create_project(body, current_user["user_id"])
        logger.info(f"[Database] Created project {body.project_id}: '{body.title}'")
        return result
    except Exception as e:
        logger.error(f"Failed to save project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save project: {e}")


# ── Update ────────────────────────────────────────────────────────────────

@project_router.post("/{projectId}/panels", summary="Save storyboard panels for a project")
async def save_project_panels(
    request: Request,
    projectId: str = Path(...),
    body: PanelsSaveRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project["project_id"]
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")

        db_panels = _build_panel_dicts(body.panels, include_original=False)
        insert_panels(projectId, db_panels)
        update_project(projectId, {"panels_count": len(body.panels)})
        ip_addr = request.client.host if request.client else "127.0.0.1"
        write_audit_log(current_user["user_id"], "Saved Storyboard Panels", ip_addr, "Success")
        logger.info(f"[Database] Saved {len(body.panels)} panels for project: {projectId}")
        return {"success": True, "saved": len(body.panels)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save panels: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save panels: {e}")


@project_router.post("/{projectId}/tokens", summary="Increment project token usage")
async def increment_project_tokens_route(
    projectId: str = Path(...),
    body: TokenIncrementRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project["project_id"]
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        increment_project_tokens(projectId, body.tokens)
        return {"success": True, "added": body.tokens}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to increment tokens: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to increment tokens: {e}")


@project_router.put("/{projectId}", summary="Update project metadata and panels")
async def update_project_details(
    projectId: str = Path(...),
    body: ProjectUpdateRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        sync_project_to_supabase(projectId, body, current_user["user_id"])

        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project["project_id"]

        if not project:
            insert_project({
                "project_id": projectId,
                "url": body.url or "",
                "title": body.title or "Untitled Project",
                "genre": body.genre or "general",
                "episode": body.episode or "",
                "status": "pending",
                "panels_count": len(body.panels) if body.panels else 0,
                "video_url": None,
                "user_id": current_user["user_id"],
                "author": body.author or "",
                "cover_image": body.cover_image or "",
                "synopsis": body.synopsis or "",
            })
            project = {"user_id": current_user["user_id"]}

        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")

        field_map = {
            "title": body.title, "genre": body.genre, "episode": body.episode,
            "author": body.author, "synopsis": body.synopsis,
            "video_url": body.video_url, "status": body.status,
            "audio_settings": body.audio_settings,
        }
        updates = {k: v for k, v in field_map.items() if v is not None}
        if body.cover_image is not None:
            updates["cover_image"] = unwrap_proxy_url(body.cover_image)

        db_panels = (
            _build_panel_dicts(body.panels, include_original=True)
            if body.panels is not None
            else None
        )
        update_project_full(projectId, updates, db_panels)

        updated = get_project(projectId)
        return {
            "success": True,
            "series_slug": updated.get("series_slug") if updated else None,
            "chapter_slug": updated.get("chapter_slug") if updated else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update project: {e}")


# ── Delete ────────────────────────────────────────────────────────────────

@project_router.post("/batch-delete", summary="Bulk delete multiple projects")
async def batch_delete_projects(
    body: BatchDeleteRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        deleted_count = 0
        for pid in body.project_ids:
            project = get_project(pid)
            if project and project.get("user_id") == current_user["user_id"]:
                delete_project(pid)
                deleted_count += 1
        return {"success": True, "deleted_count": deleted_count}
    except Exception as e:
        logger.error(f"Failed to batch delete projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to batch delete projects: {e}")


@project_router.delete("/series/{seriesId}", summary="Delete a series and its chapters")
async def delete_series_route(
    seriesId: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        conn = get_db_connection()
        row = conn.execute("SELECT user_id FROM series WHERE id = ?", (seriesId,)).fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Series not found.")
        if row["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        delete_project(seriesId)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete series: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete series: {e}")


@project_router.delete("/{projectId}", summary="Delete a project and its panels")
async def delete_single_project(
    projectId: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project["project_id"]
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        delete_panels(projectId)
        delete_project(projectId)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {e}")


# ── Wildcard single-project read (must be LAST) ───────────────────────────

@project_router.get("/{project_id_or_slug}", summary="Get a project and its panels")
async def get_single_project(
    project_id_or_slug: str = Path(..., description="Project ID or Slug"),
    current_user: dict = Depends(get_current_user),
):
    try:
        project = get_project(project_id_or_slug) or get_project_by_slug(project_id_or_slug)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        project_id = project["project_id"]
        if project.get("cover_image"):
            project["cover_image"] = wrap_proxy_url(project["cover_image"])
        elif project.get("first_panel_image"):
            project["cover_image"] = wrap_proxy_url(project["first_panel_image"])
        panels = get_panels(project_id)
        for p in panels:
            if p.get("image_url"):
                p["image_url"] = wrap_proxy_url(p["image_url"])
        return {"success": True, "project": project, "panels": panels}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {e}")


# ── Panel detection ───────────────────────────────────────────────────────
# Imported and re-exported from files.py via the panel_router

import os
import base64
import tempfile

@panel_router.post("/detect", summary="Detect panel bounding boxes (file upload)")
async def detect_panels_upload(
    file: UploadFile = File(..., description="Comic/webtoon image file"),
    sensitivity: float = Form(30.0),
    background_mode: str = Form("auto"),
    min_width_pct: float = Form(0.15),
    min_height_px: int = Form(60),
    merge_threshold: int = Form(20),
    aspect_ratio: str = Form("free"),
    canny_low: int = Form(20),
    canny_high: int = Form(100),
    close_kernel_size: int = Form(15),
    auto_split: bool = Form(True),
):
    image_path = None
    params = dict(
        sensitivity=sensitivity, background_mode=background_mode,
        min_width_pct=min_width_pct, min_height_px=min_height_px,
        merge_threshold=merge_threshold, aspect_ratio=aspect_ratio,
        canny_low=canny_low, canny_high=canny_high,
        close_kernel_size=close_kernel_size, auto_split=auto_split,
    )
    try:
        suffix = os.path.splitext(file.filename or ".png")[1] or ".png"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(await file.read())
            image_path = tmp.name
        panels = _detect(image_path, params)
        return JSONResponse(content={"success": True, "panels": panels, "count": len(panels), "message": f"Detected {len(panels)} panel(s)."})
    except Exception as exc:
        logger.error(f"Panel detection failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        delete_temp_file(image_path)


@panel_router.post("/detect-b64", summary="Detect panel bounding boxes (base64)")
async def detect_panels_base64(body: DetectPanelsBase64Request):
    try:
        raw = base64.b64decode(body.image_base64)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid base64 image data.")
    image_path = None
    params = body.model_dump(exclude={"image_base64"})
    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(raw)
            image_path = tmp.name
        panels = _detect(image_path, params)
        return JSONResponse(content={"success": True, "panels": panels, "count": len(panels), "message": f"Detected {len(panels)} panel(s)."})
    except Exception as exc:
        logger.error(f"Panel detection (base64) failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        delete_temp_file(image_path)
