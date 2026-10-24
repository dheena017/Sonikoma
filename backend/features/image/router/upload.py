"""
backend/features/image/router/upload.py
─────────────────────────────────────────────────────────────────────────────
Image Upload & Data Flywheel Router:
- Uploads images to Supabase storage bucket with cached local fallback
- Data Flywheel: Human-in-the-loop pair collection for continuous YOLO fine-tuning
─────────────────────────────────────────────────────────────────────────────
"""

import glob
import logging
import mimetypes
import os
import uuid
import asyncio
import time

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.core.cache import stitched_cache
from database.supabase import upload_to_supabase_bucket

logger = logging.getLogger("sonikoma.features.image.router.upload")
router = APIRouter()

_TRAINING_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "training_data")
)


# ── Image Upload ──────────────────────────────────────────────────────────────

@router.post("/upload", summary="Upload a panel image to Supabase static storage bucket")
async def upload_image(file: UploadFile = File(...)):
    """Uploads file to Supabase 'panels' bucket with in-memory caching fallback."""
    try:
        content_type = file.content_type or "application/octet-stream"
        if content_type == "application/octet-stream" and file.filename:
            guessed_type, _ = mimetypes.guess_type(file.filename)
            if guessed_type:
                content_type = guessed_type

        ext = "png"
        if "jpeg" in content_type or "jpg" in content_type:
            ext = "jpeg"
        elif "webp" in content_type:
            ext = "webp"
        elif "gif" in content_type:
            ext = "gif"

        file_bytes = await file.read()
        uploaded_filename = f"upload_{uuid.uuid4().hex[:8]}.{ext}"

        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket,
            file_bytes,
            "panels",
            uploaded_filename,
            content_type
        )

        if supabase_url:
            new_url = supabase_url
        else:
            cache_id = f"upload_{int(time.time() * 1000)}"
            stitched_cache.set(cache_id, {"data": file_bytes, "content_type": content_type})
            new_url = f"/api/v1/images/cached/{cache_id}"

        return {"success": True, "url": new_url}
    except Exception as exc:
        logger.error(f"[Upload API] Error uploading image: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ── Data Flywheel Endpoints ───────────────────────────────────────────────────

@router.get("/training-data-count", summary="Count saved YOLO training data pairs")
async def get_training_data_count():
    try:
        os.makedirs(_TRAINING_DIR, exist_ok=True)
        orig_files = glob.glob(os.path.join(_TRAINING_DIR, "original_*.*"))
        return {"success": True, "count": len(orig_files)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/save-training-data", summary="Save human-corrected training sample pair")
async def save_training_data(
    original_panel: UploadFile = File(...),
    corrected_text_mask: UploadFile = File(...)
):
    try:
        os.makedirs(_TRAINING_DIR, exist_ok=True)
        pair_id = uuid.uuid4().hex[:12]

        orig_bytes = await original_panel.read()
        mask_bytes = await corrected_text_mask.read()

        orig_ext = mimetypes.guess_extension(original_panel.content_type or "") or ".png"
        mask_ext = mimetypes.guess_extension(corrected_text_mask.content_type or "") or ".png"

        orig_filename = f"original_{pair_id}{orig_ext}"
        mask_filename = f"mask_{pair_id}{mask_ext}"

        with open(os.path.join(_TRAINING_DIR, orig_filename), "wb") as f:
            f.write(orig_bytes)
        with open(os.path.join(_TRAINING_DIR, mask_filename), "wb") as f:
            f.write(mask_bytes)

        return {
            "success": True,
            "pair_id": pair_id,
            "original_panel_url": f"/api/v1/images/training/{orig_filename}",
            "corrected_text_mask_url": f"/api/v1/images/training/{mask_filename}",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/training/{filename}", summary="Retrieve saved training image directly")
async def get_training_image(filename: str):
    file_path = os.path.abspath(os.path.join(_TRAINING_DIR, filename))
    if not file_path.startswith(_TRAINING_DIR) or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Training image not found")
    media_type = mimetypes.guess_type(file_path)[0] or "image/png"
    return FileResponse(file_path, media_type=media_type)


__all__ = ["router"]
