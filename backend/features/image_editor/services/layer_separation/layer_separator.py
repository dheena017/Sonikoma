"""
backend/features/image_editor/services/layer_separation/layer_separator.py
─────────────────────────────────────────────────────────────────────────────
Full-Page Panel Layer Separation Orchestration Service:
- Slices page images into individual comic panels using OpenCV panel detection
- Concurrently runs layer decomposition across panels with bounded semaphore
- Resilient fallback generation and GPU memory reclamation
- Visual YOLO debug annotation service
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import asyncio
import base64
import gc
import logging
import os
import tempfile
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image

import features.image_editor.services.utils.image_utils as img_utils
from features.image_editor.services.detector.main_service_detector.panel_detector import (
    run_cv_detection,
)
from features.image_editor.services.layer_separation.inpainting import create_blank_webp
from features.image_editor.services.layer_separation.layer_segmentation import (
    process_layers,
)

logger = logging.getLogger("sonikoma.services.image.layer_separation.layer_separator")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Panel Bounding Box & Cropping Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _calculate_crop_bounds(
    box: Dict[str, Any],
    image_width: int,
    image_height: int,
) -> Tuple[int, int, int, int, Dict[str, Any]]:
    """
    Computes absolute pixel crop bounds (left, top, width, height)
    from percentage or absolute coordinate dictionaries.
    """
    w, h = image_width, image_height

    # 1. Percentage bounds (0 - 100%)
    if any(k in box for k in ("cropTop", "cropBottom", "cropLeft", "cropRight")):
        top_px = int(round((float(box.get("cropTop", 0.0)) / 100.0) * h))
        bot_px = int(round((float(box.get("cropBottom", 0.0)) / 100.0) * h))
        left_px = int(round((float(box.get("cropLeft", 0.0)) / 100.0) * w))
        right_px = int(round((float(box.get("cropRight", 0.0)) / 100.0) * w))
        crop_w = w - left_px - right_px
        crop_h = h - top_px - bot_px

    # 2. Absolute x, y, width, height bounds
    elif any(k in box for k in ("x", "y", "w", "h")):
        left_px = int(round(float(box.get("x", 0))))
        top_px = int(round(float(box.get("y", 0))))
        crop_w = int(round(float(box.get("w", box.get("width", w - left_px)))))
        crop_h = int(round(float(box.get("h", box.get("height", h - top_px)))))

    # 3. Absolute top, bottom, left, right bounds
    elif any(k in box for k in ("bottom", "right")):
        left_px = int(round(float(box.get("left", 0))))
        top_px = int(round(float(box.get("top", 0))))
        right_bound = int(round(float(box.get("right", w))))
        bottom_bound = int(round(float(box.get("bottom", h))))
        crop_w = max(0, right_bound - left_px)
        crop_h = max(0, bottom_bound - top_px)

    # 4. Fallback: full canvas
    else:
        left_px, top_px = 0, 0
        crop_w, crop_h = w, h

    # Clamp bounds within canvas
    left_px = max(0, min(left_px, w - 1))
    top_px = max(0, min(top_px, h - 1))
    crop_w = max(0, min(crop_w, w - left_px))
    crop_h = max(0, min(crop_h, h - top_px))

    normalized_box = dict(box)
    normalized_box.setdefault("cropTop", round((top_px / h) * 100, 2) if h > 0 else 0.0)
    normalized_box.setdefault("cropBottom", round(((h - (top_px + crop_h)) / h) * 100, 2) if h > 0 else 0.0)
    normalized_box.setdefault("cropLeft", round((left_px / w) * 100, 2) if w > 0 else 0.0)
    normalized_box.setdefault("cropRight", round(((w - (left_px + crop_w)) / w) * 100, 2) if w > 0 else 0.0)
    normalized_box.setdefault("width", crop_w)
    normalized_box.setdefault("height", crop_h)

    return left_px, top_px, crop_w, crop_h, normalized_box


def _create_fallback_layers(url: str) -> Dict[str, Any]:
    """Generates empty/transparent fallback layers when AI separation fails."""
    blank_data_url = f"data:image/webp;base64,{base64.b64encode(create_blank_webp(100, 100)).decode('utf-8')}"
    return {
        "background_url": url,
        "character_url": blank_data_url,
        "text_url": blank_data_url,
    }


def _free_system_resources() -> None:
    """Collects garbage and empties PyTorch CUDA cache if available."""
    gc.collect()
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except ImportError:
        pass


# ─────────────────────────────────────────────────────────────────────────────
# 2. Main Public Service Function (Single External Entry Point for Full Pages)
# ─────────────────────────────────────────────────────────────────────────────

async def extract_panel_layers_service(panel_id: str, url: str) -> Dict[str, Any]:
    """
    Main orchestration service for panel layer extraction across full pages.

    1. Resolves input URL or image buffer into local temporary storage.
    2. Runs OpenCV panel detection to identify all individual panels.
    3. Crops each panel and processes layers concurrently (throttled by Semaphore).
    4. Gathers multi-panel responses and cleans temporary files and GPU memory.

    Args:
        panel_id: Base identifier for the comic panel / page.
        url: URL or data URI of the comic image.

    Returns:
        Structured response dictionary containing extracted layers for all panels.
    """
    resolved = await img_utils.resolve_image_to_buffer(url)
    tmp_in_path: Optional[str] = None

    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
            tmp_in.write(resolved["data"])
            tmp_in_path = tmp_in.name

        # Detect comic panel boxes
        detected_panels = run_cv_detection(
            image_path=tmp_in_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=60,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True,
        )

        img = Image.open(tmp_in_path)
        w, h = img.size

        # Fallback: No panels detected -> process entire canvas as single panel
        if not detected_panels:
            try:
                layers = await process_layers(tmp_in_path, panel_id)
                warnings: List[str] = []
            except Exception as ex:
                logger.warning(f"[Layer Separation] Full-page layer separation failed: {ex}")
                layers = _create_fallback_layers(url)
                warnings = [f"Full-page fallback: AI Separation failed: {str(ex)}"]

            return {
                "success": True,
                "panel_id": panel_id,
                "layers": layers,
                "panels": [{
                    "panel_index": 0,
                    "box": {
                        "cropTop": 0.0,
                        "cropBottom": 0.0,
                        "cropLeft": 0.0,
                        "cropRight": 0.0,
                        "width": w,
                        "height": h,
                        "area": w * h,
                    },
                    "layers": layers,
                }],
                "warnings": warnings,
            }

        # Multi-panel concurrent extraction pool
        panel_semaphore = asyncio.Semaphore(3)

        async def process_one_panel(idx: int, box: dict) -> Optional[Dict[str, Any]]:
            async with panel_semaphore:
                left_px, top_px, crop_w, crop_h, normalized_box = _calculate_crop_bounds(box, w, h)
                if crop_w <= 10 or crop_h <= 10:
                    return None

                img_cropped = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))
                tmp_panel_path: Optional[str] = None

                try:
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_panel:
                        img_cropped.save(tmp_panel, format="PNG")
                        tmp_panel_path = tmp_panel.name

                    panel_layers = await process_layers(tmp_panel_path, f"{panel_id}_{idx}")
                    return {
                        "panel_index": idx,
                        "box": normalized_box,
                        "layers": panel_layers,
                    }
                except Exception as panel_err:
                    logger.warning(f"[Layer Separation] Panel {idx+1} separation failed: {panel_err}")
                    fallback_url = box.get("url") or url
                    return {
                        "panel_index": idx,
                        "box": normalized_box,
                        "layers": _create_fallback_layers(fallback_url),
                        "warning": f"Panel #{idx + 1} fallback: AI Separation failed: {str(panel_err)}",
                    }
                finally:
                    if tmp_panel_path and os.path.exists(tmp_panel_path):
                        try:
                            os.remove(tmp_panel_path)
                        except OSError:
                            pass

        panel_tasks = [process_one_panel(idx, box) for idx, box in enumerate(detected_panels)]
        panel_results = await asyncio.gather(*panel_tasks)

        results = sorted([r for r in panel_results if r is not None], key=lambda r: r["panel_index"])
        first_layers = results[0]["layers"] if results else None
        warnings = [r.get("warning") for r in results if r and r.get("warning")]

        _free_system_resources()

        # Trigger training monitor asynchronously if relevant
        try:
            from features.intelligence.services_training.training_monitor import check_and_trigger_training
            await asyncio.to_thread(check_and_trigger_training)
        except Exception:
            pass

        return {
            "success": True,
            "panel_id": panel_id,
            "layers": first_layers,
            "panels": results,
            "warnings": warnings,
        }

    finally:
        if tmp_in_path and os.path.exists(tmp_in_path):
            try:
                os.remove(tmp_in_path)
            except OSError:
                pass


async def debug_yolo_detections_service(url: str, conf: float = 0.25) -> bytes:
    """Visual debugging endpoint that returns an annotated image of YOLO bounding boxes."""
    resolved = await img_utils.resolve_image_to_buffer(url)
    tmp_path: Optional[str] = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_f:
            tmp_f.write(resolved["data"])
            tmp_path = tmp_f.name

        from scripts.debug_visualizer import draw_yolo_detections
        annotated_bytes = await asyncio.to_thread(draw_yolo_detections, tmp_path, conf)
        if annotated_bytes is None:
            raise ValueError("YOLO model is not available.")
        return annotated_bytes
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


# Canonical alias
extract_panel_layers = extract_panel_layers_service

__all__ = [
    "extract_panel_layers",
    "extract_panel_layers_service",
    "debug_yolo_detections_service",
]
