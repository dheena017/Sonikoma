import os
import logging
from typing import List, Dict, Any

try:
    import easyocr
    import numpy as np
    from PIL import Image
    has_easyocr = True
except ImportError:
    has_easyocr = False

logger = logging.getLogger("anivox.services.ocr")

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
    Returns list of strings.
    """
    results = await extract_full_ocr_data(panel_image_path, langs)
    return [res["text"] for res in results]

async def extract_full_ocr_data(panel_image_path: str, langs: List[str] = ['en']) -> List[Dict[str, Any]]:
    """
    Extracts detailed OCR data including bounding boxes.
    Returns: List of { "text": str, "box": [[x,y],...], "conf": float }
    """
    if not os.path.exists(panel_image_path):
        logger.error(f"OCR: Image path does not exist: {panel_image_path}")
        return []

    if not has_easyocr:
        logger.warning("OCR: EasyOCR not installed. Returning empty results.")
        return []

    try:
        reader = get_reader(langs)
        if reader is None:
            return []

        # Read image to get dimensions for relative coordinates if needed
        img = Image.open(panel_image_path)
        width, height = img.size

        import asyncio
        # EasyOCR readtext
        raw_results = await asyncio.to_thread(reader.readtext, panel_image_path)
        
        # Results format: [([[x, y], [x, y], [x, y], [x, y]], text, confidence), ...]
        structured_results = []
        for res in raw_results:
            if res[2] > 0.3:
                box = res[0] # List of 4 points [[x,y], [x,y], [x,y], [x,y]]
                # Convert to percentages for frontend flexibility
                box_pct = [[p[0]/width, p[1]/height] for p in box]

                structured_results.append({
                    "text": res[1],
                    "conf": float(res[2]),
                    "box": box,
                    "box_pct": box_pct
                })

        logger.info(f"[OCR] Extracted {len(structured_results)} structured segments from {panel_image_path}")
        return structured_results

    except Exception as e:
        logger.error(f"[OCR] Error in extract_full_ocr_data from {panel_image_path}: {str(e)}")
        return []
