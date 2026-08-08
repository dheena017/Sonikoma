"""
providers/vision/yolo.py
─────────────────────────────────────────────────────────────────────────────
Proxy re-export module for YOLO vision and speech bubble detection.
All active implementation code has been moved to:
  services.image.panel_detection.speech_bubble_detector
─────────────────────────────────────────────────────────────────────────────
"""

from services.image.panel_detection.speech_bubble_detector import (
    get_yolo_speech_bubble_model,
    segment_speech_bubbles_and_text_balloons,
    get_yolo_character_segmentation_model,
    segment_character_foreground,
    get_yolo_model,
    segment_text_and_balloons,
    get_yolo_char_model,
    segment_characters,
    trigger_yolo_fine_tuning,
    trigger_fine_tuning,
    get_yolo_training_status,
    has_yolo_dependencies,
    status,
)

__all__ = [
    "get_yolo_speech_bubble_model",
    "segment_speech_bubbles_and_text_balloons",
    "get_yolo_character_segmentation_model",
    "segment_character_foreground",
    "get_yolo_model",
    "segment_text_and_balloons",
    "get_yolo_char_model",
    "segment_characters",
    "trigger_yolo_fine_tuning",
    "trigger_fine_tuning",
    "get_yolo_training_status",
    "has_yolo_dependencies",
    "status",
]
