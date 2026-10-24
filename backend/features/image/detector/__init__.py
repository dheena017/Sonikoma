"""
backend/features/image_editor/services/detector/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified Comic, Manga & Webtoon Panel Detection and Classification Package:

1. Layout & Format Classification (Pre-flight Orchestrator):
   - detect_image_layout_type     : 5-layer layout, aspect ratio, palette & reading flow classifier
   - sample_background_palette    : Corner palette sampling (white, black, hex)
   - analyze_horizontal_gutters   : Projection profile horizontal whitespace valley detector
   - calculate_edge_complexity    : Gradient energy & dynamic Canny threshold optimizer
   - classify_layout_decision_tree: Comic layout format classification tree

2. High-Level Workflow Orchestrators:
   - detect_small_panels          : Single panel / isolated comic frame / manga page detector
   - detect_long_panels           : Tall scrolling webtoon strip gutter slicing
   - detect_long_panels_boxes     : Alias for long panels detector
   - detect_batch_panels          : Parallel multi-URL batch panel detector with concurrency throttling
   - process_single_url           : Unit worker for single URL batch processing
   - detect_composite_panels      : Multimodal single-call pipeline (Panels + Bubbles + Characters)
   - detect_characters            : Dedicated character pose, face & silhouette detector
   - detect_characters_service    : Direct character detector service function
   - detect_characters_api        : Character detection API endpoint handler

3. Standalone Detectors & Vision Engines (main_service_detector):
   - detect_opencv_panels         : Pure OpenCV contour and edge detector
   - detect_manga_grid_panels     : 2D Manga grid tier and column decomposing detector
   - detect_manga_grid_pil        : Projection-based 2D grid decomposition fallback
   - detect_manga_grid_service    : Async service endpoint for manga grid detection
   - detect_vertical_strip_panels : High-precision webtoon gutter seam detector
   - detect_panels_service        : Async service endpoint for strip panel detection
   - detect_speech_bubbles        : Deep-learning speech bubble & text polygon detector
   - detect_speech_bubbles_service: Async service endpoint for speech bubble detection
   - detect_chat_ui_bubbles       : Manhwa smartphone chat and SMS dialog pill detector
   - snap_and_refine_bubble_edges : Morphological edge refinement for dialogue bubbles
   - detect_character_entities    : Multi-tier character, face, and silhouette detector
   - estimate_character_pose      : Character pose and framing classifier
   - detect_character_face        : Face landmark detection within character bounding boxes

4. Spatial Fusion & Placement Logic:
   - fuse_panels_and_bubbles      : Spatial entity fusion with manga placement conventions
   - classify_speech_bubble_placement: 5-way canonical speech bubble placement classifier
   - assign_characters_to_panels  : Assigns character entities to containing panels
   - bind_bubbles_to_characters   : Speaker attribution binding dialogue to characters
   - expand_panel_boundary_for_bubble: Safe boundary expansion capped by adjacent panels
   - apply_bleed_padding          : Boundary bleed padding application
   - detect_and_mark_inset_panels : Picture-in-picture sub-panel detector
   - enforce_strict_non_overlap   : Midpoint boundary clipping & sliver merging
   - compute_crop_margins         : Outer directional crop margins calculation
   - estimate_cinematography      : Camera framing & shot type inference

5. Models & Segmentation:
   - get_yolo_speech_bubble_model : Lazy-loaded YOLO bubble model instance
   - get_yolo_model               : Alias for speech bubble model
   - segment_speech_bubbles_and_text_balloons: Binary segmentation mask generator
   - get_yolo_character_segmentation_model: Lazy-loaded YOLO character model instance
   - segment_character_foreground : Character foreground segmentation mask generator

6. Post-Processing & Normalization:
   - PanelDetectionResult         : Container for vertical strip slicing outcomes
   - DetectStripPanelsRequest     : Request schema for strip detection
   - DetectStripPanelsResponse    : Response schema for strip detection
   - detect_background_color_and_threshold: Background polarity and threshold estimator
   - detect_vertical_subgutters   : Multi-column subgutter detector
   - sort_panels_reading_order    : True 2D reading order sequencer (LTR, RTL, TTB)
   - subdivide_continuous_tall_art_panel: Continuous art scene subdivider
   - run_cv_detection             : OpenCV detection runner
   - normalize_panel_box          : Panel box dictionary normalizer
   - resolve_overlapping_panels   : Non-destructive spatial overlap deduplication
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys

# Ensure backend root directory is in sys.path when executed directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# 1. Layout & Format Classification
from .detect_type_service import (
    detect_image_layout_type,
    sample_background_palette,
    analyze_horizontal_gutters,
    calculate_edge_complexity,
    classify_layout_decision_tree,
)

# 2. High-Level Workflow Orchestrators
from .detect_small_panels_service import (
    detect_small_panels,
)
from .detect_long_panels_service import (
    detect_long_panels,
    detect_long_panels_boxes,
)
from .detect_batch_service import (
    detect_batch_panels,
    process_single_url,
)
from .detect_composite_service import (
    detect_composite_panels,
)
from .main_service_detector.detect_characters_service import (
    detect_characters_service,
    detect_characters_api,
    detect_character_entities,
    estimate_character_pose,
    detect_character_face,
    get_yolo_character_segmentation_model,
    segment_character_foreground,
)
detect_characters = detect_characters_service
detect_characters_boxes = detect_character_entities

# 3. Standalone Detectors & Vision Engines (from main_service_detector)
from .main_service_detector.panel_detector import (
    PanelDetectionResult,
    DetectStripPanelsRequest,
    DetectStripPanelsResponse,
    detect_opencv_panels,
    detect_manga_grid_panels,
    detect_manga_grid_pil,
    detect_manga_grid_service,
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

from .speech_bubble_cleaner import (
    clean_speech_bubbles,
    clean_speech_bubbles_async,
    remove_speech_bubbles,
    remove_speech_bubbles_sync,
)

from .main_service_detector.speech_bubble_detector import (
    detect_speech_bubbles,
    detect_speech_bubbles_service,
    detect_chat_ui_bubbles,
    snap_and_refine_bubble_edges,
    get_yolo_speech_bubble_model,
    segment_speech_bubbles_and_text_balloons,
)
detect_yolo_entities = detect_speech_bubbles
_detect_chat_ui_bubbles = detect_chat_ui_bubbles
get_yolo_model = get_yolo_speech_bubble_model

# 4. Spatial Fusion & Placement Logic
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

__all__ = [
    # Layout & Format Classification
    "detect_image_layout_type",
    "sample_background_palette",
    "analyze_horizontal_gutters",
    "calculate_edge_complexity",
    "classify_layout_decision_tree",

    # Workflow Orchestrators
    "detect_small_panels",
    "detect_long_panels",
    "detect_long_panels_boxes",
    "detect_batch_panels",
    "process_single_url",
    "detect_composite_panels",
    "detect_characters",
    "detect_characters_service",
    "detect_characters_api",
    "detect_characters_boxes",

    # Standalone Detectors & Vision Engines
    "detect_opencv_panels",
    "detect_manga_grid_panels",
    "detect_manga_grid_pil",
    "detect_manga_grid_service",
    "detect_vertical_strip_panels",
    "detect_panels_service",
    "detect_speech_bubbles",
    "detect_speech_bubbles_service",
    "clean_speech_bubbles",
    "clean_speech_bubbles_async",
    "remove_speech_bubbles",
    "remove_speech_bubbles_sync",
    "detect_yolo_entities",
    "detect_chat_ui_bubbles",
    "_detect_chat_ui_bubbles",
    "snap_and_refine_bubble_edges",
    "detect_character_entities",
    "estimate_character_pose",
    "detect_character_face",

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
    "detect_background_color_and_threshold",
    "detect_vertical_subgutters",
    "sort_panels_reading_order",
    "subdivide_continuous_tall_art_panel",
    "run_cv_detection",
    "normalize_panel_box",
    "resolve_overlapping_panels",
]
