"""
backend/app/api/v1/panels/router.py
─────────────────────────────────────────────────────────────────────────────
Panel processing API routes - 100% Separated Modular Endpoints:
1.  POST /split                  -> Split tall vertical strip into discrete panels (Job)
2.  POST /detect/small-panels    -> Small Images & Single Frames (Tight frame snapping)
3.  POST /detect/long-panels     -> Tall Webtoon Strips (Gutter seam slicing)
4.  POST /detect/ultra-long-panels -> Giant Full-Chapter Continuous Scrolls (Sliding Window)
5.  POST /detect/opencv          -> Pure OpenCV geometric frames and contours
6.  POST /detect/yolo            -> Pure YOLO speech bubbles & character masks
7.  POST /detect/ai              -> Pure AI Vision OCR & reading flow
8.  POST /detect/grid            -> Dedicated Manga 2D Multi-Panel Grid Detector
9.  POST /detect/webtoon-gutters -> Dedicated Raw Webtoon Gutter Seam Scanner
10. POST /detect/fusion          -> Dedicated Fusion Engine (Bubble Binding & SFX Filter)
11. POST /detect/postprocess     -> Dedicated Post-Processor (Overlap Deduplication)
12. POST /detect/visualize       -> Dedicated Visual Diagnostic Overlay Generator
13. POST /detect/batch           -> Batch URL Panel Detector
14. POST /detect/upload          -> Multipart Form File Upload Detector
15. POST /detect/url             -> Generic URL / Base64 Detection
16. POST /detect                 -> [Alias] Backward-Compatible Dispatcher
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import base64
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse, Response
from PIL import Image
import numpy as np

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

# ── Import All 15 Specialized Panel Detection Services ────────────────────────
from services.image.panel_detection.detect_small_panels_service import detect_small_panels_boxes
from services.image.panel_detection.detect_long_panels_service import detect_long_panels_boxes
from services.image.panel_detection.detect_batch_service import detect_batch_panels
from services.image.panel_detection.detect_upload_service import detect_upload_panels
from services.image.panel_detection.opencv_detector import detect_opencv_boxes
from services.image.panel_detection.speech_bubble_detector import detect_yolo_entities
from services.image.panel_detection.ai_vision_detector import detect_ai_vision
from services.image.panel_detection.panel_fusion_service import fuse_panels_and_bubbles
from services.image.panel_detection.panel_detector import (
    detect_vertical_strip_panels,
    _detect_bg_color_and_threshold,
    compute_post_panel_confidence,
    resolve_overlapping_panels_lineage,
    resolve_micro_panels
)
from services.image.panel_detection.grid_detector import detect_manga_grid_panels
from services.image.panel_detection.debug_visualizer import ColorScheme

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


# ─── 4. Dedicated Ultra-Long Chapter Scroll Detection ─────────────────────────

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


# ─── 4b. Primary Strategy Option 1: OpenCV + YOLO Dialogue & Panel Detector ───

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


# ─── 4c. Primary Strategy Option 2: Full Multimodal AI Vision & Reading Flow ───

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


# ─── 5. Dedicated Standalone OpenCV Engine ────────────────────────────────────

@panels_router.post(
    "/detect/opencv",
    operation_id="detect_opencv_standalone",
    summary="Direct OpenCV geometric contour and gutter analysis"
)
async def detect_opencv_endpoint(body: DetectPanelsUrlRequest):
    try:
        raw_bytes = await _resolve_bytes(body)
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


# ─── 6. Dedicated Standalone YOLO Engine ──────────────────────────────────────

@panels_router.post(
    "/detect/yolo",
    operation_id="detect_yolo_standalone",
    summary="Direct YOLOv8m-seg comic speech bubble and character segmentation"
)
async def detect_yolo_endpoint(body: DetectPanelsUrlRequest):
    try:
        raw_bytes = await _resolve_bytes(body)
        entities = detect_yolo_entities(raw_bytes, conf_threshold=0.25)
        return {"success": True, "count": len(entities), "entities": entities}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectYOLO API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 7. Dedicated Standalone AI Vision Engine ─────────────────────────────────

@panels_router.post(
    "/detect/ai",
    operation_id="detect_ai_standalone",
    summary="Direct AI Vision reading flow and OCR transcription"
)
async def detect_ai_endpoint(body: DetectPanelsUrlRequest):
    try:
        raw_bytes = await _resolve_bytes(body)
        return await detect_ai_vision(raw_bytes)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectAI API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 8. Dedicated Manga 2D Grid Page Detector ─────────────────────────────────

@panels_router.post(
    "/detect/grid",
    operation_id="detect_grid_standalone",
    summary="Dedicated 2D multi-panel Manga grid detector"
)
async def detect_grid_endpoint(body: DetectPanelsUrlRequest):
    try:
        raw_bytes = await _resolve_bytes(body)
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("L")
        gray_arr = np.array(pil_img)

        grid_boxes = detect_manga_grid_panels(
            gray_arr=gray_arr,
            min_width_pct=body.min_width_pct,
            min_height_px=body.min_height_px,
            canny_low=body.canny_low,
            canny_high=body.canny_high,
            close_kernel_size=body.close_kernel_size
        )
        return {
            "success": True,
            "engine": "grid_detector",
            "count": len(grid_boxes),
            "panels": grid_boxes
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectGrid API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 9. Dedicated Raw Webtoon Gutter Seam Scanner ─────────────────────────────

@panels_router.post(
    "/detect/webtoon-gutters",
    operation_id="detect_webtoon_gutters_standalone",
    summary="Dedicated raw webtoon gutter seam scanner (Projection Profile Variance)"
)
async def detect_webtoon_gutters_endpoint(body: DetectPanelsUrlRequest):
    try:
        raw_bytes = await _resolve_bytes(body)
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("L")
        gray_arr = np.array(pil_img)

        bg_res = _detect_bg_color_and_threshold(gray_arr, body.background_mode, body.sensitivity)
        is_white_bg, threshold_val, median_bg, bg_std, top_med, bot_med, bg_rgb = bg_res

        res = detect_vertical_strip_panels(
            gray_arr=gray_arr,
            is_white_bg=is_white_bg,
            threshold_val=threshold_val,
            min_height_px=body.min_height_px,
            min_width_pct=body.min_width_pct,
            ocr_boxes=[],
            median_bg=median_bg,
            sensitivity=body.sensitivity,
            top_median=top_med,
            bottom_median=bot_med
        )
        panels = res.panels if hasattr(res, "panels") else (res[0] if isinstance(res, tuple) else [])
        bands = res.separator_bands if hasattr(res, "separator_bands") else []

        return {
            "success": True,
            "engine": "webtoon_detector",
            "is_white_bg": is_white_bg,
            "median_bg": median_bg,
            "panels_count": len(panels),
            "separator_bands": bands,
            "panels": panels
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectWebtoonGutters API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 10. Dedicated Panel & Bubble Fusion Engine ───────────────────────────────

@panels_router.post(
    "/detect/fusion",
    operation_id="detect_fusion_standalone",
    summary="Direct execution of the Panel + Speech Bubble Fusion Engine"
)
async def detect_fusion_endpoint(body: DetectPanelsUrlRequest):
    try:
        raw_bytes = await _resolve_bytes(body)
        pil_img = Image.open(io.BytesIO(raw_bytes))
        w, h = pil_img.size

        # Run OpenCV + YOLO
        cv_res = detect_opencv_boxes(raw_bytes)
        yolo_res = detect_yolo_entities(raw_bytes, conf_threshold=0.25)

        is_small = h < w * 2.2
        fused_panels, bound_bubbles, margins = fuse_panels_and_bubbles(
            cv_panels=cv_res.get("panels", []),
            yolo_bubbles=yolo_res,
            img_w=w,
            img_h=h,
            is_small_panel=is_small
        )
        return {
            "success": True,
            "is_small_panel": is_small,
            "panels": fused_panels,
            "bound_bubbles": bound_bubbles,
            "margins": margins
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectFusion API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 11. Dedicated Post-Processor (Overlap & Lineage Resolution) ───────────────

@panels_router.post(
    "/detect/postprocess",
    operation_id="detect_postprocess_standalone",
    summary="Post-process panel bounding boxes for deduplication and overlap resolution"
)
async def detect_postprocess_endpoint(request: Request):
    try:
        body = await request.json()
        raw_boxes = body.get("panels", [])
        w = body.get("image_width", 800)
        h = body.get("image_height", 1200)

        cleaned = resolve_overlapping_panels_lineage(raw_boxes, orig_w=w, orig_h=h)
        return {
            "success": True,
            "original_count": len(raw_boxes),
            "cleaned_count": len(cleaned),
            "panels": cleaned
        }
    except Exception as e:
        logger.error(f"[DetectPostprocess API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 12. Dedicated Visual Debug Overlay Generator ─────────────────────────────

@panels_router.post(
    "/detect/visualize",
    operation_id="detect_visualize_overlay",
    summary="Generate annotated visual debug image with drawn panel cuts and bubble boxes"
)
async def detect_visualize_endpoint(body: DetectPanelsUrlRequest):
    try:
        raw_bytes = await _resolve_bytes(body)
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        w, h = pil_img.size

        # Run detection
        if h >= w * 2.2:
            res = await detect_long_panels_boxes(DetectLongPanelsRequest(url=body.url, image_base64=body.image_base64))
            panels = res.panels
            bubbles = [b for p in res.panels for b in (p.speech_bubbles or [])]
        else:
            res = await detect_small_panels_boxes(DetectSmallPanelsRequest(url=body.url, image_base64=body.image_base64))
            panels = [res.panel] if res.panel else res.panels
            bubbles = res.speech_bubbles

        # Draw overlay
        from PIL import ImageDraw
        debug_img = pil_img.copy()
        draw = ImageDraw.Draw(debug_img)

        for idx, p in enumerate(panels):
            x1, y1, x2, y2 = p.x, p.y, p.x + p.w, p.y + p.h
            draw.rectangle([x1, y1, x2, y2], outline=(0, 230, 80), width=4)
            draw.line([(0, y1), (w, y1)], fill=(255, 140, 0), width=2)
            draw.line([(0, y2), (w, y2)], fill=(255, 140, 0), width=2)

        for b in bubbles:
            bx1, by1, bx2, by2 = b.x, b.y, b.x + b.width, b.y + b.height
            draw.rectangle([bx1, by1, bx2, by2], outline=(0, 200, 255), width=3)

        buf = io.BytesIO()
        debug_img.save(buf, format="JPEG", quality=90)
        return Response(content=buf.getvalue(), media_type="image/jpeg")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectVisualize API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 13. Dedicated Batch URL Detection ────────────────────────────────────────

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


# ─── 14. Dedicated Multipart File Upload Detection ────────────────────────────

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


# ─── 15. Dedicated URL / Base64 JSON Detection ────────────────────────────────

@panels_router.post(
    "/detect/url",
    response_model=PanelDetectionResponse,
    operation_id="detect_panels_url",
    summary="Panel detection for a single URL or Base64 payload"
)
async def detect_url_endpoint(body: DetectPanelsUrlRequest):
    try:
        raw = await _resolve_bytes(body)
        with Image.open(io.BytesIO(raw)) as im:
            w, h = im.size
            is_tall = h > w * 2

        if is_tall:
            long_req = DetectLongPanelsRequest(url=body.url, image_base64=body.image_base64, sensitivity=body.sensitivity)
            long_res = await detect_long_panels_boxes(long_req)
            return PanelDetectionResponse(
                success=True,
                panels=long_res.panels,
                count=len(long_res.panels),
                total_panels=long_res.total_panels,
                imageWidth=w,
                imageHeight=h,
                isTallStrip=True,
                total_speech_bubbles_count=long_res.total_speech_bubbles_count,
                message=long_res.message
            )
        else:
            small_req = DetectSmallPanelsRequest(url=body.url, image_base64=body.image_base64, aspect_ratio=body.aspect_ratio)
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
                total_speech_bubbles_count=small_res.total_speech_bubbles_count,
                message=small_res.message
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectURL API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))



