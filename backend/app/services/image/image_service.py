"""
services/image/image_service.py
─────────────────────────────────────────────────────────────────────────────
Compatibility shim — all logic has moved to focused sub-modules.

Real implementations live in:
  services/image/edit.py     – apply_image_edits_service, transform_image_service
  services/image/compose.py  – merge_images_service, execute_splits_service,
                               download_zip_service
  services/image/layers.py   – extract_panel_layers_service,
                               debug_yolo_detections_service
  services/image/bubbles.py  – bubble_cleaning_service,
                               bubble_cleaning_batch_service
  services/image/upload.py   – upload_image_service
  services/image/magick.py   – resize_image_service, rotate_image_service,
                               apply_image_enhancements_service,
                               remove_background_service, add_text_service,
                               batch_resize_service, composite_images_service
─────────────────────────────────────────────────────────────────────────────
"""

from services.image.edit import (
    apply_image_edits_service,
    transform_image_service,
)
from services.image.compose import (
    merge_images_service,
    execute_splits_service,
    download_zip_service,
)
from services.image.layers import (
    extract_panel_layers_service,
    debug_yolo_detections_service,
)
from services.image.bubbles import (
    bubble_cleaning_service,
    bubble_cleaning_batch_service,
)
from services.image.upload import upload_image_service
from services.image.magick import (
    resize_image_service,
    rotate_image_service,
    apply_image_enhancements_service,
    remove_background_service,
    add_text_service,
    batch_resize_service,
    composite_images_service,
    ResizeMode,
    FilterType,
)

__all__ = [
    # edit
    "apply_image_edits_service",
    "transform_image_service",
    # compose
    "merge_images_service",
    "execute_splits_service",
    "download_zip_service",
    # layers
    "extract_panel_layers_service",
    "debug_yolo_detections_service",
    # bubbles
    "bubble_cleaning_service",
    "bubble_cleaning_batch_service",
    # upload
    "upload_image_service",
    # magick
    "resize_image_service",
    "rotate_image_service",
    "apply_image_enhancements_service",
    "remove_background_service",
    "add_text_service",
    "batch_resize_service",
    "composite_images_service",
    "ResizeMode",
    "FilterType",
]
