"""
backend/app/api/v1/panels/router.py
─────────────────────────────────────────────────────────────────────────────
Panel processing API routes:
1. POST /split               -> Split tall vertical strip into discrete panels (Job)
2. POST /detect/small-panels -> Small Images & Single Frames (Tight frame snapping)
3. POST /detect/long-panels  -> Tall Webtoon Strips (Gutter seam slicing)
4. POST /detect/opencv       -> Pure OpenCV geometric frames and gutters
5. POST /detect/yolo         -> Pure YOLO speech bubbles & character masks
6. POST /detect/ai           -> Pure AI Vision OCR & reading flow
7. POST /detect/batch        -> Batch URL panel detection
8. POST /detect/upload       -> Multipart form file upload detection
9. POST /detect/url          -> Generic URL / Base64 detection
10. POST /detect             -> [Alias] Backward-compatible dispatcher
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import base64
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse

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
    PanelDetectionResponse
)
from services.image.processing.panel_splitter import split_vertical_strip_into_panels
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse

from services.image.panel_detection.detect_small_panels_service import detect_small_panels_boxes
from services.image.panel_detection.detect_long_panels_service import detect_long_panels_boxes
from services.image.panel_detection.detect_batch_service import detect_batch_panels
from services.image.panel_detection.detect_upload_service import detect_upload_panels
from services.image.panel_detection.opencv_detector import detect_opencv_boxes
from services.image.panel_detection.yolo_detector import detect_yolo_entities
from services.image.panel_detection.ai_vision_detector import detect_ai_vision

logger = logging.getLogger("sonikoma.api.panels")
panels_router = APIRouter()


# ─── 1. Vertical Strip Splitting (Background Job) ────────────────────────────

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


# ─── 2. Dedicated Small-Panels Detection ──────────────────────────────────────

@panels_router.post(
    "/detect/small-panels",
    response_model=DetectSmallPanelsResponse,
    operation_id="detect_small_panels",
    summary="Detect and snap tight bounding frame on small / single comic images",
    description="Finds the dominant frame, binds adjacent speech bubbles into artwork, and filters empty gutter white space / SFX."
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


# ─── 3. Dedicated Long-Panels Detection ───────────────────────────────────────

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


# ─── 4. Dedicated Standalone OpenCV Engine ────────────────────────────────────

@panels_router.post(
    "/detect/opencv",
    operation_id="detect_opencv_standalone",
    summary="Direct OpenCV geometric contour and gutter analysis"
)
async def detect_opencv_endpoint(body: DetectPanelsUrlRequest):
    try:
        target_url = body.url or body.image_url
        raw_bytes = None
        if target_url:
            resolved = await resolve_image_to_buffer(target_url)
            raw_bytes = resolved.get("data")
        elif body.image_base64:
            b64 = body.image_base64
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            raw_bytes = base64.b64decode(b64)

        if not raw_bytes:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")

        return detect_opencv_boxes(
            image_bytes=raw_bytes,
            canny_low=body.canny_low,
            canny_high=body.canny_high,
            close_kernel_size=body.close_kernel_size,
            min_width_pct=body.min_width_pct,
            min_height_px=body.min_height_px
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectOpenCV API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 5. Dedicated Standalone YOLO Engine ──────────────────────────────────────

@panels_router.post(
    "/detect/yolo",
    operation_id="detect_yolo_standalone",
    summary="Direct YOLOv8m-seg comic speech bubble and character segmentation"
)
async def detect_yolo_endpoint(body: DetectPanelsUrlRequest):
    try:
        target_url = body.url or body.image_url
        raw_bytes = None
        if target_url:
            resolved = await resolve_image_to_buffer(target_url)
            raw_bytes = resolved.get("data")
        elif body.image_base64:
            b64 = body.image_base64
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            raw_bytes = base64.b64decode(b64)

        if not raw_bytes:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")

        entities = detect_yolo_entities(raw_bytes, conf_threshold=0.30)
        return {"success": True, "count": len(entities), "entities": entities}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectYOLO API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 6. Dedicated Standalone AI Vision Engine ─────────────────────────────────

@panels_router.post(
    "/detect/ai",
    operation_id="detect_ai_standalone",
    summary="Direct AI Vision reading flow and OCR transcription"
)
async def detect_ai_endpoint(body: DetectPanelsUrlRequest):
    try:
        target_url = body.url or body.image_url
        raw_bytes = None
        if target_url:
            resolved = await resolve_image_to_buffer(target_url)
            raw_bytes = resolved.get("data")
        elif body.image_base64:
            b64 = body.image_base64
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            raw_bytes = base64.b64decode(b64)

        if not raw_bytes:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")

        return await detect_ai_vision(raw_bytes)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectAI API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 7. Dedicated Batch URL Detection ─────────────────────────────────────────

@panels_router.post(
    "/detect/batch",
    response_model=DetectPanelsBatchResponse,
    operation_id="detect_panels_batch",
    summary="Concurrent panel detection for an array of image URLs"
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


# ─── 8. Dedicated Multipart File Upload Detection ─────────────────────────────

@panels_router.post(
    "/detect/upload",
    response_model=PanelDetectionResponse,
    operation_id="detect_panels_upload",
    summary="In-memory multipart form file upload detector"
)
async def detect_upload_endpoint(file: UploadFile = File(...)):
    try:
        return await detect_upload_panels(file)
    except Exception as e:
        logger.error(f"[DetectUpload API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 9. Dedicated URL / Base64 JSON Detection ─────────────────────────────────

@panels_router.post(
    "/detect/url",
    response_model=PanelDetectionResponse,
    operation_id="detect_panels_url",
    summary="Panel detection for a single URL or Base64 payload"
)
async def detect_url_endpoint(body: DetectPanelsUrlRequest):
    try:
        target_url = body.url or body.image_url
        if target_url:
            resolved = await resolve_image_to_buffer(target_url)
            raw = resolved.get("data")
            if not raw:
                raise HTTPException(status_code=400, detail="Failed to resolve image URL.")
            
            # Classify & route
            from PIL import Image
            import io
            with Image.open(io.BytesIO(raw)) as im:
                w, h = im.size
                is_tall = h > w * 2

            if is_tall:
                long_req = DetectLongPanelsRequest(url=target_url, sensitivity=body.sensitivity)
                long_res = await detect_long_panels_boxes(long_req)
                return PanelDetectionResponse(
                    success=True,
                    panels=long_res.panels,
                    count=len(long_res.panels),
                    total_panels=long_res.total_panels,
                    imageWidth=w,
                    imageHeight=h,
                    isTallStrip=True,
                    fallback=False,
                    total_speech_bubbles_count=long_res.total_speech_bubbles_count,
                    message=long_res.message
                )
            else:
                small_req = DetectSmallPanelsRequest(url=target_url, aspect_ratio=body.aspect_ratio)
                small_res = await detect_small_panels_boxes(small_req)
                panels_list = [small_res.panel] if small_res.panel else small_res.panels
                return PanelDetectionResponse(
                    success=True,
                    panels=panels_list,
                    count=len(panels_list),
                    total_panels=len(panels_list),
                    imageWidth=w,
                    imageHeight=h,
                    isTallStrip=False,
                    fallback=False,
                    total_speech_bubbles_count=small_res.total_speech_bubbles_count,
                    message=small_res.message
                )
        elif body.image_base64:
            b64 = body.image_base64
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            raw = base64.b64decode(b64)
            from PIL import Image
            import io
            with Image.open(io.BytesIO(raw)) as im:
                w, h = im.size
                is_tall = h > w * 2
            if is_tall:
                long_res = await detect_long_panels_boxes(DetectLongPanelsRequest(image_base64=body.image_base64))
                return PanelDetectionResponse(
                    success=True,
                    panels=long_res.panels,
                    count=len(long_res.panels),
                    total_panels=long_res.total_panels,
                    imageWidth=w,
                    imageHeight=h,
                    isTallStrip=True,
                    total_speech_bubbles_count=long_res.total_speech_bubbles_count
                )
            else:
                small_res = await detect_small_panels_boxes(DetectSmallPanelsRequest(image_base64=body.image_base64))
                panels_list = [small_res.panel] if small_res.panel else small_res.panels
                return PanelDetectionResponse(
                    success=True,
                    panels=panels_list,
                    count=len(panels_list),
                    total_panels=len(panels_list),
                    imageWidth=w,
                    imageHeight=h,
                    isTallStrip=False,
                    total_speech_bubbles_count=small_res.total_speech_bubbles_count
                )
        else:
            raise HTTPException(status_code=400, detail="Must provide 'url', 'image_url', or 'image_base64'.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectURL API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 10. Backward-Compatible Dispatcher Alias ─────────────────────────────────

@panels_router.post("/detect", include_in_schema=False)
async def detect_legacy_dispatcher(request: Request):
    """Backward-compatible dispatcher for legacy calls to /api/v1/panels/detect."""
    content_type = request.headers.get("content-type", "").lower()
    if "multipart/form-data" in content_type:
        form = await request.form()
        file = form.get("file")
        if file and hasattr(file, "read"):
            return await detect_upload_panels(file)
        raise HTTPException(status_code=400, detail="No file in form data.")
    else:
        body = await request.json()
        urls = body.get("urls")
        if isinstance(urls, list) and urls:
            req = DetectPanelsBatchRequest(urls=urls)
            return await detect_batch_panels(req)
        
        req = DetectPanelsUrlRequest(
            url=body.get("url") or body.get("image_url"),
            image_base64=body.get("image_base64") or body.get("base64")
        )
        return await detect_url_endpoint(req)
