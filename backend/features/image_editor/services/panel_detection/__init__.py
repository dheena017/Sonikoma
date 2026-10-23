"""
backend/features/image_editor/services/panel_detection/__init__.py
─────────────────────────────────────────────────────────────────────────────
Panel Detection & Comic Extraction Package:

1. Workflow Orchestrators:
   - detect_small_panels         : Single panel / standard comic page detection
   - detect_long_panels          : Tall vertical scrolling webtoon strip slicing
   - detect_batch_panels         : Asynchronous multi-URL batch processor
   - detect_upload_panels        : Multipart file upload in-memory processor
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
   - classify_content_rows
   - compute_trim_bounds
   - sort_panels_reading_order
   - subdivide_continuous_tall_art_panel
   - trim_solid_borders
   - run_cv_detection / detect_panels_in_image
   - normalize_panel_box
   - resolve_overlapping_panels
   - resolve_micro_panels
   - compute_post_panel_confidence
─────────────────────────────────────────────────────────────────────────────
"""

# 1. High-Level Workflow Orchestrators
from .detect_small_panels_service import (
    detect_small_panels,
    detect_small_panels_boxes,
)
from .detect_long_panels_service import (
    detect_long_panels,
    detect_long_panels_boxes,
)
from .detect_batch_service import (
    detect_batch_panels,
    process_single_url,
    _process_single_url,
)
from .detect_upload_service import (
    detect_upload_panels,
)
from .detect_composite_service import (
    detect_composite_panels,
    detect_composite_boxes,
)
from .detect_characters_service import (
    detect_characters,
    detect_characters_boxes,
    detect_character_entities,
    estimate_character_pose,
    _estimate_character_pose,
    detect_character_face,
    _detect_simple_face,
    get_yolo_character_segmentation_model,
    segment_character_foreground,
    has_yolo_dependencies,
)

# 2. Standalone Detectors & Vision Engines
from .opencv_detector import (
    detect_opencv_panels,
    detect_opencv_boxes,
)
from .grid_detector import (
    detect_manga_grid_panels,
    detect_manga_grid_pil,
    _detect_panels_grid_cv,
    _detect_panels_grid_pil,
)
from .speech_bubble_detector import (
    detect_speech_bubbles,
    detect_yolo_entities,
    detect_chat_ui_bubbles,
    _detect_chat_ui_bubbles,
    get_yolo_speech_bubble_model,
    get_yolo_model,
    set_loaded_yolo_model,
    _set_loaded_yolo_model,
    segment_speech_bubbles_and_text_balloons,
)
from .ai_vision_detector import (
    detect_ai_vision,
    detect_ai_vision_flow,
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
    detect_vertical_strip_panels,
    _detect_panels_webtoon,
    detect_background_color_and_threshold,
    _detect_bg_color_and_threshold,
    detect_vertical_subgutters,
    _detect_vertical_subgutters,
    classify_content_rows,
    _classify_content_rows,
    compute_trim_bounds,
    _compute_trim_bounds,
    sort_panels_reading_order,
    _sort_panels_reading_order,
    subdivide_continuous_tall_art_panel,
    _subdivide_continuous_tall_art_panel,
    _split_oversized_webtoon_boxes,
    trim_solid_borders,
    run_cv_detection,
    detect_panels_in_image,
    normalize_panel_box,
    _normalize_box,
    resolve_overlapping_panels,
    resolve_overlapping_panels_lineage,
    resolve_micro_panels,
    compute_post_panel_confidence,
    postprocess_panel_boundaries,
)

__all__ = [
    # Workflow Orchestrators
    "detect_small_panels",
    "detect_small_panels_boxes",
    "detect_long_panels",
    "detect_long_panels_boxes",
    "detect_batch_panels",
    "process_single_url",
    "_process_single_url",
    "detect_upload_panels",
    "detect_composite_panels",
    "detect_composite_boxes",
    "detect_characters",
    "detect_characters_boxes",

    # Standalone Detectors
    "detect_opencv_panels",
    "detect_opencv_boxes",
    "detect_manga_grid_panels",
    "detect_manga_grid_pil",
    "_detect_panels_grid_cv",
    "_detect_panels_grid_pil",
    "detect_speech_bubbles",
    "detect_yolo_entities",
    "detect_chat_ui_bubbles",
    "_detect_chat_ui_bubbles",
    "detect_character_entities",
    "estimate_character_pose",
    "_estimate_character_pose",
    "detect_character_face",
    "_detect_simple_face",
    "detect_ai_vision",
    "detect_ai_vision_flow",
    "has_yolo_dependencies",

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
    "set_loaded_yolo_model",
    "_set_loaded_yolo_model",
    "segment_speech_bubbles_and_text_balloons",
    "get_yolo_character_segmentation_model",
    "segment_character_foreground",

    # Core Engine & Post-Processing
    "PanelDetectionResult",
    "detect_vertical_strip_panels",
    "_detect_panels_webtoon",
    "detect_background_color_and_threshold",
    "_detect_bg_color_and_threshold",
    "detect_vertical_subgutters",
    "_detect_vertical_subgutters",
    "classify_content_rows",
    "_classify_content_rows",
    "compute_trim_bounds",
    "_compute_trim_bounds",
    "sort_panels_reading_order",
    "_sort_panels_reading_order",
    "subdivide_continuous_tall_art_panel",
    "_subdivide_continuous_tall_art_panel",
    "_split_oversized_webtoon_boxes",
    "trim_solid_borders",
    "run_cv_detection",
    "detect_panels_in_image",
    "normalize_panel_box",
    "_normalize_box",
    "resolve_overlapping_panels",
    "resolve_overlapping_panels_lineage",
    "resolve_micro_panels",
    "compute_post_panel_confidence",
    "postprocess_panel_boundaries",
]
