"""
backend/app/api/v1/projects.py
─────────────────────────────────────────────────────────────────────────────
Project History and Panel management routes.
Acts as a thin controller delegating database operations to project/user repositories.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import os
import tempfile
import base64
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Path, Body, Depends, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse

from routes.auth_routes import get_current_user, get_admin_user
from schemas.project import (
    ProjectCreateRequest,
    PanelsSaveRequest,
    TokenIncrementRequest,
    ProjectUpdateRequest,
    BatchDeleteRequest,
    DetectPanelsBase64Request
)

# Import Repositories and database helpers directly
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
    insert_token_log
)
from repositories.user_repository import write_audit_log
from infrastructure.database.connection import get_db_connection, unwrap_proxy_url
from media.image.detect_panels import run_cv_detection

logger = logging.getLogger("sonikoma.routes.projects")
project_router = APIRouter()
panel_router = APIRouter()
router = project_router


def wrap_proxy_url(url_str: str) -> str:
    cleaned = unwrap_proxy_url(url_str)
    if not cleaned:
        return ""
    if cleaned.startswith("http") and "/api/" not in cleaned:
        from urllib.parse import quote
        return f"/api/proxy-image?url={quote(cleaned)}"
    return cleaned


def calculate_and_save_token_usage(project_id: str, panels: List[dict], price_per_million: float = 0.50) -> dict:
    """
    Sums the total token usage across all panels in a project,
    calculates estimated cost, and saves to Supabase and local DB.
    """
    import uuid
    input_tokens = sum(panel.get("inputTokens", 0) for panel in panels)
    output_tokens = sum(panel.get("outputTokens", 0) for panel in panels)
    total_tokens = input_tokens + output_tokens

    cost = round((total_tokens / 1_000_000.0) * price_per_million, 6)

    usage_metrics = {
        "inputTokens": input_tokens,
        "outputTokens": output_tokens,
        "totalTokens": total_tokens,
        "estimatedCostUSD": cost
    }

    log_id = str(uuid.uuid4())

    try:
        insert_token_log(log_id, project_id, input_tokens, output_tokens, total_tokens, cost)
    except Exception as e:
        logger.error(f"Failed to insert local token usage log: {e}")

    try:
        from db import supabase
        if supabase:
            supabase.table("projects").update({"usage_metrics": usage_metrics}).eq("id", project_id).execute()
            supabase.table("token_usage_logs").insert({
                "id": log_id,
                "project_id": project_id,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "estimated_cost_usd": cost
            }).execute()
            logger.info(f"Saved usage metrics for project {project_id}: {usage_metrics}")
    except Exception as e:
        logger.error(f"Failed to save token usage metrics to Supabase: {e}")

    return usage_metrics


# ─── Project Routes ───────────────────────────────────────────────────────────

@project_router.get("", summary="Get all projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"[Database] Fetching project histories for user {current_user['user_id']} from local SQLite...")
        projects = get_all_projects(user_id=current_user['user_id'])

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


@project_router.get("/{project_id_or_slug}", summary="Get a project and its panels")
async def get_single_project(
    project_id_or_slug: str = Path(..., description="Project ID or Slug"),
    current_user: dict = Depends(get_current_user)
):
    try:
        logger.info(f"[Database] Querying project details and panels for: {project_id_or_slug}")
        project = get_project(project_id_or_slug)
        if not project:
            project = get_project_by_slug(project_id_or_slug)

        if not project:
            logger.warning(f"[Database] Project {project_id_or_slug} not found.")
            raise HTTPException(status_code=404, detail="Project not found.")

        if project.get("user_id") != current_user["user_id"]:
            logger.warning(f"[Database] Access denied for user {current_user['user_id']} to project {project_id_or_slug}")
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

        logger.info(f"[Database] Project {project_id_or_slug} found with {len(panels)} panels.")
        return {"success": True, "project": project, "panels": panels}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {e}")


@project_router.post("", summary="Create a new project entry")
async def create_project(body: ProjectCreateRequest, current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"[Database] Attempting to create new project: {body.project_id} for user {current_user['user_id']}")
        existing = get_project(body.project_id)
        if existing:
            logger.info(f"[Database] Project {body.project_id} already exists. Skipping insertion.")
            return {"success": True, "project_id": body.project_id, "message": "Project already exists."}

        insert_project({
            "project_id": body.project_id,
            "url": unwrap_proxy_url(body.url),
            "title": body.title,
            "genre": body.genre,
            "episode": body.episode,
            "status": "pending",
            "panels_count": body.panels_count,
            "video_url": body.video_url,
            "user_id": current_user["user_id"],
            "author": body.author,
            "cover_image": unwrap_proxy_url(body.cover_image),
            "synopsis": body.synopsis
        })
        logger.info(f"[Database] Created project {body.project_id} successfully: '{body.title}'")
        return {"success": True, "project_id": body.project_id}
    except Exception as e:
        logger.error(f"Failed to save project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save project: {e}")


@project_router.post("/{projectId}/panels", summary="Save storyboard panels for a project")
async def save_project_panels(
    request: Request,
    projectId: str = Path(...),
    body: PanelsSaveRequest = Body(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        logger.info(f"[Database] Saving {len(body.panels)} panels for project: {projectId}")
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project['project_id']

        if not project:
            logger.warning(f"[Database] Cannot save panels, project {projectId} not found.")
            raise HTTPException(status_code=404, detail="Project not found.")

        if project.get("user_id") != current_user["user_id"]:
            logger.warning(f"[Database] Access denied for user {current_user['user_id']} to modify project {projectId}")
            raise HTTPException(status_code=403, detail="Access denied.")

        db_panels = []
        for p in body.panels:
            orig_url = p.original_image_url
            db_panels.append({
                "image_url": unwrap_proxy_url(p.image_url),
                "original_url": unwrap_proxy_url(orig_url),
                "speech_text": p.speech_text,
                "sfx": p.sfx,
                "duration": p.duration,
                "motion_type": p.motion_type,
                "visual_description": p.visual_description,
                "brightness": p.brightness,
                "contrast": p.contrast,
                "saturation": p.saturation,
                "grayscale": p.grayscale,
                "filter_preset": p.filter_preset,
                "bubble_method": p.bubble_method,
                "bubble_sensitivity": p.bubble_sensitivity,
                "bubble_dilation": p.bubble_dilation,
                "inpaint_radius": p.inpaint_radius,
                "detection_style": p.detection_style
            })

        insert_panels(projectId, db_panels)
        update_project(projectId, {"panels_count": len(body.panels)})

        ip_addr = request.client.host if request.client else "127.0.0.1"
        write_audit_log(current_user["user_id"], "Saved Storyboard Panels", ip_addr, "Success")

        logger.info(f"[Database] Saved {len(body.panels)} panels and updated count for project: {projectId}")
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
    current_user: dict = Depends(get_current_user)
):
    try:
        logger.info(f"[Database] Incrementing {body.tokens} tokens for project: {projectId}")
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project['project_id']

        if not project:
            logger.warning(f"[Database] Cannot increment tokens, project {projectId} not found.")
            raise HTTPException(status_code=404, detail="Project not found.")

        if project.get("user_id") != current_user["user_id"]:
            logger.warning(f"[Database] Access denied for user {current_user['user_id']} to modify project {projectId}")
            raise HTTPException(status_code=403, detail="Access denied.")

        increment_project_tokens(projectId, body.tokens)
        logger.info(f"[Database] Added {body.tokens} tokens to project {projectId}.")
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
    current_user: dict = Depends(get_current_user)
):
    try:
        logger.info(f"[Database] Updating project details and/or panels for: {projectId}")

        try:
            from db import supabase
            if supabase:
                supabase_data = {
                    "id": projectId,
                    "title": body.title or "Untitled Project",
                    "genre": body.genre or "general",
                    "episode": body.episode or "",
                    "author": body.author or "",
                    "cover_image": body.cover_image or "",
                    "synopsis": body.synopsis or "",
                    "panels": [p.dict(exclude_none=True) for p in body.panels] if body.panels else [],
                    "user_id": current_user["user_id"],
                    "audio_settings": body.audio_settings
                }
                supabase.table("projects").upsert(supabase_data).execute()
                logger.info(f"Successfully saved project JSON to Supabase for {projectId}")
        except Exception as e:
            logger.error(f"Failed to sync project JSON to Supabase: {e}")

        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project['project_id']

        if not project:
            logger.info(f"[Database] Project {projectId} not found. Creating new project row on demand.")
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
            logger.warning(f"[Database] Access denied for user {current_user['user_id']} to modify project {projectId}")
            raise HTTPException(status_code=403, detail="Access denied.")

        updates = {}
        if body.title is not None:
            updates['title'] = body.title
        if body.genre is not None:
            updates['genre'] = body.genre
        if body.episode is not None:
            updates['episode'] = body.episode
        if body.author is not None:
            updates['author'] = body.author
        if body.cover_image is not None:
            updates['cover_image'] = unwrap_proxy_url(body.cover_image)
        if body.synopsis is not None:
            updates['synopsis'] = body.synopsis
        if body.video_url is not None:
            updates['video_url'] = body.video_url
        if body.status is not None:
            updates['status'] = body.status
        if body.audio_settings is not None:
            updates['audio_settings'] = body.audio_settings

        db_panels = None
        if body.panels is not None:
            db_panels = []
            for p in body.panels:
                db_panels.append({
                    "image_url": unwrap_proxy_url(p.image_url),
                    "original_image_url": unwrap_proxy_url(p.original_image_url),
                    "speech_text": p.speech_text,
                    "sfx": p.sfx,
                    "duration": p.duration,
                    "motion_type": p.motion_type,
                    "visual_description": p.visual_description,
                    "brightness": p.brightness,
                    "contrast": p.contrast,
                    "saturation": p.saturation,
                    "grayscale": p.grayscale,
                    "filter_preset": p.filter_preset,
                    "bubble_method": p.bubble_method,
                    "bubble_sensitivity": p.bubble_sensitivity,
                    "bubble_dilation": p.bubble_dilation,
                    "inpaint_radius": p.inpaint_radius,
                    "detection_style": p.detection_style
                })

        update_project_full(projectId, updates, db_panels)

        updated_project = get_project(projectId)
        series_slug = updated_project.get("series_slug") if updated_project else None
        chapter_slug = updated_project.get("chapter_slug") if updated_project else None

        logger.info(f"[Database] Project {projectId} updated successfully. slugs: {series_slug}/{chapter_slug}")
        return {
            "success": True,
            "series_slug": series_slug,
            "chapter_slug": chapter_slug
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update project: {e}")


@project_router.delete("/{projectId}", summary="Delete a project and its panels")
async def delete_single_project(projectId: str = Path(...), current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"[Database] Deleting project and panels for: {projectId}")
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project['project_id']

        if not project:
            logger.warning(f"[Database] Project {projectId} not found for deletion.")
            raise HTTPException(status_code=404, detail="Project not found.")

        if project.get("user_id") != current_user["user_id"]:
            logger.warning(f"[Database] Access denied for user {current_user['user_id']} to delete project {projectId}")
            raise HTTPException(status_code=403, detail="Access denied.")

        delete_panels(projectId)
        delete_project(projectId)
        logger.info(f"[Database] Deleted project and panels successfully: {projectId}")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {e}")


@project_router.get("/series/{series_id_or_slug}", summary="Get a series details")
async def get_series_route(series_id_or_slug: str = Path(...), current_user: dict = Depends(get_current_user)):
    try:
        conn = get_db_connection()
        row = conn.execute("SELECT * FROM series WHERE id = ?", (series_id_or_slug,)).fetchone()
        if not row:
            row = conn.execute("SELECT * FROM series WHERE slug = ?", (series_id_or_slug,)).fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Series not found.")

        series = dict(row)
        if series['user_id'] != current_user['user_id']:
            raise HTTPException(status_code=403, detail="Access denied.")

        return {"success": True, "series": series}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch series: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@project_router.delete("/series/{seriesId}", summary="Delete a series and all its chapters")
async def delete_series_route(seriesId: str = Path(...), current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"[Database] Deleting series for: {seriesId}")
        conn = get_db_connection()
        row = conn.execute("SELECT user_id FROM series WHERE id = ?", (seriesId,)).fetchone()
        conn.close()

        if not row:
            logger.warning(f"[Database] Series {seriesId} not found for deletion.")
            raise HTTPException(status_code=404, detail="Series not found.")

        if row['user_id'] != current_user['user_id']:
            logger.warning(f"[Database] Access denied for user {current_user['user_id']} to delete series {seriesId}")
            raise HTTPException(status_code=403, detail="Access denied.")

        delete_project(seriesId)  # Falls back to series deletion in repo
        logger.info(f"[Database] Deleted series successfully: {seriesId}")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete series: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete series: {e}")


@project_router.post("/batch-delete", summary="Bulk delete multiple projects")
async def batch_delete_projects(body: BatchDeleteRequest, current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"[Database] Bulk deleting {len(body.project_ids)} projects for user {current_user['user_id']}...")
        deleted_count = 0
        for pid in body.project_ids:
            project = get_project(pid)
            if project:
                if project.get("user_id") == current_user["user_id"]:
                    delete_project(pid)
                    deleted_count += 1
        logger.info(f"[Database] Successfully deleted {deleted_count} projects out of {len(body.project_ids)} requested.")
        return {"success": True, "deleted_count": deleted_count}
    except Exception as e:
        logger.error(f"Failed to batch delete projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to batch delete projects: {e}")


@project_router.get("/public/{project_id}", summary="Get a project and its panels publicly (no auth)")
async def get_public_project(project_id: str = Path(..., description="Project ID")):
    try:
        logger.info(f"[Database] Public query for project details and panels: {project_id}")
        project = get_project(project_id)
        if not project:
            project = get_project_by_slug(project_id)

        if not project:
            logger.warning(f"[Database] Public project {project_id} not found.")
            raise HTTPException(status_code=404, detail="Project not found.")

        if project.get("cover_image"):
            project["cover_image"] = wrap_proxy_url(project["cover_image"])
        elif project.get("first_panel_image"):
            project["cover_image"] = wrap_proxy_url(project["first_panel_image"])

        panels = get_panels(project["project_id"])
        for p in panels:
            if p.get("image_url"):
                p["image_url"] = wrap_proxy_url(p["image_url"])

        logger.info(f"[Database] Public project {project_id} found with {len(panels)} panels.")
        return {"success": True, "project": project, "panels": panels}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch public project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch public project: {e}")


@project_router.get("/analytics/tokens", summary="Get token usage history for user's projects")
async def get_token_analytics(current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"Fetching token analytics for user: {current_user['user_id']}")
        logs = get_token_logs(current_user['user_id'])
        return {"success": True, "token_logs": logs}
    except Exception as e:
        logger.error(f"Failed to fetch token analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch token analytics")


# ─── Panel Detection Routes ───────────────────────────────────────────────────

def _detect(image_path: str, params: dict) -> List[dict]:
    return run_cv_detection(
        image_path=image_path,
        sensitivity=params["sensitivity"],
        bg_mode=params["background_mode"],
        min_width_pct=params["min_width_pct"],
        min_height_px=params["min_height_px"],
        merge_threshold=params["merge_threshold"],
        aspect_ratio_str=params["aspect_ratio"],
        canny_low=params["canny_low"],
        canny_high=params["canny_high"],
        close_kernel_size=params["close_kernel_size"],
        auto_split=params.get("auto_split", True),
    )


@panel_router.post("/detect", summary="Detect panel bounding boxes in a comic image (file upload)")
async def detect_panels_upload(
    file: UploadFile = File(..., description="Comic/webtoon image file"),
    sensitivity: float       = Form(30.0),
    background_mode: str     = Form("auto"),
    min_width_pct: float     = Form(0.15),
    min_height_px: int       = Form(60),
    merge_threshold: int     = Form(20),
    aspect_ratio: str        = Form("free"),
    canny_low: int           = Form(20),
    canny_high: int          = Form(100),
    close_kernel_size: int   = Form(15),
    auto_split: bool         = Form(True),
):
    image_path = None
    params = dict(
        sensitivity=sensitivity,
        background_mode=background_mode,
        min_width_pct=min_width_pct,
        min_height_px=min_height_px,
        merge_threshold=merge_threshold,
        aspect_ratio=aspect_ratio,
        canny_low=canny_low,
        canny_high=canny_high,
        close_kernel_size=close_kernel_size,
        auto_split=auto_split,
    )

    try:
        suffix = os.path.splitext(file.filename or ".png")[1] or ".png"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(await file.read())
            image_path = tmp.name

        logger.info(f"[Panel Detection] Processing uploaded file: {file.filename}")
        panels = _detect(image_path, params)
        logger.info(f"[Panel Detection] Successfully detected {len(panels)} panels.")
        return JSONResponse(content={
            "success": True,
            "panels": panels,
            "count": len(panels),
            "message": f"Detected {len(panels)} panel(s).",
        })
    except Exception as exc:
        logger.error(f"Panel detection failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if image_path:
            try:
                if os.path.exists(image_path):
                    os.remove(image_path)
            except OSError:
                pass


@panel_router.post("/detect-b64", summary="Detect panel bounding boxes from a base64-encoded image")
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

        logger.info("[Panel Detection] Processing base64 image")
        panels = _detect(image_path, params)
        logger.info(f"[Panel Detection] Successfully detected {len(panels)} panels.")
        return JSONResponse(content={
            "success": True,
            "panels": panels,
            "count": len(panels),
            "message": f"Detected {len(panels)} panel(s).",
        })
    except Exception as exc:
        logger.error(f"Panel detection (base64) failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if image_path:
            try:
                if os.path.exists(image_path):
                    os.remove(image_path)
            except OSError:
                pass
