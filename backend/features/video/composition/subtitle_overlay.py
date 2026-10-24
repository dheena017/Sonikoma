"""
backend/features/video/composition/subtitle_overlay.py
─────────────────────────────────────────────────────────────────────────────
Cinematic subtitle pill banner rendering and precomputed alpha compositing.
─────────────────────────────────────────────────────────────────────────────
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from typing import Optional


class SubtitleOverlay:
    """Precomputed subtitle banner overlay that applies alpha blending with minimal CPU ops."""

    def __init__(self, rgb: np.ndarray, alpha: np.ndarray, banner_h: int):
        self.rgb = rgb
        self.alpha = alpha
        self.rgb_alpha = (rgb * alpha)
        self.inv_alpha = (1.0 - alpha)
        self.height = banner_h

    def apply_to(self, frame: np.ndarray, target_width: int):
        """In-place fast alpha compositing of the subtitle banner onto a video frame."""
        h = self.height
        frame[-h:, 0:target_width] = (
            frame[-h:, 0:target_width] * self.inv_alpha + self.rgb_alpha
        ).astype(np.uint8)

    def __iter__(self):
        return iter((self.rgb, self.alpha))


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _resolve_font(size: int = 26):
    """Loads system truetype font with fallback to PIL default font."""
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        try:
            return ImageFont.load_default()
        except Exception:
            return None


def _truncate_text(text: str, max_chars: int = 160) -> str:
    """Safely cleans and truncates subtitle text to prevent canvas overflow."""
    clean = text.strip()
    if len(clean) > max_chars:
        return clean[:max_chars - 3] + "..."
    return clean


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def create_subtitles(
    text: str,
    target_width: int = 1920
) -> Optional[SubtitleOverlay]:
    """Creates a subtitle banner overlay to draw on video frames."""
    if not text or not text.strip():
        return None

    clean_text = _truncate_text(text)
    banner_h = 105
    banner = Image.new("RGBA", (target_width, banner_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(banner)

    font = _resolve_font(26)
    bbox = draw.textbbox((0, 0), clean_text, font=font) if hasattr(draw, "textbbox") and font else (0, 0, len(clean_text) * 14, 30)
    text_w = bbox[2] - bbox[0]
    pill_w = min(target_width - 80, max(360, text_w + 60))
    pill_x0 = (target_width - pill_w) // 2
    pill_x1 = pill_x0 + pill_w
    pill_y0 = 12
    pill_y1 = banner_h - 12

    # Draw rounded pill background with subtle glow border
    draw.rounded_rectangle(
        [(pill_x0, pill_y0), (pill_x1, pill_y1)],
        radius=18,
        fill=(10, 10, 15, 210),
        outline=(255, 255, 255, 45),
        width=1,
    )

    text_x = (target_width - text_w) // 2
    text_y = (banner_h - (bbox[3] - bbox[1])) // 2 - 2

    # Shadow and sharp foreground text
    draw.text((text_x + 1, text_y + 1), clean_text, font=font, fill=(0, 0, 0, 190))
    draw.text((text_x, text_y), clean_text, font=font, fill=(255, 255, 255, 255))

    banner_np = np.array(banner, dtype=np.float32)
    alpha = banner_np[:, :, 3:4] / 255.0
    rgb = banner_np[:, :, :3]
    return SubtitleOverlay(rgb=rgb, alpha=alpha, banner_h=banner_h)


# Backward compatibility alias
create_subtitle_overlay = create_subtitles

__all__ = [
    "SubtitleOverlay",
    "create_subtitles",
    "create_subtitle_overlay",
]
