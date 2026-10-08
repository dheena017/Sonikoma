"""
backend/features/video_editor/video/services/frame_builder.py
─────────────────────────────────────────────────────────────────────────────
Frame composition and subtitle overlay generators for video compilation.
Includes frame resizing, letterboxing, gaussian blurring, and subtitle banners.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont
from typing import Optional, Tuple
from proglog import ProgressBarLogger

logger = logging.getLogger("sonikoma.video_editor.video.services.frame_builder")

_PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")
)
_VIDEO_OUTPUT_DIR = os.path.join(_PROJECT_ROOT, "data", "media")


class MoviePyCompileLogger(ProgressBarLogger):
    """
    Proglog logger that intercepts FFmpeg frame rendering from MoviePy and
    emits concise log messages every 10% as well as updating the job manager progress.
    """
    def __init__(self, report_progress=None):
        super().__init__()
        self.report_progress = report_progress
        self.last_pct = -1

    def bars_callback(self, bar, attr, value, old_value=None):
        if bar == "t" and attr == "index":
            total = self.bars.get(bar, {}).get("total", 0)
            if total > 0:
                pct = int((value / total) * 100)
                if pct % 10 == 0 and pct != self.last_pct:
                    self.last_pct = pct
                    logger.info(f"[Video Compiler] FFmpeg encoding progress: {pct}% ({value}/{total} frames)")
                    if self.report_progress:
                        prog = 88.0 + (pct / 100.0) * 11.0
                        self.report_progress(round(prog, 1))


class SubtitleOverlay:
    """Precomputed subtitle banner overlay that applies alpha blending with minimal CPU ops."""
    def __init__(self, rgb: np.ndarray, alpha: np.ndarray, banner_h: int):
        self.rgb = rgb
        self.alpha = alpha
        self.rgb_alpha = (rgb * alpha)
        self.inv_alpha = (1.0 - alpha)
        self.height = banner_h

    def apply_to(self, frame: np.ndarray, target_width: int):
        h = self.height
        frame[-h:, 0:target_width] = (
            frame[-h:, 0:target_width] * self.inv_alpha + self.rgb_alpha
        ).astype(np.uint8)

    def __iter__(self):
        return iter((self.rgb, self.alpha))


def build_panel_frame_image(
    background_image: Image.Image,
    foreground_image: Image.Image,
    target_width: int = 1920,
    target_height: int = 1080,
) -> Image.Image:
    """Combines foreground panel centered over a blurred background fill with fast downscaled blur."""
    target_width = max(1, target_width)
    target_height = max(1, target_height)

    # Fast downscaled gaussian blur: downsample by 4x, apply radius 6, resize back
    blur_w = max(16, target_width // 4)
    blur_h = max(16, target_height // 4)
    bg_small = background_image.resize((blur_w, blur_h), Image.Resampling.BILINEAR)
    bg_blurred = bg_small.filter(ImageFilter.GaussianBlur(6))
    bg_img = bg_blurred.resize((target_width, target_height), Image.Resampling.BILINEAR)

    img_w, img_h = foreground_image.size
    img_w = max(1, img_w)
    img_h = max(1, img_h)

    scale = min(target_width / img_w, target_height / img_h)
    new_w = max(1, int(img_w * scale))
    new_h = max(1, int(img_h * scale))
    fg_img = foreground_image.resize((new_w, new_h), Image.Resampling.LANCZOS)

    frame = bg_img.copy()
    offset_x = max(0, (target_width - new_w) // 2)
    offset_y = max(0, (target_height - new_h) // 2)
    frame.paste(fg_img, (offset_x, offset_y))
    return frame.convert("RGB")


def create_subtitle_overlay(text: str, target_width: int = 1920) -> Optional[SubtitleOverlay]:
    """Renders a sleek cinematic subtitle overlay banner to blend onto frames."""
    if not text or not text.strip():
        return None
    clean_text = text.strip()
    if len(clean_text) > 160:
        clean_text = clean_text[:157] + "..."

    banner_h = 105
    banner = Image.new("RGBA", (target_width, banner_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(banner)

    try:
        font = ImageFont.truetype("arial.ttf", 26)
    except Exception:
        try:
            font = ImageFont.load_default()
        except Exception:
            font = None

    bbox = draw.textbbox((0, 0), clean_text, font=font) if hasattr(draw, "textbbox") and font else (0, 0, len(clean_text) * 14, 30)
    text_w = bbox[2] - bbox[0]
    pill_w = min(target_width - 80, max(360, text_w + 60))
    pill_x0 = (target_width - pill_w) // 2
    pill_x1 = pill_x0 + pill_w
    pill_y0 = 12
    pill_y1 = banner_h - 12

    # Draw rounded pill background with subtle glow border
    draw.rounded_rectangle([(pill_x0, pill_y0), (pill_x1, pill_y1)], radius=18, fill=(10, 10, 15, 210), outline=(255, 255, 255, 45), width=1)
    
    text_x = (target_width - text_w) // 2
    text_y = (banner_h - (bbox[3] - bbox[1])) // 2 - 2
    # Shadow and sharp text
    draw.text((text_x + 1, text_y + 1), clean_text, font=font, fill=(0, 0, 0, 190))
    draw.text((text_x, text_y), clean_text, font=font, fill=(255, 255, 255, 255))

    banner_np = np.array(banner, dtype=np.float32)
    alpha = banner_np[:, :, 3:4] / 255.0
    rgb = banner_np[:, :, :3]
    return SubtitleOverlay(rgb=rgb, alpha=alpha, banner_h=banner_h)


__all__ = [
    "_PROJECT_ROOT",
    "_VIDEO_OUTPUT_DIR",
    "MoviePyCompileLogger",
    "SubtitleOverlay",
    "build_panel_frame_image",
    "create_subtitle_overlay",
]
