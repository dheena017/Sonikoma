"""
backend/app/services/scraper/ai/stitcher_descrambler.py
─────────────────────────────────────────────────────────────────────────────
AI Smart Scene Stitcher & DRM Tile Descrambler
Handles continuous vertical gutter stitching and DRM scrambled tile reconstruction.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import math
import logging
from typing import List, Tuple, Optional
from PIL import Image

logger = logging.getLogger("sonikoma.scraper.stitcher")


class StitcherDescrambler:
    """Smart continuous scene stitcher & DRM tile descrambler."""

    @classmethod
    def descramble_image_tiles(
        cls,
        image_bytes: bytes,
        grid_cols: int = 4,
        grid_rows: int = 4,
        key_seed: Optional[int] = None
    ) -> bytes:
        """
        Descrambles an image divided into a grid matrix (e.g. 4x4 or 8x8)
        by applying the inverse permutation mapping.
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            tile_w = width // grid_cols
            tile_h = height // grid_rows

            dest = Image.new(img.mode, (width, height))
            
            # Standard pseudo-random permutation sequence based on seed
            total_tiles = grid_cols * grid_rows
            permutation = list(range(total_tiles))
            if key_seed is not None:
                # Deterministic shuffle reversal
                for i in range(total_tiles - 1, 0, -1):
                    j = (key_seed * (i + 1) * 31) % (i + 1)
                    permutation[i], permutation[j] = permutation[j], permutation[i]

            for src_idx, dest_idx in enumerate(permutation):
                src_x = (src_idx % grid_cols) * tile_w
                src_y = (src_idx // grid_cols) * tile_h
                dest_x = (dest_idx % grid_cols) * tile_w
                dest_y = (dest_idx // grid_cols) * tile_h

                tile = img.crop((src_x, src_y, src_x + tile_w, src_y + tile_h))
                dest.paste(tile, (dest_x, dest_y))

            out = io.BytesIO()
            dest.save(out, format="JPEG", quality=95)
            return out.getvalue()
        except Exception as e:
            logger.debug(f"[StitcherDescrambler] Descramble exception: {e}")
            return image_bytes

    @classmethod
    def stitch_vertical_slices(cls, slice_images: List[Image.Image], max_height: int = 15000) -> List[Image.Image]:
        """
        Seamlessly stitches chunked vertical webtoon slices into continuous narrative panels.
        """
        if not slice_images:
            return []
        if len(slice_images) == 1:
            return slice_images

        target_width = slice_images[0].width
        panels: List[Image.Image] = []
        current_batch: List[Image.Image] = []
        current_height = 0

        for s in slice_images:
            # Resize if width differs slightly due to responsive CDN
            if s.width != target_width:
                aspect = s.height / s.width
                s = s.resize((target_width, int(target_width * aspect)), Image.Resampling.LANCZOS)

            if current_height + s.height > max_height and current_batch:
                # Stitch current batch
                combined = Image.new("RGB", (target_width, current_height), (255, 255, 255))
                y_offset = 0
                for part in current_batch:
                    combined.paste(part, (0, y_offset))
                    y_offset += part.height
                panels.append(combined)
                current_batch = [s]
                current_height = s.height
            else:
                current_batch.append(s)
                current_height += s.height

        if current_batch:
            combined = Image.new("RGB", (target_width, current_height), (255, 255, 255))
            y_offset = 0
            for part in current_batch:
                combined.paste(part, (0, y_offset))
                y_offset += part.height
            panels.append(combined)

        return panels
