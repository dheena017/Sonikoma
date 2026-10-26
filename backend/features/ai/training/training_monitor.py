"""
backend/features/ai/training/training_monitor.py
─────────────────────────────────────────────────────────────────────────────
Automatic background training monitor for comic bubble & panel detector YOLO models.
Watches training_data folder for new sample thresholds and triggers fine-tuning.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import glob
import json
import time
import logging
import asyncio
import threading
from typing import Dict, Any

from features.ai.training.train_detector import train_bubble_model
from features.ai.training.track_training import check_training_status

logger = logging.getLogger("sonikoma.features.ai.training.monitor")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", "..", ".."))
TRAINING_DATA_DIR = os.path.join(PROJECT_ROOT, "data", "training_data")
METADATA_FILE = os.path.join(TRAINING_DATA_DIR, "training_metadata.json")

_metadata_lock = threading.Lock()
_monitor_task = None


def get_current_original_count() -> int:
    """Returns the total number of original_* training images in training_data."""
    if not os.path.exists(TRAINING_DATA_DIR):
        return 0
    patterns = [os.path.join(TRAINING_DATA_DIR, "original_*.*")]
    count = 0
    for p in patterns:
        count += len(glob.glob(p))
    return count


def load_metadata() -> Dict[str, Any]:
    """Loads training monitor metadata."""
    with _metadata_lock:
        if not os.path.exists(METADATA_FILE):
            return {
                "last_trained_count": 0,
                "last_trained_at": 0.0,
                "total_runs": 0,
            }
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"[TrainingMonitor] Failed to load metadata, returning default: {e}")
            return {
                "last_trained_count": 0,
                "last_trained_at": 0.0,
                "total_runs": 0,
            }


def save_metadata(meta: Dict[str, Any]) -> None:
    """Saves training monitor metadata."""
    with _metadata_lock:
        os.makedirs(TRAINING_DATA_DIR, exist_ok=True)
        try:
            with open(METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump(meta, f, indent=2)
        except Exception as e:
            logger.error(f"[TrainingMonitor] Failed to save metadata: {e}")


def check_and_trigger_training() -> bool:
    """
    Checks the current sample count against the last trained count.
    If 20 or more new samples have accumulated, triggers background fine-tuning.
    """
    lock_file = os.path.join(TRAINING_DATA_DIR, "training.lock")
    status_info = check_training_status()
    if status_info.get("is_training") or os.path.exists(lock_file):
        return False

    current_count = get_current_original_count()
    meta = load_metadata()
    last_trained = meta.get("last_trained_count", 0)

    if current_count < last_trained:
        meta["last_trained_count"] = current_count
        save_metadata(meta)
        last_trained = current_count

    new_samples = current_count - last_trained
    if new_samples >= 20:
        logger.info(f"[TrainingMonitor] Threshold reached ({new_samples} new samples). Triggering training.")
        meta["last_trained_count"] = current_count
        meta["last_trained_at"] = time.time()
        meta["total_runs"] = meta.get("total_runs", 0) + 1
        save_metadata(meta)

        try:
            coro = train_bubble_model(dataset_folder=TRAINING_DATA_DIR, rounds=20, batch_size=4)
            if asyncio.iscoroutine(coro):
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = None
                if loop and loop.is_running():
                    future = asyncio.run_coroutine_threadsafe(coro, loop)
                    future.result()
                else:
                    asyncio.run(coro)
            return True
        except Exception as e:
            logger.warning(f"[TrainingMonitor] Failed to trigger training: {e}")
            meta["last_trained_count"] = last_trained
            save_metadata(meta)
            return False

    return False


async def _monitor_loop(interval_seconds: int = 60):
    """Background loop that periodically executes check_and_trigger_training."""
    logger.info(f"[TrainingMonitor] Started background training monitor loop ({interval_seconds}s interval).")
    while True:
        try:
            await asyncio.to_thread(check_and_trigger_training)
        except Exception as e:
            logger.error(f"[TrainingMonitor] Error in check loop: {e}", exc_info=True)
        await asyncio.sleep(interval_seconds)


def start_background_monitor(loop=None):
    """Starts the training monitor loop on the active event loop."""
    global _monitor_task
    if _monitor_task is not None and not _monitor_task.done():
        logger.warning("[TrainingMonitor] Background monitor is already active.")
        return

    if loop is None:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()

    _monitor_task = loop.create_task(_monitor_loop(interval_seconds=60))


__all__ = [
    "check_and_trigger_training",
    "start_background_monitor",
    "get_current_original_count",
    "load_metadata",
    "save_metadata",
    "TRAINING_DATA_DIR",
    "METADATA_FILE",
]
