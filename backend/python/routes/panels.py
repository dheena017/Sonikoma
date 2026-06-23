"""
backend/python/routes/panels.py
─────────────────────────────────────────────────────────────────────────────
Panel detection endpoint.

POST /api/py/panels/detect
  Body: multipart/form-data — image file upload
  OR  : JSON with base64 image + detection params

Returns: JSON array of detected panel bounding boxes with crop percentages
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import base64
import tempfile
import logging
from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.detect_panels import run_cv_detection

logger = logging.getLogger("sonikoma.routes.panels")
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class DetectPanelsBase64Request(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded source image")
    sensitivity: float = Field(30.0, ge=0.0, le=100.0)
    background_mode: Literal["auto", "white", "black"] = "auto"
    min_width_pct: float = Field(0.15, ge=0.0, le=1.0)
    min_height_px: int   = Field(60, ge=1)
    merge_threshold: int = Field(20, ge=0)
    aspect_ratio: Literal["free", "1:1", "16:9", "9:16", "4:3"] = "free"
    canny_low: int  = Field(20, ge=0, le=255)
    canny_high: int = Field(100, ge=0, le=255)
    close_kernel_size: int = Field(15, ge=1, le=99)
    auto_split: bool = Field(True, description="Automatically split tall strips at gutters")


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
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


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/detect",
    summary="Detect panel bounding boxes in a comic image (file upload)",
)
async def detect_panels_upload(
    file: UploadFile = File(..., description="Comic/webtoon image file"),
    sensitivity: float       = Form(30.0),
    background_mode: str     = Form("auto"),
    min_width_pct: float     = Form(0.15),
    min_height_px: int       = Form(60),
    merge_threshold: int     = Form(20),
    aspect_ratio: str        = Form("free"),
    canny_low: int           = Form(20),
    canny_high: int          = Form(100),
    close_kernel_size: int   = Form(15),
    auto_split: bool         = Form(True),
):
    """
    Runs OpenCV-based contour detection on the uploaded image and returns
    panel bounding boxes expressed as crop percentages (top/bottom/left/right)
    along with pixel dimensions and area.
    """
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
    )

    try:
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
    """
    Accepts the comic image as a base64 string. Ideal for calls originating
    from the Express layer or the frontend over fetch.
    """
    try:
        raw = base64.b64decode(body.image_base64)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid base64 image data.")

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(raw)
        image_path = tmp.name

    params = body.model_dump(exclude={"image_base64"})

    try:
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
        try:
            if os.path.exists(image_path):
                os.remove(image_path)
        except OSError:
            pass
