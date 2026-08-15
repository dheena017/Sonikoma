"""
backend/app/services/scraper/reconstruction/tiles.py
─────────────────────────────────────────────────────────────────────────────
Tile detection and image reconstruction for chopped webtoon panels.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import re
import logging
from typing import List, Dict, Any, Optional
from PIL import Image
from ..models import CandidateImage, ImageSourceType

logger = logging.getLogger("sonikoma.services.scraper.reconstruction.tiles")


class TileReconstructor:
    """Detects chopped image tile sequences and stitches them into full pages."""

    TILE_PATTERN = re.compile(r'[-_]tile[-_]?(\d+)|[-_]slice[-_]?(\d+)|[-_]part[-_]?(\d+)', re.IGNORECASE)

    @classmethod
    def is_tile_candidate(cls, url: str) -> bool:
        """Determines if a URL filename represents a sliced image tile."""
        return bool(cls.TILE_PATTERN.search(url))

    @classmethod
    def group_and_reconstruct_tiles(cls, image_buffers: List[bytes], layout: str = "vertical") -> Optional[bytes]:
        """Stitches a list of raw image tile byte buffers into a single composite image."""
        if not image_buffers:
            return None
        if len(image_buffers) == 1:
            return image_buffers[0]

        try:
            images = [Image.open(io.BytesIO(buf)).convert("RGB") for buf in image_buffers]
            if layout == "vertical":
                max_w = max(img.width for img in images)
                total_h = sum(img.height for img in images)
                canvas = Image.new("RGB", (max_w, total_h), (255, 255, 255))
                y_offset = 0
                for img in images:
                    # Center align if widths differ slightly
                    x_offset = (max_w - img.width) // 2
                    canvas.paste(img, (x_offset, y_offset))
                    y_offset += img.height
            else:
                total_w = sum(img.width for img in images)
                max_h = max(img.height for img in images)
                canvas = Image.new("RGB", (total_w, max_h), (255, 255, 255))
                x_offset = 0
                for img in images:
                    y_offset = (max_h - img.height) // 2
                    canvas.paste(img, (x_offset, y_offset))
                    x_offset += img.width

            out_buf = io.BytesIO()
            canvas.save(out_buf, format="JPEG", quality=92)
            return out_buf.getvalue()
        except Exception as e:
            logger.error(f"[TileReconstructor] Failed to stitch tiles: {e}")
            return None
