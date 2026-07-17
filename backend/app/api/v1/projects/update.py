"""
api/v1/projects/update.py
─────────────────────────────────────────────────────────────────────────────
Routes for updating project data: metadata, panels, and token increments.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException, Path, Body, Depends, Request

from api.dependencies.auth import get_current_user
from schemas.project import PanelsSaveRequest, TokenIncrementRequest, ProjectUpdateRequest
from repositories.project_repository import (
    get_project,
    get_project_by_slug,
    insert_project,
    insert_panels,
    update_project,
    increment_project_tokens,
    update_project_full,
)
from repositories.user_repository import write_audit_log
from database.connection import unwrap_proxy_url

logger = logging.getLogger("sonikoma.routes.projects.update")
router = APIRouter()


# ── Shared panel-dict builder ─────────────────────────────────────────────


def _build_panel_dicts(panels, *, include_original: bool = False) -> list:
    result = []
    for p in panels:
        d = {
            "image_url": unwrap_proxy_url(p.image_url),
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
            "detection_style": p.detection_style,
        }
        if include_original:
            d["original_image_url"] = unwrap_proxy_url(p.original_image_url)
        else:
            d["original_url"] = unwrap_proxy_url(p.original_image_url)
        result.append(d)
    return result


# ── Routes ────────────────────────────────────────────────────────────────


@router.post("/{projectId}/panels", summary="Save storyboard panels for a project")
async def save_project_panels(
    request: Request,
    projectId: str = Path(...),
    body: PanelsSaveRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Saving {len(body.panels)} panels for project: {projectId}"
        )
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project["project_id"]

        if not project:
            logger.warning(
                f"[Database] Cannot save panels, project {projectId} not found."
            )
            raise HTTPException(status_code=404, detail="Project not found.")

        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")

        db_panels = _build_panel_dicts(body.panels, include_original=False)
        insert_panels(projectId, db_panels)
        update_project(projectId, {"panels_count": len(body.panels)})

        ip_addr = request.client.host if request.client else "127.0.0.1"
        write_audit_log(current_user["user_id"], "Saved Storyboard Panels", ip_addr, "Success")

        logger.info(
            f"[Database] Saved {len(body.panels)} panels and updated count for project: {projectId}"
        )
        return {"success": True, "saved": len(body.panels)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save panels: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save panels: {e}")


@router.post("/{projectId}/tokens", summary="Increment project token usage")
async def increment_project_tokens_route(
    projectId: str = Path(...),
    body: TokenIncrementRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Incrementing {body.tokens} tokens for project: {projectId}"
        )
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
        logger.info(f"[Database] Added {body.tokens} tokens to project {projectId}.")
        return {"success": True, "added": body.tokens}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to increment tokens: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to increment tokens: {e}"
        )


@router.put("/{projectId}", summary="Update project metadata and panels")
async def update_project_details(
    projectId: str = Path(...),
    body: ProjectUpdateRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Updating project details and/or panels for: {projectId}"
        )

        # ── Supabase sync (best-effort) ───────────────────────────────────
        try:
            from database.supabase import supabase
            if supabase:
                supabase_data = {
                    "id": projectId,
                    "title": body.title or "Untitled Project",
                    "genre": body.genre or "general",
                    "episode": body.episode or "",
                    "author": body.author or "",
                    "cover_image": body.cover_image or "",
                    "synopsis": body.synopsis or "",
                    "panels": (
                        [p.dict(exclude_none=True) for p in body.panels]
                        if body.panels
                        else []
                    ),
                    "user_id": current_user["user_id"],
                    "audio_settings": body.audio_settings,
                }
                supabase.table("projects").upsert(supabase_data).execute()
                logger.info(
                    f"Successfully saved project JSON to Supabase for {projectId}"
                )
        except Exception as e:
            logger.error(f"Failed to sync project JSON to Supabase: {e}")

        # ── Local DB ──────────────────────────────────────────────────────
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project["project_id"]

        if not project:
            logger.info(
                f"[Database] Project {projectId} not found. Creating new row on demand."
            )
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

        # ── Build update dict ─────────────────────────────────────────────
        field_map = {
            "title": body.title,
            "genre": body.genre,
            "episode": body.episode,
            "author": body.author,
            "synopsis": body.synopsis,
            "video_url": body.video_url,
            "status": body.status,
            "audio_settings": body.audio_settings,
        }
        updates = {k: v for k, v in field_map.items() if v is not None}
        if body.cover_image is not None:
            updates["cover_image"] = unwrap_proxy_url(body.cover_image)

        db_panels = None
        if body.panels is not None:
            db_panels = _build_panel_dicts(body.panels, include_original=True)

        update_project_full(projectId, updates, db_panels)

        updated_project = get_project(projectId)
        series_slug = updated_project.get("series_slug") if updated_project else None
        chapter_slug = updated_project.get("chapter_slug") if updated_project else None

        logger.info(
            f"[Database] Project {projectId} updated successfully. "
            f"slugs: {series_slug}/{chapter_slug}"
        )
        return {"success": True, "series_slug": series_slug, "chapter_slug": chapter_slug}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update project: {e}")
