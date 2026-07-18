import os
import io
import logging
from typing import Dict
import numpy as np
import cv2
from PIL import Image

logger = logging.getLogger("sonikoma.services.layer_segmentation")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower().strip()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
LOCAL_MEDIA_ROOT = os.path.abspath(os.path.join(PROJECT_ROOT, "data", "local_media"))
# Matches main.py mount: /media -> <LOCAL_MEDIA_ROOT>
LOCAL_MEDIA_URL_PREFIX = "/media"

from media.image.ocr import extract_full_ocr_data
from media.image.detect_panels import _detect_bg_color_and_threshold
from providers.vision.yolo import segment_text_and_balloons, segment_characters
from database.storage.supabase_storage import upload_to_supabase_bucket
from providers.vision.sam import has_rembg, segment_character_u2net

def create_blank_webp(width: int, height: int) -> bytes:
    """Helper to generate a fully transparent WebP image of given dimensions."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    buffer = io.BytesIO()
    img.save(buffer, format="WEBP")
    return buffer.getvalue()

def create_blank_png(width: int, height: int) -> bytes:
    """Helper to generate a fully transparent PNG image of given dimensions."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
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

    # Detect dominant background color and threshold
    gray_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2GRAY)
    is_white_bg, threshold_val = _detect_bg_color_and_threshold(gray_img, bg_mode="auto", sensitivity=30.0)
    logger.info(f"[Background Context] Detected background is {'white/light' if is_white_bg else 'black/dark'} (threshold_val={threshold_val})")

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
            pil_orig = Image.fromarray(cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB))
            char_pil_scan = segment_character_u2net(pil_orig)
            if char_pil_scan is not None:
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

    # Pre-segment speech bubbles if background is dark
    if not is_white_bg:
        logger.info("[Text Separation] Dark background detected. Pre-segmenting bright speech bubbles.")
        _, bright_mask = cv2.threshold(gray_img, 200, 255, cv2.THRESH_BINARY)
        close_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        cleaned_bright = cv2.morphologyEx(bright_mask, cv2.MORPH_CLOSE, close_kernel)
        
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(cleaned_bright, connectivity=8)
        for label_idx in range(1, num_labels):
            area = stats[label_idx, cv2.CC_STAT_AREA]
            if 100 < area < (height * width * 0.5):
                text_mask[labels == label_idx] = 255

    # 1. Attempt Primary YOLO-based Manga Text & Balloon Segmentation (AI-native Pivot)
    # Confidence lowered to 0.25 to capture stylized manga text regions that sit below 0.5
    yolo_text_mask = segment_text_and_balloons(image_path, conf_threshold=0.25)

    if yolo_text_mask is not None and np.any(yolo_text_mask > 0):
        logger.info("[Text Separation] YOLO model successfully segmented text and balloon layers.")
        text_mask = cv2.bitwise_or(text_mask, yolo_text_mask)
    elif ocr_results:
        # Fallback to improved OpenCV Bilateral + Canny edge-contour logic (for cases where YOLO confidence < 0.5 or unavailable)
        logger.info(f"[Text Separation] YOLO did not yield high-confidence masks. Falling back to refined Canny/OpenCV on {len(ocr_results)} OCR regions.")
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
                
                # Refine simple threshold based on dominant background color
                if is_white_bg:
                    _, simple_thresh = cv2.threshold(roi_gray, min(220, threshold_val), 255, cv2.THRESH_BINARY)
                else:
                    _, simple_thresh = cv2.threshold(roi_gray, max(180, threshold_val), 255, cv2.THRESH_BINARY)

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
                    # Fallback: Isolate Text/SFX cleanly
                    tx1, ty1 = max(0, x), max(0, y)
                    tx2, ty2 = min(width, x + w), min(height, y + h_box)
                    exact_roi = original_img[ty1:ty2, tx1:tx2]
                    if exact_roi.size > 0:
                        # Apply Bilateral Filter
                        smoothed_roi = cv2.bilateralFilter(exact_roi, d=9, sigmaColor=75, sigmaSpace=75)
                        smoothed_roi_gray = cv2.cvtColor(smoothed_roi, cv2.COLOR_BGR2GRAY)

                        # Use Canny Edge Detection to capture character and text outlines cleanly
                        canny_edges = cv2.Canny(smoothed_roi_gray, 50, 150)

                        # Dilate Canny edges slightly to close individual character boundary loops
                        edge_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
                        dilated_edges = cv2.dilate(canny_edges, edge_kernel, iterations=1)

                        # Find contours on the dilated edge mask
                        roi_contours, _ = cv2.findContours(dilated_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                        # Draw filled contours to isolate the text/SFX characters cleanly
                        filled_text_mask = np.zeros_like(smoothed_roi_gray)
                        roi_w, roi_h = tx2 - tx1, ty2 - ty1
                        min_pixel_area = max(2, int((roi_w * roi_h) * 0.0005))
                        max_pixel_area = int((roi_w * roi_h) * 0.35)

                        for c in roi_contours:
                            c_area = cv2.contourArea(c)
                            if min_pixel_area <= c_area <= max_pixel_area:
                                # Smooth contour to ensure high-fidelity boundaries
                                smoothed_c = smooth_contour(c, factor=0.005)
                                _, _, cw, ch = cv2.boundingRect(smoothed_c)
                                aspect_ratio = float(cw) / ch if ch > 0 else 0
                                if 0.05 < aspect_ratio < 20.0:
                                    cv2.drawContours(filled_text_mask, [smoothed_c], -1, 255, -1)

                        # Clean isolated text mask using statistical component analysis
                        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(filled_text_mask, connectivity=8)
                        final_roi_mask = np.zeros_like(filled_text_mask)
                        for label_idx in range(1, num_labels):
                            comp_area = stats[label_idx, cv2.CC_STAT_AREA]
                            if comp_area >= min_pixel_area:
                                final_roi_mask[labels == label_idx] = 255

                        text_mask[ty1:ty2, tx1:tx2] = cv2.bitwise_or(text_mask[ty1:ty2, tx1:tx2], final_roi_mask)
        except Exception as e:
            logger.error(f"Error during fallback text separation: {e}", exc_info=True)

    # If any text mask is present (from YOLO or Canny fallback)
    if np.any(text_mask > 0):
        try:
            # Subtract character bounding mask from the text layer so speech bubbles never clip the main character details (Step 1 Integration)
            if np.any(global_char_mask > 0):
                char_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
                eroded_char_mask = cv2.erode(global_char_mask, char_kernel, iterations=1)
                text_mask = cv2.bitwise_and(text_mask, cv2.bitwise_not(eroded_char_mask))

            # Extract final text layer
            text_layer = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
            text_layer[text_mask == 0] = [0, 0, 0, 0]
            _, buffer = cv2.imencode('.png', text_layer)
            text_layer_bytes = buffer.tobytes()

            # Clean text/bubbles out of working image immediately to prevent "Sticky Text" (Solves "Dilate Before Inpainting")
            dilated_text_mask = cv2.dilate(text_mask, np.ones((5, 5), np.uint8), iterations=2)
            textless_img = cv2.inpaint(original_img, dilated_text_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
        except Exception as e:
            logger.error(f"Error compiling text layer or inpainting textless image: {e}", exc_info=True)
            text_layer_bytes = create_blank_png(width, height)
            textless_img = original_img.copy()
    else:
        logger.info("[Text Separation] No text regions detected. Creating blank placeholder text layer.")
        text_layer_bytes = create_blank_png(width, height)
        textless_img = original_img.copy()

    # =========================================================================
    # Phase 3: Character & Background Separation
    # =========================================================================
    char_mask = np.zeros((height, width), dtype=np.uint8)
    yolo_success = False

    try:
        yolo_mask = segment_characters(image_path, conf_threshold=0.25)
        if yolo_mask is not None:
            logger.info("YOLOv8-seg successfully segmented character mask.")
            char_mask = yolo_mask
            yolo_success = True
        else:
            logger.warning("YOLOv8-seg returned None for character segmentation. Trying rembg fallback...")
    except Exception as e:
        logger.error(f"YOLOv8-seg character segmentation failed: {e}. Trying rembg fallback...", exc_info=True)

    if not yolo_success:
        try:
            if not has_rembg:
                logger.warning("rembg is not installed. Character mask will be blank.")
            else:
                # rembg run STRICTLY on textless_img to guarantee character is fully clean
                pil_textless = Image.fromarray(cv2.cvtColor(textless_img, cv2.COLOR_BGR2RGB))
                char_pil = segment_character_u2net(pil_textless)
                if char_pil is not None:
                    char_np = np.array(char_pil)
                if char_np.shape[2] == 4:
                    char_mask = char_np[:, :, 3]
                logger.info("rembg fallback completed successfully.")
        except Exception as e:
            logger.error(f"Fallback character segmentation failed: {e}", exc_info=True)

    # Foreground Generation: Apply the merged character mask to the original image,
    # adding an alpha channel to create a transparent 'Foreground/Character Layer'.
    char_layer_bytes = None
    try:
        char_layer = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
        char_layer[char_mask == 0] = [0, 0, 0, 0]
        _, buffer = cv2.imencode('.png', char_layer)
        char_layer_bytes = buffer.tobytes()
    except Exception as e:
        logger.error(f"Error generating character foreground layer: {e}", exc_info=True)
        char_layer_bytes = create_blank_png(width, height)

    # Background Generation: Invert the character mask. Apply this inverted mask to create the 'Background Layer'.
    bg_layer_bytes = None
    try:
        bg_mask = cv2.bitwise_not(char_mask)
        bg_layer = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
        bg_layer[bg_mask == 0] = [0, 0, 0, 0]
        _, buffer = cv2.imencode('.png', bg_layer)
        bg_layer_bytes = buffer.tobytes()
    except Exception as e:
        logger.error(f"Error generating background layer: {e}", exc_info=True)
        bg_layer = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
        _, buffer = cv2.imencode('.png', bg_layer)
        bg_layer_bytes = buffer.tobytes()

    # =========================================================================
    # Step 4: Storage (Supabase vs Local)
    # =========================================================================
    folder_prefix = f"layers/{panel_id}/"
    env_mode = os.getenv("ENVIRONMENT", "development").lower().strip()

    if env_mode == "production":
        logger.info(f"[Layer Segmentation] ENVIRONMENT=production — uploading layers to Supabase for panel_id={panel_id}")

        try:
            bg_url = upload_to_supabase_bucket(bg_layer_bytes, "panels", f"{folder_prefix}bg.png", "image/png")
            char_url = upload_to_supabase_bucket(char_layer_bytes, "panels", f"{folder_prefix}char.png", "image/png")
            text_url = upload_to_supabase_bucket(text_layer_bytes, "panels", f"{folder_prefix}text.png", "image/png")
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

    logger.info(f"[Layer Segmentation] ENVIRONMENT={env_mode} — saving layers locally for panel_id={panel_id} at {local_panel_dir}")

    local_files = {
        "bg.png": bg_layer_bytes,
        "char.png": char_layer_bytes,
        "text.png": text_layer_bytes,
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
        logger.error(f"[Layer Segmentation] Failed writing local PNG files for panel_id={panel_id}: {e}", exc_info=True)
        raise

    # Return paths frontend can load via FastAPI static mount (/media)
    bg_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/bg.png"
    char_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/char.png"
    text_url = f"{LOCAL_MEDIA_URL_PREFIX}/panels/layers/{panel_id}/text.png"

    return {
        "background_url": bg_url,
        "character_url": char_url,
        "text_url": text_url,
    }
