"""
backend/app/services/image/image_service.py
─────────────────────────────────────────────────────────────────────────────
Coordinator/facade service layer for image operations. This module delegates
to specialized modules for transformations, metadata, I/O, and workflows.
─────────────────────────────────────────────────────────────────────────────
"""

# Import and re-export services from specialised sub-modules to preserve backward compatibility.
from services.image.image_transform import (
    transform_image_service,
    resize_image_service,
    rotate_image_service,
    apply_image_enhancements_service,
    remove_background_service,
    add_text_service,
    batch_resize_service,
    composite_images_service
)

from services.image.image_metadata import (
    get_image_metadata_service,
    debug_yolo_detections_service
)

from services.image.image_io import (
    upload_image_service,
    download_zip_service
)

from services.image.image_workflow import (
    apply_image_edits_service,
    merge_images_service,
    execute_splits_service,
    extract_panel_layers_service,
    bubble_cleaning_service,
    bubble_cleaning_batch_service
)

# Explicitly export all the coordinator services
__all__ = [
    "transform_image_service",
    "resize_image_service",
    "rotate_image_service",
    "apply_image_enhancements_service",
    "remove_background_service",
    "add_text_service",
    "batch_resize_service",
    "composite_images_service",
    "get_image_metadata_service",
    "debug_yolo_detections_service",
    "upload_image_service",
    "download_zip_service",
    "apply_image_edits_service",
    "merge_images_service",
    "execute_splits_service",
    "extract_panel_layers_service",
    "bubble_cleaning_service",
    "bubble_cleaning_batch_service"
]
