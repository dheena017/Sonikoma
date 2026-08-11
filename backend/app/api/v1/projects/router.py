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

from typing import Optional
from fastapi import APIRouter, HTTPException, Path, Body, Depends, Request, UploadFile, File, Form, Query
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
from repositories.project import (
    get_all_projects,
    get_project,
    get_project_by_slug,
    get_panels,
    insert_project,
    increment_project_tokens,
    delete_panels,
    delete_project,
    get_token_logs,
)
from repositories.user import write_audit_log
from services.project.project_service import (
    ProjectService,
    get_series_details,
    sync_project_to_supabase,
    delete_temp_file,
)
from database.engine import get_db_connection
from api.v1.projects._helpers import wrap_proxy_url
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
        scraped_images = []
        audio_set = project.get("audio_settings") or {}
        if isinstance(audio_set, dict):
            scraped_images_raw = audio_set.get("scraped_images")
            if isinstance(scraped_images_raw, list):
                scraped_images = [wrap_proxy_url(img) for img in scraped_images_raw if img]
        elif project.get("url"):
            try:
                from repositories.scraper import get_latest_scrape_session
                sess = get_latest_scrape_session(project["url"])
                if sess and sess.get("image_urls"):
                    scraped_images = [wrap_proxy_url(img) for img in sess["image_urls"] if img]
            except Exception:
                pass
        return {"success": True, "project": project, "panels": panels, "scraped_images": scraped_images}
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
        try:
            result = project_service.save_project_panels(
                projectId,
                body.panels,
                current_user["user_id"],
                audit_logger=write_audit_log,
                request_client=request.client.host if request.client else "127.0.0.1",
            )
        except ValueError as exc:
            logger.warning(f"[Database] Cannot save panels, project {projectId} not found.")
            raise HTTPException(status_code=404, detail="Project not found.") from exc
        except PermissionError as exc:
            raise HTTPException(status_code=403, detail="Access denied.") from exc

        logger.info(f"[Database] Saved {len(body.panels)} panels for project: {projectId}")
        return result
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

        try:
            result = project_service.update_project_details(projectId, body, current_user["user_id"])
        except PermissionError as exc:
            raise HTTPException(status_code=403, detail="Access denied.") from exc

        return result
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
    job_id: Optional[str] = Query(None, description="Optional Workspace Job ID context"),
    current_user: dict = Depends(get_current_user),
):
    try:
        project = get_project(project_id_or_slug) or get_project_by_slug(project_id_or_slug)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        if job_id and not project.get("job_id"):
            project["job_id"] = job_id
        project_id = project["project_id"]
        if project.get("cover_image"):
            project["cover_image"] = wrap_proxy_url(project["cover_image"])
        elif project.get("first_panel_image"):
            project["cover_image"] = wrap_proxy_url(project["first_panel_image"])
        panels = get_panels(project_id)
        for p in panels:
            if p.get("image_url"):
                p["image_url"] = wrap_proxy_url(p["image_url"])
        scraped_images = []
        audio_set = project.get("audio_settings") or {}
        if isinstance(audio_set, dict):
            scraped_images_raw = audio_set.get("scraped_images")
            if isinstance(scraped_images_raw, list):
                scraped_images = [wrap_proxy_url(img) for img in scraped_images_raw if img]
        elif project.get("url"):
            try:
                from repositories.scraper import get_latest_scrape_session
                sess = get_latest_scrape_session(project["url"])
                if sess and sess.get("image_urls"):
                    scraped_images = [wrap_proxy_url(img) for img in sess["image_urls"] if img]
            except Exception:
                pass
        return {"success": True, "project": project, "panels": panels, "scraped_images": scraped_images}
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
