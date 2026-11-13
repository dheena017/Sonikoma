"""
backend/features/image/router/ocr.py
─────────────────────────────────────────────────────────────────────────────
Speech bubble dialogue OCR extraction API routes:
1. POST /detect-text     -> Direct synchronous image OCR
2. POST /bubble-dialogue -> YOLO bubble-guided isolated OCR
3. POST /extract         -> Full chapter asynchronous OCR background job
4. GET  /languages       -> List supported OCR recognition languages
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends

from app.core.dependencies.auth import get_optional_current_user
from features.platform.scraper.schemas_scraper import ExtractScriptRequest
from features.image.schemas import DetectTextRequest, DetectTextResponse
from features.platform.scraper.services.scraper_service import scrape_and_initialize_project
from features.image.ocr.dialogue_text_detector import (
    extract_script_from_panels,
    extract_direct_image_ocr,
    extract_bubble_guided_ocr,
)
from features.image.ocr.ocr_reader import get_default_ocr_languages
from common.media import resolve_image_to_buffer
from features.platform.jobs import job_manager, JobType, JobStage, JobStatusResponse

logger = logging.getLogger("sonikoma.features.image.router.ocr")

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


# ─── 2. Bubble-Guided Isolated OCR ────────────────────────────────────────────

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
    operation_id="extract_speech_dialogue_ocr_job",
    summary="Extract speech bubble dialogue script via OCR (Creates OCR Job)",
    description="Asynchronously runs OCR vision processing across manga/webtoon panels to extract speech dialogue lines and text bounding boxes."
)
async def extract_ocr_endpoint(
    body: ExtractScriptRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Webtoon URL is required.")

    user_id = (current_user or {}).get("user_id", "guest_user")
    job = job_manager.create_job(
        job_type=JobType.OCR,
        user_id=user_id,
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


# ─── 4. OCR Languages Catalog ────────────────────────────────────────────────

@ocr_router.get(
    "/languages",
    operation_id="get_ocr_supported_languages",
    summary="List supported OCR recognition language codes"
)
async def get_ocr_languages_endpoint():
    """Returns the list of OCR recognition languages supported by the engine."""
    languages = get_default_ocr_languages()
    return {
        "success": True,
        "languages": languages,
        "count": len(languages),
    }


router = ocr_router

__all__ = [
    "ocr_router",
    "router",
]
