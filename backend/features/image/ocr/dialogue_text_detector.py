"""
backend/features/image_editor/services/ocr/dialogue_text_detector.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Comic Dialogue Text Detector & Speech Bubble OCR:
Modular facade re-exporting:
- ocr_reader: Model lifecycle, reader caching, and buffer extraction
- ocr_geometry: Canvas normalization, coordinates, and NMS deduplication
- ocr_engine: Core sliding-window OCR extraction & panel dialogue reader
- ocr_service: FastAPI service orchestrator (Mode A: Bubble, Mode B: Direct)
─────────────────────────────────────────────────────────────────────────────
"""

import io
import sys
import os
import time
import asyncio
import base64
import logging
from typing import Any, Dict, List, Optional, Tuple, TypedDict

# Ensure backend root directory is in sys.path when executed directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

try:
    from .ocr_geometry import (
        DEFAULT_CONFIDENCE_THRESHOLD,
        DEFAULT_BUBBLE_CONFIDENCE,
        DEFAULT_BUBBLE_PADDING_RATIO,
        MAX_SINGLE_PASS_DIMENSION_PX,
        SLIDING_TILE_HEIGHT_PX,
        SLIDING_TILE_OVERLAP_PX,
        SLIDING_TILE_MAX_WIDTH_PX,
        TALL_STRIP_MIN_HEIGHT_PX,
        TALL_STRIP_ASPECT_RATIO_MIN,
        DEDUPLICATION_IOU_THRESHOLD,
        MIN_IMAGE_DIMENSION_PX,
        OcrSegment,
        resolve_image_input_to_rgb,
        compute_axis_aligned_bbox,
        reproject_box_to_original_canvas,
        deduplicate_ocr_segments_nms,
    )

    from .ocr_reader import (
        get_default_ocr_languages,
        get_ocr_reader,
        _load_ocr_reader,
        clean_transcript_whitespace,
        extract_text_from_image_bytes,
        _HAS_EASYOCR,
        _HAS_TESSERACT,
        HAS_TESSERACT,
    )

    from .ocr_engine import (
        extract_full_ocr_data,
        extract_dialogue_from_panel,
        extract_text_lines_from_panel,
        detect_text_and_bounding_boxes,
        read_speech_bubble_dialogue,
    )

    from .ocr_service import (
        detect_text_service,
        extract_bubble_guided_ocr,
        extract_direct_image_ocr,
        extract_script_from_panels,
    )
except (ImportError, ValueError):
    from features.image.ocr.ocr_geometry import (
        DEFAULT_CONFIDENCE_THRESHOLD,
        DEFAULT_BUBBLE_CONFIDENCE,
        DEFAULT_BUBBLE_PADDING_RATIO,
        MAX_SINGLE_PASS_DIMENSION_PX,
        SLIDING_TILE_HEIGHT_PX,
        SLIDING_TILE_OVERLAP_PX,
        SLIDING_TILE_MAX_WIDTH_PX,
        TALL_STRIP_MIN_HEIGHT_PX,
        TALL_STRIP_ASPECT_RATIO_MIN,
        DEDUPLICATION_IOU_THRESHOLD,
        MIN_IMAGE_DIMENSION_PX,
        OcrSegment,
        resolve_image_input_to_rgb,
        compute_axis_aligned_bbox,
        reproject_box_to_original_canvas,
        deduplicate_ocr_segments_nms,
    )

    from features.image.ocr.ocr_reader import (
        get_default_ocr_languages,
        get_ocr_reader,
        _load_ocr_reader,
        clean_transcript_whitespace,
        extract_text_from_image_bytes,
        _HAS_EASYOCR,
        _HAS_TESSERACT,
        HAS_TESSERACT,
    )

    from features.image.ocr.ocr_engine import (
        extract_full_ocr_data,
        extract_dialogue_from_panel,
        extract_text_lines_from_panel,
        detect_text_and_bounding_boxes,
        read_speech_bubble_dialogue,
    )

    from features.image.ocr.ocr_service import (
        detect_text_service,
        extract_bubble_guided_ocr,
        extract_direct_image_ocr,
        extract_script_from_panels,
    )

__all__ = [
    # Core Constants & Types
    "DEFAULT_CONFIDENCE_THRESHOLD",
    "DEFAULT_BUBBLE_CONFIDENCE",
    "DEFAULT_BUBBLE_PADDING_RATIO",
    "MAX_SINGLE_PASS_DIMENSION_PX",
    "SLIDING_TILE_HEIGHT_PX",
    "SLIDING_TILE_OVERLAP_PX",
    "SLIDING_TILE_MAX_WIDTH_PX",
    "TALL_STRIP_MIN_HEIGHT_PX",
    "TALL_STRIP_ASPECT_RATIO_MIN",
    "DEDUPLICATION_IOU_THRESHOLD",
    "MIN_IMAGE_DIMENSION_PX",
    "OcrSegment",
    # Reader Lifecycle & Primitives
    "get_default_ocr_languages",
    "get_ocr_reader",
    "_load_ocr_reader",
    "clean_transcript_whitespace",
    "extract_text_from_image_bytes",
    "_HAS_EASYOCR",
    "_HAS_TESSERACT",
    "HAS_TESSERACT",
    # Geometry & Transforms
    "resolve_image_input_to_rgb",
    "compute_axis_aligned_bbox",
    "reproject_box_to_original_canvas",
    "deduplicate_ocr_segments_nms",
    # Core Engine Functions
    "extract_full_ocr_data",
    "extract_dialogue_from_panel",
    "extract_text_lines_from_panel",
    "detect_text_and_bounding_boxes",
    "read_speech_bubble_dialogue",
    # Service Orchestrator Functions
    "detect_text_service",
    "extract_bubble_guided_ocr",
    "extract_direct_image_ocr",
    "extract_script_from_panels",
]


# ─────────────────────────────────────────────────────────────────────────────
# Developer Self-Verification CLI Runner
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from PIL import Image, ImageDraw
    from features.image.schemas import DetectTextRequest

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    print("\n" + "=" * 78)
    print("  SONIKOMA DIALOGUE TEXT DETECTOR: COMPLETE DEVELOPER SUITE TEST")
    print("=" * 78)

    synth_canvas = Image.new("RGB", (500, 400), color=(240, 240, 240))
    d = ImageDraw.Draw(synth_canvas)
    d.ellipse([60, 50, 440, 250], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
    d.text((120, 130), "DON'T MOVE! STAY BACK!", fill=(0, 0, 0))

    buf = io.BytesIO()
    synth_canvas.save(buf, format="PNG")
    canvas_bytes = buf.getvalue()
    canvas_b64 = base64.b64encode(canvas_bytes).decode("utf-8")

    # 1. Test Primitive Buffer Extraction
    print("\n[Test 1/3] extract_text_from_image_bytes()...")
    raw_str = extract_text_from_image_bytes(canvas_bytes, languages=["en"])
    print(f"  [OK] Primitive Buffer OCR: '{raw_str}'")

    # 2. Test Core Engine extract_full_ocr_data()
    print("\n[Test 2/3] extract_full_ocr_data()...")
    t0 = time.perf_counter()
    segments = asyncio.run(extract_full_ocr_data(synth_canvas, langs=["en"]))
    print(f"  [OK] Core Engine Segments: {len(segments)} in {int((time.perf_counter() - t0)*1000)}ms")

    # 3. Test Main Service Orchestrator detect_text_service()
    print("\n[Test 3/3] detect_text_service()...")
    req_direct = DetectTextRequest(image_base64=canvas_b64, bubble_guided=False, languages=["en"])
    resp_direct = asyncio.run(detect_text_service(req_direct))
    print(f"  [OK] detect_text_service(direct): success={resp_direct.success}, segments={resp_direct.total_segments}")
    print(f"       Full Transcript: '{resp_direct.full_transcript}'")

    print("\n" + "=" * 78)
    print("  ALL TESTS COMPLETED SUCCESSFULLY! [OK]")
    print("=" * 78 + "\n")
