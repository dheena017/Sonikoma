"""
backend/python/routes/projects.py
─────────────────────────────────────────────────────────────────────────────
Project History and Panel management routes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, HTTPException, Path, Body
from pydantic import BaseModel, Field

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

class PanelSaveItem(BaseModel):
    image_url: Optional[str] = Field("")
    original_image_url: Optional[str] = Field(None, alias="original_url")
    speech_text: Optional[str] = Field("")
    sfx: Optional[str] = Field("")
    duration: Optional[float] = Field(4.5)
    motion_type: Optional[str] = Field("zoom_in")
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


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("", summary="Get all projects")
async def get_projects():
    try:
        logger.info("[Database] Fetching all project histories from local SQLite...")
        projects = db.get_all_projects()
        logger.info(f"[Database] Retrieved {len(projects)} projects.")
        return {"success": True, "projects": projects}
    except Exception as e:
        logger.error(f"Failed to fetch projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {e}")


@router.get("/{projectId}", summary="Get a project and its panels")
async def get_single_project(projectId: str = Path(..., description="Project ID")):
    try:
        logger.info(f"[Database] Querying project details and panels for: {projectId}")
        project = db.get_project(projectId)
        if not project:
            logger.warning(f"[Database] Project {projectId} not found.")
            raise HTTPException(status_code=404, detail="Project not found.")
        panels = db.get_panels(projectId)
        logger.info(f"[Database] Project {projectId} found with {len(panels)} panels.")
        return {"success": True, "project": project, "panels": panels}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {e}")


@router.post("", summary="Create a new project entry")
async def create_project(body: ProjectCreateRequest):
    try:
        logger.info(f"[Database] Attempting to create new project: {body.project_id}")
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
            "video_url": body.video_url
        })
        logger.info(f"[Database] Created project {body.project_id} successfully: '{body.title}'")
        return {"success": True, "project_id": body.project_id}
    except Exception as e:
        logger.error(f"Failed to save project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save project: {e}")


@router.post("/{projectId}/panels", summary="Save storyboard panels for a project")
async def save_project_panels(projectId: str = Path(...), body: PanelsSaveRequest = Body(...)):
    try:
        logger.info(f"[Database] Saving {len(body.panels)} panels for project: {projectId}")
        # Check if project exists
        project = db.get_project(projectId)
        if not project:
            logger.warning(f"[Database] Cannot save panels, project {projectId} not found.")
            raise HTTPException(status_code=404, detail="Project not found.")

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
        logger.info(f"[Database] Saved {len(body.panels)} panels and updated count for project: {projectId}")
        return {"success": True, "saved": len(body.panels)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save panels: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save panels: {e}")


@router.delete("/{projectId}", summary="Delete a project and its panels")
async def delete_single_project(projectId: str = Path(...)):
    try:
        logger.info(f"[Database] Deleting project and panels for: {projectId}")
        project = db.get_project(projectId)
        if not project:
            logger.warning(f"[Database] Project {projectId} not found for deletion.")
            raise HTTPException(status_code=404, detail="Project not found.")
        db.delete_project(projectId)
        logger.info(f"[Database] Deleted project and panels successfully: {projectId}")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {e}")
