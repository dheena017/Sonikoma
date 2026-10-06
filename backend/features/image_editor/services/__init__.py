"""
backend/features/image_editor/services/__init__.py
─────────────────────────────────────────────────────────────────────────────
Consolidated Services Package for the Image Editor Domain:
Provides modular specialized micro-services across:
- crop: Layout classification, multi-panel slicing, single panel cropping
- layer_separation: SAM & YOLO panel layer decomposition
- ocr: Direct dialogue recognition, bubble-guided text extraction
- panel_detection: OpenCV, YOLO, manga grid, multi-modal vision detectors
- processing: Image transformations, inpainting, bubble cleaning, splitting
- stitching: Horizontal/vertical strip merging and cached canvas retrieval
- thumbnails: Smart thumbnail generation
- upload: Local & cloud asset persistence
- utils: Image resolution, box calculations, color quantization
- compound_processor: Multi-step multimedia compound pipelines
─────────────────────────────────────────────────────────────────────────────
"""

from .crop import (
    detect_image_layout_type,
    crop_long_panels_batch,
    crop_single_panels_margins,
)
from .compound_processor import (
    CompoundProcessor,
    get_compound_processor,
    WorkflowType,
    WorkflowProgress,
)

__all__ = [
    "detect_image_layout_type",
    "crop_long_panels_batch",
    "crop_single_panels_margins",
    "CompoundProcessor",
    "get_compound_processor",
    "WorkflowType",
    "WorkflowProgress",
]
