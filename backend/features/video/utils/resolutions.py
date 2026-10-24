"""
backend/features/video/utils/resolutions.py
─────────────────────────────────────────────────────────────────────────────
Standard video dimensions, aspect ratios, encoder alignment, and bitrate math.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Tuple, Dict, Optional

# Standard display aspect ratios and broadcast dimensions
STANDARD_RESOLUTIONS: Dict[str, Tuple[int, int]] = {
    "1080p": (1920, 1080),           # Full HD 16:9 Landscape (YouTube)
    "720p": (1280, 720),             # Standard HD 16:9 Landscape
    "4k": (3840, 2160),              # Ultra HD 16:9 Landscape
    "vertical_1080p": (1080, 1920),  # 9:16 Vertical (Shorts, Reels, TikTok)
    "vertical_720p": (720, 1280),    # 9:16 Vertical
    "square": (1080, 1080),          # 1:1 Square (Instagram)
    "classic": (1440, 1080),         # 4:3 Standard
    "cinemascope": (2560, 1080),     # 21:9 Ultra-wide Cinema
    "16:9": (1920, 1080),
    "9:16": (1080, 1920),
    "1:1": (1080, 1080),
    "4:3": (1440, 1080),
    "21:9": (2560, 1080),
    "auto": (1920, 1080),
}


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _parse_custom_dimensions(preset_clean: str) -> Optional[Tuple[int, int]]:
    """Internal helper to parse custom dimension strings like '1920x1080' or '1920*1080'."""
    if 'x' in preset_clean or '*' in preset_clean:
        sep = 'x' if 'x' in preset_clean else '*'
        parts = preset_clean.split(sep)
        if len(parts) == 2:
            try:
                w, h = int(parts[0].strip()), int(parts[1].strip())
                return make_even_dimensions(w, h)
            except (ValueError, TypeError):
                return None
    return None


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def make_even_dimensions(width: int, height: int) -> Tuple[int, int]:
    """Ensures pixel dimensions are divisible by 2 (mandatory for H.264/yuv420p video codecs)."""
    w = max(2, width - (width % 2))
    h = max(2, height - (height % 2))
    return w, h


def get_resolution(
    preset: str,
    default: Tuple[int, int] = (1920, 1080)
) -> Tuple[int, int]:
    """Resolves a preset string ('1080p', 'vertical_1080p', '4k') or 'WxH' into (width, height)."""
    if not preset:
        return default

    preset_clean = preset.lower().strip()
    if preset_clean in STANDARD_RESOLUTIONS:
        return STANDARD_RESOLUTIONS[preset_clean]

    custom_dims = _parse_custom_dimensions(preset_clean)
    if custom_dims:
        return custom_dims

    return default


def get_bitrate(width: int, height: int, fps: int = 30) -> str:
    """Calculates recommended video encoding bitrate string based on resolution and framerate."""
    pixels = width * height
    if pixels >= 3840 * 2160:
        return "35M" if fps > 30 else "25M"
    elif pixels >= 1920 * 1080:
        return "12M" if fps > 30 else "8M"
    elif pixels >= 1280 * 720:
        return "6M" if fps > 30 else "4M"
    else:
        return "2M"


# Backward compatibility aliases
ensure_even_dimensions = make_even_dimensions
resolve_resolution = get_resolution
calculate_video_bitrate = get_bitrate

__all__ = [
    "STANDARD_RESOLUTIONS",
    "make_even_dimensions",
    "get_resolution",
    "get_bitrate",
    "ensure_even_dimensions",
    "resolve_resolution",
    "calculate_video_bitrate",
]
