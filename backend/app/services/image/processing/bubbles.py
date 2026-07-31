"""Backward-compatible shim: re-export bubbles logic."""
from .image_detection import bubble_cleaning_service, bubble_cleaning_batch_service
__all__ = ["bubble_cleaning_service", "bubble_cleaning_batch_service"]
