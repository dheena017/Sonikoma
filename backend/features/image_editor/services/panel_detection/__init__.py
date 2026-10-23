"""
backend/features/image_editor/services/panel_detection/__init__.py
─────────────────────────────────────────────────────────────────────────────
Panel Detection & Comic Extraction Package:

1. Workflow Orchestrators:
   - detect_small_panels         : Single panel / standard comic page detection
   - detect_long_panels          : Tall vertical scrolling webtoon strip slicing
   - detect_batch_panels         : Asynchronous multi-URL batch processor
   - detect_composite_panels     : Single-call pipeline (panels + bubbles + characters)
   - detect_characters           : Dedicated character and pose detection orchestrator

2. Standalone Detectors & Vision Engines:
   - detect_opencv_panels        : Pure OpenCV contour and edge detector
   - detect_manga_grid_panels    : 2D Manga grid tier and column decomposing detector
   - detect_manga_grid_pil       : Projection-based 2D grid decomposition fallback
   - detect_speech_bubbles       : Deep-learning speech bubble & text polygon detector
   - detect_chat_ui_bubbles      : Manhwa smartphone chat and SMS dialog pill detector
   - detect_character_entities   : Multi-tier character, face, and silhouette detector
   - detect_ai_vision_flow       : Multimodal reading flow (TTB/RTL/LTR) & OCR reasoning
   - fuse_panels_and_bubbles     : Spatial entity fusion with manga placement conventions

3. Models & Segmentation:
   - get_yolo_speech_bubble_model
   - get_yolo_model (alias)
   - set_loaded_yolo_model
   - segment_speech_bubbles_and_text_balloons
   - get_yolo_character_segmentation_model
   - segment_character_foreground
   - has_yolo_dependencies

4. Core Webtoon Engine & Post-Processing:
   - PanelDetectionResult
   - detect_vertical_strip_panels
   - detect_background_color_and_threshold
   - detect_vertical_subgutters
   - sort_panels_reading_order
   - subdivide_continuous_tall_art_panel
   - run_cv_detection
   - normalize_panel_box
   - resolve_overlapping_panels
─────────────────────────────────────────────────────────────────────────────
"""

# 1. High-Level Workflow Orchestrators
from .detect_small_panels_service import (
    detect_small_panels,
)
from .detect_long_panels_service import (
    detect_long_panels,
)
from .detect_batch_service import (
    detect_batch_panels,
    process_single_url,
)
from .detect_composite_service import (
    detect_composite_panels,
)
from .detect_characters_service import (
    detect_characters,
    detect_character_entities,
    estimate_character_pose,
    detect_character_face,
    get_yolo_character_segmentation_model,
    segment_character_foreground,
)
detect_characters_boxes = detect_character_entities

# 2. Standalone Detectors & Vision Engines
from .opencv_detector import (
    detect_opencv_panels,
    detect_opencv_panels,
)
from .grid_detector import (
    detect_manga_grid_panels,
    detect_manga_grid_pil,
    detect_manga_grid_service,
)
from .speech_bubble_detector import (
    detect_speech_bubbles,
    detect_speech_bubbles_service,
    detect_chat_ui_bubbles,
    get_yolo_speech_bubble_model,
    segment_speech_bubbles_and_text_balloons,
)
detect_yolo_entities = detect_speech_bubbles
_detect_chat_ui_bubbles = detect_chat_ui_bubbles
get_yolo_model = get_yolo_speech_bubble_model
from .ai_vision_detector import (
    detect_ai_vision,
)

# 3. Spatial Fusion & Placement Logic
from .panel_fusion_service import (
    fuse_panels_and_bubbles,
    classify_speech_bubble_placement,
    is_bubble_inside_panel,
    is_bubble_crossing_panel_border,
    is_bubble_outside_panel_gutter,
    find_bubble_spanning_panels,
    find_overlapping_dialogue_bubbles,
    assign_characters_to_panels,
    bind_bubbles_to_characters,
    expand_panel_boundary_for_bubble,
    apply_bleed_padding,
    detect_and_mark_inset_panels,
    enforce_strict_non_overlap,
    compute_crop_margins,
    compute_box_distance,
    _box_distance,
    compute_box_intersection_area,
    _box_intersection_area,
    get_panel_y1,
    _raw_y1,
    get_panel_y2,
    _raw_y2,
    estimate_cinematography,
    _estimate_cinematography,
)

# 4. Core Engine & Post-Processing
from .panel_detector import (
    PanelDetectionResult,
    DetectStripPanelsRequest,
    DetectStripPanelsResponse,
    detect_vertical_strip_panels,
    detect_background_color_and_threshold,
    detect_vertical_subgutters,
    sort_panels_reading_order,
    subdivide_continuous_tall_art_panel,
    run_cv_detection,
    normalize_panel_box,
    resolve_overlapping_panels,
    detect_panels_service,
)

__all__ = [
    # Workflow Orchestrators
    "detect_small_panels",
    "detect_long_panels",
    "detect_batch_panels",
    "process_single_url",
    "detect_composite_panels",
    "detect_characters",
    "detect_characters_boxes",

    # Standalone Detectors
    "detect_opencv_panels",
    "detect_opencv_panels",
    "detect_manga_grid_panels",
    "detect_manga_grid_pil",
    "detect_manga_grid_service",
    "detect_speech_bubbles",
    "detect_yolo_entities",
    "detect_chat_ui_bubbles",
    "_detect_chat_ui_bubbles",
    "detect_character_entities",
    "estimate_character_pose",
    "detect_character_face",
    "detect_ai_vision",

    # Spatial Fusion
    "fuse_panels_and_bubbles",
    "classify_speech_bubble_placement",
    "is_bubble_inside_panel",
    "is_bubble_crossing_panel_border",
    "is_bubble_outside_panel_gutter",
    "find_bubble_spanning_panels",
    "find_overlapping_dialogue_bubbles",
    "assign_characters_to_panels",
    "bind_bubbles_to_characters",
    "expand_panel_boundary_for_bubble",
    "apply_bleed_padding",
    "detect_and_mark_inset_panels",
    "enforce_strict_non_overlap",
    "compute_crop_margins",
    "compute_box_distance",
    "_box_distance",
    "compute_box_intersection_area",
    "_box_intersection_area",
    "get_panel_y1",
    "_raw_y1",
    "get_panel_y2",
    "_raw_y2",
    "estimate_cinematography",
    "_estimate_cinematography",

    # Models & Segmentation
    "get_yolo_speech_bubble_model",
    "get_yolo_model",
    "segment_speech_bubbles_and_text_balloons",
    "get_yolo_character_segmentation_model",
    "segment_character_foreground",

    # Core Engine & Post-Processing
    "PanelDetectionResult",
    "DetectStripPanelsRequest",
    "DetectStripPanelsResponse",
    "detect_vertical_strip_panels",
    "detect_background_color_and_threshold",
    "detect_vertical_subgutters",
    "sort_panels_reading_order",
    "subdivide_continuous_tall_art_panel",
    "run_cv_detection",
    "normalize_panel_box",
    "resolve_overlapping_panels",
    "detect_panels_service",
]
