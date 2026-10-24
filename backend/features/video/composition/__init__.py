"""
backend/features/video/composition/__init__.py
─────────────────────────────────────────────────────────────────────────────
Frame composition, letterboxing, subtitle overlays, and visual effects.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video.composition.frame_builder import (
    build_frame,
    build_panel_frame_image,
)
from features.video.composition.subtitle_overlay import (
    SubtitleOverlay,
    create_subtitles,
    create_subtitle_overlay,
)
from features.video.composition.sfx_visualizer import (
    add_sfx_text,
    overlay_manga_sfx,
)
from features.video.composition.watermark_overlay import (
    add_watermark,
    apply_video_watermark,
)

__all__ = [
    "build_frame",
    "build_panel_frame_image",
    "SubtitleOverlay",
    "create_subtitles",
    "create_subtitle_overlay",
    "add_sfx_text",
    "overlay_manga_sfx",
    "add_watermark",
    "apply_video_watermark",
]
