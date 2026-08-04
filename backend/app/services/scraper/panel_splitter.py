"""
backend/app/services/scraper/panel_splitter.py
─────────────────────────────────────────────────────────────────────────────
Smart AI Panel Splitter for vertical Webtoon strips using gutter line density.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
from typing import List, Dict, Any
from PIL import Image
import numpy as np

logger = logging.getLogger("sonikoma.services.scraper.panel_splitter")


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

        # Convert to grayscale for line luminance inspection
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

        # Calculate row means for dual-color check
        try:
            if img_np is not None and img_np.size > 0:
                if img_np.ndim == 3:
                    row_means = np.mean(np.mean(img_np, axis=2), axis=1).tolist()
                else:
                    row_means = np.mean(img_np, axis=1).tolist()
            else:
                row_means = []
        except Exception:
            row_means = []
            if 'pixels' in locals():
                for y in range(height):
                    row_vals = []
                    for x in range(0, width, step):
                        px = pixels[x, y]
                        if isinstance(px, (tuple, list)):
                            row_vals.append(float(px[0]))
                        elif isinstance(px, (int, float)):
                            row_vals.append(float(px))
                    if not row_vals:
                        row_means.append(0.0)
                    else:
                        row_means.append(sum(row_vals) / len(row_vals))

        # Detect consecutive continuous gutter blocks
        min_panel_height = max(40, min_panel_height) # ensure it doesn't swallow everything if left default
        if height <= min_panel_height:
            return [image_bytes]

        is_gutter_row = []
        for y in range(height):
            mean = row_means[y] if y < len(row_means) else 0.0
            var = row_variances[y] if y < len(row_variances) else 0.0

            # Check for explicitly white or black flat rows
            if (mean >= 240 and var < 12.0) or (mean <= 15 and var < 12.0):
                is_gutter_row.append(True)
            else:
                is_gutter_row.append(False)

        cut_points = []
        in_gutter = False
        g_start = 0
        min_gutter_h = 10

        for y in range(height):
            if is_gutter_row[y] and not in_gutter:
                in_gutter = True
                g_start = y
            elif not is_gutter_row[y] and in_gutter:
                in_gutter = False
                g_end = y
                if g_end - g_start >= min_gutter_h:
                    cut_points.append((g_start + g_end) // 2)

        if in_gutter:
            g_end = height
            if g_end - g_start >= min_gutter_h:
                cut_points.append((g_start + g_end) // 2)

        # Merge close cuts to form valid panels
        split_points = [0]
        for cut in cut_points:
            if cut - split_points[-1] >= min_panel_height:
                split_points.append(cut)

        if height - split_points[-1] >= min_panel_height:
            split_points.append(height)
        else:
            split_points[-1] = height

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
