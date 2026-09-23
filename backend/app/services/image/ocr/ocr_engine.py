"""
backend/app/services/image/ocr_engine.py
──────────────────────────────────────────────────────────────────────────────
OCR extraction service powered by EasyOCR.
──────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple, TypedDict

logger = logging.getLogger("sonikoma.services.image.ocr.ocr_engine")

try:
    import numpy as np
    from PIL import Image
    _HAS_EASYOCR = True
except ImportError:
    _HAS_EASYOCR = False

_DEFAULT_CONFIDENCE_THRESHOLD: float = 0.20
_MAX_SINGLE_PASS_DIM:          int   = 2000
_TILE_HEIGHT_PX:               int   = 1200
_TILE_OVERLAP_PX:              int   = 150
_TILE_MAX_WIDTH_PX:            int   = 1600
_TALL_STRIP_MIN_HEIGHT_PX:     int   = 2000
_TALL_STRIP_MIN_RATIO:         float = 1.5
_DEDUP_IOU_THRESHOLD:          float = 0.50


class OcrSegment(TypedDict):
    text:    str
    conf:    float
    box:     List[List[int]]
    box_pct: List[List[float]]


_ocr_readers: Dict[str, Any] = {}


def _get_default_ocr_langs() -> List[str]:
    env_langs = os.getenv("OCR_LANGUAGES", "en").strip()
    return [lang.strip() for lang in env_langs.split(",") if lang.strip()] or ["en"]


def _load_ocr_reader(langs: Optional[List[str]] = None) -> Optional[Any]:
    global _ocr_readers
    if langs is None:
        langs = _get_default_ocr_langs()

    # EasyOCR language compatibility normalization:
    # Japanese is only compatible with English.
    # Korean is only compatible with English.
    safe_langs = [l for l in langs if l]
    if "ja" in safe_langs and "ko" in safe_langs:
        # Cannot mix ja and ko in EasyOCR; prioritize ja+en or default to en
        safe_langs = ["en", "ja"]
    elif "ja" in safe_langs:
        safe_langs = ["en", "ja"]
    elif "ko" in safe_langs:
        safe_langs = ["en", "ko"]
    elif not safe_langs:
        safe_langs = ["en"]

    cache_key = ",".join(sorted(safe_langs))
    if cache_key not in _ocr_readers and _HAS_EASYOCR:
        logger.info(f"[OCR Engine] Initialising EasyOCR reader — languages: {safe_langs}")
        try:
            import easyocr
            import torch
            use_gpu = torch.cuda.is_available()
            _ocr_readers[cache_key] = easyocr.Reader(safe_langs, gpu=use_gpu, verbose=False)
        except ImportError:
            logger.warning("[OCR Engine] EasyOCR is not installed.")
            return None
        except Exception as err:
            logger.warning(f"[OCR Engine] Failed to load EasyOCR with languages {safe_langs}: {err}")
            # Graceful fallback to English-only reader
            try:
                import easyocr
                import torch
                use_gpu = torch.cuda.is_available()
                logger.info("[OCR Engine] Falling back to English EasyOCR reader")
                _ocr_readers[cache_key] = easyocr.Reader(["en"], gpu=use_gpu, verbose=False)
            except Exception as fallback_err:
                logger.error(f"[OCR Engine] English EasyOCR fallback also failed: {fallback_err}")
                return None
    return _ocr_readers.get(cache_key)


def _convert_to_rgb_array(pil_image: Any) -> Any:
    return np.array(pil_image.convert("RGB"))


def _downscale_to_fit(img_np: Any, max_dim: int = _MAX_SINGLE_PASS_DIM) -> Tuple[Any, float]:
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
    h, w = img_np.shape[:2]

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

    sorted_boxes = sorted(boxes, key=lambda s: -s["conf"])
    kept: List[OcrSegment] = []
    for candidate in sorted_boxes:
        cb = _axis_aligned_bbox(candidate["box"])
        if not any(_iou(cb, _axis_aligned_bbox(k["box"])) >= iou_threshold for k in kept):
            kept.append(candidate)

    return kept


async def extract_full_ocr_data(
    image_path: str,
    langs: Optional[List[str]] = None,
    confidence_threshold: float = _DEFAULT_CONFIDENCE_THRESHOLD,
) -> List[OcrSegment]:
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
        logger.info(f"[OCR Engine] Detected {len(segments)} text dialogue segment{'s' if len(segments) != 1 else ''} in image")
        return segments

    except Exception as exc:
        logger.error(f"[OCR Engine] Text extraction failed: {exc}")
        return []


async def extract_text_lines_from_panel(
    image_path: str,
    langs: Optional[List[str]] = None,
) -> List[str]:
    segments = await extract_full_ocr_data(image_path, langs)
    return [seg["text"] for seg in segments]


extract_dialogue_from_panel = extract_text_lines_from_panel

# Human-readable aliases
detect_text_and_bounding_boxes = extract_full_ocr_data
read_speech_bubble_dialogue = extract_text_lines_from_panel

