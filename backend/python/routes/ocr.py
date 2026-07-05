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
from media.image.ocr import extract_dialogue_from_panel, extract_full_ocr_data

logger = logging.getLogger("sonikoma.routes.ocr")
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
    lang_list = [l.strip() for l in langs.split(",") if l.strip()]
    suffix = os.path.splitext(file.filename or ".png")[1] or ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        image_path = tmp.name

    try:
        logger.info(f"[OCR] Extracting dialogue from uploaded file: {file.filename}")
        dialogue = await extract_dialogue_from_panel(image_path, langs=lang_list)
        logger.info(f"[OCR] Extraction successful. Text length: {len(dialogue)}")
        return {"success": True, "text": dialogue}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if os.path.exists(image_path): os.remove(image_path)


@router.post(
    "/extract-full",
    summary="Extract detailed OCR data including bounding boxes",
)
async def extract_text_full(
    file: UploadFile = File(...),
    langs: str = Form("en"),
):
    lang_list = [l.strip() for l in langs.split(",") if l.strip()]
    suffix = os.path.splitext(file.filename or ".png")[1] or ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        image_path = tmp.name

    try:
        logger.info(f"[OCR] Extracting full OCR data from uploaded file: {file.filename}")
        results = await extract_full_ocr_data(image_path, langs=lang_list)
        logger.info(f"[OCR] Full extraction successful. Segments found: {len(results)}")
        return {"success": True, "results": results}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if os.path.exists(image_path): os.remove(image_path)


@router.post("/extract-b64", summary="Extract text from base64")
async def extract_text_base64(body: OCRBase64Request):
    try:
        raw = base64.b64decode(body.image_base64)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid base64 image data.")

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(raw)
        image_path = tmp.name

    try:
        dialogue = await extract_dialogue_from_panel(image_path, langs=body.langs)
        return {"success": True, "text": dialogue}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if os.path.exists(image_path): os.remove(image_path)


@router.post("/extract-full-b64", summary="Extract full OCR data from base64")
async def extract_text_full_base64(body: OCRBase64Request):
    try:
        raw = base64.b64decode(body.image_base64)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid base64 image data.")

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(raw)
        image_path = tmp.name

    try:
        results = await extract_full_ocr_data(image_path, langs=body.langs)
        return {"success": True, "results": results}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if os.path.exists(image_path): os.remove(image_path)
