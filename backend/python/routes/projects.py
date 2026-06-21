"""
backend/python/routes/projects.py
─────────────────────────────────────────────────────────────────────────────
Project History and Panel management routes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, HTTPException, Path, Body, Depends, Request
from pydantic import BaseModel, Field
from routes.auth_routes import get_current_user

import database.db as db

logger = logging.getLogger("anivox.routes.projects")
router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────────────────────

class ProjectCreateRequest(BaseModel):
    project_id: str = Field(..., description="Unique Project ID")
    url: str = Field(..., description="Original Webtoon episode URL")
    title: Optional[str] = Field("Untitled Webtoon")
    genre: Optional[str] = Field("general")
    episode: Optional[str] = Field("")
    panels_count: Optional[int] = Field(0)
    video_url: Optional[str] = Field(None)
    author: Optional[str] = Field(None)
    cover_image: Optional[str] = Field(None)
    synopsis: Optional[str] = Field(None)

class PanelSaveItem(BaseModel):
    image_url: Optional[str] = Field("")
    original_image_url: Optional[str] = Field(None, alias="original_url")
    speech_text: Optional[str] = Field("")
    sfx: Optional[str] = Field("")
    duration: Optional[float] = Field(0.0)
    motion_type: Optional[str] = Field("")
    visual_description: Optional[str] = Field(None)
    brightness: Optional[float] = Field(None)
    contrast: Optional[float] = Field(None)
    saturation: Optional[float] = Field(None)
    grayscale: Optional[bool] = Field(False)
    filter_preset: Optional[str] = Field(None)
    bubble_method: Optional[str] = Field(None)
    bubble_sensitivity: Optional[float] = Field(None)
    bubble_dilation: Optional[float] = Field(None)
    inpaint_radius: Optional[int] = Field(None)
    detection_style: Optional[str] = Field(None)

    class Config:
        populate_by_name = True

class PanelsSaveRequest(BaseModel):
    panels: List[PanelSaveItem] = Field(..., description="Curated panel items list")


class ProjectUpdateRequest(BaseModel):
    url: Optional[str] = Field(None, description="Original Webtoon episode URL")
    title: Optional[str] = Field(None, description="Series Title")
    genre: Optional[str] = Field(None, description="Series Genre")
    episode: Optional[str] = Field(None, description="Chapter/Episode Number")
    author: Optional[str] = Field(None, description="Series Author")
    cover_image: Optional[str] = Field(None, description="Series Cover Image URL")
    synopsis: Optional[str] = Field(None, description="Series Synopsis")
    panels: Optional[List[PanelSaveItem]] = Field(None, description="Storyboard panels list")



# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("", summary="Get all projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"[Database] Fetching project histories for user {current_user['user_id']} from local SQLite...")
        projects = db.get_all_projects(user_id=current_user['user_id'])
        
        # Ensure all project cover images are proxied if external
        from urllib.parse import quote
        for proj in projects:
            if proj.get("cover_image") and proj["cover_image"].startswith("http") and "/api/" not in proj["cover_image"]:
                proj["cover_image"] = f"/api/proxy-image?url={quote(proj['cover_image'])}"
                
        logger.info(f"[Database] Retrieved {len(projects)} projects.")
        return {"success": True, "projects": projects}
    except Exception as e:
        logger.error(f"Failed to fetch projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {e}")


@router.get("/{project_id_or_slug}", summary="Get a project and its panels")
async def get_single_project(
    project_id_or_slug: str = Path(..., description="Project ID or Slug"),
    current_user: dict = Depends(get_current_user)
):
    try:
        logger.info(f"[Database] Querying project details and panels for: {project_id_or_slug}")
        # Try finding by ID first, then by slug
        project = db.get_project(project_id_or_slug)
        if not project:
            project = db.get_project_by_slug(project_id_or_slug)

        if not project:
            logger.warning(f"[Database] Project {project_id_or_slug} not found.")
            raise HTTPException(status_code=404, detail="Project not found.")
        
        # Verify ownership
        if project.get("user_id") != current_user["user_id"]:
            logger.warning(f"[Database] Access denied for user {current_user['user_id']} to project {project_id_or_slug}")
            raise HTTPException(status_code=403, detail="Access denied.")

        project_id = project["project_id"]

        from urllib.parse import quote
        # Ensure project cover image is proxied
        if project.get("cover_image") and project["cover_image"].startswith("http") and "/api/" not in project["cover_image"]:
            project["cover_image"] = f"/api/proxy-image?url={quote(project['cover_image'])}"

        panels = db.get_panels(project_id)
        # Ensure all panel images are proxied
        for p in panels:
            img = p.get("image_url")
            if img and img.startswith("http") and "/api/" not in img:
                p["image_url"] = f"/api/proxy-image?url={quote(img)}"

        logger.info(f"[Database] Project {project_id_or_slug} found with {len(panels)} panels.")
        return {"success": True, "project": project, "panels": panels}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {e}")


@router.post("", summary="Create a new project entry")
async def create_project(body: ProjectCreateRequest, current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"[Database] Attempting to create new project: {body.project_id} for user {current_user['user_id']}")
        # Check if project already exists to avoid UniqueConstraint errors
        existing = db.get_project(body.project_id)
        if existing:
            logger.info(f"[Database] Project {body.project_id} already exists. Skipping insertion.")
            return {"success": True, "project_id": body.project_id, "message": "Project already exists."}
            
        db.insert_project({
            "project_id": body.project_id,
            "url": body.url,
            "title": body.title,
            "genre": body.genre,
            "episode": body.episode,
            "status": "pending",
            "panels_count": body.panels_count,
            "video_url": body.video_url,
            "user_id": current_user["user_id"],
            "author": body.author,
            "cover_image": body.cover_image,
            "synopsis": body.synopsis
        })
        logger.info(f"[Database] Created project {body.project_id} successfully: '{body.title}'")
        return {"success": True, "project_id": body.project_id}
    except Exception as e:
        logger.error(f"Failed to save project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save project: {e}")


@router.post("/{projectId}/panels", summary="Save storyboard panels for a project")
async def save_project_panels(
    request: Request,
    projectId: str = Path(...),
    body: PanelsSaveRequest = Body(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        logger.info(f"[Database] Saving {len(body.panels)} panels for project: {projectId}")
        # Check if project exists
        project = db.get_project(projectId)
        if not project:
            project = db.get_project_by_slug(projectId)
            if project:
                projectId = project['project_id']

        if not project:
            logger.warning(f"[Database] Cannot save panels, project {projectId} not found.")
            raise HTTPException(status_code=404, detail="Project not found.")

        # Verify ownership
        if project.get("user_id") != current_user["user_id"]:
            logger.warning(f"[Database] Access denied for user {current_user['user_id']} to modify project {projectId}")
            raise HTTPException(status_code=403, detail="Access denied.")

        # Re-map panel items to database format
        db_panels = []
        for p in body.panels:
            # Ensure alias resolves original_image_url
            orig_url = p.original_image_url
            db_panels.append({
                "image_url": p.image_url,
                "original_url": orig_url,
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
            
        db.insert_panels(projectId, db_panels)
        db.update_project(projectId, {"panels_count": len(body.panels)})
        
        # Write to audit log
        ip_addr = request.client.host if request.client else "127.0.0.1"
        db.write_audit_log(current_user["user_id"], "Saved Storyboard Panels", ip_addr, "Success")
        
        logger.info(f"[Database] Saved {len(body.panels)} panels and updated count for project: {projectId}")
        return {"success": True, "saved": len(body.panels)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save panels: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save panels: {e}")


@router.put("/{projectId}", summary="Update project metadata and panels")
async def update_project_details(
    projectId: str = Path(...),
    body: ProjectUpdateRequest = Body(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        logger.info(f"[Database] Updating project details and/or panels for: {projectId}")
        project = db.get_project(projectId)
        if not project:
            project = db.get_project_by_slug(projectId)
            if project:
                projectId = project['project_id']

        if not project:
            logger.info(f"[Database] Project {projectId} not found. Creating new project row on demand.")
            db.insert_project({
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

        # Verify ownership
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
            updates['cover_image'] = body.cover_image
        if body.synopsis is not None:
            updates['synopsis'] = body.synopsis

        db_panels = None
        if body.panels is not None:
            db_panels = []
            for p in body.panels:
                db_panels.append({
                    "image_url": p.image_url,
                    "original_image_url": p.original_image_url,
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

        db.update_project_full(projectId, updates, db_panels)
        logger.info(f"[Database] Project {projectId} updated successfully.")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update project: {e}")


@router.delete("/{projectId}", summary="Delete a project and its panels")
async def delete_single_project(projectId: str = Path(...), current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"[Database] Deleting project and panels for: {projectId}")
        project = db.get_project(projectId)
        if not project:
            project = db.get_project_by_slug(projectId)
            if project:
                projectId = project['project_id']

        if not project:
            logger.warning(f"[Database] Project {projectId} not found for deletion.")
            raise HTTPException(status_code=404, detail="Project not found.")

        # Verify ownership
        if project.get("user_id") != current_user["user_id"]:
            logger.warning(f"[Database] Access denied for user {current_user['user_id']} to delete project {projectId}")
            raise HTTPException(status_code=403, detail="Access denied.")

        db.delete_project(projectId)
        logger.info(f"[Database] Deleted project and panels successfully: {projectId}")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {e}")


@router.get("/series/{series_id_or_slug}", summary="Get a series details")
async def get_series_route(series_id_or_slug: str = Path(...), current_user: dict = Depends(get_current_user)):
    try:
        # Try by ID
        conn = db.get_db_connection()
        row = conn.execute("SELECT * FROM series WHERE id = ?", (series_id_or_slug,)).fetchone()
        if not row:
            # Try by slug
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

@router.delete("/series/{seriesId}", summary="Delete a series and all its chapters")
async def delete_series_route(seriesId: str = Path(...), current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"[Database] Deleting series for: {seriesId}")
        # Verify ownership: check that the series belongs to current_user
        conn = db.get_db_connection()
        row = conn.execute("SELECT user_id FROM series WHERE id = ?", (seriesId,)).fetchone()
        conn.close()
        
        if not row:
            logger.warning(f"[Database] Series {seriesId} not found for deletion.")
            raise HTTPException(status_code=404, detail="Series not found.")
            
        if row['user_id'] != current_user['user_id']:
            logger.warning(f"[Database] Access denied for user {current_user['user_id']} to delete series {seriesId}")
            raise HTTPException(status_code=403, detail="Access denied.")
            
        db.delete_series(seriesId)
        logger.info(f"[Database] Deleted series successfully: {seriesId}")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete series: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete series: {e}")


class BatchDeleteRequest(BaseModel):
    project_ids: List[str] = Field(..., description="List of Project IDs to delete")

@router.post("/batch-delete", summary="Bulk delete multiple projects")
async def batch_delete_projects(body: BatchDeleteRequest, current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"[Database] Bulk deleting {len(body.project_ids)} projects for user {current_user['user_id']}...")
        deleted_count = 0
        for pid in body.project_ids:
            project = db.get_project(pid)
            if project:
                if project.get("user_id") == current_user["user_id"]:
                    db.delete_project(pid)
                    deleted_count += 1
        logger.info(f"[Database] Successfully deleted {deleted_count} projects out of {len(body.project_ids)} requested.")
        return {"success": True, "deleted_count": deleted_count}
    except Exception as e:
        logger.error(f"Failed to batch delete projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to batch delete projects: {e}")
