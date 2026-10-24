"""
backend/features/image_editor/services/ocr/__init__.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Comic OCR & Speech Extraction Service Package:
- dialogue_text_detector: Unified core detection engine & service orchestrator
─────────────────────────────────────────────────────────────────────────────
"""

from .dialogue_text_detector import (
    DEFAULT_CONFIDENCE_THRESHOLD,
    OcrSegment,
    get_ocr_reader,
    extract_full_ocr_data,
    extract_dialogue_from_panel,
    extract_text_lines_from_panel,
    detect_text_and_bounding_boxes,
    read_speech_bubble_dialogue,
    detect_text_service,
    extract_bubble_guided_ocr,
    extract_direct_image_ocr,
    extract_script_from_panels,
    clean_transcript_whitespace,
    extract_text_from_image_bytes,
    HAS_TESSERACT,
    _load_ocr_reader,
    _HAS_EASYOCR,
)

__all__ = [
    # Core Engine Functions
    "extract_full_ocr_data",
    "extract_dialogue_from_panel",
    "extract_text_lines_from_panel",
    "detect_text_and_bounding_boxes",
    "read_speech_bubble_dialogue",
    "get_ocr_reader",
    "OcrSegment",
    "DEFAULT_CONFIDENCE_THRESHOLD",
    "_load_ocr_reader",
    "_HAS_EASYOCR",
    # Main Service Orchestrator Functions
    "detect_text_service",
    "extract_bubble_guided_ocr",
    "extract_direct_image_ocr",
    "extract_script_from_panels",
    "clean_transcript_whitespace",
    "extract_text_from_image_bytes",
    "HAS_TESSERACT",
]
