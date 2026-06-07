import os
from typing import Optional
import base64
import json
import urllib.request
import urllib.error

try:
    import cv2
    import numpy as np
    has_opencv = True
except ImportError:
    has_opencv = False

try:
    import easyocr
    has_easyocr = True
except ImportError:
    has_easyocr = False

try:
    from PIL import Image, ImageFilter
    has_pil = True
except ImportError:
    Image = None
    ImageFilter = None
    has_pil = False

try:
    from backend.services.bubble_detector import (
        detect_bubble_regions_via_gemini,
        heuristic_classify,
        classify_cropped_region
    )
except ImportError:
    from bubble_detector import (
        detect_bubble_regions_via_gemini,
        heuristic_classify,
        classify_cropped_region
    )


def clean_standard_bubble(image: np.ndarray, mask: np.ndarray, inpaint_radius: int = 3) -> np.ndarray:
    """
    Removes standard speech/thought bubbles by inpainting.
    """
    return cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_TELEA)


def clean_shout_bubble(image: np.ndarray, mask: np.ndarray, inpaint_radius: int = 3) -> np.ndarray:
    """
    Removes shout and action bubbles by inpainting.
    """
    return cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_TELEA)


def clean_narration_box(image: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """
    Blurs narration/monologue boxes to preserve background color but kill text.
    """
    h, w = image.shape[:2]
    blur_factor = max(25, int(min(w, h) * 0.12) | 1)
    blurred = cv2.GaussianBlur(image, (blur_factor, blur_factor), 0)
    return np.where(mask[:, :, np.newaxis] == 255, blurred, image)


def clean_borderless_text(image: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """
    Blurs floating/borderless text to protect underlying art features.
    """
    h, w = image.shape[:2]
    blur_factor = max(15, int(min(w, h) * 0.08) | 1)
    blurred = cv2.GaussianBlur(image, (blur_factor, blur_factor), 0)
    return np.where(mask[:, :, np.newaxis] == 255, blurred, image)


def clean_sfx(image: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """
    Keeps/ignores sound effects to retain comic book feel.
    """
    return image


def auto_decide_and_clean(
    original_image: np.ndarray,
    contour: np.ndarray,
    dilation: int = 0,
    inpaint_radius: int = 3,
    debug_img: Optional[np.ndarray] = None
) -> np.ndarray:
    """
    Extracts the crop of the contour, classifies it (heuristic first, then Gemini),
    and dispatches to the corresponding specialized cleaning function.
    """
    if original_image is None or original_image.size == 0 or contour is None or len(contour) == 0:
        return original_image
        
    h_img, w_img = original_image.shape[:2]
    
    # Get bounding box of the contour
    x, y, w, h = cv2.boundingRect(contour)
    
    # Ensure coordinates are within boundaries
    y1, y2 = max(0, y), min(h_img, y + h)
    x1, x2 = max(0, x), min(w_img, x + w)
    
    if (y2 - y1) <= 0 or (x2 - x1) <= 0:
        return original_image
        
    crop_img = original_image[y1:y2, x1:x2]
    
    # 1. HEURISTIC CLASSIFICATION FIRST (Fast, No API Cost)
    category = heuristic_classify(crop_img)
    print(f"[Cleaner] Heuristic classification for region [{x1},{y1},{x2},{y2}]: {category}")
    
    # 2. ESCALATE TO GEMINI (Only if heuristic is unsure)
    if category == "uncertain":
        print(f"[Cleaner] Escalating region [{x1},{y1},{x2},{y2}] to Gemini Vision API...")
        category = classify_cropped_region(crop_img)
        print(f"[Cleaner] Gemini Vision classification: {category}")
        
    # Construct binary mask for this specific contour
    mask = np.zeros((h_img, w_img), dtype=np.uint8)
    cv2.drawContours(mask, [contour], -1, 255, -1)
    
    # Apply dilation if specified
    if dilation > 0:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilation, dilation))
        mask = cv2.dilate(mask, kernel, iterations=1)
        
    # Update debug image if provided
    if debug_img is not None:
        color = (0, 255, 0)  # Green for white_bubble
        label = "White Bubble"
        if category == "colored_box":
            color = (255, 165, 0)  # Orange for colored_box
            label = "Colored Box"
        elif category == "sfx":
            color = (0, 0, 255)  # Red for SFX
            label = "SFX"
        cv2.rectangle(debug_img, (x, y), (x + w, y + h), color, 2)
        cv2.putText(debug_img, label, (x, max(15, y - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)

    # 3. DISPATCH TO SPECIALIZED CLEANING FUNCTION
    if category == "white_bubble":
        return clean_standard_bubble(original_image, mask, inpaint_radius)
    elif category == "colored_box":
        return clean_narration_box(original_image, mask)
    elif category == "sfx":
        return clean_sfx(original_image, mask)
    else:
        return clean_standard_bubble(original_image, mask, inpaint_radius)


def clean_speech_bubbles(
    image_path: str,
    output_path: str,
    method: str = "auto",
    sensitivity: float = 50.0,
    dilation: int = -1,
    inpaint_radius: int = 3,
    detection_style: str = "all",
    debug_path: Optional[str] = None,
    ocr_lang: str = "en",
    gpu: bool = False,
    fill_color: str = "",
    morph_kernel_size: int = 15,
    morph_shape: str = "ellipse",
    custom_color_target: str = "",
    custom_color_tolerance: float = 25.0,
    custom_mask_path: Optional[str] = None
) -> None:
    """
    Detects and removes speech bubbles from comic drawings and webtoon panels 
    to make room for translation overlay, TTS alignment, or dynamic subtitles.

    Parameters:
        image_path (str): Filepath to the input image.
        output_path (str): Filepath where the final processed image will be written.
        method (str): Eraser algorithm. Options: 'auto', 'inpaint', 'inpaint_ns', 'blur', 'solid_white', 'solid_black', 'transparent', 'ocr'.
        sensitivity (float): Threshold adjustment value from 0 to 100.
        dilation (int): Custom padding margin pixel count. If -1, dynamically calculated.
        inpaint_radius (int): Pixel radius neighborhood for image inpainting.
        detection_style (str): Filter behavior: 'all', 'white_only', or 'text_only'.
        debug_path (str): Filepath to write classification debug visualization.
        ocr_lang (str): EasyOCR language code.
        gpu (bool): Enable GPU for EasyOCR.
        fill_color (str): Hex fill color for solid_color strategy.
        morph_kernel_size (int): Morphological kernel size.
        morph_shape (str): Morphological kernel shape.
        custom_color_target (str): Custom bubble background target hex color.
        custom_color_tolerance (float): Tolerance for custom color matching.
        custom_mask_path (str): Optional path to a binary mask image.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image not found: {image_path}")

    # Ensure parent output directory exists (if output_path contains a directory structure)
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    # 1. Primary Path: OpenCV + Numpy Implementation
    if has_opencv:
        print("OPENCV_SUPPORT=TRUE")
        # Load image with potential alpha channel
        img_temp = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
        if img_temp is None:
            raise ValueError(f"Could not load or read the image at: {image_path}")

        # Blend alpha channel composite onto solid white background if transparent
        if len(img_temp.shape) == 3 and img_temp.shape[2] == 4:
            alpha = img_temp[:, :, 3] / 255.0
            background = np.ones_like(img_temp[:, :, :3]) * 255
            for c in range(3):
                background[:, :, c] = (alpha * img_temp[:, :, c] + (1.0 - alpha) * 255.0).astype(np.uint8)
            original_image = background
        else:
            original_image = img_temp[:, :, :3]

        gray = cv2.cvtColor(original_image, cv2.COLOR_BGR2GRAY)
        height, width = gray.shape

        method_lower = method.lower()
        is_auto = (method_lower == "auto")
        auto_processed = False

        # Initialize debug image if path is provided
        debug_img = original_image.copy() if debug_path else None

        # Initialize Morph Shape constant
        shape_const = cv2.MORPH_ELLIPSE
        if morph_shape == "rect":
            shape_const = cv2.MORPH_RECT
        elif morph_shape == "cross":
            shape_const = cv2.MORPH_CROSS

        # 2. Detect the Bubbles & Text Regions
        # Create a combined mask for all dialogue regions (used for non-auto modes)
        mask = np.zeros_like(gray)
        bubble_detected = False

        # We compute dilation_factor early
        dilation_factor = dilation if dilation >= 0 else max(6, int(min(width, height) * 0.012))

        # Check if custom mask file is provided to bypass autodetection
        if custom_mask_path and os.path.exists(custom_mask_path):
            print(f"[Cleaner] Loading manual drawing mask from: {custom_mask_path}")
            custom_mask_loaded = cv2.imread(custom_mask_path, cv2.IMREAD_GRAYSCALE)
            if custom_mask_loaded is not None:
                if custom_mask_loaded.shape[:2] != (height, width):
                    mask = cv2.resize(custom_mask_loaded, (width, height), interpolation=cv2.INTER_NEAREST)
                else:
                    mask = custom_mask_loaded
                _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
                bubble_detected = True

        # Try AI-assisted Gemini bubble locator first (unless restricted to white only)
        if not bubble_detected and detection_style != "white_only":
            gemini_regions = detect_bubble_regions_via_gemini(image_path)
            if gemini_regions:
                print(f"[Gemini Cleaner] AI detected {len(gemini_regions)} bubble/text regions.")
                for reg in gemini_regions:
                    box = reg.get("box")
                    if box and len(box) == 4:
                        ymin, xmin, ymax, xmax = box
                        # Map from 0-1000 scale to actual pixel dimensions
                        y1 = int((ymin / 1000.0) * height)
                        x1 = int((xmin / 1000.0) * width)
                        y2 = int((ymax / 1000.0) * height)
                        x2 = int((xmax / 1000.0) * width)
                        
                        # Ensure coordinates are within image boundaries
                        y1 = max(0, min(height - 1, y1))
                        x1 = max(0, min(width - 1, x1))
                        y2 = max(0, min(height - 1, y2))
                        x2 = max(0, min(width - 1, x2))
                        
                        # Pad text bounding box to ensure outline/context is beautifully inpainted
                        pad_y = int(max(15, (y2 - y1) * 0.15))
                        pad_x = int(max(15, (x2 - x1) * 0.15))
                        
                        y1_pad = max(0, y1 - pad_y)
                        x1_pad = max(0, x1 - pad_x)
                        y2_pad = min(height, y2 + pad_y)
                        x2_pad = min(width, x2 + pad_x)
                        
                        if is_auto:
                            contour = np.array([[[x1_pad, y1_pad]], [[x2_pad, y1_pad]], [[x2_pad, y2_pad]], [[x1_pad, y2_pad]]], dtype=np.int32)
                            original_image = auto_decide_and_clean(original_image, contour, dilation=0, inpaint_radius=inpaint_radius, debug_img=debug_img)
                            auto_processed = True
                        else:
                            cv2.rectangle(mask, (x1_pad, y1_pad), (x2_pad, y2_pad), 255, -1)
                            bubble_detected = True

        # If Gemini didn't detect anything (or wasn't queried), run the traditional OpenCV fallback locator
        if not bubble_detected and (not is_auto or not auto_processed):
            # Shift thresholds based on sensitivity (0 to 100)
            bright_thresh_val = max(160, min(245, 235 - int((sensitivity - 50) * 0.6)))
            dark_thresh_val = max(60, min(160, 110 + int((sensitivity - 50) * 0.8)))
            min_bubble_area = max(300, min(2000, 1000 - int((sensitivity - 50) * 15)))

            # Threshold to identify target speech bubbles (custom color vs standard white/bright thresholding)
            if custom_color_target and len(custom_color_target.lstrip('#')) == 6:
                hex_c = custom_color_target.lstrip('#')
                target_bgr = np.array([int(hex_c[4:6], 16), int(hex_c[2:4], 16), int(hex_c[0:2], 16)], dtype=np.uint8)
                color_dist = np.linalg.norm(original_image.astype(np.float32) - target_bgr.astype(np.float32), axis=2)
                bright_mask = (color_dist <= custom_color_tolerance).astype(np.uint8) * 255
            else:
                _, bright_mask = cv2.threshold(gray, bright_thresh_val, 255, cv2.THRESH_BINARY)
            
            # Dark text mask to verify if these bright bubbles actually contain text strokes
            _, dark_text_mask = cv2.threshold(gray, dark_thresh_val, 255, cv2.THRESH_BINARY_INV)

            # Gather initial letter candidate components (small dark strokes in the entire image)
            letter_candidates = []
            if detection_style != "white_only":
                dark_contours, _ = cv2.findContours(dark_text_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for dc in dark_contours:
                    dx, dy, dw, dh = cv2.boundingRect(dc)
                    da = cv2.contourArea(dc)
                    if (3 <= dw <= 40) and (4 <= dh <= 45) and (4 <= da <= 450):
                        aspect = dw / dh if dh > 0 else 1.0
                        if 0.15 <= aspect <= 3.0:
                            letter_candidates.append((dx, dy, dw, dh, dc))

            # --- A. Traditional Bright/Light Speech Bubble Search ---
            if detection_style != "text_only":
                contours, _ = cv2.findContours(bright_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for contour in contours:
                    x, y, w, h = cv2.boundingRect(contour)
                    area = cv2.contourArea(contour)

                    if area < min_bubble_area:
                        continue
                    if area > (width * height) * 0.65:
                        continue
                    aspect_ratio = w / h if h > 0 else 1
                    if aspect_ratio < 0.22 or aspect_ratio > 4.5:
                        continue

                    contained_letters_count = 0
                    for lx, ly, lw, lh, _ in letter_candidates:
                        cx = lx + lw // 2
                        cy = ly + lh // 2
                        if x <= cx <= x + w and y <= cy <= y + h:
                            contained_letters_count += 1

                    required_letters = max(3, 5 - int(sensitivity / 25)) if len(letter_candidates) > 0 else 0
                    
                    if detection_style == "white_only" or len(letter_candidates) == 0:
                        if is_auto:
                            original_image = auto_decide_and_clean(original_image, contour, dilation=dilation_factor, inpaint_radius=inpaint_radius, debug_img=debug_img)
                            auto_processed = True
                        else:
                            cv2.drawContours(mask, [contour], -1, 255, -1)
                            bubble_detected = True
                    elif contained_letters_count >= required_letters:
                        if is_auto:
                            original_image = auto_decide_and_clean(original_image, contour, dilation=dilation_factor, inpaint_radius=inpaint_radius, debug_img=debug_img)
                            auto_processed = True
                        else:
                            cv2.drawContours(mask, [contour], -1, 255, -1)
                            bubble_detected = True

            # --- B. Universal Text-Stroke Layout Grouping ---
            if detection_style != "white_only" and len(letter_candidates) >= 3:
                text_seeds = np.zeros_like(gray)
                for lx, ly, lw, lh, l_contour in letter_candidates:
                    cv2.drawContours(text_seeds, [l_contour], -1, 255, -1)

                text_dilate_kernel = cv2.getStructuringElement(shape_const, (morph_kernel_size, morph_kernel_size))
                text_blocks = cv2.dilate(text_seeds, text_dilate_kernel, iterations=1)
                text_contours, _ = cv2.findContours(text_blocks, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                for tc in text_contours:
                    tx, ty, tw, th = cv2.boundingRect(tc)
                    ta = cv2.contourArea(tc)

                    if tw < width * 0.75 and th < height * 0.75 and tw > 10 and th > 10:
                        block_letter_count = 0
                        for lx, ly, lw, lh, _ in letter_candidates:
                            cx = lx + lw // 2
                            cy = ly + lh // 2
                            if tx <= cx <= tx + tw and ty <= cy <= ty + th:
                                block_letter_count += 1

                        required_block_letters = max(4, 6 - int(sensitivity / 20))
                        if block_letter_count >= required_block_letters:
                            pad_x = int(max(6, tw * 0.10))
                            pad_y = int(max(6, th * 0.10))
                            x1 = max(0, tx - pad_x)
                            y1 = max(0, ty - pad_y)
                            x2 = min(width, tx + tw + pad_x)
                            y2 = min(height, ty + th + pad_y)
                            
                            if is_auto:
                                contour = np.array([[[x1, y1]], [[x2, y1]], [[x2, y2]], [[x1, y2]]], dtype=np.int32)
                                original_image = auto_decide_and_clean(original_image, contour, dilation=0, inpaint_radius=inpaint_radius, debug_img=debug_img)
                                auto_processed = True
                            else:
                                cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
                                bubble_detected = True

        # Dilate bubble boundaries for non-auto mode to guarantee speech bubble borders/outlines are 100% covered.
        if not is_auto and bubble_detected:
            if dilation_factor > 0:
                kernel = cv2.getStructuringElement(shape_const, (dilation_factor, dilation_factor))
                mask = cv2.dilate(mask, kernel, iterations=1)

        # 4. Apply the Cleaning Method
        if is_auto:
            final_image = original_image
            print("BUBBLES_DETECTED=TRUE" if auto_processed else "BUBBLES_DETECTED=FALSE")
        elif np.count_nonzero(mask) == 0:
            print("BUBBLES_DETECTED=FALSE")
            final_image = img_temp.copy()
        else:
            print("BUBBLES_DETECTED=TRUE")
            if method_lower == "blur":
                blur_factor = max(25, int(min(width, height) * 0.12) | 1)
                heavy_blurred = cv2.GaussianBlur(original_image, (blur_factor, blur_factor), 0)
                final_image = np.where(mask[:, :, np.newaxis] == 255, heavy_blurred, original_image)
            elif method_lower in ["inpaint_ns", "ns"]:
                final_image = cv2.inpaint(original_image, mask, inpaint_radius, cv2.INPAINT_NS)
            elif method_lower == "solid_white":
                final_image = original_image.copy()
                final_image[mask == 255] = [255, 255, 255]
            elif method_lower == "solid_black":
                final_image = original_image.copy()
                final_image[mask == 255] = [0, 0, 0]
            elif method_lower == "solid_color":
                final_image = original_image.copy()
                color = [255, 255, 255]
                if fill_color:
                    hex_color = fill_color.lstrip('#')
                    if len(hex_color) == 6:
                        # OpenCV BGR
                        color = [int(hex_color[4:6], 16), int(hex_color[2:4], 16), int(hex_color[0:2], 16)]
                final_image[mask == 255] = color
            elif method_lower == "transparent":
                if img_temp.shape[2] == 3:
                    h, w = img_temp.shape[:2]
                    alpha_chan = np.ones((h, w), dtype=np.uint8) * 255
                    rgba_img = cv2.merge((img_temp[:, :, 0], img_temp[:, :, 1], img_temp[:, :, 2], alpha_chan))
                else:
                    rgba_img = img_temp.copy()
                rgba_img[mask == 255, 3] = 0
                final_image = rgba_img
            elif method_lower == "ocr" and has_easyocr:
                reader = easyocr.Reader([ocr_lang], gpu=gpu)
                results = reader.readtext(image_path)
                ocr_mask = np.zeros(original_image.shape[:2], dtype=np.uint8)
                for (bbox, text, prob) in results:
                    (tl, tr, br, bl) = bbox
                    tl, tr, br, bl = map(lambda x: [int(x[0]), int(x[1])], [tl, tr, br, bl])
                    pad = 8
                    x1 = max(0, min(tl[0], bl[0]) - pad)
                    y1 = max(0, min(tl[1], tr[1]) - pad)
                    x2 = min(width, max(tr[0], br[0]) + pad)
                    y2 = min(height, max(bl[1], br[1]) + pad)
                    cv2.rectangle(ocr_mask, (x1, y1), (x2, y2), 255, -1)
                final_image = cv2.inpaint(original_image, ocr_mask, inpaint_radius, cv2.INPAINT_TELEA)
            else:
                final_image = cv2.inpaint(original_image, mask, inpaint_radius, cv2.INPAINT_TELEA)

        # Save to file
        cv2.imwrite(output_path, final_image)
        if debug_path and debug_img is not None:
            cv2.imwrite(debug_path, debug_img)
        return

    # 2. Fallback Path: Pure Pillow + Numpy Implementation
    elif has_pil and Image is not None and ImageFilter is not None:
        print("OPENCV_SUPPORT=FALSE")
        print("BUBBLES_DETECTED=FALSE")
        img = Image.open(image_path).convert("RGBA" if method.lower() == "transparent" else "RGB")
        width, height = img.size
        
        if method.lower() == "blur":
            blur_intensity = max(15, int(min(width, height) * 0.08))
            blurred_img = img.filter(ImageFilter.GaussianBlur(radius=blur_intensity))
            blurred_img.save(output_path)
        else:
            img.save(output_path)
        return

    else:
        print("OPENCV_SUPPORT=FALSE")
        print("BUBBLES_DETECTED=FALSE")
        import shutil
        shutil.copy(image_path, output_path)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Anivox Speech Bubble Cleaner CLI service")
    parser.add_argument("--image_path", required=True, help="Path to input comic panel")
    parser.add_argument("--output_path", required=True, help="Path to write the processed output")
    parser.add_argument("--method", default="auto", help="Erase algorithm (auto, inpaint, blur, solid_white, etc.)")
    parser.add_argument("--sensitivity", type=float, default=50.0, help="Sensitivity parameter (0-100)")
    parser.add_argument("--dilation", type=int, default=-1, help="Custom dilation padding (px)")
    parser.add_argument("--inpaint_radius", type=int, default=3, help="Neighbor inpaint pixel radius")
    parser.add_argument("--detection_style", default="all", choices=["all", "white_only", "text_only"], help="Detection style")
    parser.add_argument("--debug_path", default=None, help="Path to write visual classification debug mask")
    parser.add_argument("--ocr_lang", default="en", help="EasyOCR language code")
    parser.add_argument("--gpu", action="store_true", help="Enable GPU EasyOCR")
    parser.add_argument("--fill_color", default="", help="Hex fill color for solid_color strategy")
    parser.add_argument("--morph_kernel_size", type=int, default=15, help="Morphological kernel size")
    parser.add_argument("--morph_shape", default="ellipse", choices=["rect", "ellipse", "cross"], help="Morphological kernel shape")
    parser.add_argument("--custom_color_target", default="", help="Custom bubble background target hex color")
    parser.add_argument("--custom_color_tolerance", type=float, default=25.0, help="Tolerance for custom color matching")
    parser.add_argument("--custom_mask_path", default=None, help="Path to custom manual mask image")

    args = parser.parse_args()
    try:
        clean_speech_bubbles(
            args.image_path,
            args.output_path,
            method=args.method,
            sensitivity=args.sensitivity,
            dilation=args.dilation,
            inpaint_radius=args.inpaint_radius,
            detection_style=args.detection_style,
            debug_path=args.debug_path,
            ocr_lang=args.ocr_lang,
            gpu=args.gpu,
            fill_color=args.fill_color,
            morph_kernel_size=args.morph_kernel_size,
            morph_shape=args.morph_shape,
            custom_color_target=args.custom_color_target,
            custom_color_tolerance=args.custom_color_tolerance,
            custom_mask_path=args.custom_mask_path
        )
        print("SUCCESS")
    except Exception as e:
        import sys
        print(f"ERROR: {str(e)}", file=sys.stderr)

