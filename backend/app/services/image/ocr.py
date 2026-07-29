"""
backend/app/services/image/ocr.py
──────────────────────────────────────────────────────────────────────────────
OCR extraction service powered by EasyOCR.

Public API (stable — used by detect_panels, layer_segmentation, metadata API):
  • extract_full_ocr_data(image_path, langs, confidence_threshold)
      → List[OcrSegment]  — bounding boxes + text for speech-bubble protection
  • extract_text_lines_from_panel(image_path, langs)
      → List[str]         — plain text strings only (convenience wrapper)

Internal helpers (private, prefixed with _):
  • _load_ocr_reader(langs)
  • _convert_to_rgb_array(pil_image)
  • _downscale_to_fit(img_np, max_dim)
  • _build_vertical_tiles(img_np, tile_height, overlap)
  • _reproject_box_to_original(box_pts, scale, y_offset)
  • _deduplicate_ocr_boxes(boxes, iou_threshold)
──────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple, TypedDict

logger = logging.getLogger("sonikoma.services.image.ocr")

# ── Optional dependencies ────────────────────────────────────────────────────
try:
    import easyocr
    import numpy as np
    from PIL import Image
    _HAS_EASYOCR = True
except ImportError:
    _HAS_EASYOCR = False

# ── Constants ─────────────────────────────────────────────────────────────────
_DEFAULT_CONFIDENCE_THRESHOLD: float = 0.20   # lower than 0.3 to capture stylised comic fonts
_MAX_SINGLE_PASS_DIM:          int   = 2000   # max px for single-pass mode (width or height)
_TILE_HEIGHT_PX:               int   = 1200   # vertical tile size for tall-strip mode
_TILE_OVERLAP_PX:              int   = 150    # overlap between tiles (avoids cutting speech bubbles)
_TILE_MAX_WIDTH_PX:            int   = 1600   # max tile width before downscaling
_TALL_STRIP_MIN_HEIGHT_PX:     int   = 2000   # strip must be at least this tall to use tile mode
_TALL_STRIP_MIN_RATIO:         float = 1.5    # height / width must exceed this to use tile mode
_DEDUP_IOU_THRESHOLD:          float = 0.50   # IoU above which two boxes are considered duplicates

# ── Type alias ────────────────────────────────────────────────────────────────
class OcrSegment(TypedDict):
    text:    str
    conf:    float
    box:     List[List[int]]       # 4 corner points in original image pixels [[x,y], ...]
    box_pct: List[List[float]]     # same corners as fractions of image (w, h)


# ── Global reader (singleton) ─────────────────────────────────────────────────
_ocr_reader: Optional[Any] = None


def _load_ocr_reader(langs: List[str] = ["en"]) -> Optional[Any]:
    """
    Lazily initialise and cache the EasyOCR Reader.
    Subsequent calls with different languages are ignored (same reader returned).
    """
    global _ocr_reader
    if _ocr_reader is None and _HAS_EASYOCR:
        logger.info(f"[OCR] Initialising EasyOCR reader — languages: {langs}")
        _ocr_reader = easyocr.Reader(langs, gpu=False)
    return _ocr_reader


# ── Image preprocessing helpers ───────────────────────────────────────────────

def _convert_to_rgb_array(pil_image: Any) -> Any:
    """
    Convert any PIL Image (RGBA, L, P …) to an RGB numpy array
    that EasyOCR can consume without crashing.
    """
    return np.array(pil_image.convert("RGB"))


def _downscale_to_fit(img_np: Any, max_dim: int = _MAX_SINGLE_PASS_DIM) -> Tuple[Any, float]:
    """
    Uniformly scale *img_np* so its largest dimension is ≤ *max_dim*.

    Returns:
        (scaled_array, scale_factor)   — scale_factor = new / original
    """
    h, w = img_np.shape[:2]
    scale = min(1.0, max_dim / max(h, w, 1))
    if scale < 1.0:
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        pil = Image.fromarray(img_np).resize((new_w, new_h), Image.Resampling.LANCZOS)
        return np.array(pil), scale
    return img_np, 1.0


def _build_vertical_tiles(
    img_np: Any,
    tile_height: int = _TILE_HEIGHT_PX,
    overlap: int = _TILE_OVERLAP_PX,
    max_width: int = _TILE_MAX_WIDTH_PX,
) -> List[Dict[str, Any]]:
    """
    Slice a tall image into overlapping vertical tiles for tiled OCR scanning.

    Each tile dict contains:
        arr      – numpy array of the tile
        y_offset – pixel offset in original (pre-width-scale) image
        x_scale  – horizontal scale factor applied to fit within *max_width*
        y_scale  – same as x_scale (uniform scaling)
    """
    h, w = img_np.shape[:2]

    # Uniformly scale width down if needed (keeps aspect ratio)
    width_scale = min(1.0, max_width / max(w, 1))
    if width_scale < 1.0:
        new_w = max(1, int(w * width_scale))
        new_h = max(1, int(h * width_scale))
        img_np = np.array(Image.fromarray(img_np).resize((new_w, new_h), Image.Resampling.LANCZOS))
        h, w = img_np.shape[:2]

    if h <= tile_height:
        return [{"arr": img_np, "y_offset": 0, "scale": width_scale}]

    tiles: List[Dict[str, Any]] = []
    step = max(1, tile_height - overlap)
    y = 0
    while y < h:
        y_end = min(h, y + tile_height)
        tiles.append({
            "arr":      img_np[y:y_end, :],
            "y_offset": y,
            "scale":    width_scale,
        })
        if y_end >= h:
            break
        y += step

    return tiles


def _reproject_box_to_original(
    box_pts: List[List[float]],
    scale: float,
    y_offset: int,
    orig_w: int,
    orig_h: int,
) -> Tuple[List[List[int]], List[List[float]]]:
    """
    Map tile-space bounding box coordinates back to original image pixels
    and compute percentage coordinates.

    Returns:
        (pixel_box, pct_box)
    """
    pixel_box: List[List[int]] = []
    pct_box:   List[List[float]] = []
    for pt in box_pts:
        px = int(pt[0] / scale)
        py = int(pt[1] / scale) + y_offset
        pixel_box.append([px, py])
        pct_box.append([px / max(orig_w, 1), py / max(orig_h, 1)])
    return pixel_box, pct_box


def _deduplicate_ocr_boxes(
    boxes: List[OcrSegment],
    iou_threshold: float = _DEDUP_IOU_THRESHOLD,
) -> List[OcrSegment]:
    """
    Remove near-duplicate OCR results that appear in tile overlap regions.
    Keeps the highest-confidence box when two boxes overlap above *iou_threshold*.
    """
    if not boxes:
        return boxes

    def _axis_aligned_bbox(box_pts: List[List[int]]) -> Tuple[int, int, int, int]:
        xs = [p[0] for p in box_pts]
        ys = [p[1] for p in box_pts]
        return min(xs), min(ys), max(xs), max(ys)

    def _iou(a: Tuple, b: Tuple) -> float:
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        ix1, iy1 = max(ax1, bx1), max(ay1, by1)
        ix2, iy2 = min(ax2, bx2), min(ay2, by2)
        inter_area = max(0, ix2 - ix1) * max(0, iy2 - iy1)
        if inter_area == 0:
            return 0.0
        area_a = max(1, (ax2 - ax1) * (ay2 - ay1))
        area_b = max(1, (bx2 - bx1) * (by2 - by1))
        return inter_area / float(area_a + area_b - inter_area)

    # Highest confidence first so we always keep the best duplicate
    sorted_boxes = sorted(boxes, key=lambda s: -s["conf"])
    kept: List[OcrSegment] = []
    for candidate in sorted_boxes:
        cb = _axis_aligned_bbox(candidate["box"])
        if not any(_iou(cb, _axis_aligned_bbox(k["box"])) >= iou_threshold for k in kept):
            kept.append(candidate)

    return kept


# ── Public API ────────────────────────────────────────────────────────────────

async def extract_full_ocr_data(
    image_path: str,
    langs: List[str] = ["en"],
    confidence_threshold: float = _DEFAULT_CONFIDENCE_THRESHOLD,
) -> List[OcrSegment]:
    """
    Run OCR on *image_path* and return structured bounding-box results.

    Automatically selects the scan strategy:
      • **Tile mode**   — for tall Webtoon strips (h > 2000px, ratio > 1.5)
      • **Single-pass** — for normal comic panels

    Args:
        image_path:           Absolute path to the image file.
        langs:                EasyOCR language codes (default ``["en"]``).
        confidence_threshold: Minimum confidence to accept a result (default 0.20).

    Returns:
        List of :class:`OcrSegment` dicts, deduplicated and reprojected to
        original image coordinates.
    """
    if not os.path.exists(image_path):
        logger.error(f"[OCR] File not found: {image_path}")
        return []

    if not _HAS_EASYOCR:
        logger.warning("[OCR] EasyOCR is not installed — returning empty results.")
        return []

    reader = _load_ocr_reader(langs)
    if reader is None:
        return []

    try:
        pil_image = Image.open(image_path)
        orig_w, orig_h = pil_image.size
        img_rgb = _convert_to_rgb_array(pil_image)

        is_tall_strip = (
            orig_h > _TALL_STRIP_MIN_HEIGHT_PX and
            (float(orig_h) / float(max(orig_w, 1))) > _TALL_STRIP_MIN_RATIO
        )

        raw_segments: List[OcrSegment] = []

        if is_tall_strip:
            tiles = _build_vertical_tiles(img_rgb)
            logger.info(f"[OCR] Tall strip ({orig_w}×{orig_h}px) — scanning {len(tiles)} tile(s).")

            for tile in tiles:
                tile_results = await asyncio.to_thread(reader.readtext, tile["arr"])
                for raw in tile_results:
                    conf = float(raw[2])
                    if conf < confidence_threshold:
                        continue
                    pixel_box, pct_box = _reproject_box_to_original(
                        raw[0], tile["scale"], tile["y_offset"], orig_w, orig_h
                    )
                    raw_segments.append(OcrSegment(
                        text=raw[1], conf=conf, box=pixel_box, box_pct=pct_box
                    ))
        else:
            scaled_arr, scale = _downscale_to_fit(img_rgb)
            raw_results = await asyncio.to_thread(reader.readtext, scaled_arr)

            for raw in raw_results:
                conf = float(raw[2])
                if conf < confidence_threshold:
                    continue
                pixel_box, pct_box = _reproject_box_to_original(
                    raw[0], scale, 0, orig_w, orig_h
                )
                raw_segments.append(OcrSegment(
                    text=raw[1], conf=conf, box=pixel_box, box_pct=pct_box
                ))

        segments = _deduplicate_ocr_boxes(raw_segments)
        mode = "tile" if is_tall_strip else "single-pass"
        logger.info(f"[OCR] {len(segments)} segment(s) found ({mode}) — {image_path}")
        return segments

    except Exception as exc:
        logger.error(f"[OCR] Extraction failed for {image_path}: {exc}", exc_info=True)
        return []


async def extract_text_lines_from_panel(
    image_path: str,
    langs: List[str] = ["en"],
) -> List[str]:
    """
    Convenience wrapper around :func:`extract_full_ocr_data`.

    Returns only the plain text strings (no bounding boxes), useful for
    dialogue extraction after panels have already been cropped.

    Args:
        image_path: Absolute path to the panel image.
        langs:      EasyOCR language codes.

    Returns:
        List of text strings, ordered by confidence (highest first).
    """
    segments = await extract_full_ocr_data(image_path, langs)
    return [seg["text"] for seg in segments]


# ── Backward-compatible alias (do not remove — used by detect_panels & metadata API) ──
extract_dialogue_from_panel = extract_text_lines_from_panel
