"""
api/v1/projects/files.py
─────────────────────────────────────────────────────────────────────────────
Panel detection routes — file upload and base64 variants.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import base64
import tempfile
import logging
from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from schemas.project import DetectPanelsBase64Request
from media.image.detect_panels import run_cv_detection

logger = logging.getLogger("sonikoma.routes.projects.files")
router = APIRouter()


# ── Internal detection helper ─────────────────────────────────────────────


def _detect(image_path: str, params: dict) -> List[dict]:
    return run_cv_detection(
        image_path=image_path,
        sensitivity=params["sensitivity"],
        bg_mode=params["background_mode"],
        min_width_pct=params["min_width_pct"],
        min_height_px=params["min_height_px"],
        merge_threshold=params["merge_threshold"],
        aspect_ratio_str=params["aspect_ratio"],
        canny_low=params["canny_low"],
        canny_high=params["canny_high"],
        close_kernel_size=params["close_kernel_size"],
        auto_split=params.get("auto_split", True),
    )


# ── Routes ────────────────────────────────────────────────────────────────


@router.post(
    "/detect",
    summary="Detect panel bounding boxes in a comic image (file upload)",
)
async def detect_panels_upload(
    file: UploadFile = File(..., description="Comic/webtoon image file"),
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
):
    image_path = None
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
    )

    try:
        suffix = os.path.splitext(file.filename or ".png")[1] or ".png"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(await file.read())
            image_path = tmp.name

        logger.info(f"[Panel Detection] Processing uploaded file: {file.filename}")
        panels = _detect(image_path, params)
        logger.info(f"[Panel Detection] Successfully detected {len(panels)} panels.")
        return JSONResponse(content={
            "success": True,
            "panels": panels,
            "count": len(panels),
            "message": f"Detected {len(panels)} panel(s).",
        })
    except Exception as exc:
        logger.error(f"Panel detection failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if image_path:
            try:
                if os.path.exists(image_path):
                    os.remove(image_path)
            except OSError:
                pass


@router.post(
    "/detect-b64",
    summary="Detect panel bounding boxes from a base64-encoded image",
)
async def detect_panels_base64(body: DetectPanelsBase64Request):
    try:
        raw = base64.b64decode(body.image_base64)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid base64 image data.")

    image_path = None
    params = body.model_dump(exclude={"image_base64"})

    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(raw)
            image_path = tmp.name

        logger.info("[Panel Detection] Processing base64 image")
        panels = _detect(image_path, params)
        logger.info(f"[Panel Detection] Successfully detected {len(panels)} panels.")
        return JSONResponse(content={
            "success": True,
            "panels": panels,
            "count": len(panels),
            "message": f"Detected {len(panels)} panel(s).",
        })
    except Exception as exc:
        logger.error(f"Panel detection (base64) failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if image_path:
            try:
                if os.path.exists(image_path):
                    os.remove(image_path)
            except OSError:
                pass
