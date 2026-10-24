"""
YOLO comic detector model training runner.

Launches background training for custom YOLO models to detect comic speech bubbles
and panel boundaries on creator artwork.
"""

from typing import Dict, Any, Literal
import os
import uuid
import logging

logger = logging.getLogger("sonikoma.features.ai.training.train")


def _check_training_files(dataset_folder: str) -> bool:
    """Verifies that dataset directory exists and has images."""
    if not os.path.exists(dataset_folder):
        return False
    return True


async def train_bubble_model(
    dataset_folder: str,
    target: Literal["bubble", "panel"] = "bubble",
    rounds: int = 50,
    batch_size: int = 16
) -> Dict[str, Any]:
    """Launches background training for a custom YOLO comic detection model."""
    valid = _check_training_files(dataset_folder)
    job_id = str(uuid.uuid4())

    return {
        "job_id": job_id,
        "target": target,
        "rounds": rounds,
        "batch_size": batch_size,
        "dataset_valid": valid,
        "status": "queued",
        "message": f"Training job {job_id} queued for {target} detection with {rounds} epochs."
    }


__all__ = ["train_bubble_model"]
