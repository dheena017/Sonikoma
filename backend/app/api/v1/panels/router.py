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
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse

logger = logging.getLogger("sonikoma.api.panels")

panels_router = APIRouter()


def _detect_helper(image_path: str, params: dict) -> List[dict]:
    """Helper to execute CV & YOLO panel detection."""
    try:
        from PIL import Image
        with Image.open(image_path) as im:
            w, h = im.size
            if w < 10 or h < 10:
                return []
    except Exception:
        pass

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
    body: Optional[DetectPanelsBase64Request] = None,
):
    image_path = None
    content_type = request.headers.get("content-type", "").lower()

    try:
        # Scenario A: Multipart Form Upload
        if "multipart/form-data" in content_type:
            form = await request.form()
            file = form.get("file")
            if file and hasattr(file, "read"):
                suffix = os.path.splitext(getattr(file, "filename", ".png"))[1] or ".png"
                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                    tmp.write(await file.read())
                    image_path = tmp.name

            def _get_float(key: str, default: float) -> float:
                val = form.get(key)
                if not isinstance(val, (str, int, float)):
                    return default
                try:
                    return float(val)
                except (ValueError, TypeError):
                    return default

            def _get_int(key: str, default: int) -> int:
                val = form.get(key)
                if not isinstance(val, (str, int)):
                    return default
                try:
                    return int(val)
                except (ValueError, TypeError):
                    return default

            def _get_str(key: str, default: str) -> str:
                val = form.get(key)
                if not isinstance(val, str):
                    return default
                return val

            def _get_bool(key: str, default: bool) -> bool:
                val = form.get(key)
                if not isinstance(val, str):
                    return default
                return val.lower() in ("true", "1", "yes")

            params = {
                "sensitivity": _get_float("sensitivity", 30.0),
                "background_mode": _get_str("background_mode", "auto"),
                "min_width_pct": _get_float("min_width_pct", 0.15),
                "min_height_px": _get_int("min_height_px", 60),
                "merge_threshold": _get_int("merge_threshold", 20),
                "aspect_ratio": _get_str("aspect_ratio", "free"),
                "canny_low": _get_int("canny_low", 20),
                "canny_high": _get_int("canny_high", 100),
                "close_kernel_size": _get_int("close_kernel_size", 15),
                "auto_split": _get_bool("auto_split", True),
                "use_yolo": _get_bool("use_yolo", True),
            }
        # Scenario B: JSON Payload (Base64 or URL)
        else:
            try:
                body_dict = await request.json()
            except Exception:
                body_bytes = await request.body()
                body_dict = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}

            b64_str = body_dict.get("image_base64") or body_dict.get("base64") or body_dict.get("image")
            img_url = body_dict.get("image_url") or body_dict.get("url")

            if b64_str:
                if "," in b64_str:
                    b64_str = b64_str.split(",", 1)[1]
                try:
                    raw = base64.b64decode(b64_str)
                except Exception:
                    raise HTTPException(status_code=422, detail="Invalid base64 image data.")

                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    tmp.write(raw)
                    image_path = tmp.name
            elif img_url:
                try:
                    res = await resolve_image_to_buffer(img_url)
                    raw = res.get("data")
                    if not raw:
                        raise HTTPException(status_code=400, detail="Failed to resolve image data.")
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                        tmp.write(raw)
                        image_path = tmp.name
                except HTTPException:
                    raise
                except Exception as e:
                    logger.error(f"[Panel Detection] Failed to resolve image URL '{img_url}': {e}")
                    raise HTTPException(status_code=400, detail=f"Failed to fetch image: {str(e)}")
            else:
                raise HTTPException(status_code=422, detail="Must provide 'image_base64', 'image_url', or multipart 'file'.")

            params = {
                "sensitivity": float(body_dict.get("sensitivity", 30.0)),
                "background_mode": str(body_dict.get("background_mode", "auto")),
                "min_width_pct": float(body_dict.get("min_width_pct", 0.15)),
                "min_height_px": int(body_dict.get("min_height_px", 60)),
                "merge_threshold": int(body_dict.get("merge_threshold", 20)),
                "aspect_ratio": str(body_dict.get("aspect_ratio", "free")),
                "canny_low": int(body_dict.get("canny_low", 20)),
                "canny_high": int(body_dict.get("canny_high", 100)),
                "close_kernel_size": int(body_dict.get("close_kernel_size", 15)),
                "auto_split": bool(body_dict.get("auto_split", True)),
                "use_yolo": bool(body_dict.get("use_yolo", True)),
            }

        if not image_path:
            raise HTTPException(status_code=400, detail="No image file or image data provided.")

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
