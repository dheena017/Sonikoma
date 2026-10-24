"""
backend/features/image_editor/services/ocr/ocr_reader.py
─────────────────────────────────────────────────────────────────────────────
EasyOCR / Tesseract Model Lifecycle & Isolated Text Extraction:
- Reader caching and GPU initialization
- Language normalization (handling EasyOCR JA/KO mutual exclusivity)
- Text whitespace cleanup
- Isolated image buffer text extraction primitives
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
import os
import re
import sys
from typing import Any, Dict, List, Optional

import numpy as np
from PIL import Image

try:
    import easyocr
    import torch
    _HAS_EASYOCR = True
except ImportError:
    _HAS_EASYOCR = False

try:
    import pytesseract
    _HAS_TESSERACT = True
except ImportError:
    _HAS_TESSERACT = False

HAS_TESSERACT: bool = _HAS_TESSERACT

logger = logging.getLogger("sonikoma.features.image_editor.services.ocr.ocr_reader")

# Cached EasyOCR Reader instances keyed by sorted normalized language codes
_ocr_readers: Dict[str, Any] = {}


def get_default_ocr_languages() -> List[str]:
    """Retrieves default OCR language codes configured via the OCR_LANGUAGES environment variable."""
    env_langs = os.getenv("OCR_LANGUAGES", "en").strip()
    return [lang.strip().lower() for lang in env_langs.split(",") if lang.strip()] or ["en"]


def get_ocr_reader(languages: Optional[List[str]] = None) -> Optional[Any]:
    """
    Lazily loads, caches, and returns an EasyOCR Reader singleton instance.

    Normalizes language combinations according to EasyOCR compatibility:
    - Japanese ('ja') is mutually incompatible with Korean ('ko') in EasyOCR.
    - Korean ('ko') is combined with English ('en').
    - Japanese ('ja') is combined with English ('en').

    Args:
        languages (Optional[List[str]]): Target language codes (e.g. ['en', 'ja']).

    Returns:
        Optional[Any]: EasyOCR Reader instance, or None if library is unavailable.
    """
    global _ocr_readers

    if not _HAS_EASYOCR:
        logger.warning("[OCR Reader] EasyOCR library is not installed in the current environment.")
        return None

    if languages is None:
        languages = get_default_ocr_languages()

    safe_langs = [str(l).strip().lower() for l in languages if str(l).strip()]
    if "ja" in safe_langs and "ko" in safe_langs:
        safe_langs = ["en", "ja"]
    elif "ja" in safe_langs:
        safe_langs = ["en", "ja"] if "en" not in safe_langs else safe_langs
    elif "ko" in safe_langs:
        safe_langs = ["en", "ko"] if "en" not in safe_langs else safe_langs
    elif not safe_langs:
        safe_langs = ["en"]

    cache_key = ",".join(sorted(set(safe_langs)))
    if cache_key in _ocr_readers:
        return _ocr_readers[cache_key]

    logger.info(f"[OCR Reader] Initializing EasyOCR Reader for languages: {safe_langs}...")
    try:
        use_gpu = torch.cuda.is_available() if "torch" in sys.modules else False
        reader = easyocr.Reader(safe_langs, gpu=use_gpu, verbose=False)
        _ocr_readers[cache_key] = reader
        logger.info(f"[OCR Reader] Loaded EasyOCR reader for '{cache_key}' (GPU: {use_gpu}).")
        return reader
    except Exception as err:
        logger.warning(f"[OCR Reader] Failed initializing EasyOCR for {safe_langs}: {err}. Trying English fallback.")
        try:
            use_gpu = torch.cuda.is_available() if "torch" in sys.modules else False
            fallback_reader = easyocr.Reader(["en"], gpu=use_gpu, verbose=False)
            _ocr_readers[cache_key] = fallback_reader
            return fallback_reader
        except Exception as fallback_err:
            logger.error(f"[OCR Reader] English EasyOCR fallback reader failed: {fallback_err}")
            return None


_load_ocr_reader = get_ocr_reader


def clean_transcript_whitespace(text: str) -> str:
    """Cleans and normalizes extraneous whitespace, newlines, and tabs from text."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def extract_text_from_image_bytes(
    image_bytes: bytes,
    languages: Optional[List[str]] = None,
    min_confidence: float = 0.20,
) -> str:
    """
    Extracts raw text string from an image byte buffer using EasyOCR with Tesseract fallback.
    """
    if not image_bytes or len(image_bytes) == 0:
        return ""

    if languages is None:
        languages = ["en"]

    if _HAS_EASYOCR:
        try:
            reader = get_ocr_reader(languages)
            if reader is not None:
                img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                img_np = np.array(img_pil, dtype=np.uint8)
                results = reader.readtext(img_np)
                lines = [
                    str(r[1]).strip()
                    for r in results
                    if str(r[1]).strip() and float(r[2]) >= min_confidence
                ]
                if lines:
                    return clean_transcript_whitespace(" ".join(lines))
        except Exception as e:
            logger.debug(f"[Dialogue OCR] EasyOCR buffer extraction bypassed: {e}")

    # Fallback to Tesseract
    if _HAS_TESSERACT:
        try:
            img = Image.open(io.BytesIO(image_bytes))
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")
            raw_text = pytesseract.image_to_string(img, config="--psm 6")
            clean_lines = [line.strip() for line in str(raw_text).splitlines() if line.strip()]
            return clean_transcript_whitespace(" ".join(clean_lines))
        except Exception:
            pass

    return ""


__all__ = [
    "get_default_ocr_languages",
    "get_ocr_reader",
    "_load_ocr_reader",
    "clean_transcript_whitespace",
    "extract_text_from_image_bytes",
    "_HAS_EASYOCR",
    "_HAS_TESSERACT",
    "HAS_TESSERACT",
]
