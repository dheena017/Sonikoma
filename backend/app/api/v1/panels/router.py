"""
backend/app/api/v1/panels/router.py
─────────────────────────────────────────────────────────────────────────────
Panel processing API routes: strip splitting, panel detection, and bounding boxes.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import base64
import tempfile
import httpx
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse

from api.dependencies.auth import get_current_user
from schemas.scraper import SmartSplitRequest
from schemas.project import DetectPanelsBase64Request, PanelDetectionResponse
from services.image.processing.panel_splitter import split_vertical_strip_into_panels
from services.image.panel_detection.panel_detector import run_cv_detection
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse

logger = logging.getLogger("sonikoma.api.panels")

panels_router = APIRouter()


def _detect_helper(image_path: str, params: dict) -> List[dict]:
    """Helper to execute CV & YOLO panel detection."""
    return run_cv_detection(
        image_path=image_path,
        sensitivity=params.get("sensitivity", 30.0),
        bg_mode=params.get("background_mode", "auto"),
        min_width_pct=params.get("min_width_pct", 0.15),
        min_height_px=params.get("min_height_px", 60),
        merge_threshold=params.get("merge_threshold", 20),
        aspect_ratio_str=params.get("aspect_ratio", "free"),
        canny_low=params.get("canny_low", 20),
        canny_high=params.get("canny_high", 100),
        close_kernel_size=params.get("close_kernel_size", 15),
        auto_split=params.get("auto_split", True),
        use_yolo=params.get("use_yolo", True),
    )


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


# ─── 2. Unified Panel Bounding Box Detection (File Upload & Base64 JSON) ──────

@panels_router.post(
    "/detect",
    response_model=PanelDetectionResponse,
    operation_id="detect_panels_in_image",
    summary="Detect panel bounding boxes in a comic image (Unified File Upload & Base64 JSON)",
    description="Analyzes uploaded webtoon page or base64 JSON payload and detects individual panel bounding boxes via OpenCV and YOLO."
)
async def detect_panels_upload_endpoint(
    request: Request,
    file: Optional[UploadFile] = File(None, description="Comic/webtoon image file"),
    sensitivity: float = Form(30.0),
    background_mode: str = Form("auto"),
    min_width_pct: float = Form(0.15),
    min_height_px: int = Form(60),
    merge_threshold: int = Form(20),
    aspect_ratio: str = Form("free"),
    canny_low: int = Form(20),
    canny_high: int = Form(100),
    close_kernel_size: int = Form(15),
    auto_split: bool = Form(True),
    use_yolo: bool = Form(True),
):
    image_path = None
    content_type = request.headers.get("content-type", "")

    try:
        # Scenario A: JSON Payload (Base64)
        if "application/json" in content_type:
            body_bytes = await request.body()
            body_dict = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            b64_str = body_dict.get("image_base64")
            if not b64_str:
                raise HTTPException(status_code=422, detail="Missing 'image_base64' in JSON body.")

            try:
                raw = base64.b64decode(b64_str)
            except Exception:
                raise HTTPException(status_code=422, detail="Invalid base64 image data.")

            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp.write(raw)
                image_path = tmp.name

            params = {
                "sensitivity": body_dict.get("sensitivity", 30.0),
                "background_mode": body_dict.get("background_mode", "auto"),
                "min_width_pct": body_dict.get("min_width_pct", 0.15),
                "min_height_px": body_dict.get("min_height_px", 60),
                "merge_threshold": body_dict.get("merge_threshold", 20),
                "aspect_ratio": body_dict.get("aspect_ratio", "free"),
                "canny_low": body_dict.get("canny_low", 20),
                "canny_high": body_dict.get("canny_high", 100),
                "close_kernel_size": body_dict.get("close_kernel_size", 15),
                "auto_split": body_dict.get("auto_split", True),
                "use_yolo": body_dict.get("use_yolo", True),
            }

        # Scenario B: Multipart File Upload
        elif file is not None:
            suffix = os.path.splitext(file.filename or ".png")[1] or ".png"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(await file.read())
                image_path = tmp.name

            params = dict(
                sensitivity=sensitivity,
                background_mode=background_mode,
                min_width_pct=min_width_pct,
                min_height_px=min_height_px,
                merge_threshold=merge_threshold,
                aspect_ratio=aspect_ratio,
                canny_low=canny_low,
                canny_high=canny_high,
                close_kernel_size=close_kernel_size,
                auto_split=auto_split,
                use_yolo=use_yolo,
            )
        else:
            raise HTTPException(status_code=400, detail="Must provide either a file upload or a JSON body with 'image_base64'.")

        logger.info(f"[Panel Detection] Processing panel detection")
        panels = _detect_helper(image_path, params)
        logger.info(f"[Panel Detection] Successfully detected {len(panels)} panels.")
        return JSONResponse(content={
            "success": True,
            "panels": panels,
            "count": len(panels),
            "message": f"Detected {len(panels)} panel(s).",
        })
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Panel detection failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if image_path and os.path.exists(image_path):
            try:
                os.remove(image_path)
            except OSError:
                pass
