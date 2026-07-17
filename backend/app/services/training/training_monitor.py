import os
import json
import time
import glob
import logging
import asyncio
import threading
from providers.vision.yolo import trigger_fine_tuning, status

logger = logging.getLogger("sonikoma.services.training_monitor")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
TRAINING_DATA_DIR = os.path.join(PROJECT_ROOT, "data", "training_data")
METADATA_FILE = os.path.join(TRAINING_DATA_DIR, "training_metadata.json")

# Lock for loading/saving metadata to prevent concurrent read/write issues
_metadata_lock = threading.Lock()

def get_current_original_count() -> int:
    """Returns the total number of original_* files in the training_data folder."""
    if not os.path.exists(TRAINING_DATA_DIR):
        return 0
    # Match original_* images
    patterns = [
        os.path.join(TRAINING_DATA_DIR, "original_*.*")
    ]
    count = 0
    for p in patterns:
        count += len(glob.glob(p))
    return count

def load_metadata() -> dict:
    """Loads training metadata from the JSON file."""
    with _metadata_lock:
        if not os.path.exists(METADATA_FILE):
            # If metadata doesn't exist, we default to last_trained_count = 0
            return {
                "last_trained_count": 0,
                "last_trained_at": 0.0,
                "total_runs": 0
            }
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load training metadata, returning default: {e}")
            return {
                "last_trained_count": 0,
                "last_trained_at": 0.0,
                "total_runs": 0
            }

def save_metadata(meta: dict):
    """Saves training metadata to the JSON file."""
    with _metadata_lock:
        os.makedirs(TRAINING_DATA_DIR, exist_ok=True)
        try:
            with open(METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump(meta, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save training metadata: {e}")

def check_and_trigger_training() -> bool:
    """
    Checks the current sample count against the last trained count.
    If there are 20 or more new samples, triggers non-blocking background fine-tuning.
    """
    # 1. Check if training is already active
    lock_file = os.path.join(TRAINING_DATA_DIR, "training.lock")
    if status.to_dict()["is_training"] or os.path.exists(lock_file):
        logger.debug("[Monitor] Training is currently running or locked. Skipping check.")
        return False

    # 2. Get current sample count and last trained count
    current_count = get_current_original_count()
    meta = load_metadata()
    last_trained = meta.get("last_trained_count", 0)

    # Prevent negative count issues if samples were manually deleted
    if current_count < last_trained:
        meta["last_trained_count"] = current_count
        save_metadata(meta)
        last_trained = current_count

    new_samples = current_count - last_trained
    logger.info(f"[Monitor] Current samples: {current_count}, Last trained at: {last_trained}, New samples: {new_samples}/20")

    if new_samples >= 20:
        logger.info(f"[Monitor] Reached threshold of {new_samples} new samples! Triggering automatic YOLO fine-tuning.")

        # Update metadata before triggering to prevent double/multiple triggers
        meta["last_trained_count"] = current_count
        meta["last_trained_at"] = time.time()
        meta["total_runs"] = meta.get("total_runs", 0) + 1
        save_metadata(meta)

        # Trigger fine-tuning (runs in background thread, non-blocking)
        success = trigger_fine_tuning(epochs=20, batch_size=4)
        if success:
            logger.info("[Monitor] Successfully triggered YOLO training background task.")
            return True
        else:
            logger.warning("[Monitor] Failed to trigger training (already running or locked). Rolling back metadata count.")
            # Rollback metadata on failure
            meta["last_trained_count"] = last_trained
            meta["total_runs"] = max(0, meta.get("total_runs", 1) - 1)
            save_metadata(meta)
            return False

    return False

# Asynchronous background loop for FastAPI
_monitor_task = None

async def _monitor_loop(interval_seconds: int = 60):
    """Asynchronous loop that periodically runs check_and_trigger_training."""
    logger.info(f"Starting background training monitor loop (interval={interval_seconds}s)...")
    while True:
        try:
            await asyncio.to_thread(check_and_trigger_training)
        except Exception as e:
            logger.error(f"[Monitor Loop] Error during automatic training check: {e}", exc_info=True)
        await asyncio.sleep(interval_seconds)

def start_background_monitor(loop=None):
    """Starts the background monitor loop on the event loop."""
    global _monitor_task
    if _monitor_task is not None:
        logger.warning("Background monitor is already running.")
        return

    logger.info("Initializing automatic training data monitor service...")
    if loop is None:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()

    _monitor_task = loop.create_task(_monitor_loop(interval_seconds=60))
