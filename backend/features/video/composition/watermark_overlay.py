"""
backend/features/video/composition/watermark_overlay.py
─────────────────────────────────────────────────────────────────────────────
Creator branding stamps, watermark placement, and channel logo overlays.
─────────────────────────────────────────────────────────────────────────────
"""

from PIL import Image
from typing import Tuple


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _calculate_anchor_coords(
    canvas_w: int,
    canvas_h: int,
    mark_w: int,
    mark_h: int,
    position: str = "bottom-right",
    margin: int = 24
) -> Tuple[int, int]:
    """Computes top-left (x, y) coordinates for anchored watermark positioning."""
    pos = position.lower().strip()
    if pos == "top-left":
        return margin, margin
    elif pos == "top-right":
        return max(0, canvas_w - mark_w - margin), margin
    elif pos == "bottom-left":
        return margin, max(0, canvas_h - mark_h - margin)
    elif pos == "center":
        return max(0, (canvas_w - mark_w) // 2), max(0, (canvas_h - mark_h) // 2)
    else:  # default bottom-right
        return max(0, canvas_w - mark_w - margin), max(0, canvas_h - mark_h - margin)


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def add_watermark(
    frame: Image.Image,
    watermark_image: Image.Image,
    position: str = "bottom-right",
    opacity: float = 0.85
) -> Image.Image:
    """Adds a watermark or logo image onto a video frame."""
    if not watermark_image:
        return frame

    base = frame.convert("RGBA")
    mark = watermark_image.convert("RGBA")

    # Resize watermark if it exceeds 15% of frame width
    max_w = int(base.width * 0.15)
    if mark.width > max_w and max_w > 10:
        ratio = max_w / mark.width
        mark = mark.resize((max_w, int(mark.height * ratio)), Image.Resampling.LANCZOS)

    # Adjust opacity
    if opacity < 1.0:
        r, g, b, a = mark.split()
        a = a.point(lambda p: int(p * max(0.0, min(1.0, opacity))))
        mark = Image.merge("RGBA", (r, g, b, a))

    x, y = _calculate_anchor_coords(base.width, base.height, mark.width, mark.height, position)
    base.paste(mark, (x, y), mark)
    return base.convert("RGB")


# Backward compatibility alias
apply_video_watermark = add_watermark

__all__ = [
    "add_watermark",
    "apply_video_watermark",
]
