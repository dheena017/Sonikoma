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
from schemas.ocr import DetectTextRequest, DetectTextResponse
from services.scraper.scraper_service import scrape_and_initialize_project
from services.image.ocr.ocr_service import (
    extract_script_from_panels,
    extract_direct_image_ocr,
    extract_bubble_guided_ocr
)
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse

logger = logging.getLogger("sonikoma.api.ocr")

ocr_router = APIRouter()


# ─── 1. Direct Synchronous Image OCR ──────────────────────────────────────────

@ocr_router.post(
    "/detect-text",
    response_model=DetectTextResponse,
    operation_id="detect_ocr_text",
    summary="Synchronous Direct Image OCR (Extracts dialogue lines and bounding boxes immediately)",
    description="Runs multi-language OCR on a single image buffer, returning dialogue lines, text coordinates, and transcript without background scraping."
)
async def detect_ocr_text_endpoint(body: DetectTextRequest):
    try:
        if not body.url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")
        return await extract_direct_image_ocr(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectOCR API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 2. Bubble-Guided Isolated OCR ───────────────────────────────────────────

@ocr_router.post(
    "/bubble-dialogue",
    response_model=DetectTextResponse,
    operation_id="detect_bubble_dialogue_ocr",
    summary="Bubble-Guided High-Precision Dialogue OCR",
    description="Fuses YOLO speech bubble localization with OCR to isolate dialogue inside balloons while rejecting background art noise."
)
async def detect_bubble_dialogue_endpoint(body: DetectTextRequest):
    try:
        if not body.url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")
        body.bubble_guided = True
        return await extract_bubble_guided_ocr(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectBubbleOCR API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 3. Full-Chapter Asynchronous OCR Job ────────────────────────────────────


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
        for u in panel_urls[:body.limit or 50]:
            try:
                img_res = await resolve_image_to_buffer(u)
                if img_res and img_res.get("data"):
                    buffers.append(img_res["data"])
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
