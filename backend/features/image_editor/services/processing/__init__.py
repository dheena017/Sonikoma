"""
backend/features/image_editor/services/processing/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified Processing Services Package for the Image Editor Domain.

Consolidates all image manipulation, transformation, panel composition,
speech bubble cleaning, archiving, and multimedia workflow pipelines.
─────────────────────────────────────────────────────────────────────────────
"""

# 1. Archive & Metadata Exporting
from .archive_exporter import (
    generate_comic_info_xml,
    create_comic_archive,
)

# 2. Composition, Merging & Slicing
from .compose import (
    merge_images_service,
    execute_splits_service,
    download_zip_service,
)

# 3. Strip & Panel Splitting
from .panel_splitter import (
    split_vertical_strip_into_panels,
)

# 4. Image Editing, Cropping & Transformations
from .edit import (
    apply_image_edits_service,
    transform_image_service,
)

# 5. ImageMagick & Pillow Hybrid Transformations
from .image_transformer import (
    resize_image_service,
    rotate_image_service,
    apply_image_enhancements_service,
    remove_background_service,
    add_text_service,
    batch_resize_service,
    composite_images_service,
    resize_image,
    rotate_image,
    enhance_image_quality,
    remove_image_background,
    overlay_text_on_image,
)

# 6. Core ImageMagick Engine & Types
from .imagemagick import (
    ImageMagickEngine,
    get_imagemagick_engine,
    FilterType,
    CompressionQuality,
    ImageMetadata,
    WAND_AVAILABLE,
)

# 7. Low-level Image Operations & Metadata
from .image_ops import (
    ImageMeta,
    get_image_meta,
    fingerprint_image,
)

# 8. Speech Bubble Cleaning & Underlay Reconstruction
from .panel_cleaner import (
    remove_speech_bubbles,
    remove_speech_bubbles_sync,
    erase_speech_bubbles_from_panel,
)

# 9. Detection & Cleaning High-Level Services
from .image_detection import (
    debug_yolo_detections_service,
    bubble_cleaning_service,
    bubble_cleaning_batch_service,
)

# 10. Multi-Step Compound Workflows
from .compound_processor import (
    CompoundProcessor,
    get_compound_processor,
    WorkflowType,
    WorkflowProgress,
)

__all__ = [
    # Archive Exporter
    "generate_comic_info_xml",
    "create_comic_archive",
    # Compose
    "merge_images_service",
    "execute_splits_service",
    "download_zip_service",
    # Panel Splitter
    "split_vertical_strip_into_panels",
    # Edit
    "apply_image_edits_service",
    "transform_image_service",
    # Image Transformer
    "resize_image_service",
    "rotate_image_service",
    "apply_image_enhancements_service",
    "remove_background_service",
    "add_text_service",
    "batch_resize_service",
    "composite_images_service",
    "resize_image",
    "rotate_image",
    "enhance_image_quality",
    "remove_image_background",
    "overlay_text_on_image",
    # ImageMagick Engine
    "ImageMagickEngine",
    "get_imagemagick_engine",
    "FilterType",
    "CompressionQuality",
    "ImageMetadata",
    "WAND_AVAILABLE",
    # Image Ops
    "ImageMeta",
    "get_image_meta",
    "fingerprint_image",
    # Panel Cleaner
    "remove_speech_bubbles",
    "remove_speech_bubbles_sync",
    "erase_speech_bubbles_from_panel",
    # Detection
    "debug_yolo_detections_service",
    "bubble_cleaning_service",
    "bubble_cleaning_batch_service",
    # Compound Processor
    "CompoundProcessor",
    "get_compound_processor",
    "WorkflowType",
    "WorkflowProgress",
]
