"""
backend/features/image/crop/panel_splitter_service.py
─────────────────────────────────────────────────────────────────────────────
Automatic AI/CV Panel Splitter for Vertical Webtoon Strips:
- Analyzes horizontal row pixel variance across columns
- Detects natural whitespace and black gutters
- Splits continuous strips into discrete panel image buffers
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
from typing import List
from PIL import Image
import numpy as np

logger = logging.getLogger("sonikoma.features.image.crop.splitter")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _compute_row_variances(gray_img: Image.Image, width: int, height: int) -> List[float]:
    """Computes horizontal pixel row variance across subsampled column points."""
    try:
        img_np = np.array(gray_img)
        if img_np is not None and img_np.size > 0:
            step = max(1, width // 50)
            sampled_cols = img_np[:, ::step]
            return np.var(sampled_cols, axis=1).tolist()
    except Exception:
        pass

    # Pure PIL fallback if numpy array conversion fails
    pixels = gray_img.load()
    if pixels is None:
        return [0.0] * height

    row_variances = []
    step = max(1, width // 50)
    for y in range(height):
        row_vals: List[float] = []
        for x in range(0, width, step):
            px = pixels[x, y]
            if isinstance(px, (tuple, list)):
                row_vals.append(float(px[0]))
            elif isinstance(px, (int, float)):
                row_vals.append(float(px))
        if not row_vals:
            row_variances.append(0.0)
            continue
        avg = sum(row_vals) / len(row_vals)
        var = sum((v - avg) ** 2 for v in row_vals) / len(row_vals)
        row_variances.append(var)

    return row_variances


def _find_gutter_split_points(
    row_variances: List[float],
    height: int,
    min_panel_height: int,
    gutter_threshold: float
) -> List[int]:
    """Identifies vertical split indices based on low variance gutter bands."""
    split_points = [0]
    for y in range(min_panel_height, height - min_panel_height):
        if row_variances[y] < gutter_threshold:
            if y - split_points[-1] >= min_panel_height:
                split_points.append(y)
    split_points.append(height)
    return split_points


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def split_strip_by_gutters(
    image_bytes: bytes,
    min_panel_height: int = 250,
    gutter_threshold: float = 15.0
) -> List[bytes]:
    """
    Analyzes a vertical Webtoon image strip for horizontal gutters
    and splits it into discrete panel image buffers.

    Args:
        image_bytes: Raw bytes of the vertical webtoon strip.
        min_panel_height: Minimum pixel height for an extracted panel slice.
        gutter_threshold: Pixel variance floor under which a row is considered a gutter.

    Returns:
        List of encoded PNG panel byte buffers.
    """
    if not image_bytes:
        return []

    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size

        if height <= min_panel_height:
            return [image_bytes]

        gray = img.convert("L")
        variances = _compute_row_variances(gray, width, height)
        split_points = _find_gutter_split_points(variances, height, min_panel_height, gutter_threshold)

        panels: List[bytes] = []
        for i in range(len(split_points) - 1):
            y_start = split_points[i]
            y_end = split_points[i + 1]

            if y_end - y_start < min_panel_height:
                continue

            cropped_img = img.crop((0, y_start, width, y_end))
            out_buf = io.BytesIO()
            cropped_img.save(out_buf, format="PNG")
            panels.append(out_buf.getvalue())

        return panels if panels else [image_bytes]

    except Exception as err:
        logger.warning(f"[Panel Splitter] Error splitting vertical strip: {err}")
        return [image_bytes]


__all__ = [
    "split_strip_by_gutters",
]
