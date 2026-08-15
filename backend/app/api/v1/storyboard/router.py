"""
backend/app/api/v1/storyboard/router.py
─────────────────────────────────────────────────────────────────────────────
AI Storyboard generation API routes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import jwt
from fastapi import APIRouter, HTTPException, Request, Depends

from api.dependencies.auth import get_all_user_keys
from core.security import SECRET_KEY
from app.core.config import GEMINI_MODEL_PRIMARY
from schemas.scraper import GenerateStoryboardOnlyRequest, GenerateStoryboardRequest
from services.scraper.service import generate_storyboard_only_service, generate_storyboard_and_video
from services.jobs import job_manager, JobType, JobStage

logger = logging.getLogger("sonikoma.api.storyboard")

storyboard_router = APIRouter()
ALGORITHM = "HS256"


@storyboard_router.post("/generate", summary="Generate AI storyboard script (Creates GENERATE_STORYBOARD Job)")
async def generate_storyboard_endpoint(
    request: Request,
    body: GenerateStoryboardOnlyRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    user_id = get_optional_user_id(request)
    job = job_manager.create_job(
        job_type=JobType.GENERATE_STORYBOARD,
        project_id=body.project_id,
        job_id=body.job_id,
        metadata={"url": body.url, "model": body.model}
    )

    async def _storyboard_coro(report_progress):
        report_progress(20.0, JobStage.FETCHING.value)
        report_progress(50.0, JobStage.GENERATING_STORYBOARD.value)
        result = await generate_storyboard_only_service(
            url=body.url,
            project_id=body.project_id,
            job_id=job.job_id,
            model=body.model or GEMINI_MODEL_PRIMARY,
            narration_style=body.narrationStyle or "long",
            user_id=user_id,
            user_keys=user_keys,
            title=getattr(body, "title", None),
            episode=getattr(body, "episode", None),
            genre=getattr(body, "genre", None),
            author=getattr(body, "author", None),
            cover_image=getattr(body, "cover_image", None),
            synopsis=getattr(body, "synopsis", None)
        )
        report_progress(100.0, JobStage.COMPLETED.value)
        return result

    job_manager.run_in_background(job.job_id, _storyboard_coro)
    return job.model_dump()


def get_optional_user_id(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None
