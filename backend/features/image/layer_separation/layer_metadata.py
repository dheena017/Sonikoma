"""
backend/features/image_editor/services/layer_separation/layer_metadata.py
─────────────────────────────────────────────────────────────────────────────
Layer Metadata & 3D Motion Presets Generation Service:
- Structured OCR text nodes for TTS voiceover & subtitle alignment
- 3D parallax motion presets (z-indices, camera focus, speed multipliers)
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations
 
from typing import Any, Dict, List, Sequence, Union

import cv2
import numpy as np

from features.image.ocr.ocr_geometry import OcrSegment


def build_text_nodes(ocr_results: Union[List[OcrSegment], List[Dict[str, Any]], Sequence[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    Builds structured reading-order OCR text nodes for auto-TTS voiceover
    and dynamic subtitle alignment.

    Args:
        ocr_results: Raw bounding boxes and transcribed texts from EasyOCR.

    Returns:
        List of structured text node dicts with reading order, type, and bboxes.
    """
    text_nodes = []
    if not ocr_results:
        return text_nodes

    sfx_keywords = {"BOOM", "WHAM", "SWOOSH", "BANG", "CLICK", "ERROR"}
    for idx, res in enumerate(ocr_results):
        pts = np.array(res.get("box", []), dtype=np.int32)
        bx, by, bw, bh = cv2.boundingRect(pts) if len(pts) > 0 else (0, 0, 0, 0)
        txt_content = str(res.get("text", "")).strip()
        conf_val = float(res.get("conf", res.get("confidence", 0.9)))

        node_type = "sfx" if any(k in txt_content.upper() for k in sfx_keywords) else "dialogue"

        text_nodes.append({
            "id": f"text_node_{idx+1}",
            "reading_order": idx + 1,
            "text": txt_content,
            "type": node_type,
            "confidence": round(conf_val, 2),
            "bbox": {"x": int(bx), "y": int(by), "w": int(bw), "h": int(bh)},
        })

    return text_nodes


def build_motion_presets(
    width: int,
    height: int,
    char_count: int,
) -> Dict[str, Any]:
    """
    Generates ready-to-use 3D Parallax Motion Presets for Motion Comic video generation.

    Args:
        width: Panel width in pixels.
        height: Panel height in pixels.
        char_count: Number of distinct character layers.

    Returns:
        Motion preset configuration dictionary.
    """
    return {
        "suggested_camera_focus": {"x": width // 2, "y": height // 2},
        "suggested_transition": "zoom_in" if char_count <= 1 else "parallax_pan",
        "parallax_depth_config": {
            "background": {"z_index": 0, "parallax_speed": 0.2},
            "effects": {"z_index": 1, "parallax_speed": 0.5},
            "character": {"z_index": 2, "parallax_speed": 1.0},
            "sfx": {"z_index": 3, "parallax_speed": 1.1},
            "text": {"z_index": 4, "parallax_speed": 1.25},
        },
    }


__all__ = [
    "build_text_nodes",
    "build_motion_presets",
]
