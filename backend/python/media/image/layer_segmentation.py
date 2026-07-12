import os
import io
import uuid
import logging
from typing import Dict, Any, Tuple
import numpy as np
import cv2
from PIL import Image

logger = logging.getLogger("sonikoma.services.layer_segmentation")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower().strip()
LOCAL_MEDIA_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "local_media"))
# Matches main.py mount: /media -> <LOCAL_MEDIA_ROOT>
LOCAL_MEDIA_URL_PREFIX = "/media"

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

    ENVIRONMENT toggle:
      - development: write WebP layers to disk and return local URL paths
      - production: upload WebP layers to Supabase and return Supabase public URLs
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
    # Step 1: Text & Speech Bubble Segmentation (Refined to solve "Boxy Bubbles")
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
            for res in ocr_results:
                # box is [[x1,y1], [x2,y1], [x2,y2], [x1,y2]]
                pts = np.array(res["box"], dtype=np.int32)
                x, y, w, h_box = cv2.boundingRect(pts)
                if w <= 0 or h_box <= 0:
                    continue

                # Create a local ROI slightly larger than the bounding box to search for bubble contours
                pad = max(w, h_box) // 2
                x1, y1 = max(0, x - pad), max(0, y - pad)
                x2, y2 = min(width, x + w + pad), min(height, y + h_box + pad)

                roi = original_img[y1:y2, x1:x2]
                if roi.size == 0:
                    continue

                roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

                # Generate thresholded images
                thresh_bin = cv2.adaptiveThreshold(
                    roi_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
                )
                thresh_inv = cv2.adaptiveThreshold(
                    roi_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
                )
                _, simple_thresh = cv2.threshold(roi_gray, 200, 255, cv2.THRESH_BINARY)

                # Find contours on thresholded versions
                contours_bin, _ = cv2.findContours(thresh_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                contours_inv, _ = cv2.findContours(thresh_inv, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                contours_simple, _ = cv2.findContours(simple_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                all_contours = list(contours_bin) + list(contours_inv) + list(contours_simple)

                # Center of the text bounding box in the ROI coordinate system
                cx, cy = (x + w // 2) - x1, (y + h_box // 2) - y1
                roi_box_area = w * h_box

                bubble_found = False
                # Sort contours by area descending to check largest first
                all_contours = sorted(all_contours, key=cv2.contourArea, reverse=True)

                for cnt in all_contours:
                    area = cv2.contourArea(cnt)
                    if area > 0.4 * roi_box_area:
                        # Check if the OCR bounding box center is inside this contour
                        if cv2.pointPolygonTest(cnt, (cx, cy), False) >= 0:
                            # Calculate solidity
                            hull = cv2.convexHull(cnt)
                            hull_area = cv2.contourArea(hull)
                            solidity = float(area) / hull_area if hull_area > 0 else 0

                            if solidity > 0.7:
                                # Assume it's a speech bubble and mask the entire contour
                                cnt_offset = cnt + [x1, y1]
                                cv2.drawContours(text_mask, [cnt_offset], -1, 255, -1)
                                bubble_found = True
                                break

                if not bubble_found:
                    # Fallback: float text, mask only the thresholded text pixels themselves
                    tx1, ty1 = max(0, x), max(0, y)
                    tx2, ty2 = min(width, x + w), min(height, y + h_box)
                    exact_roi = original_img[ty1:ty2, tx1:tx2]
                    if exact_roi.size > 0:
                        exact_roi_gray = cv2.cvtColor(exact_roi, cv2.COLOR_BGR2GRAY)
                        exact_thresh_inv = cv2.adaptiveThreshold(
                            exact_roi_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
                        )
                        exact_thresh_bin = cv2.adaptiveThreshold(
                            exact_roi_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
                        )
                        mean_val = np.mean(exact_roi_gray)
                        text_pixels = exact_thresh_inv if mean_val > 127 else exact_thresh_bin
                        text_mask[ty1:ty2, tx1:tx2] = cv2.bitwise_or(text_mask[ty1:ty2, tx1:tx2], text_pixels)

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
    # Step 1.5: Erase Text to create Textless Image (Solves "Sticky Text" Step B)
    # =========================================================================
    textless_img = original_img.copy()
    try:
        # Dilate text_mask slightly to cover the text/bubble borders perfectly
        text_dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        dilated_text_mask = cv2.dilate(text_mask, text_dilate_kernel, iterations=1)
        textless_img = cv2.inpaint(original_img, dilated_text_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
    except Exception as e:
        logger.error(f"Error generating textless image: {e}", exc_info=True)

    # =========================================================================
    # Step 2: Character Segmentation (Solves "Sticky Text" Step C)
    # =========================================================================
    char_layer_bytes = None
    try:
        if not has_rembg:
            char_layer_bytes = create_blank_webp(width, height)
        else:
            session = get_rembg_session()
            # rembg expects a PIL Image or bytes. We pass PIL Image of textless_img (not original_img)
            pil_img = Image.fromarray(cv2.cvtColor(textless_img, cv2.COLOR_BGR2RGB))

            # rembg returns a PIL Image with transparent background
            char_pil = rembg_remove(pil_img, session=session)

            # Generate the character mask for inpainting later
            char_np = np.array(char_pil) # RGBA
            if char_np.shape[2] == 4:
                char_mask = char_np[:,:,3] # Extract alpha channel
            else:
                char_mask = np.zeros((height, width), dtype=np.uint8)

            # Encode character layer to webp
            buffer = io.BytesIO()
            char_pil.save(buffer, format="WEBP")
            char_layer_bytes = buffer.getvalue()

    except Exception as e:
        logger.error(f"Error extracting character layer: {e}", exc_info=True)
        char_layer_bytes = create_blank_webp(width, height)
        char_mask = np.zeros((height, width), dtype=np.uint8)

    # =========================================================================
    # Step 3: Background Inpainting (Solves "Ghosting Blob")
    # =========================================================================
    bg_layer_bytes = None
    try:
        # Combine masks to find all holes
        combined_mask = cv2.bitwise_or(text_mask, char_mask)

        # Dilate mask slightly to prevent artifacts at the edges
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        combined_mask = cv2.dilate(combined_mask, kernel, iterations=1)

        # Inpaint using cv2.INPAINT_NS with a large radius (radius=20) for background
        inpainted_bg = cv2.inpaint(original_img, combined_mask, inpaintRadius=20, flags=cv2.INPAINT_NS)

        # Convert BGR to BGRA and encode to WebP
        _, buffer = cv2.imencode('.webp', inpainted_bg)
        bg_layer_bytes = buffer.tobytes()

    except Exception as e:
        logger.error(f"Error inpainting background layer: {e}", exc_info=True)
        # Fallback to original image if inpainting completely fails
        _, buffer = cv2.imencode('.webp', original_img)
        bg_layer_bytes = buffer.tobytes()

    # =========================================================================
    # Step 4: Storage (Supabase vs Local)
    # =========================================================================
    folder_prefix = f"layers/{panel_id}/"

    if ENVIRONMENT == "production":
        logger.info(f"[Layer Segmentation] ENVIRONMENT=production — uploading layers to Supabase for panel_id={panel_id}")

        try:
            bg_url = upload_to_supabase_bucket(bg_layer_bytes, "panels", f"{folder_prefix}bg.webp", "image/webp")
            char_url = upload_to_supabase_bucket(char_layer_bytes, "panels", f"{folder_prefix}char.webp", "image/webp")
            text_url = upload_to_supabase_bucket(text_layer_bytes, "panels", f"{folder_prefix}text.webp", "image/webp")
        except Exception as e:
            logger.error(f"[Layer Segmentation] Supabase upload failed for panel_id={panel_id}: {e}", exc_info=True)
            raise

        # Eliminate "null" silently returning; surface the real issue.
        missing = {k: v for k, v in {"background_url": bg_url, "character_url": char_url, "text_url": text_url}.items() if not v}
        if missing:
            raise RuntimeError(f"Supabase upload returned empty URLs for panel_id={panel_id}: {missing}")

        return {
            "background_url": bg_url,
            "character_url": char_url,
            "text_url": text_url,
        }

    # Development/local bypass
    local_panel_dir = os.path.join(LOCAL_MEDIA_ROOT, "panels", "layers", panel_id)
    try:
        os.makedirs(local_panel_dir, exist_ok=True)
    except Exception as e:
        logger.error(f"[Layer Segmentation] Failed to create local media directory: {local_panel_dir} : {e}", exc_info=True)
        raise

    logger.info(f"[Layer Segmentation] ENVIRONMENT={ENVIRONMENT} — saving layers locally for panel_id={panel_id} at {local_panel_dir}")

    local_files = {
        "bg.webp": bg_layer_bytes,
        "char.webp": char_layer_bytes,
        "text.webp": text_layer_bytes,
    }

    for fname, b in local_files.items():
        if b is None:
            raise RuntimeError(f"Local layer bytes is None for {fname} (panel_id={panel_id})")

    try:
        for fname, b in local_files.items():
            out_path = os.path.join(local_panel_dir, fname)
            with open(out_path, "wb") as f:
                f.write(b)
    except Exception as e:
        logger.error(f"[Layer Segmentation] Failed writing local WebP files for panel_id={panel_id}: {e}", exc_info=True)
        raise

    # Return paths frontend can load via FastAPI static mount (/media)
    bg_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/bg.webp"
    char_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/char.webp"
    text_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/text.webp"

    return {
        "background_url": bg_url,
        "character_url": char_url,
        "text_url": text_url,
    }
