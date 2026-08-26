"""
backend/app/api/v1/panels/router.py
─────────────────────────────────────────────────────────────────────────────
Panel Detection & Processing API Routes:
1. POST /detect/cv-yolo          -> Option 1: OpenCV + YOLO Dialogue & Panel Detector
2. POST /detect/ai-vision        -> Option 2: Full Multimodal AI Vision & Reading Flow
3. POST /detect/small-panels     -> Small Images & Single Frames (Tight frame snapping)
4. POST /detect/long-panels      -> Tall Webtoon Strips (Gutter seam slicing)
5. POST /detect/ultra-long-panels -> Giant Full-Chapter Continuous Scrolls (Sliding Window)
6. POST /detect/batch            -> Batch URL Panel Detector
7. POST /detect/upload           -> Multipart Form File Upload Detector
8. POST /split                   -> Split tall vertical strip into discrete panels (Background Job)
─────────────────────────────────────────────────────────────────────────────
"""

import io
import base64
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from PIL import Image

from api.dependencies.auth import get_current_user
from schemas.scraper import SmartSplitRequest
from schemas.project import (
    DetectSmallPanelsRequest,
    DetectSmallPanelsResponse,
    DetectLongPanelsRequest,
    DetectLongPanelsResponse,
    DetectPanelsBatchRequest,
    DetectPanelsBatchResponse,
    DetectPanelsUrlRequest,
    PanelDetectionResponse,
    DetectCharactersRequest,
    DetectCharactersResponse,
    DetectCompositeResponse
)
from services.image.processing.panel_splitter import split_vertical_strip_into_panels
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse

# Specialized Panel Detection Services
from services.image.panel_detection.detect_small_panels_service import detect_small_panels_boxes
from services.image.panel_detection.detect_long_panels_service import detect_long_panels_boxes
from services.image.panel_detection.detect_batch_service import detect_batch_panels
from services.image.panel_detection.detect_upload_service import detect_upload_panels
from services.image.panel_detection.detect_characters_service import detect_characters_boxes
from services.image.panel_detection.detect_composite_service import detect_composite_boxes

logger = logging.getLogger("sonikoma.api.panels")
panels_router = APIRouter()


async def _resolve_bytes(body: DetectPanelsUrlRequest) -> bytes:
    target_url = body.url or body.image_url
    if target_url:
        resolved = await resolve_image_to_buffer(target_url)
        raw = resolved.get("data")
        if raw:
            return raw
    elif body.image_base64:
        b64 = body.image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        return base64.b64decode(b64)
    raise HTTPException(status_code=400, detail="Must provide 'url', 'image_url', or 'image_base64'.")


# ─── 1. Primary Strategy Option 1: OpenCV + YOLO Dialogue & Panel Detector ───

@panels_router.post(
    "/detect/cv-yolo",
    operation_id="detect_panels_cv_yolo",
    summary="Option 1: Pure OpenCV + Deep-Learning YOLO Dialogue & Panel Detection (Lightning-Fast)",
    description="Fuses YOLO speech bubble segmentation with OpenCV horizontal gutter variance slicing on-device."
)
async def detect_cv_yolo_endpoint(body: DetectPanelsUrlRequest):
    try:
        body.engine_mode = "cv_yolo"
        raw = await _resolve_bytes(body)
        with Image.open(io.BytesIO(raw)) as im:
            w, h = im.size
            is_tall = h > w * 2

        if is_tall:
            long_req = DetectLongPanelsRequest(
                url=body.url,
                image_base64=body.image_base64,
                engine_mode="cv_yolo",
                sensitivity=body.sensitivity
            )
            return await detect_long_panels_boxes(long_req)
        else:
            small_req = DetectSmallPanelsRequest(
                url=body.url,
                image_base64=body.image_base64,
                engine_mode="cv_yolo"
            )
            return await detect_small_panels_boxes(small_req)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectCVYOLO API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 2. Primary Strategy Option 2: Full Multimodal AI Vision & Reading Flow ───

@panels_router.post(
    "/detect/ai-vision",
    operation_id="detect_panels_ai_vision",
    summary="Option 2: Full AI Vision Reading Flow + YOLO + OpenCV Multimodal Pipeline",
    description="Executes OCR transcription, reading order reasoning (TTB/RTL), and breakout scene analysis."
)
async def detect_ai_vision_endpoint(body: DetectPanelsUrlRequest):
    try:
        body.engine_mode = "ai_vision"
        raw = await _resolve_bytes(body)
        with Image.open(io.BytesIO(raw)) as im:
            w, h = im.size
            is_tall = h > w * 2

        if is_tall:
            long_req = DetectLongPanelsRequest(
                url=body.url,
                image_base64=body.image_base64,
                engine_mode="ai_vision",
                sensitivity=body.sensitivity
            )
            return await detect_long_panels_boxes(long_req)
        else:
            small_req = DetectSmallPanelsRequest(
                url=body.url,
                image_base64=body.image_base64,
                engine_mode="ai_vision"
            )
            return await detect_small_panels_boxes(small_req)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectAIVision API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 3. Dedicated Small-Panels Detection ──────────────────────────────────────

@panels_router.post(
    "/detect/small-panels",
    response_model=DetectSmallPanelsResponse,
    operation_id="detect_small_panels",
    summary="Detect and snap tight bounding frame on small / single comic images",
    description="Finds dominant frame, binds adjacent speech bubbles into artwork, and filters empty gutter white space / SFX."
)
async def detect_small_panels_endpoint(body: DetectSmallPanelsRequest):
    try:
        if not body.url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")
        return await detect_small_panels_boxes(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectSmallPanels API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 4. Dedicated Long-Panels Detection ───────────────────────────────────────

@panels_router.post(
    "/detect/long-panels",
    response_model=DetectLongPanelsResponse,
    operation_id="detect_long_panels",
    summary="Detect stacked panel bounding boxes in a tall continuous webtoon strip",
    description="Scans horizontal projection variance to find gutter seams and binds speech bubbles down the strip."
)
async def detect_long_panels_endpoint(body: DetectLongPanelsRequest):
    try:
        if not body.url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")
        return await detect_long_panels_boxes(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectLongPanels API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 5. Dedicated Ultra-Long Chapter Scroll Detection ─────────────────────────

@panels_router.post(
    "/detect/ultra-long-panels",
    response_model=DetectLongPanelsResponse,
    operation_id="detect_ultra_long_panels",
    summary="Detect panels in giant whole-chapter continuous webtoon scrolls (20-100+ panels)",
    description="Uses sliding-window YOLO chunking and multi-pass gutter variance across 10,000-60,000px scrolls."
)
async def detect_ultra_long_panels_endpoint(body: DetectLongPanelsRequest):
    try:
        if not body.url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")
        return await detect_long_panels_boxes(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectUltraLongPanels API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 6. Dedicated Batch URL Detection ────────────────────────────────────────

@panels_router.post(
    "/detect/batch",
    response_model=DetectPanelsBatchResponse,
    operation_id="detect_panels_batch",
    summary="Concurrent panel detection for an array of image URLs",
    description="Asynchronously processes multiple images concurrently using asyncio worker pools."
)
async def detect_batch_endpoint(body: DetectPanelsBatchRequest):
    try:
        if not body.urls:
            raise HTTPException(status_code=400, detail="List of 'urls' is required.")
        return await detect_batch_panels(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectBatch API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 7. Dedicated Multipart File Upload Detection ────────────────────────────

@panels_router.post(
    "/detect/upload",
    response_model=PanelDetectionResponse,
    operation_id="detect_panels_upload",
    summary="In-memory multipart form file upload detector",
    description="Accepts a raw image file directly from multipart form-data and streams results without disk overhead."
)
async def detect_upload_endpoint(file: UploadFile = File(...)):
    try:
        return await detect_upload_panels(file)
    except Exception as e:
        logger.error(f"[DetectUpload API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 8. Vertical Strip Splitting (Background Job) ────────────────────────────

@panels_router.post(
    "/split",
    response_model=JobStatusResponse,
    operation_id="split_vertical_strip_panels",
    summary="Split tall vertical strip into discrete panels (Creates PANEL_SPLIT Job)",
    description="Asynchronously downloads and segments a continuous webtoon/manhwa strip into individual panel images."
)
async def split_strip_panels_endpoint(body: SmartSplitRequest, current_user: dict = Depends(get_current_user)):
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
        img_res = await resolve_image_to_buffer(body.url)
        img_bytes = img_res.get("data")
        if not img_bytes:
            raise Exception("Failed to fetch image URL for splitting.")

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
            "panels": [f"data:image/jpeg;base64,{base64.b64encode(b).decode('utf-8')}" for b in split_buffers[:50]]
        }

    job_manager.run_in_background(job.job_id, _split_coro)
    return job.to_status_response()


# ─── 9. Dedicated Character & Silhouette Detection ───────────────────────────

@panels_router.post(
    "/detect/characters",
    response_model=DetectCharactersResponse,
    operation_id="detect_characters",
    summary="Detect comic and manga characters with bounding boxes, poses, and segmentation masks",
    description="Uses YOLOv8-seg and Computer Vision to isolate character figures, faces, and silhouette contours."
)
async def detect_characters_endpoint(body: DetectCharactersRequest):
    try:
        if not body.url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")
        return await detect_characters_boxes(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectCharacters API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 10. Unified Composite Detection (Panels + Speech + Characters) ──────────

@panels_router.post(
    "/detect/composite",
    response_model=DetectCompositeResponse,
    operation_id="detect_composite",
    summary="Unified multimodal composite detection (Panels + Dialogue Bubbles + Characters + Cinematography)",
    description="Fuses panels, speech balloons, characters, and camera cinematography into a rich unified storyboard scene graph."
)
async def detect_composite_endpoint(body: DetectPanelsUrlRequest):
    try:
        if not body.url and not body.image_url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url', 'image_url', or 'image_base64'.")
        return await detect_composite_boxes(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectComposite API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

