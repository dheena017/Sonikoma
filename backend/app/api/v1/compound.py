
# ─────────────────────────────────────────────────────────────────────────────
# FROM compound_routes.py
# ─────────────────────────────────────────────────────────────────────────────
from schemas.compound import *
"""
backend/python/routes/compound_routes.py
─────────────────────────────────────────────────────────────────────────────
Compound orchestration routes for multi-step media workflows.
"""

import os
import sys
import logging
import uuid

from fastapi import APIRouter, HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.compound.compound_processor import get_compound_processor

logger = logging.getLogger("sonikoma.routes.compound_routes")
compound_router = APIRouter()
router = compound_router
processor = None


def _get_processor():
    global processor
    if processor is None:
        processor = get_compound_processor()
    return processor










@router.post("/workflow/video-editing", summary="Run a video editing workflow")
async def run_video_editing_workflow(body: VideoEditingWorkflowRequest):
    workflow_id = f"video_editing_{uuid.uuid4().hex[:8]}"
    try:
        result = await _get_processor().video_editing_workflow(
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
        result = await _get_processor().audio_enhancement_workflow(
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
        result = await _get_processor().image_generation_workflow(
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
    progress = _get_processor().get_workflow_progress(workflow_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"success": True, "progress": progress.__dict__}


@router.get("/workflow/active", summary="List all active compound workflows")
async def list_active_workflows():
    workflows = _get_processor().list_active_workflows()
    return {"success": True, "active_workflows": [w.__dict__ for w in workflows]}

