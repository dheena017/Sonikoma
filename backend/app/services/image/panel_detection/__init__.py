"""
backend/app/services/image/panel_detection/__init__.py
─────────────────────────────────────────────────────────────────────────────
Package Initializer for Panel Detection Services:
- Modular Detection Engines: OpenCV, YOLO, AI Vision, Webtoon Gutters, Grid Contours
- Workflow Orchestrators: Small Panels, Long Panels, Batch URLs, File Uploads
- Post-Processing & Fusion: Speech bubble proximity binding, gutter noise filtering
─────────────────────────────────────────────────────────────────────────────
"""

# 1. High-Level Workflow Orchestrators
from .detect_small_panels_service import detect_small_panels_boxes
from .detect_long_panels_service import detect_long_panels_boxes
from .detect_batch_service import detect_batch_panels
from .detect_upload_service import detect_upload_panels

# 2. Standalone Engine Detectors
from .opencv_detector import detect_opencv_boxes
from .speech_bubble_detector import detect_yolo_entities
from .ai_vision_detector import detect_ai_vision
from .panel_fusion_service import fuse_panels_and_bubbles

# 3. Domain-Specific Detectors
from .panel_detector import (
    detect_vertical_strip_panels,
    _detect_bg_color_and_threshold,
    _detect_panels_webtoon,
)
from .grid_detector import (
    detect_manga_grid_panels,
    _detect_panels_grid_cv,
    _detect_panels_grid_pil,
)
from .speech_bubble_detector import (
    get_yolo_speech_bubble_model,
    segment_speech_bubbles_and_text_balloons,
    get_yolo_character_segmentation_model,
    segment_character_foreground,
    trigger_yolo_fine_tuning,
    get_yolo_training_status,
)

# 4. Post-Processing & Detector Runners
from .panel_detector import (
    compute_post_panel_confidence,
    resolve_micro_panels,
    resolve_overlapping_panels_lineage,
    detect_panels_in_image,
    run_cv_detection,
    _sort_panels_reading_order,
    _split_oversized_webtoon_boxes,
)

# Alias for post-processing
postprocess_panel_boundaries = compute_post_panel_confidence

__all__ = [
    # Primary Workflow Services
    "detect_small_panels_boxes",
    "detect_long_panels_boxes",
    "detect_batch_panels",
    "detect_upload_panels",
    # Standalone Engines
    "detect_opencv_boxes",
    "detect_yolo_entities",
    "detect_ai_vision",
    "fuse_panels_and_bubbles",
    # Specialized Format Detectors
    "detect_vertical_strip_panels",
    "detect_manga_grid_panels",
    "get_yolo_speech_bubble_model",
    "segment_speech_bubbles_and_text_balloons",
    "get_yolo_character_segmentation_model",
    "segment_character_foreground",
    "trigger_yolo_fine_tuning",
    "get_yolo_training_status",
    # Post-processing & Legacy
    "postprocess_panel_boundaries",
    "detect_panels_in_image",
    "run_cv_detection",
    "_detect_bg_color_and_threshold",
    "_detect_panels_webtoon",
    "_detect_panels_grid_cv",
    "_detect_panels_grid_pil",
    "_sort_panels_reading_order",
    "_split_oversized_webtoon_boxes",
    "compute_post_panel_confidence",
    "resolve_micro_panels",
    "resolve_overlapping_panels_lineage",
    "recover_coverage_selectively",
]
