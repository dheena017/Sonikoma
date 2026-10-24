"""
backend/features/image_editor/services/ocr/ocr_engine.py
─────────────────────────────────────────────────────────────────────────────
Core Comic Dialogue OCR Vision Processing Engine:
- Full-frame text and bounding polygon extraction
- Adaptive sliding-window strip tiling for tall webtoon images
- Boundary deduplication via NMS and reading-order sorting
- Clean transcript extraction from comic panels
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
from typing import Any, List, Optional

import numpy as np
from PIL import Image

from common.media import resolve_image_to_buffer
try:
    from .ocr_geometry import (
        DEFAULT_CONFIDENCE_THRESHOLD,
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
        get_ocr_reader,
        _HAS_EASYOCR,
    )
except (ImportError, ValueError):
    from features.image_editor.services.ocr.ocr_geometry import (
        DEFAULT_CONFIDENCE_THRESHOLD,
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
    from features.image_editor.services.ocr.ocr_reader import (
        get_ocr_reader,
        _HAS_EASYOCR,
    )

logger = logging.getLogger("sonikoma.features.image_editor.services.ocr.ocr_engine")


async def extract_full_ocr_data(
    image_input: Any,
    langs: Optional[List[str]] = None,
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> List[OcrSegment]:
    """
    Main core OCR vision function. Extracts text segments, confidences, and bounding quads.

    Features:
    - Automatically partitions tall webtoon strips into sliding tiles to preserve resolution.
    - Reprojects quad coordinates back to canvas dimensions.
    - Deduplicates cross-tile boundary duplicates via NMS.
    - Sequences segments into comic reading order (top-to-bottom, left-to-right).

    Args:
        image_input (Any): Filepath (str), URL (str), PIL.Image, or raw image bytes.
        langs (Optional[List[str]]): Target OCR language codes.
        confidence_threshold (float): Minimum confidence score. Defaults to 0.20.

    Returns:
        List[OcrSegment]: Extracted and deduplicated text segments.
    """
    if image_input is None:
        return []

    if isinstance(image_input, str) and (image_input.startswith("http://") or image_input.startswith("https://")):
        resolved = await resolve_image_to_buffer(image_input)
        raw_bytes = resolved.get("data")
        if not raw_bytes:
            logger.error(f"[Dialogue OCR] Failed downloading remote image URL: {image_input}")
            return []
        image_input = raw_bytes

    if not _HAS_EASYOCR:
        logger.warning("[Dialogue OCR] EasyOCR library is not installed. Returning empty results.")
        return []

    reader = get_ocr_reader(langs)
    if reader is None:
        logger.error("[Dialogue OCR] EasyOCR reader instance could not be loaded.")
        return []

    try:
        img_rgb, orig_w, orig_h = resolve_image_input_to_rgb(image_input)
    except Exception as e:
        logger.error(f"[Dialogue OCR] Failed to resolve input image: {e}")
        return []

    if orig_w < MIN_IMAGE_DIMENSION_PX or orig_h < MIN_IMAGE_DIMENSION_PX:
        return []

    logger.info(
        f"[Dialogue OCR] Starting text extraction on canvas ({orig_w}x{orig_h}px, "
        f"conf_threshold={confidence_threshold})..."
    )

    raw_segments: List[OcrSegment] = []
    is_tall_strip = (
        orig_h > TALL_STRIP_MIN_HEIGHT_PX and
        (float(orig_h) / float(max(orig_w, 1))) > TALL_STRIP_ASPECT_RATIO_MIN
    )

    try:
        if is_tall_strip:
            width_scale = min(1.0, SLIDING_TILE_MAX_WIDTH_PX / max(orig_w, 1))
            tiled_img = img_rgb
            if width_scale < 1.0:
                nw, nh = max(1, int(orig_w * width_scale)), max(1, int(orig_h * width_scale))
                tiled_img = np.array(Image.fromarray(img_rgb).resize((nw, nh), Image.Resampling.LANCZOS))

            step = max(1, SLIDING_TILE_HEIGHT_PX - SLIDING_TILE_OVERLAP_PX)
            y = 0
            tiles = []
            while y < tiled_img.shape[0]:
                y_end = min(tiled_img.shape[0], y + SLIDING_TILE_HEIGHT_PX)
                tiles.append({"arr": tiled_img[y:y_end, :], "y_offset": y, "scale": width_scale})
                if y_end >= tiled_img.shape[0]:
                    break
                y += step

            logger.info(f"[Dialogue OCR] Scanning {len(tiles)} sliding tile(s) across tall webtoon strip...")
            for tile in tiles:
                tile_results = await asyncio.to_thread(reader.readtext, tile["arr"])
                for raw in tile_results:
                    conf = float(raw[2])
                    if conf < confidence_threshold:
                        continue
                    text_str = str(raw[1]).strip()
                    if not text_str:
                        continue

                    pixel_box, pct_box = reproject_box_to_original_canvas(
                        raw[0], tile["scale"], tile["y_offset"], orig_w, orig_h
                    )
                    raw_segments.append(OcrSegment(
                        text=text_str,
                        conf=round(conf, 4),
                        box=pixel_box,
                        box_pct=pct_box,
                    ))
        else:
            scale = min(1.0, MAX_SINGLE_PASS_DIMENSION_PX / max(orig_h, orig_w, 1))
            scaled_arr = img_rgb
            if scale < 1.0:
                nw, nh = max(1, int(orig_w * scale)), max(1, int(orig_h * scale))
                scaled_arr = np.array(Image.fromarray(img_rgb).resize((nw, nh), Image.Resampling.LANCZOS))

            raw_results = await asyncio.to_thread(reader.readtext, scaled_arr)
            for raw in raw_results:
                conf = float(raw[2])
                if conf < confidence_threshold:
                    continue
                text_str = str(raw[1]).strip()
                if not text_str:
                    continue

                pixel_box, pct_box = reproject_box_to_original_canvas(
                    raw[0], scale, 0, orig_w, orig_h
                )
                raw_segments.append(OcrSegment(
                    text=text_str,
                    conf=round(conf, 4),
                    box=pixel_box,
                    box_pct=pct_box,
                ))

        # Deduplication & reading order sort
        deduped = deduplicate_ocr_segments_nms(raw_segments, iou_threshold=DEDUPLICATION_IOU_THRESHOLD)
        deduped.sort(
            key=lambda s: (
                compute_axis_aligned_bbox(s["box"])[1] // 30,
                compute_axis_aligned_bbox(s["box"])[0]
            )
        )

        logger.info(f"[Dialogue OCR] Complete: {len(deduped)} segment(s) extracted across {orig_w}x{orig_h}px image.")
        return deduped

    except Exception as exc:
        logger.error(f"[Dialogue OCR] Text extraction forward pass failed: {exc}", exc_info=True)
        return []


async def extract_dialogue_from_panel(
    image_input: Any,
    langs: Optional[List[str]] = None,
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> List[str]:
    """Extracts clean transcribed dialogue speech strings in reading order from a comic panel."""
    segments = await extract_full_ocr_data(image_input, langs, confidence_threshold)
    return [seg["text"].strip() for seg in segments if seg.get("text", "").strip()]


# Aliases
extract_text_lines_from_panel = extract_dialogue_from_panel
detect_text_and_bounding_boxes = extract_full_ocr_data
read_speech_bubble_dialogue = extract_dialogue_from_panel


__all__ = [
    "extract_full_ocr_data",
    "extract_dialogue_from_panel",
    "extract_text_lines_from_panel",
    "detect_text_and_bounding_boxes",
    "read_speech_bubble_dialogue",
]
