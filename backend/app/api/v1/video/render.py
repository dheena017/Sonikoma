"""
backend/app/api/v1/video/render.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for rendering projects and checking render job statuses.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends

from api.dependencies.auth import get_current_user
from services.user.credit_service import get_available_credits, record_credit_transaction
from database.config import LOW_BALANCE_THRESHOLD
from schemas.video import RenderRequest
from services.jobs import job_manager, JobType
from services.video.video_service import process_render_job

from repositories.project import get_project, get_project_by_slug

logger = logging.getLogger("sonikoma.api.video.render")
router = APIRouter()


@router.post("/render", summary="Render comic panels into an MP4 motion comic video")
async def render_video_endpoint(
    request: RenderRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    if not request.panels:
        raise HTTPException(status_code=400, detail="Panel list is empty.")

    if request.project_id and not (request.project_id.startswith("temp_") or request.project_id.startswith("draft_")):
        project = get_project(request.project_id) or get_project_by_slug(request.project_id)
        if not project:
            raise HTTPException(status_code=404, detail=f"Project '{request.project_id}' not found.")
        if project.get("user_id") and project.get("user_id") != current_user.get("user_id"):
            raise HTTPException(status_code=403, detail=f"Access denied for project '{request.project_id}'.")
        if project.get("job_id") and request.job_id and project.get("job_id") != request.job_id:
            raise HTTPException(status_code=400, detail=f"Job ID mismatch for project '{request.project_id}'.")

    COST = 20
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST} for video render.")

    job = job_manager.create_job(
        job_type=JobType.RENDER_VIDEO,
        user_id=current_user["user_id"],
        project_id=request.project_id,
    )
    
    logger.info(
        f"[Render] Initiating render job_id={job.job_id} for project_id={request.project_id or 'N/A'}"
    )

    # Deduct credits
    new_balance = record_credit_transaction(current_user["user_id"], -COST, "video_render")

    async def process_render_wrapper(report_progress):
        return await process_render_job(
            report_progress=report_progress,
            job_id=job.job_id,
            panels=[p.model_dump() for p in request.panels],
            voice=request.voice,
            music_theme=request.music_theme or "none",
            aspect_ratio=request.aspect_ratio or "auto",
            frame_rate=request.frame_rate or 24,
            video_format=request.video_format or "mp4",
            background_style=request.background_style or "black",
            subtitles_style=request.subtitles_style or "none",
            audio_reactive_shake=request.audio_reactive_shake or False,
            shake_intensity=request.shake_intensity or "medium",
            master_volume=request.master_volume if request.master_volume is not None else 1.0,
            narration_volume=request.narration_volume if request.narration_volume is not None else 1.0,
            bgm_volume=request.bgm_volume if request.bgm_volume is not None else 1.0,
            speech_rate=request.speech_rate if request.speech_rate is not None else 1.0,
            speech_pitch=request.speech_pitch if request.speech_pitch is not None else 1.0,
            project_id=request.project_id,
        )

    job_manager.run_in_background(
        job.job_id,
        process_render_wrapper,
    )

    return {
        "success": True,
        "job_id": job.job_id,
        "execution_id": job.job_id,
        "project_id": request.project_id,
        "workspace_job_id": request.job_id,
        "low_balance": new_balance < LOW_BALANCE_THRESHOLD,
    }


