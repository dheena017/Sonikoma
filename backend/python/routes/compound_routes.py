"""
backend/python/routes/compound_routes.py
─────────────────────────────────────────────────────────────────────────────
Compound orchestration routes for multi-step media workflows.
"""

import os
import sys
import logging
import uuid
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.compound_processor import get_compound_processor, WorkflowType

logger = logging.getLogger("sonikoma.routes.compound_routes")
router = APIRouter()
processor = get_compound_processor()


class VideoCutSpec(BaseModel):
    start: float = Field(..., ge=0.0)
    end: float = Field(..., gt=0.0)
    fade_in: Optional[float] = Field(0.0, ge=0.0)
    fade_out: Optional[float] = Field(0.0, ge=0.0)


class VideoEditingWorkflowRequest(BaseModel):
    video_path: str
    cuts: List[VideoCutSpec]
    audio_path: Optional[str] = None
    output_dir: Optional[str] = None


class AudioEnhancementWorkflowRequest(BaseModel):
    audio_path: str
    transcribe: Optional[bool] = True
    analyze: Optional[bool] = True
    output_dir: Optional[str] = None


class ImageGenerationWorkflowRequest(BaseModel):
    prompts: List[str]
    enhance: Optional[bool] = True
    output_dir: Optional[str] = None


@router.post("/workflow/video-editing", summary="Run a video editing workflow")
async def run_video_editing_workflow(body: VideoEditingWorkflowRequest):
    workflow_id = f"video_editing_{uuid.uuid4().hex[:8]}"
    try:
        result = await processor.video_editing_workflow(
            workflow_id=workflow_id,
            video_path=body.video_path,
            cuts=[cut.dict() for cut in body.cuts],
            audio_path=body.audio_path,
            output_dir=body.output_dir or ""
        )
        return {"success": True, "workflow_id": workflow_id, "result": result}
    except Exception as exc:
        logger.error(f"Video editing workflow failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/workflow/audio-enhancement", summary="Run an audio enhancement workflow")
async def run_audio_enhancement_workflow(body: AudioEnhancementWorkflowRequest):
    workflow_id = f"audio_enhancement_{uuid.uuid4().hex[:8]}"
    try:
        result = await processor.audio_enhancement_workflow(
            workflow_id=workflow_id,
            audio_path=body.audio_path,
            transcribe=body.transcribe,
            analyze=body.analyze,
            output_dir=body.output_dir or ""
        )
        return {"success": True, "workflow_id": workflow_id, "result": result}
    except Exception as exc:
        logger.error(f"Audio enhancement workflow failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/workflow/image-generation", summary="Run an image generation workflow")
async def run_image_generation_workflow(body: ImageGenerationWorkflowRequest):
    workflow_id = f"image_generation_{uuid.uuid4().hex[:8]}"
    try:
        result = await processor.image_generation_workflow(
            workflow_id=workflow_id,
            prompts=body.prompts,
            enhance=body.enhance,
            output_dir=body.output_dir or ""
        )
        return {"success": True, "workflow_id": workflow_id, "result": result}
    except Exception as exc:
        logger.error(f"Image generation workflow failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/workflow/{workflow_id}/progress", summary="Get workflow progress by ID")
async def get_workflow_progress(workflow_id: str):
    progress = processor.get_workflow_progress(workflow_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"success": True, "progress": progress.__dict__}


@router.get("/workflow/active", summary="List all active compound workflows")
async def list_active_workflows():
    workflows = processor.list_active_workflows()
    return {"success": True, "active_workflows": [w.__dict__ for w in workflows]}
