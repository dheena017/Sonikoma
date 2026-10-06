"""
backend/app/services/image/panel_detection/__init__.py
─────────────────────────────────────────────────────────────────────────────
Panel Detection Services Package:
- Workflow Orchestrators: Small Panels, Long Panels, Batch URLs, File Uploads
- Standalone Detectors: OpenCV, YOLO Speech Bubbles, AI Vision, Manga Grids
- Core Engine: Webtoon Gutter Slicing, 100% Whitespace Trimming, Overlap Resolution
─────────────────────────────────────────────────────────────────────────────
"""

# 1. High-Level Workflow Orchestrators
from .detect_small_panels_service import detect_small_panels_boxes
from .detect_long_panels_service import detect_long_panels_boxes
from .detect_batch_service import detect_batch_panels
from .detect_upload_service import detect_upload_panels

# 2. Standalone Engine Detectors
from .opencv_detector import detect_opencv_boxes
from .speech_bubble_detector import (
    detect_yolo_entities,
    get_yolo_speech_bubble_model,
    segment_speech_bubbles_and_text_balloons,
    get_yolo_character_segmentation_model,
    segment_character_foreground,
)
from .ai_vision_detector import detect_ai_vision
from .grid_detector import detect_manga_grid_panels
from .panel_fusion_service import fuse_panels_and_bubbles

# 3. Core Engine & Post-Processing
from .panel_detector import (
    detect_vertical_strip_panels,
    _detect_bg_color_and_threshold,
    resolve_overlapping_panels_lineage,
    resolve_micro_panels,
    compute_post_panel_confidence,
    run_cv_detection,
)

__all__ = [
    # Workflow Orchestrators
    "detect_small_panels_boxes",
    "detect_long_panels_boxes",
    "detect_batch_panels",
    "detect_upload_panels",
    # Standalone Detectors
    "detect_opencv_boxes",
    "detect_yolo_entities",
    "detect_ai_vision",
    "detect_manga_grid_panels",
    "fuse_panels_and_bubbles",
    # Speech Bubbles & Characters
    "get_yolo_speech_bubble_model",
    "segment_speech_bubbles_and_text_balloons",
    "get_yolo_character_segmentation_model",
    "segment_character_foreground",
    # Core Engine & Post-Processing
    "detect_vertical_strip_panels",
    "_detect_bg_color_and_threshold",
    "resolve_overlapping_panels_lineage",
    "resolve_micro_panels",
    "compute_post_panel_confidence",
    "run_cv_detection",
]
