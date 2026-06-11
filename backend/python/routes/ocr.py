"""
backend/python/routes/ocr.py
─────────────────────────────────────────────────────────────────────────────
OCR text extraction endpoint.

POST /api/py/ocr/extract
  Body: multipart/form-data — image file upload

Returns: JSON with extracted text segments
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import base64
import tempfile
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.ocr import extract_dialogue_from_panel

logger = logging.getLogger("anivox.routes.ocr")
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class OCRBase64Request(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded panel image")
    langs: List[str] = Field(default=["en"], description="Language codes for EasyOCR")


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/extract",
    summary="Extract dialogue text from a comic panel (file upload)",
)
async def extract_text_upload(
    file: UploadFile = File(..., description="Comic panel image"),
    langs: str = Form("en", description="Comma-separated language codes, e.g. 'en,ko'"),
):
    """
    Uses EasyOCR to extract text from speech bubbles or any visible text
    in the uploaded panel image. Returns a list of text segments with
    confidence scores above 0.3.

    Note: First invocation will download EasyOCR language model files (~200MB).
    """
    lang_list = [l.strip() for l in langs.split(",") if l.strip()]

    suffix = os.path.splitext(file.filename or ".png")[1] or ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        image_path = tmp.name

    try:
        logger.info(f"OCR extracting from: {file.filename} | langs={lang_list}")
        dialogue = await extract_dialogue_from_panel(image_path, langs=lang_list)
        return JSONResponse(content={
            "success": True,
            "text": dialogue,
            "count": len(dialogue),
            "languages": lang_list,
            "message": f"Extracted {len(dialogue)} text segment(s).",
        })
    except Exception as exc:
        logger.error(f"OCR failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        try:
            if os.path.exists(image_path):
                os.remove(image_path)
        except OSError:
            pass


@router.post(
    "/extract-b64",
    summary="Extract dialogue text from a base64-encoded panel image",
)
async def extract_text_base64(body: OCRBase64Request):
    """
    Accepts the panel image as a base64 string for programmatic use
    from the Express layer or browser-based callers.
    """
    try:
        raw = base64.b64decode(body.image_base64)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid base64 image data.")

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(raw)
        image_path = tmp.name

    try:
        logger.info(f"OCR (base64) | langs={body.langs}")
        dialogue = await extract_dialogue_from_panel(image_path, langs=body.langs)
        return JSONResponse(content={
            "success": True,
            "text": dialogue,
            "count": len(dialogue),
            "languages": body.langs,
            "message": f"Extracted {len(dialogue)} text segment(s).",
        })
    except Exception as exc:
        logger.error(f"OCR (base64) failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        try:
            if os.path.exists(image_path):
                os.remove(image_path)
        except OSError:
            pass
