"""
backend/python/routes/cleaner.py
─────────────────────────────────────────────────────────────────────────────
Speech bubble removal endpoint.

POST /api/py/cleaner/remove-bubbles
  Body: multipart/form-data  — image file upload
  OR  : JSON with base64 image

Returns: processed image as base64 PNG + bubble detection flag
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import base64
import tempfile
import logging
import asyncio
from typing import Optional, Literal

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.cleaner import remove_speech_bubbles

logger = logging.getLogger("anivox.routes.cleaner")
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class CleanerBase64Request(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded source image (PNG/JPG)")
    method: Literal["inpaint", "blur"] = Field("inpaint", description="Removal method")
    sensitivity: float = Field(50.0, ge=0.0, le=100.0)
    dilation: int = Field(-1, ge=-1, le=100)
    inpaint_radius: int = Field(3, ge=1, le=20)
    detection_style: str = Field("all")


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def _run_cleaner(
    input_path: str,
    output_path: str,
    method: str,
    sensitivity: float,
    dilation: int,
    inpaint_radius: int,
    detection_style: str,
) -> bool:
    return remove_speech_bubbles(
        image_path=input_path,
        output_path=output_path,
        method=method,
        sensitivity=sensitivity,
        dilation=dilation,
        inpaint_radius=inpaint_radius,
        detection_style=detection_style,
    )


def _encode_output(output_path: str) -> dict:
    with open(output_path, "rb") as f:
        raw = f.read()
    return {
        "image_base64": base64.b64encode(raw).decode("utf-8"),
        "mime_type": "image/png",
        "file_size_kb": round(len(raw) / 1024, 1),
    }


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/remove-bubbles",
    summary="Remove speech bubbles from a comic panel (file upload)",
)
async def remove_bubbles_upload(
    file: UploadFile = File(..., description="Panel image file (PNG/JPG/WEBP)"),
    method: str = Form("inpaint", description="'inpaint' or 'blur'"),
    sensitivity: float = Form(50.0),
    dilation: int = Form(-1),
    inpaint_radius: int = Form(3),
    detection_style: str = Form("all"),
):
    """
    Accepts a panel image via file upload, detects speech bubbles using
    OpenCV contour analysis, and removes them via inpainting or Gaussian blur.
    Returns the cleaned image as base64-encoded PNG.
    """
    suffix = os.path.splitext(file.filename or ".png")[1] or ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_in:
        tmp_in.write(await file.read())
        input_path = tmp_in.name

    output_path = input_path.replace(suffix, "_clean.png")

    try:
        logger.info(
            f"Cleaning: {file.filename} | method={method} "
            f"sensitivity={sensitivity} dilation={dilation}"
        )
        bubbles_detected = await asyncio.to_thread(
            _run_cleaner,
            input_path, output_path, method, sensitivity, dilation,
            inpaint_radius, detection_style,
        )
        encoded = _encode_output(output_path)
        return JSONResponse(content={
            "success": True,
            "bubbles_detected": bubbles_detected,
            **encoded,
        })
    except Exception as exc:
        logger.error(f"Cleaner failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        for p in (input_path, output_path):
            try:
                if os.path.exists(p):
                    os.remove(p)
            except OSError:
                pass


@router.post(
    "/remove-bubbles-b64",
    summary="Remove speech bubbles from a base64-encoded image",
)
async def remove_bubbles_base64(body: CleanerBase64Request):
    """
    Accepts the panel image as a base64 string. Useful when calling from the
    Express layer or other HTTP clients that don't use multipart forms.
    """
    try:
        raw = base64.b64decode(body.image_base64)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid base64 image data.")

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
        tmp_in.write(raw)
        input_path = tmp_in.name

    output_path = input_path.replace(".png", "_clean.png")

    try:
        logger.info(
            f"Cleaning base64 image | method={body.method} "
            f"sensitivity={body.sensitivity}"
        )
        bubbles_detected = await asyncio.to_thread(
            _run_cleaner,
            input_path, output_path, body.method, body.sensitivity,
            body.dilation, body.inpaint_radius, body.detection_style,
        )
        encoded = _encode_output(output_path)
        return JSONResponse(content={
            "success": True,
            "bubbles_detected": bubbles_detected,
            **encoded,
        })
    except Exception as exc:
        logger.error(f"Cleaner (base64) failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        for p in (input_path, output_path):
            try:
                if os.path.exists(p):
                    os.remove(p)
            except OSError:
                pass
