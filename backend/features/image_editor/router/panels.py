"""
backend/app/api/v1/panels/router.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Panel Detection & Processing API Routes:
1. POST /detect/cv-yolo          -> OpenCV + YOLO Dialogue & Panel Detector
2. POST /detect/small-panels     -> Small Images & Single Frames (Tight frame snapping)
3. POST /detect/long-panels      -> Tall Webtoon Strips (Gutter seam slicing)
4. POST /detect/ultra-long-panels -> Giant Full-Chapter Continuous Scrolls (Sliding Window)
5. POST /detect/batch            -> Batch URL Panel Detector
6. POST /detect/upload           -> Multipart Form File Upload Detector
7. POST /split                   -> Split tall vertical strip into discrete panels (Background Job)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import io
import base64
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from PIL import Image

from app.core.dependencies.auth import get_current_user
from features.platform.scraper.schemas_scraper import SmartSplitRequest
from features.platform.projects.schemas_project import (
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
    DetectSpeechBubblesRequest,
    DetectSpeechBubblesResponse,
    DetectCompositeResponse,
    DetectMangaGridRequest,
    DetectMangaGridResponse,
)
from features.image_editor.services.processing.panel_splitter import split_vertical_strip_into_panels
from common.media import resolve_image_to_buffer
from features.platform.jobs import job_manager, JobType, JobStage, JobStatusResponse

# Specialized Panel Detection Services
from features.image_editor.services.detector import (
    detect_small_panels,
    detect_long_panels,
    detect_batch_panels,
    detect_characters,
    detect_composite_panels,
    detect_speech_bubbles_service,
    detect_manga_grid_service,
    detect_panels_service,
    DetectStripPanelsRequest,
    DetectStripPanelsResponse,
    detect_image_layout_type,
)


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


# â”€â”€â”€ 1. Primary Strategy Option 1: OpenCV + YOLO Dialogue & Panel Detector â”€â”€â”€

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

        # 1st call detect_type_service to classify image layout format
        type_res = await detect_image_layout_type(raw_bytes=raw)
        crop_type_str = str(
            type_res.crop_type.value if hasattr(type_res.crop_type, "value") else type_res.crop_type
        ).lower()
        is_tall = (
            crop_type_str in ("long_panels", "ultra_long_panels", "four_koma")
            or (type_res.aspect_ratio or 0) >= 2.0
        )

        if is_tall:
            long_req = DetectLongPanelsRequest(
                url=body.url,
                image_base64=body.image_base64,
                engine_mode="cv_yolo",
                sensitivity=body.sensitivity
            )
            return await detect_long_panels(long_req)
        else:
            small_req = DetectSmallPanelsRequest(
                url=body.url,
                image_base64=body.image_base64,
                engine_mode="cv_yolo"
            )
            return await detect_small_panels(small_req)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectCVYOLO API] Error: {e}", exc_info=True)
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
        return await detect_small_panels(body)
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
        return await detect_long_panels(body)
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
        return await detect_long_panels(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectUltraLongPanels API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# â”€â”€â”€ 6. Dedicated Batch URL Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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



# â”€â”€â”€ 8. Vertical Strip Splitting (Background Job) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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


# â”€â”€â”€ 9. Dedicated Character & Silhouette Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        return await detect_characters(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectCharacters API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 10. Unified Composite Detection (Panels + Speech + Characters) ───────────

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
        return await detect_composite_panels(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectComposite API] Error: {e}", exc_info=True)
# ─── 11. Dedicated Speech Bubble & Dialogue Balloon Detection ──────────────────

@panels_router.post(
    "/detect/speech-bubbles",
    response_model=DetectSpeechBubblesResponse,
    operation_id="detect_speech_bubbles",
    summary="Detect speech bubbles, dialogue balloons, and manhwa chat UI pills",
    description="Uses fine-tuned YOLOv8-seg and Computer Vision to isolate speech balloons, thought clouds, and messenger UI dialogue.",
)
async def detect_speech_bubbles_endpoint(body: DetectSpeechBubblesRequest):
    try:
        if not body.url and not body.image_url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url', 'image_url', or 'image_base64'.")
        return await detect_speech_bubbles_service(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectSpeechBubbles API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 12. Dedicated Manga Grid & Comic Tier Panel Detection ───────────────────

@panels_router.post(
    "/detect/grid",
    response_model=DetectMangaGridResponse,
    operation_id="detect_manga_grid",
    summary="Detect multi-tier and multi-column 2D manga grid panels (RTL / LTR)",
    description="Uses OpenCV contour + 2D projection tier decomposition to isolate multi-panel comic and manga page layouts."
)
async def detect_manga_grid_endpoint(body: DetectMangaGridRequest):
    try:
        if not body.url and not body.image_url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url', 'image_url', or 'image_base64'.")
        return await detect_manga_grid_service(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectMangaGrid API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@panels_router.post(
    "/detect/manga-grid",
    response_model=DetectMangaGridResponse,
    operation_id="detect_manga_grid_alias",
    include_in_schema=False
)
async def detect_manga_grid_alias_endpoint(body: DetectMangaGridRequest):
    return await detect_manga_grid_endpoint(body)


# ─── 13. Dedicated Computer Vision Strip Panel Detection ──────────────────────

@panels_router.post(
    "/detect/strip",
    response_model=DetectStripPanelsResponse,
    operation_id="detect_strip_panels",
    summary="Pure Computer Vision Vertical Strip & Webtoon Panel Detection",
    description="High-precision gutter seam slicing and layout decomposition directly via panel_detector.",
)
async def detect_strip_panels_endpoint(body: DetectStripPanelsRequest):
    try:
        if not body.url and not body.image_url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url', 'image_url', or 'image_base64'.")
        return await detect_panels_service(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectStripPanels API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@panels_router.post(
    "/detect/vertical-strip",
    response_model=DetectStripPanelsResponse,
    operation_id="detect_vertical_strip_panels_alias",
    include_in_schema=False,
)
async def detect_vertical_strip_panels_alias_endpoint(body: DetectStripPanelsRequest):
    return await detect_strip_panels_endpoint(body)


panel_router = panels_router
router = panels_router


__all__ = ["panels_router", "panel_router", "router"]


