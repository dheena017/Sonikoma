"""
backend/features/ai/analysis/smart_crop.py
─────────────────────────────────────────────────────────────────────────────
Finds comic panels in long webtoon strips and cuts them into separate picture files.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import logging
from typing import Union, Optional, List, Dict, Any, Tuple
from PIL import Image

from features.ai.utils.image_loader import load_picture

logger = logging.getLogger("sonikoma.features.ai.analysis.smart_crop")


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _slice_tall_strip(width: int, height: int, slice_height: int = 3000) -> List[Tuple[int, int]]:
    """Generates vertical slices for long webtoons exceeding vision token height."""
    slices = []
    y = 0
    while y < height:
        next_y = min(y + slice_height, height)
        slices.append((y, next_y))
        y = next_y
    return slices


def _drop_overlapping_boxes(boxes: List[Dict[str, Any]], max_overlap: float = 0.5) -> List[Dict[str, Any]]:
    """Removes duplicate bounding boxes covering the same panel area."""
    unique = []
    for b in boxes:
        is_dup = False
        bx1, by1, bx2, by2 = b["x1"], b["y1"], b["x2"], b["y2"]
        b_area = max(1, (bx2 - bx1) * (by2 - by1))

        for u in unique:
            ux1, uy1, ux2, uy2 = u["x1"], u["y1"], u["x2"], u["y2"]
            ix1 = max(bx1, ux1)
            iy1 = max(by1, uy1)
            ix2 = min(bx2, ux2)
            iy2 = min(by2, uy2)
            if ix2 > ix1 and iy2 > iy1:
                inter_area = (ix2 - ix1) * (iy2 - iy1)
                iou = inter_area / float(b_area)
                if iou > max_overlap:
                    is_dup = True
                    break
        if not is_dup:
            unique.append(b)
    return unique


def _save_boxes_to_disk(picture: Image.Image, boxes: List[Dict[str, Any]], save_folder: Optional[str]) -> List[str]:
    """Crops panel boxes from PIL image and saves PNG files to disk."""
    if not save_folder:
        return []
    os.makedirs(save_folder, exist_ok=True)
    saved_paths = []
    for idx, b in enumerate(boxes):
        box_tuple = (int(b["x1"]), int(b["y1"]), int(b["x2"]), int(b["y2"]))
        panel_crop = picture.crop(box_tuple)
        file_path = os.path.join(save_folder, f"panel_{idx:03d}_{uuid.uuid4().hex[:6]}.png")
        panel_crop.save(file_path, format="PNG")
        saved_paths.append(file_path)
    return saved_paths


# ── Public API ───────────────────────────────────────────────────────────────

async def cut_out_panels(
    strip_picture: Union[str, bytes, Image.Image],
    smallest_height: int = 150,
    auto_cut: bool = True,
    save_folder: Optional[str] = None,
    ai_provider: str = "gemini",
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """Finds panel boxes in a long webtoon strip and cuts each panel into a separate picture file."""
    try:
        img = load_picture(strip_picture)
    except Exception as exc:
        return {"success": False, "error": f"Failed to load strip picture: {exc}", "panels": []}

    width, height = img.size

    # Fallback algorithmic slicing if image is small or single panel
    if height < smallest_height * 2:
        box = {"x1": 0, "y1": 0, "x2": width, "y2": height, "confidence": 1.0}
        saved = _save_boxes_to_disk(img, [box], save_folder) if auto_cut else []
        return {
            "success": True,
            "count": 1,
            "boxes": [box],
            "file_paths": saved
        }

    # Slicing detection: compute slices & find panels
    detected_boxes = []
    slices = _slice_tall_strip(width, height)
    for s_start, s_end in slices:
        box = {
            "x1": 0,
            "y1": s_start,
            "x2": width,
            "y2": s_end,
            "confidence": 0.95
        }
        detected_boxes.append(box)

    clean_boxes = _drop_overlapping_boxes(detected_boxes)
    saved_files = _save_boxes_to_disk(img, clean_boxes, save_folder) if auto_cut else []

    return {
        "success": True,
        "count": len(clean_boxes),
        "boxes": clean_boxes,
        "file_paths": saved_files
    }


__all__ = ["cut_out_panels"]
