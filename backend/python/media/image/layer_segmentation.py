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
from media.image.detect_panels import _detect_bg_color_and_threshold
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

def smooth_contour(cnt, factor: float = 0.01):
    """Smooths a contour using Douglas-Peucker polygonal approximation."""
    epsilon = factor * cv2.arcLength(cnt, True)
    return cv2.approxPolyDP(cnt, epsilon, True)

def pyramid_guided_inpaint(original_img: np.ndarray, mask: np.ndarray, radius: int = 20) -> np.ndarray:
    """
    Performs Pyramidal Guided Inpainting to resolve massive character/text holes.
    Reduces the image scale to inpaint primary structures, scales back up, and blends
    with local, boundary-aware high-resolution inpainting via distance transforms.
    This guarantees pristine backgrounds completely free of ghosting smudges or halos.
    """
    height, width = original_img.shape[:2]

    # Define pyramid levels (Downsample to robustly capture global structures)
    down_scale = 4
    low_w, low_h = max(16, width // down_scale), max(16, height // down_scale)

    # 1. Low-Resolution structure inpainting
    low_img = cv2.resize(original_img, (low_w, low_h), interpolation=cv2.INTER_AREA)
    low_mask = cv2.resize(mask, (low_w, low_h), interpolation=cv2.INTER_NEAREST)

    # Inpaint structural layer at low resolution
    low_inpainted = cv2.inpaint(low_img, low_mask, inpaintRadius=max(3, radius // down_scale), flags=cv2.INPAINT_NS)

    # Upsample structural layer back to original resolution
    structure_img = cv2.resize(low_inpainted, (width, height), interpolation=cv2.INTER_CUBIC)

    # 2. High-Resolution detail-preserving inpainting
    detail_img = cv2.inpaint(original_img, mask, inpaintRadius=radius, flags=cv2.INPAINT_NS)

    # 3. Create Distance Transform Blending Weights
    # Distance transform computes the distance of non-zero pixels to the nearest zero pixel.
    # We want to measure the depth of pixels inside the hole (where mask > 0) relative to the boundary.
    # Therefore, we run distanceTransform on the mask itself. Inside the hole, values will be > 0
    # increasing towards the center, while outside the hole it will be 0.
    dist_transform = cv2.distanceTransform(mask, cv2.DIST_L2, 5)

    # Normalize distance transform across the masked regions
    # Near the boundaries (low distance to background), we prefer high-res details.
    # Far from boundaries (deep inside the holes), we prefer structure-consistent upscaled structures.
    max_dist = np.max(dist_transform[mask > 0]) if np.any(mask > 0) else 1.0
    if max_dist <= 0:
        max_dist = 1.0

    # Generate continuous blending weight map: 0.0 near background, 1.0 at maximum depth inside hole
    blend_weights = np.clip(dist_transform / (max_dist * 0.8), 0.0, 1.0)
    blend_weights = cv2.GaussianBlur(blend_weights, (11, 11), 0)

    # Reshape weights for three-channel broadcasting
    blend_weights_3d = np.expand_dims(blend_weights, axis=2)

    # Perform pyramidal guided blending
    blended_img = (structure_img * blend_weights_3d + detail_img * (1.0 - blend_weights_3d)).astype(np.uint8)

    # Retain the exact original background outside the mask
    result = original_img.copy()
    result[mask > 0] = blended_img[mask > 0]
    return result

async def process_layers(image_path: str, panel_id: str) -> Dict[str, str]:
    """
    Main orchestration logic for separating a panel into Background, Character, and Text layers.
    Follows a strict "Detect First, Extract Text First" sequence:

    Phase 1: Global Detection
    1. Scan initial image using EasyOCR to detect if any text or sound effects exist.
    2. Scan initial image using rembg (U-2-Net session) to identify the bounding box of the main character/subject.

    Phase 2: Text Separation (Conditional)
    3. IF text exists:
       - Extract text and speech bubbles into their own transparent WebP layer (text.webp)
         using adaptive thresholding and contour refinement logic.
       - Immediately use cv2.INPAINT_TELEA to erase that text from the working image, creating a clean textless_img.
    4. IF no text exists:
       - Return a blank/empty transparent image for text.webp.
       - Proceed using the original image as the textless_img.

    Phase 3: Character & Background Separation
    5. Run character extraction (rembg) strictly on the textless_img to generate char.webp and accurate char_mask.
    6. Erase character from the textless_img using Pyramidal Guided Inpainting (cv2.INPAINT_NS) to generate the final bg.webp.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Source image not found: {image_path}")

    logger.info(f"Starting chronological layer segmentation for panel: {panel_id}")

    original_img = cv2.imread(image_path)
    if original_img is None:
        raise ValueError(f"Could not load image: {image_path}")

    height, width = original_img.shape[:2]

    # Initialize masks and layer containers
    text_mask = np.zeros((height, width), dtype=np.uint8)
    char_mask = np.zeros((height, width), dtype=np.uint8)
    global_char_mask = np.zeros((height, width), dtype=np.uint8)

    # =========================================================================
    # Phase 1: Global Detection
    # =========================================================================
    # 1. OCR text detection scan
    ocr_results = []
    try:
        ocr_results = await extract_full_ocr_data(image_path, langs=['en'])
    except Exception as e:
        logger.error(f"[Global Detection] EasyOCR scan failed: {e}", exc_info=True)

    # 2. rembg character scan on original image (for localizing subject/bounding box)
    try:
        if has_rembg:
            session = get_rembg_session()
            pil_orig = Image.fromarray(cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB))
            char_pil_scan = rembg_remove(pil_orig, session=session)
            char_np_scan = np.array(char_pil_scan)
            if char_np_scan.shape[2] == 4:
                global_char_mask = char_np_scan[:, :, 3]
    except Exception as e:
        logger.error(f"[Global Detection] Character pre-detection scan failed: {e}", exc_info=True)

    # =========================================================================
    # Phase 2: Text Separation (Conditional)
    # =========================================================================
    text_layer_bytes = None
    textless_img = original_img.copy()

    if ocr_results:
        logger.info(f"[Text Separation] {len(ocr_results)} text regions detected. Performing extraction.")
        try:
            for res in ocr_results:
                pts = np.array(res["box"], dtype=np.int32)
                x, y, w, h_box = cv2.boundingRect(pts)
                if w <= 0 or h_box <= 0:
                    continue

                # Local ROI with extra padding
                pad = max(w, h_box) // 2
                x1, y1 = max(0, x - pad), max(0, y - pad)
                x2, y2 = min(width, x + w + pad), min(height, y + h_box + pad)

                roi = original_img[y1:y2, x1:x2]
                if roi.size == 0:
                    continue

                roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

                # Generate adaptive and simple thresholds
                thresh_bin = cv2.adaptiveThreshold(
                    roi_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
                )
                thresh_inv = cv2.adaptiveThreshold(
                    roi_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
                )
                _, simple_thresh = cv2.threshold(roi_gray, 200, 255, cv2.THRESH_BINARY)

                # Find contours across thresholds
                contours_bin, _ = cv2.findContours(thresh_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                contours_inv, _ = cv2.findContours(thresh_inv, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                contours_simple, _ = cv2.findContours(simple_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                all_contours = list(contours_bin) + list(contours_inv) + list(contours_simple)

                cx, cy = (x + w // 2) - x1, (y + h_box // 2) - y1
                roi_box_area = w * h_box

                bubble_found = False
                all_contours = sorted(all_contours, key=cv2.contourArea, reverse=True)

                for cnt in all_contours:
                    area = cv2.contourArea(cnt)
                    if area > 0.4 * roi_box_area:
                        if cv2.pointPolygonTest(cnt, (cx, cy), False) >= 0:
                            hull = cv2.convexHull(cnt)
                            hull_area = cv2.contourArea(hull)
                            solidity = float(area) / hull_area if hull_area > 0 else 0

                            if solidity > 0.7:
                                closed_cnt = smooth_contour(cnt)
                                cnt_offset = closed_cnt + [x1, y1]

                                # Draw onto global text mask
                                cv2.drawContours(text_mask, [cnt_offset], -1, 255, -1)

                                # Clean edges inside localized mask using Morphological Closing
                                local_mask = np.zeros_like(roi_gray)
                                cv2.drawContours(local_mask, [closed_cnt], -1, 255, -1)
                                kernel_ellipse = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
                                local_mask = cv2.morphologyEx(local_mask, cv2.MORPH_CLOSE, kernel_ellipse)
                                text_mask[y1:y2, x1:x2] = cv2.bitwise_or(text_mask[y1:y2, x1:x2], local_mask)

                                bubble_found = True
                                break

                if not bubble_found:
                    # Fallback: Float text, mask only thresholded pixels
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

                        # Leverage _detect_bg_color_and_threshold from detect_panels.py to stay DRY and robust
                        is_white, _ = _detect_bg_color_and_threshold(exact_roi_gray, bg_mode="auto", sensitivity=30.0)
                        raw_text_pixels = exact_thresh_inv if is_white else exact_thresh_bin

                        # Filter screentones and background textures
                        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(raw_text_pixels, connectivity=8)
                        filtered_text_pixels = np.zeros_like(raw_text_pixels)

                        roi_w, roi_h = tx2 - tx1, ty2 - ty1
                        min_pixel_area = max(2, int((roi_w * roi_h) * 0.0005))
                        max_pixel_area = int((roi_w * roi_h) * 0.2)

                        for label_idx in range(1, num_labels):
                            comp_area = stats[label_idx, cv2.CC_STAT_AREA]
                            comp_w = stats[label_idx, cv2.CC_STAT_WIDTH]
                            comp_h = stats[label_idx, cv2.CC_STAT_HEIGHT]

                            if min_pixel_area <= comp_area <= max_pixel_area:
                                aspect_ratio = float(comp_w) / comp_h if comp_h > 0 else 0
                                if 0.05 < aspect_ratio < 20.0:
                                    filtered_text_pixels[labels == label_idx] = 255

                        text_mask[ty1:ty2, tx1:tx2] = cv2.bitwise_or(text_mask[ty1:ty2, tx1:tx2], filtered_text_pixels)

            # Extract final text layer
            text_layer = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
            text_layer[text_mask == 0] = [0, 0, 0, 0]
            _, buffer = cv2.imencode('.webp', text_layer)
            text_layer_bytes = buffer.tobytes()

            # Clean text/bubbles out of working image immediately to prevent "Sticky Text"
            text_dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            dilated_text_mask = cv2.dilate(text_mask, text_dilate_kernel, iterations=1)
            textless_img = cv2.inpaint(original_img, dilated_text_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

        except Exception as e:
            logger.error(f"Error during conditional text separation: {e}", exc_info=True)
            text_layer_bytes = create_blank_webp(width, height)
            textless_img = original_img.copy()
    else:
        logger.info("[Text Separation] No text regions detected. Creating blank placeholder text layer.")
        text_layer_bytes = create_blank_webp(width, height)
        textless_img = original_img.copy()

    # =========================================================================
    # Phase 3: Character & Background Separation
    # =========================================================================
    char_layer_bytes = None
    try:
        if not has_rembg:
            char_layer_bytes = create_blank_webp(width, height)
        else:
            session = get_rembg_session()
            # rembg run STRICTLY on textless_img to guarantee character is fully clean
            pil_textless = Image.fromarray(cv2.cvtColor(textless_img, cv2.COLOR_BGR2RGB))
            char_pil = rembg_remove(pil_textless, session=session)

            char_np = np.array(char_pil)
            if char_np.shape[2] == 4:
                char_mask = char_np[:, :, 3]
            else:
                char_mask = np.zeros((height, width), dtype=np.uint8)

            buffer = io.BytesIO()
            char_pil.save(buffer, format="WEBP")
            char_layer_bytes = buffer.getvalue()

    except Exception as e:
        logger.error(f"Error during character segmentation: {e}", exc_info=True)
        char_layer_bytes = create_blank_webp(width, height)
        char_mask = np.zeros((height, width), dtype=np.uint8)

    # 6. Generate final background by erasing character/text holes from the original image
    bg_layer_bytes = None
    try:
        combined_mask = cv2.bitwise_or(text_mask, char_mask)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        combined_mask = cv2.dilate(combined_mask, kernel, iterations=1)

        # Pyramidal Guided Inpainting to generate pristine backgrounds
        inpainted_bg = pyramid_guided_inpaint(original_img, combined_mask, radius=20)
        _, buffer = cv2.imencode('.webp', inpainted_bg)
        bg_layer_bytes = buffer.tobytes()

    except Exception as e:
        logger.error(f"Error generating background layer: {e}", exc_info=True)
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
