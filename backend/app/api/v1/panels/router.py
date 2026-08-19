"""
backend/app/api/v1/panels/router.py
─────────────────────────────────────────────────────────────────────────────
Panel processing API routes: strip splitting, panel detection, and bounding boxes.
─────────────────────────────────────────────────────────────────────────────
"""

import httpx
import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from api.dependencies.auth import get_current_user

from schemas.scraper import SmartSplitRequest
from services.scraper.splitter import split_vertical_strip_into_panels
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse

logger = logging.getLogger("sonikoma.api.panels")

panels_router = APIRouter()


@panels_router.post(
    "/split",
    response_model=JobStatusResponse,
    summary="Split tall vertical strip into discrete panels (Creates PANEL_SPLIT Job)",
    description="Asynchronously downloads and segments a continuous webtoon/manhwa strip into individual panel images."
)
async def split_panels_endpoint(body: SmartSplitRequest, current_user: dict = Depends(get_current_user)):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target image URL is required.")

    job = job_manager.create_job(
        job_type=JobType.PANEL_SPLIT,
        user_id=current_user["user_id"],
        project_id=body.project_id,
        metadata={"url": body.url, "min_panel_height": body.min_panel_height}
    )

    async def _split_coro(report_progress):
        report_progress(20.0, JobStage.FETCHING.value)
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            resp = await client.get(body.url)
            if resp.status_code != 200:
                raise Exception("Failed to fetch image URL for splitting.")
            img_bytes = resp.content

        report_progress(50.0, JobStage.SPLITTING.value)
        split_buffers = split_vertical_strip_into_panels(
            img_bytes,
            min_panel_height=body.min_panel_height or 250
        )
        report_progress(100.0, JobStage.COMPLETED.value)
        return {
            "success": True,
            "original_url": body.url,
            "extracted_panels_count": len(split_buffers),
            "panels": [f"data:image/jpeg;base64,{b.hex()}" for b in split_buffers[:50]]
        }

    job_manager.run_in_background(job.job_id, _split_coro)
    return job.to_status_response()
