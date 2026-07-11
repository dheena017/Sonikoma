import os
import io
import uuid
import logging
from typing import Dict, Any, Tuple
import numpy as np
import cv2
from PIL import Image

logger = logging.getLogger("sonikoma.services.layer_segmentation")

# Try importing dependencies safely
try:
    from rembg import remove as rembg_remove
    from rembg import new_session
    has_rembg = True
except ImportError:
    has_rembg = False
    logger.warning("rembg is not installed. Character segmentation will return a blank layer.")

from media.image.ocr import extract_full_ocr_data
from utils.supabase_storage import upload_to_supabase_bucket

# Initialize a global rembg session for U-2-Net model to prevent reloading it per request
_rembg_session = None

def get_rembg_session():
    global _rembg_session
    if _rembg_session is None and has_rembg:
        logger.info("Initializing rembg session (U-2-Net)")
        _rembg_session = new_session("u2net")
    return _rembg_session

def create_blank_webp(width: int, height: int) -> bytes:
    """Helper to generate a fully transparent WebP image of given dimensions."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    buffer = io.BytesIO()
    img.save(buffer, format="WEBP")
    return buffer.getvalue()

async def process_layers(image_path: str, panel_id: str) -> Dict[str, str]:
    """
    Main orchestration logic for separating a panel into Background, Character, and Text layers.
    Returns a dictionary mapping layer type to public URLs.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Source image not found: {image_path}")

    logger.info(f"Starting layer segmentation for panel: {panel_id}")

    original_img = cv2.imread(image_path)
    if original_img is None:
        raise ValueError(f"Could not load image: {image_path}")

    height, width = original_img.shape[:2]

    # 1. Initialize masks
    # Both masks are single channel (grayscale)
    text_mask = np.zeros((height, width), dtype=np.uint8)
    char_mask = np.zeros((height, width), dtype=np.uint8)

    # =========================================================================
    # Step 1: Text & Speech Bubble Segmentation
    # =========================================================================
    text_layer_bytes = None
    try:
        # Get bounding boxes from OCR
        ocr_results = await extract_full_ocr_data(image_path, langs=['en'])

        if not ocr_results:
            logger.info("No text detected. Creating blank text layer.")
            text_layer_bytes = create_blank_webp(width, height)
        else:
            # We use OpenCV contouring around the bounding boxes to catch speech bubbles
            gray = cv2.cvtColor(original_img, cv2.COLOR_BGR2GRAY)
            # Find bright areas (assuming white bubbles)
            _, bright_mask = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)

            for res in ocr_results:
                # box is [[x1,y1], [x2,y1], [x2,y2], [x1,y2]]
                pts = np.array(res["box"], dtype=np.int32)
                x, y, w, h_box = cv2.boundingRect(pts)

                # Create a local ROI slightly larger than the bounding box to search for bubble contours
                pad = max(w, h_box) // 2
                x1, y1 = max(0, x - pad), max(0, y - pad)
                x2, y2 = min(width, x + w + pad), min(height, y + h_box + pad)

                roi_bright = bright_mask[y1:y2, x1:x2]

                # Find contours in the local bright mask
                contours, _ = cv2.findContours(roi_bright, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                bubble_found = False
                for cnt in contours:
                    # Offset contour back to global coordinates
                    cnt += [x1, y1]
                    # If the OCR bounding box center is inside this contour, we assume it's the bubble
                    cx, cy = x + w//2, y + h_box//2
                    if cv2.pointPolygonTest(cnt, (cx, cy), False) >= 0:
                        cv2.drawContours(text_mask, [cnt], -1, 255, -1)
                        bubble_found = True
                        break

                # Fallback: if no bubble contour found, just mask the bounding box with some padding
                if not bubble_found:
                    cv2.rectangle(text_mask, (max(0, x-10), max(0, y-10)), (min(width, x+w+10), min(height, y+h_box+10)), 255, -1)

            # Extract the text layer (original image colors, but only where mask is 255, else transparent)
            text_layer = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
            text_layer[text_mask == 0] = [0, 0, 0, 0] # Make background transparent

            # Encode to webp
            _, buffer = cv2.imencode('.webp', text_layer)
            text_layer_bytes = buffer.tobytes()

    except Exception as e:
        logger.error(f"Error extracting text layer: {e}", exc_info=True)
        text_layer_bytes = create_blank_webp(width, height)

    # =========================================================================
    # Step 2: Character Segmentation
    # =========================================================================
    char_layer_bytes = None
    try:
        if not has_rembg:
            char_layer_bytes = create_blank_webp(width, height)
        else:
            session = get_rembg_session()
            # rembg expects a PIL Image or bytes. We can pass the raw file bytes or PIL image
            pil_img = Image.fromarray(cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB))

            # rembg returns a PIL Image with transparent background
            char_pil = rembg_remove(pil_img, session=session)

            # Generate the character mask for inpainting later
            char_np = np.array(char_pil) # RGBA
            if char_np.shape[2] == 4:
                char_mask = char_np[:,:,3] # Extract alpha channel

            # Encode character layer to webp
            buffer = io.BytesIO()
            char_pil.save(buffer, format="WEBP")
            char_layer_bytes = buffer.getvalue()

    except Exception as e:
        logger.error(f"Error extracting character layer: {e}", exc_info=True)
        char_layer_bytes = create_blank_webp(width, height)
        char_mask = np.zeros((height, width), dtype=np.uint8)

    # =========================================================================
    # Step 3: Background Inpainting
    # =========================================================================
    bg_layer_bytes = None
    try:
        # Combine masks to find all holes
        combined_mask = cv2.bitwise_or(text_mask, char_mask)

        # Dilate mask slightly to prevent artifacts at the edges
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        combined_mask = cv2.dilate(combined_mask, kernel, iterations=1)

        # Inpaint using Telea algorithm
        inpainted_bg = cv2.inpaint(original_img, combined_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

        # Convert BGR to BGRA and encode to WebP
        # (Though BG can be opaque, keeping it WebP ensures consistency)
        _, buffer = cv2.imencode('.webp', inpainted_bg)
        bg_layer_bytes = buffer.tobytes()

    except Exception as e:
        logger.error(f"Error inpainting background layer: {e}", exc_info=True)
        # Fallback to original image if inpainting completely fails
        _, buffer = cv2.imencode('.webp', original_img)
        bg_layer_bytes = buffer.tobytes()

    # =========================================================================
    # Step 4: Upload to Supabase
    # =========================================================================
    folder_prefix = f"layers/{panel_id}/"

    # Run uploads concurrently if needed, but sequential is fine for now
    bg_url = upload_to_supabase_bucket(bg_layer_bytes, "panels", f"{folder_prefix}bg.webp", "image/webp")
    char_url = upload_to_supabase_bucket(char_layer_bytes, "panels", f"{folder_prefix}char.webp", "image/webp")
    text_url = upload_to_supabase_bucket(text_layer_bytes, "panels", f"{folder_prefix}text.webp", "image/webp")

    return {
        "background_url": bg_url,
        "character_url": char_url,
        "text_url": text_url
    }
