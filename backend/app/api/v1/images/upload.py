"""
backend/app/api/v1/images/upload.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for uploading images and managing YOLO fine-tuning training data
(the Data Flywheel). Logic is kept inline here since it has no corresponding
service layer — it drives file I/O directly on training_data/.
─────────────────────────────────────────────────────────────────────────────
"""

import glob
import logging
import mimetypes
import os
import uuid
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile

from utils.cache import stitched_cache
from utils.supabase_storage import upload_to_supabase_bucket
import services.image.image_utils as img_utils
import asyncio, time

logger = logging.getLogger("sonikoma.api.images.upload")
router = APIRouter()

# Shared training-data directory (sits next to the repo root's data/ folder)
_TRAINING_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "data", "training_data")
)


# ─── Image Upload ──────────────────────────────────────────────────────────────

@router.post("/upload", summary="Upload a panel image to Supabase static storage bucket")
async def upload_image(file: UploadFile = File(...)):
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
            new_url = f"/api/image/cached/{cache_id}"

        return {"success": True, "url": new_url}
    except Exception as e:
        logger.error(f"[Upload API] Error uploading image: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Data Flywheel — YOLO Training Pairs ──────────────────────────────────────

@router.get("/training-data-count", summary="Count saved YOLO training data pairs")
async def get_training_data_count():
    try:
        os.makedirs(_TRAINING_DIR, exist_ok=True)
        orig_files = glob.glob(os.path.join(_TRAINING_DIR, "original_*.*"))
        return {"success": True, "count": len(orig_files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/save-training-data",
    summary="Save human-corrected text masks and original panels for future YOLO training (Data Flywheel)"
)
async def save_training_data(
    original_panel: UploadFile = File(...),
    corrected_text_mask: UploadFile = File(...)
):
    logger.info("[Data Flywheel] Received human-corrected training sample pair.")
    try:
        os.makedirs(_TRAINING_DIR, exist_ok=True)

        unique_pair_id = uuid.uuid4().hex[:12]

        orig_bytes = await original_panel.read()
        mask_bytes = await corrected_text_mask.read()

        orig_ext = mimetypes.guess_extension(original_panel.content_type or "") or ".png"
        mask_ext = mimetypes.guess_extension(corrected_text_mask.content_type or "") or ".png"

        orig_filename = f"original_{unique_pair_id}{orig_ext}"
        mask_filename = f"mask_{unique_pair_id}{mask_ext}"

        env_mode = os.getenv("ENVIRONMENT", "development").lower().strip()

        orig_url = None
        mask_url = None

        if env_mode == "production":
            orig_url = await asyncio.to_thread(
                upload_to_supabase_bucket, orig_bytes, "training", orig_filename,
                original_panel.content_type or "image/png"
            )
            mask_url = await asyncio.to_thread(
                upload_to_supabase_bucket, mask_bytes, "training", mask_filename,
                corrected_text_mask.content_type or "image/png"
            )

        # Always save locally so training pipeline can access them
        with open(os.path.join(_TRAINING_DIR, orig_filename), "wb") as f:
            f.write(orig_bytes)
        with open(os.path.join(_TRAINING_DIR, mask_filename), "wb") as f:
            f.write(mask_bytes)

        logger.info(f"[Data Flywheel] Saved pair '{unique_pair_id}' to {_TRAINING_DIR}")
        return {
            "success": True,
            "pair_id": unique_pair_id,
            "original_panel_url": orig_url or f"/api/image/training/{orig_filename}",
            "corrected_text_mask_url": mask_url or f"/api/image/training/{mask_filename}",
        }
    except Exception as e:
        logger.error(f"[Data Flywheel] Failed to save training pair: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start-training", summary="Trigger YOLO fine-tuning on the collected training data")
async def start_training(epochs: int = 20, batch_size: int = 4):
    os.makedirs(_TRAINING_DIR, exist_ok=True)
    orig_files = glob.glob(os.path.join(_TRAINING_DIR, "original_*.*"))
    if not orig_files:
        raise HTTPException(
            status_code=400,
            detail="Cannot start training: No human-corrected samples have been saved yet."
        )
    try:
        from services.image.providers.yolo import trigger_fine_tuning
        success = trigger_fine_tuning(epochs, batch_size)
        if not success:
            raise HTTPException(status_code=409, detail="A training run is already in progress.")
        return {"success": True, "message": f"Training started in background for {epochs} epochs (batch={batch_size})."}
    except ImportError:
        raise HTTPException(status_code=503, detail="Training subsystem is not available.")


@router.get("/training-status", summary="Get status of current YOLO fine-tuning run")
async def get_training_status():
    try:
        from services.image.providers.yolo import status, is_training_locked, get_lock_pid
        from services.training_monitor import get_current_original_count, load_metadata, TRAINING_DATA_DIR

        status_dict = status.to_dict()

        try:
            meta = load_metadata()
            last_trained_count = meta.get("last_trained_count", 0)
        except Exception:
            last_trained_count = 0

        try:
            current_count = get_current_original_count()
        except Exception:
            current_count = 0

        lock_file_path = os.path.join(TRAINING_DATA_DIR, "training.lock")
        lock_file_exists = os.path.exists(lock_file_path)
        lock_file_pid = get_lock_pid(lock_file_path) if lock_file_exists else None
        lock_file_active = is_training_locked(lock_file_path) if lock_file_exists else False

        return {
            "success": True,
            **status_dict,
            "last_trained_count": last_trained_count,
            "current_count": current_count,
            "new_samples_since_last_training": max(0, current_count - last_trained_count),
            "lock_file_exists": lock_file_exists,
            "lock_file_pid": lock_file_pid,
            "lock_file_active": lock_file_active,
        }
    except ImportError:
        return {"success": True, "is_training": False, "message": "Training subsystem not available."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/training-data-list", summary="List saved training data pairs")
async def get_training_data_list():
    try:
        os.makedirs(_TRAINING_DIR, exist_ok=True)
        orig_files = sorted(glob.glob(os.path.join(_TRAINING_DIR, "original_*.*")))
        pairs = []
        for orig_path in orig_files:
            pair_id = os.path.basename(orig_path).replace("original_", "").rsplit(".", 1)[0]
            mask_candidates = glob.glob(os.path.join(_TRAINING_DIR, f"mask_{pair_id}.*"))
            pairs.append({
                "pair_id": pair_id,
                "original_url": f"/api/image/training/original_{pair_id}.png",
                "mask_url": f"/api/image/training/mask_{pair_id}.png" if mask_candidates else None,
            })
        return {"success": True, "pairs": pairs, "count": len(pairs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/training-data-pair/{pair_id}", summary="Delete a human-corrected training pair by ID")
async def delete_training_data_pair(pair_id: str):
    try:
        os.makedirs(_TRAINING_DIR, exist_ok=True)
        found = []
        for pattern in [f"original_{pair_id}.*", f"mask_{pair_id}.*"]:
            found.extend(glob.glob(os.path.join(_TRAINING_DIR, pattern)))

        if not found:
            raise HTTPException(status_code=404, detail=f"Training pair '{pair_id}' not found.")

        for f in found:
            try:
                os.remove(f)
            except OSError:
                pass

        return {"success": True, "pair_id": pair_id, "deleted": len(found)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
