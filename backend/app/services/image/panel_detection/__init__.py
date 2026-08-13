"""
backend/app/services/image/panel_detector/__init__.py
─────────────────────────────────────────────────────────────────────────────
Package initializer for panel detection services.
Provides complete panel detection, vertical strip slicing, grid detection,
and post-processing pipelines with clean, human-readable function names.
─────────────────────────────────────────────────────────────────────────────
"""

from .panel_detector import (
    detect_panels_in_image,
    run_cv_detection,
    _sort_panels_reading_order,
    _split_oversized_webtoon_boxes,
)
from .grid_detector import (
    detect_manga_grid_panels,
    _detect_panels_grid_cv,
    _detect_panels_grid_pil,
)
from .webtoon_detector import (
    detect_vertical_strip_panels,
    _detect_panels_webtoon,
    _detect_bg_color_and_threshold,
)
from .panel_postprocessor import (
    compute_post_panel_confidence,
    resolve_micro_panels,
    resolve_overlapping_panels_lineage,
    recover_coverage_selectively,
)
from .speech_bubble_detector import (
    get_yolo_speech_bubble_model,
    segment_speech_bubbles_and_text_balloons,
    get_yolo_character_segmentation_model,
    segment_character_foreground,
    get_yolo_model,
    segment_text_and_balloons,
    get_yolo_char_model,
    segment_characters,
    trigger_yolo_fine_tuning,
    get_yolo_training_status,
)

# Human-readable alias for post-processing panel boundaries
postprocess_panel_boundaries = compute_post_panel_confidence

__all__ = [
    # Human-readable public API
    "detect_panels_in_image",
    "detect_vertical_strip_panels",
    "detect_manga_grid_panels",
    "postprocess_panel_boundaries",
    "get_yolo_speech_bubble_model",
    "segment_speech_bubbles_and_text_balloons",
    "get_yolo_character_segmentation_model",
    "segment_character_foreground",
    "trigger_yolo_fine_tuning",
    "get_yolo_training_status",
    # Legacy backward-compatibility aliases
    "run_cv_detection",
    "_detect_panels_webtoon",
    "_detect_panels_grid_cv",
    "_sort_panels_reading_order",
    "_split_oversized_webtoon_boxes",
    "_detect_panels_grid_pil",
    "_detect_bg_color_and_threshold",
    "compute_post_panel_confidence",
    "resolve_micro_panels",
    "resolve_overlapping_panels_lineage",
    "recover_coverage_selectively",
    "get_yolo_model",
    "segment_text_and_balloons",
    "get_yolo_char_model",
    "segment_characters",
]
