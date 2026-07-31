"""
backend/app/services/image/providers/yolo_provider.py
─────────────────────────────────────────────────────────────────────────────
Wrapper interface for Ultralytics YOLO model loading and inference.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Any, Optional

import importlib.util

logger = logging.getLogger("sonikoma.providers.vision.yolo")

class YOLOProvider:
    """Wrapper provider to interact with YOLO models."""

    @staticmethod
    def is_available() -> bool:
        return importlib.util.find_spec("ultralytics") is not None and importlib.util.find_spec("huggingface_hub") is not None

    @staticmethod
    def load_model(model_path_or_hub_id: str, filename: Optional[str] = None) -> Any:
        """Loads a YOLO model from a local file path or downloads it from HuggingFace."""
        if not YOLOProvider.is_available():
            raise RuntimeError("ultralytics or huggingface_hub is not installed.")

        try:
            from ultralytics import YOLO
            from huggingface_hub import hf_hub_download
        except ImportError:
            raise RuntimeError("Failed to import ultralytics or huggingface_hub.")

        # If it is a HuggingFace repository identifier
        if "/" in model_path_or_hub_id and not os.path.exists(model_path_or_hub_id):
            if not filename:
                raise ValueError("filename is required to download model from HuggingFace Hub.")
            logger.info(f"[YOLOProvider] Downloading model {model_path_or_hub_id} ({filename}) from HuggingFace...")
            model_path = hf_hub_download(repo_id=model_path_or_hub_id, filename=filename)
        else:
            model_path = model_path_or_hub_id

        logger.info(f"[YOLOProvider] Loading YOLO model from path: {model_path}")
        return YOLO(model_path)

    @staticmethod
    def run_inference(model: Any, image_source: Any, conf: float = 0.25, **kwargs) -> Any:
        """Executes object detection/segmentation inference on the given image source."""
        if model is None:
            raise ValueError("YOLO model instance is not initialized.")
        return model(image_source, conf=conf, **kwargs)
