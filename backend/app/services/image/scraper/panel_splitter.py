"""
backend/app/services/image/scraper/panel_splitter.py
─────────────────────────────────────────────────────────────────────────────
Smart AI Panel Splitter for vertical Webtoon strips using gutter line density.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
from typing import List, Dict, Any
from PIL import Image
import numpy as np

logger = logging.getLogger("sonikoma.services.image.scraper.panel_splitter")


def split_vertical_strip_into_panels(
    image_bytes: bytes,
    min_panel_height: int = 250,
    gutter_threshold: int = 15
) -> List[bytes]:
    """
    Analyzes a vertical webtoon image strip for horizontal whitespace/black gutters
    and splits it into discrete panel image buffers.
    """
    if not image_bytes:
        return []

    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size

        if height <= min_panel_height:
            return [image_bytes]

        gray = img.convert("L")

        try:
            img_np = np.array(gray)
            if img_np is None or img_np.size == 0:
                return [image_bytes]

            step = max(1, width // 50)
            sampled_cols = img_np[:, ::step]
            row_variances = np.var(sampled_cols, axis=1).tolist()
        except Exception:
            pixels = gray.load()
            if pixels is None:
                return [image_bytes]
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

        split_points = [0]
        for y in range(min_panel_height, height - min_panel_height):
            if row_variances[y] < gutter_threshold:
                if y - split_points[-1] >= min_panel_height:
                    split_points.append(y)

        split_points.append(height)

        panels = []
        for i in range(len(split_points) - 1):
            y_start = split_points[i]
            y_end = split_points[i + 1]

            if y_end - y_start < min_panel_height:
                continue

            crop_box = (0, y_start, width, y_end)
            cropped_img = img.crop(crop_box)

            out_buf = io.BytesIO()
            cropped_img.save(out_buf, format="PNG")
            panels.append(out_buf.getvalue())

        return panels if panels else [image_bytes]

    except Exception as err:
        logger.warning(f"[Panel Splitter] Error splitting vertical strip: {err}")
        return [image_bytes]
