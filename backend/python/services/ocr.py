import os
import logging
from typing import List

try:
    import easyocr
    import numpy as np
    from PIL import Image
    has_easyocr = True
except ImportError:
    has_easyocr = False

logger = logging.getLogger("webtoon_engine.ocr")

# Global reader instance to avoid reloading models on every call
_reader = None

def get_reader(langs: List[str] = ['en']):
    global _reader
    if _reader is None and has_easyocr:
        logger.info(f"Initializing EasyOCR reader with languages: {langs}")
        _reader = easyocr.Reader(langs)
    return _reader

async def extract_dialogue_from_panel(panel_image_path: str, langs: List[str] = ['en']) -> List[str]:
    """
    Extracts text/dialogue from a panel image using EasyOCR.
    """
    if not os.path.exists(panel_image_path):
        logger.error(f"OCR: Image path does not exist: {panel_image_path}")
        return []

    if not has_easyocr:
        logger.warning("OCR: EasyOCR not installed. Returning empty dialogue list.")
        return []

    try:
        reader = get_reader(langs)
        if reader is None:
            return []

        # EasyOCR can take the image path directly
        results = reader.readtext(panel_image_path)
        
        # Results format: [([[x, y], [x, y], [x, y], [x, y]], text, confidence), ...]
        dialogue = [res[1] for res in results if res[2] > 0.3] # Confidence threshold

        logger.info(f"OCR: Extracted {len(dialogue)} text segments from {panel_image_path}")
        return dialogue

    except Exception as e:
        logger.error(f"OCR: Error extracting dialogue from {panel_image_path}: {str(e)}")
        return []
