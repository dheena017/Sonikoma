"""
backend/app/api/v1/ocr/router.py
─────────────────────────────────────────────────────────────────────────────
Speech bubble dialogue OCR extraction API routes.
─────────────────────────────────────────────────────────────────────────────
"""

import httpx
import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from api.dependencies.auth import get_current_user

from schemas.scraper import ExtractScriptRequest
from services.scraper.service import scrape_and_initialize_project
from services.image.ocr.ocr_service import extract_script_from_panels
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse

logger = logging.getLogger("sonikoma.api.ocr")

ocr_router = APIRouter()


@ocr_router.post(
    "/extract",
    response_model=JobStatusResponse,
    summary="Extract speech bubble dialogue script via OCR (Creates OCR Job)",
    description="Asynchronously runs OCR vision processing across manga/webtoon panels to extract speech dialogue lines and text bounding boxes."
)
async def extract_ocr_endpoint(body: ExtractScriptRequest, current_user: dict = Depends(get_current_user)):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Webtoon URL is required.")

    job = job_manager.create_job(
        job_type=JobType.OCR,
        user_id=current_user["user_id"],
        project_id=body.project_id,
        metadata={"url": body.url}
    )

    async def _ocr_coro(report_progress):
        report_progress(15.0, JobStage.FETCHING.value)
        res = await scrape_and_initialize_project(
            url=body.url,
            limit=body.limit,
            proxy_images=False,
            job_id=job.job_id,
            project_id=body.project_id
        )
        panel_urls = res.get("images", [])

        report_progress(35.0, JobStage.FETCHING.value)
        buffers = []
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            for u in panel_urls[:body.limit or 50]:
                try:
                    resp = await client.get(u)
                    if resp.status_code == 200:
                        buffers.append(resp.content)
                except Exception:
                    pass

        report_progress(60.0, JobStage.PROCESSING_OCR.value)
        script = await extract_script_from_panels(buffers)
        report_progress(100.0, JobStage.COMPLETED.value)
        return {
            "success": True,
            "url": body.url,
            "total_dialogue_panels": sum(1 for p in script if p.get("has_dialogue")),
            "script": script
        }

    job_manager.run_in_background(job.job_id, _ocr_coro)
    return job.to_status_response()
