"""
backend/app/api/v1/projects/settings.py
─────────────────────────────────────────────────────────────────────────────
Project Settings management routes:
- GET/PUT/PATCH /{projectId}/settings          – Centralized settings (video, audio, autocrop)
- GET/PUT/PATCH /{projectId}/settings/video    – Dedicated video rendering settings
- GET/PUT/PATCH /{projectId}/settings/audio    – Dedicated audio & narration settings
- GET/PUT/PATCH /{projectId}/settings/autocrop – Dedicated panel slicing & crop settings
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Path, Body, Depends

try:
    from app.api.dependencies.auth import get_current_user
    from app.schemas.project import (
        ProjectSettingsUpdateRequest,
        VideoSettingsUpdateRequest,
        AudioSettingsUpdateRequest,
        AutoCropSettingsUpdateRequest,
    )
    from app.repositories.project import (
        get_project,
        get_project_by_slug,
        get_project_settings,
        update_project_settings,
    )
except ImportError:
    from api.dependencies.auth import get_current_user
    from schemas.project import (
        ProjectSettingsUpdateRequest,
        VideoSettingsUpdateRequest,
        AudioSettingsUpdateRequest,
        AutoCropSettingsUpdateRequest,
    )
    from repositories.project import (
        get_project,
        get_project_by_slug,
        get_project_settings,
        update_project_settings,
    )

logger = logging.getLogger("sonikoma.routes.projects.settings")
router = APIRouter()


# ── Centralized Settings ──────────────────────────────────────────────────

@router.get("/{projectId}/settings", summary="Get centralized project settings (video, audio, autocrop)")
async def get_project_settings_endpoint(
    projectId: str = Path(..., description="Target Project ID or Slug"),
    current_user: dict = Depends(get_current_user),
):
    try:
        if projectId.startswith("temp_") or projectId.startswith("draft_"):
            return {
                "success": True,
                "project_id": projectId,
                "settings": {
                    "video_settings": {},
                    "audio_settings": {},
                    "autocrop_settings": {},
                },
            }

        project = get_project(projectId) or get_project_by_slug(projectId)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        
        settings = get_project_settings(project["project_id"])
        return {
            "success": True,
            "project_id": project["project_id"],
            "settings": settings or {
                "video_settings": {},
                "audio_settings": {},
                "autocrop_settings": {},
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch project settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch project settings: {e}")


@router.put("/{projectId}/settings", summary="Update centralized project settings (video, audio, autocrop)")
@router.patch("/{projectId}/settings", summary="Patch centralized project settings (video, audio, autocrop)")
async def update_project_settings_endpoint(
    projectId: str = Path(..., description="Target Project ID or Slug"),
    body: ProjectSettingsUpdateRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        if projectId.startswith("temp_") or projectId.startswith("draft_"):
            return {
                "success": True,
                "project_id": projectId,
                "settings": {
                    "video_settings": body.video_settings or {},
                    "audio_settings": body.audio_settings or {},
                    "autocrop_settings": body.autocrop_settings or {},
                },
            }

        project = get_project(projectId) or get_project_by_slug(projectId)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        
        updates = {}
        if body.video_settings is not None:
            updates["video_settings"] = body.video_settings
        if body.audio_settings is not None:
            updates["audio_settings"] = body.audio_settings
        if body.autocrop_settings is not None:
            updates["autocrop_settings"] = body.autocrop_settings

        updated_settings = update_project_settings(project["project_id"], updates)
        return {
            "success": True,
            "project_id": project["project_id"],
            "settings": updated_settings,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update project settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update project settings: {e}")


# ── Video Settings Dedicated Endpoints ─────────────────────────────────────

@router.get("/{projectId}/settings/video", summary="Get dedicated Video & Canvas settings")
async def get_video_settings_endpoint(
    projectId: str = Path(..., description="Target Project ID or Slug"),
    current_user: dict = Depends(get_current_user),
):
    try:
        if projectId.startswith("temp_") or projectId.startswith("draft_"):
            return {
                "success": True,
                "project_id": projectId,
                "video_settings": {},
            }

        project = get_project(projectId) or get_project_by_slug(projectId)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        
        settings = get_project_settings(project["project_id"]) or {}
        return {
            "success": True,
            "project_id": project["project_id"],
            "video_settings": settings.get("video_settings") or {},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch video settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch video settings: {e}")


@router.put("/{projectId}/settings/video", summary="Update dedicated Video & Canvas settings")
@router.patch("/{projectId}/settings/video", summary="Patch dedicated Video & Canvas settings")
async def update_video_settings_endpoint(
    projectId: str = Path(..., description="Target Project ID or Slug"),
    body: VideoSettingsUpdateRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        video_payload = body.video_settings if body.video_settings is not None else body.dict(exclude_unset=True, exclude={"video_settings"})
        if projectId.startswith("temp_") or projectId.startswith("draft_"):
            return {
                "success": True,
                "project_id": projectId,
                "video_settings": video_payload,
            }

        project = get_project(projectId) or get_project_by_slug(projectId)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        
        updated_settings = update_project_settings(project["project_id"], {"video_settings": video_payload})
        return {
            "success": True,
            "project_id": project["project_id"],
            "video_settings": updated_settings.get("video_settings") or {},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update video settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update video settings: {e}")


# ── Audio Settings Dedicated Endpoints ─────────────────────────────────────

@router.get("/{projectId}/settings/audio", summary="Get dedicated Audio & Narration settings")
async def get_audio_settings_endpoint(
    projectId: str = Path(..., description="Target Project ID or Slug"),
    current_user: dict = Depends(get_current_user),
):
    try:
        if projectId.startswith("temp_") or projectId.startswith("draft_"):
            return {
                "success": True,
                "project_id": projectId,
                "audio_settings": {},
            }

        project = get_project(projectId) or get_project_by_slug(projectId)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        
        settings = get_project_settings(project["project_id"]) or {}
        return {
            "success": True,
            "project_id": project["project_id"],
            "audio_settings": settings.get("audio_settings") or {},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch audio settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch audio settings: {e}")


@router.put("/{projectId}/settings/audio", summary="Update dedicated Audio & Narration settings")
@router.patch("/{projectId}/settings/audio", summary="Patch dedicated Audio & Narration settings")
async def update_audio_settings_endpoint(
    projectId: str = Path(..., description="Target Project ID or Slug"),
    body: AudioSettingsUpdateRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        audio_payload = body.audio_settings if body.audio_settings is not None else body.dict(exclude_unset=True, exclude={"audio_settings"})
        if projectId.startswith("temp_") or projectId.startswith("draft_"):
            return {
                "success": True,
                "project_id": projectId,
                "audio_settings": audio_payload,
            }

        project = get_project(projectId) or get_project_by_slug(projectId)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        
        updated_settings = update_project_settings(project["project_id"], {"audio_settings": audio_payload})
        return {
            "success": True,
            "project_id": project["project_id"],
            "audio_settings": updated_settings.get("audio_settings") or {},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update audio settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update audio settings: {e}")


# ── AutoCrop Settings Dedicated Endpoints ──────────────────────────────────

@router.get("/{projectId}/settings/autocrop", summary="Get dedicated Auto-Crop & Panel Slicing settings")
async def get_autocrop_settings_endpoint(
    projectId: str = Path(..., description="Target Project ID or Slug"),
    current_user: dict = Depends(get_current_user),
):
    try:
        if projectId.startswith("temp_") or projectId.startswith("draft_"):
            return {
                "success": True,
                "project_id": projectId,
                "autocrop_settings": {},
            }

        project = get_project(projectId) or get_project_by_slug(projectId)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        
        settings = get_project_settings(project["project_id"]) or {}
        return {
            "success": True,
            "project_id": project["project_id"],
            "autocrop_settings": settings.get("autocrop_settings") or {},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch autocrop settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch autocrop settings: {e}")


@router.put("/{projectId}/settings/autocrop", summary="Update dedicated Auto-Crop & Panel Slicing settings")
@router.patch("/{projectId}/settings/autocrop", summary="Patch dedicated Auto-Crop & Panel Slicing settings")
async def update_autocrop_settings_endpoint(
    projectId: str = Path(..., description="Target Project ID or Slug"),
    body: AutoCropSettingsUpdateRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        autocrop_payload = body.autocrop_settings if body.autocrop_settings is not None else body.dict(exclude_unset=True, exclude={"autocrop_settings"})
        if projectId.startswith("temp_") or projectId.startswith("draft_"):
            return {
                "success": True,
                "project_id": projectId,
                "autocrop_settings": autocrop_payload,
            }

        project = get_project(projectId) or get_project_by_slug(projectId)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        
        updated_settings = update_project_settings(project["project_id"], {"autocrop_settings": autocrop_payload})
        return {
            "success": True,
            "project_id": project["project_id"],
            "autocrop_settings": updated_settings.get("autocrop_settings") or {},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update autocrop settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update autocrop settings: {e}")
