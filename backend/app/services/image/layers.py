"""
services/image/layers.py
─────────────────────────────────────────────────────────────────────────────
AI-powered layer extraction and YOLO debug visualisation.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import gc
import base64
import asyncio
import tempfile
import logging
from typing import Dict, Any

import services.image.utils.image_utils as img_utils
from PIL import Image
from services.image.detect_panels import run_cv_detection
from media.image.layer_segmentation import process_layers

logger = logging.getLogger("sonikoma.services.image.layers")


async def extract_panel_layers_service(panel_id: str, url: str) -> Dict[str, Any]:
    resolved = await img_utils.resolve_image_to_buffer(url)
    tmp_in_path = None

    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
            tmp_in.write(resolved["data"])
            tmp_in_path = tmp_in.name

        detected_panels = run_cv_detection(
            image_path=tmp_in_path,
            sensitivity=30.0,
            bg_mode="auto",
            min_width_pct=0.15,
            min_height_px=60,
            merge_threshold=20,
            aspect_ratio_str="free",
            auto_split=True
        )

        img = Image.open(tmp_in_path)
        w, h = img.size

        if not detected_panels:
            try:
                layers = await process_layers(tmp_in_path, panel_id)
                warnings = []
            except Exception as ex:
                logger.error(f"[Layers Service] Sliceless processing failed: {ex}", exc_info=True)
                from media.image.layer_segmentation import create_blank_webp
                layers = {
                    "background_url": url,
                    "character_url": f"data:image/webp;base64,{base64.b64encode(create_blank_webp(100, 100)).decode('utf-8')}",
                    "text_url": f"data:image/webp;base64,{base64.b64encode(create_blank_webp(100, 100)).decode('utf-8')}",
                }
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
                        "area": w * h
                    },
                    "layers": layers
                }],
                "warnings": warnings
            }

        panel_semaphore = asyncio.Semaphore(3)

        async def process_one_panel(idx: int, box: dict):
            async with panel_semaphore:
                top_px = int(round((box["cropTop"] / 100) * h))
                bot_px = int(round((box["cropBottom"] / 100) * h))
                left_px = int(round((box["cropLeft"] / 100) * w))
                right_px = int(round((box["cropRight"] / 100) * w))

                crop_w = w - left_px - right_px
                crop_h = h - top_px - bot_px

                if left_px < 0 or top_px < 0 or crop_w <= 0 or crop_h <= 0 or (left_px + crop_w) > w or (top_px + crop_h) > h:
                    return None

                if crop_w <= 10 or crop_h <= 10:
                    return None

                img_cropped = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))
                tmp_panel_path = None
                try:
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_panel:
                        img_cropped.save(tmp_panel, format="PNG")
                        tmp_panel_path = tmp_panel.name

                    panel_layers = await process_layers(tmp_panel_path, f"{panel_id}_{idx}")
                    return {
                        "panel_index": idx,
                        "box": box,
                        "layers": panel_layers
                    }
                except Exception as panel_err:
                    logger.error(f"[Layers Service] Panel {idx} failed: {panel_err}", exc_info=True)
                    from media.image.layer_segmentation import create_blank_webp
                    fallback_bg_url = box.get("url") or url
                    fallback_layers = {
                        "background_url": fallback_bg_url,
                        "character_url": f"data:image/webp;base64,{base64.b64encode(create_blank_webp(100, 100)).decode('utf-8')}",
                        "text_url": f"data:image/webp;base64,{base64.b64encode(create_blank_webp(100, 100)).decode('utf-8')}",
                    }
                    return {
                        "panel_index": idx,
                        "box": box,
                        "layers": fallback_layers,
                        "warning": f"Panel #{idx + 1} fallback: AI Separation failed: {str(panel_err)}"
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

        gc.collect()
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except ImportError:
            pass

        try:
            from services.training.training_monitor import check_and_trigger_training
            await asyncio.to_thread(check_and_trigger_training)
        except Exception:
            pass

        return {
            "success": True,
            "panel_id": panel_id,
            "layers": first_layers,
            "panels": results,
            "warnings": warnings
        }
    finally:
        if tmp_in_path and os.path.exists(tmp_in_path):
            try:
                os.remove(tmp_in_path)
            except OSError:
                pass


async def debug_yolo_detections_service(url: str, conf: float = 0.25) -> bytes:
    resolved = await img_utils.resolve_image_to_buffer(url)
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_f:
            tmp_f.write(resolved["data"])
            tmp_path = tmp_f.name

        from media.image.debug_visualizer import draw_yolo_detections
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


__all__ = [
    "extract_panel_layers_service",
    "debug_yolo_detections_service",
]
