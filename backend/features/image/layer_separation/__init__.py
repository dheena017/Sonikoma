"""
backend/features/image/layer_separation/__init__.py
─────────────────────────────────────────────────────────────────────────────
Package initializer for panel layer separation services.
Provides AI-powered layer extraction, segmentation, and YOLO debug visualization.
─────────────────────────────────────────────────────────────────────────────
"""

from .layer_separator import (
    extract_panel_layers_service,
    debug_yolo_detections_service,
)
from .layer_segmentation import (
    process_layers,
    separate_foreground_background_text,
    create_blank_webp,
    create_blank_png,
)
from .sam import (
    extract_character_layer,
    extract_character_mask,
    segment_with_sam,
    segment_character_sam,
    segment_character_u2net,
)
from .inpainting import (
    pyramid_guided_inpaint,
    smooth_contour,
)
from .text_layer_extractor import (
    extract_text_and_sfx_layers,
)
from .character_layer_extractor import (
    extract_characters_and_background,
)
from .layer_metadata import (
    build_text_nodes,
    build_motion_presets,
)
from .layer_storage import (
    persist_panel_layers,
)

__all__ = [
    "extract_panel_layers_service",
    "debug_yolo_detections_service",
    "process_layers",
    "separate_foreground_background_text",
    "create_blank_webp",
    "create_blank_png",
    "pyramid_guided_inpaint",
    "smooth_contour",
    "extract_text_and_sfx_layers",
    "extract_characters_and_background",
    "build_text_nodes",
    "build_motion_presets",
    "persist_panel_layers",
    "extract_character_layer",
    "extract_character_mask",
    "segment_with_sam",
    "segment_character_sam",
    "segment_character_u2net",
]
