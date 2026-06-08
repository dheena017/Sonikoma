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
    Removes standard speech/thought bubbles by reconstructing the background.
    Fits a 2D linear gradient or solid color to boundary pixels for a smooth result,
    falling back to cv2.inpaint if the boundary is textured.
    """
    if not has_opencv or image is None or image.size == 0 or mask is None or mask.size == 0:
        return image
        
    h, w = image.shape[:2]
    
    # 1. Create a detached outer boundary ring to sample background art,
    # bypassing any speech bubble black borders/outlines
    inner_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    outer_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    dilated_inner = cv2.dilate(mask, inner_kernel, iterations=1)
    dilated_outer = cv2.dilate(mask, outer_kernel, iterations=1)
    outer_ring = cv2.subtract(dilated_outer, dilated_inner)
    
    # Check if we have enough boundary pixels
    ring_pixels = np.where(outer_ring == 255)
    if len(ring_pixels[0]) < 10:
        return cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_TELEA)
        
    # Get coordinates and color values of the boundary ring
    coords_y, coords_x = ring_pixels[0], ring_pixels[1]
    colors = image[coords_y, coords_x].astype(np.float32)
    
    # Downsample if we have too many boundary pixels to keep least-squares super fast
    if len(coords_y) > 1000:
        indices = np.random.choice(len(coords_y), 1000, replace=False)
        coords_y = coords_y[indices]
        coords_x = coords_x[indices]
        colors = colors[indices]
        
    # Fit a 2D linear regression model for each channel: Value = a*y + b*x + c
    # Formulate A matrix: [Y, X, 1]
    A = np.column_stack([coords_y, coords_x, np.ones_like(coords_y)])
    
    try:
        # Solve least squares: A * W = colors
        W, residuals, rank, s = np.linalg.lstsq(A, colors, rcond=None)
        
        # Calculate mean squared error of the fit
        fitted = A @ W
        mse = np.mean((colors - fitted) ** 2)
        
        # If the fit is good (MSE is low), we reconstruct the background using the fit
        if mse < 65.0:  # Threshold for clean gradient or solid color
            # Get all coordinates inside the mask
            mask_y, mask_x = np.where(mask == 255)
            if len(mask_y) > 0:
                A_mask = np.column_stack([mask_y, mask_x, np.ones_like(mask_y)])
                predicted = A_mask @ W
                predicted = np.clip(predicted, 0, 255).astype(np.uint8)
                
                cleaned_image = image.copy()
                cleaned_image[mask_y, mask_x] = predicted
                
                # Perform a thin boundary blend to remove any hard transition seam
                # Create a 3px boundary blend mask
                blend_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
                blend_mask = cv2.subtract(cv2.dilate(mask, blend_kernel), cv2.erode(mask, blend_kernel))
                return cv2.inpaint(cleaned_image, blend_mask, 2, cv2.INPAINT_TELEA)
    except Exception as e:
        print(f"[Cleaner standard_bubble warning] Gradient fit failed: {e}")
        
    # Fallback to standard inpainting
    return cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_TELEA)


def clean_shout_bubble(image: np.ndarray, mask: np.ndarray, inpaint_radius: int = 3) -> np.ndarray:
    """
    Removes shout and action bubbles by inpainting and preserving edge contrast
    with bilateral filtering.
    """
    if not has_opencv or image is None or image.size == 0 or mask is None or mask.size == 0:
        return image
        
    # 1. Inpaint using Navier-Stokes (better boundary structure preservation)
    inpainted = cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_NS)
    
    # 2. Apply bilateral filter to the inpainted region to smooth out inpainting smudges
    # while preserving strong edge details of the illustration
    smoothed = cv2.bilateralFilter(inpainted, d=9, sigmaColor=75, sigmaSpace=75)
    
    # 3. Blend only the mask region
    return np.where(mask[:, :, np.newaxis] == 255, smoothed, inpainted)


def clean_narration_box(image: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """
    Removes text inside narration boxes by segmenting high-contrast text strokes
    and inpainting only the strokes, leaving borders and box background intact.
    """
    if not has_opencv or image is None or image.size == 0 or mask is None or mask.size == 0:
        return image
        
    h_img, w_img = image.shape[:2]
    
    # 1. Get bounding box to crop the ROI
    x, y, w, h = cv2.boundingRect(mask)
    y1, y2 = max(0, y), min(h_img, y + h)
    x1, x2 = max(0, x), min(w_img, x + w)
    
    if (y2 - y1) <= 0 or (x2 - x1) <= 0:
        return image
        
    roi_img = image[y1:y2, x1:x2]
    roi_mask = mask[y1:y2, x1:x2]
    
    # Erode the mask dynamically to exclude the outer borders of the narration box
    # This prevents the boundary/borders from being classified as text strokes
    erode_size = max(9, int(min(w, h) * 0.06) | 1)
    border_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (erode_size, erode_size))
    interior_mask = cv2.erode(roi_mask, border_kernel, borderType=cv2.BORDER_CONSTANT, borderValue=0)
    
    if np.count_nonzero(interior_mask) == 0:
        # If the box is too thin to erode, use the original mask
        interior_mask = roi_mask
        
    # 2. Get median color of the box interior
    box_pixels = roi_img[interior_mask == 255]
    if len(box_pixels) == 0:
        return image
        
    median_color = np.median(box_pixels, axis=0)
    
    # 3. Compute L2 color distance from median color
    diff = np.linalg.norm(roi_img.astype(np.float32) - median_color, axis=2)
    
    # Convert to uint8 for thresholding
    diff_uint8 = np.clip(diff, 0, 255).astype(np.uint8)
    
    # Verify if there is actually high contrast text inside the interior
    max_diff = np.max(diff_uint8[interior_mask == 255])
    if max_diff < 20:
        # No high contrast text strokes found, keep narration box as is
        return image
        
    # 4. Use Otsu's thresholding to find text stroke candidates
    # We apply Otsu's on the entire ROI and mask it with the interior_mask
    _, stroke_mask = cv2.threshold(diff_uint8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    stroke_mask = cv2.bitwise_and(stroke_mask, interior_mask)
    
    # 5. Dilate stroke mask slightly to fully cover stroke antialiasing edges
    dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    stroke_mask_dilated = cv2.dilate(stroke_mask, dilate_kernel, iterations=1)
    
    # 6. Apply inpainting ONLY to the text strokes globally
    global_stroke_mask = np.zeros((h_img, w_img), dtype=np.uint8)
    global_stroke_mask[y1:y2, x1:x2] = stroke_mask_dilated
    
    # Return inpainted image (inpainting strokes inside the box blends them with box background)
    return cv2.inpaint(image, global_stroke_mask, 3, cv2.INPAINT_TELEA)


def clean_borderless_text(image: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """
    Removes floating/borderless text by extracting high-frequency text strokes
    using morphological Top-Hat/Bottom-Hat transforms, and inpainting only those strokes.
    """
    if not has_opencv or image is None or image.size == 0 or mask is None or mask.size == 0:
        return image
        
    h_img, w_img = image.shape[:2]
    
    x, y, w, h = cv2.boundingRect(mask)
    y1, y2 = max(0, y), min(h_img, y + h)
    x1, x2 = max(0, x), min(w_img, x + w)
    
    if (y2 - y1) <= 0 or (x2 - x1) <= 0:
        return image
        
    roi_img = image[y1:y2, x1:x2]
    roi_mask = mask[y1:y2, x1:x2]
    
    # Convert ROI to grayscale
    roi_gray = cv2.cvtColor(roi_img, cv2.COLOR_BGR2GRAY)
    
    # Use Top-Hat and Bottom-Hat transforms to highlight local light and dark features (strokes)
    morph_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    top_hat = cv2.morphologyEx(roi_gray, cv2.MORPH_TOPHAT, morph_kernel)
    bottom_hat = cv2.morphologyEx(roi_gray, cv2.MORPH_BLACKHAT, morph_kernel)
    
    # Combine the features to handle both white/light text and black/dark text
    text_features = cv2.max(top_hat, bottom_hat)
    
    # Only run thresholding if we have pixels in the mask
    mask_pixels = text_features[roi_mask == 255]
    if len(mask_pixels) == 0:
        return image
        
    max_val = np.max(mask_pixels)
    if max_val < 30:
        # No significant text features detected
        return image
        
    # Threshold based on max contrast to dynamically segment strokes
    thresh_val = max(15, int(max_val * 0.35))
    _, stroke_mask = cv2.threshold(text_features, thresh_val, 255, cv2.THRESH_BINARY)
    stroke_mask = cv2.bitwise_and(stroke_mask, roi_mask)
    
    # Dilate stroke mask to cover anti-aliased borders and text outlines
    dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    stroke_mask_dilated = cv2.dilate(stroke_mask, dilate_kernel, iterations=1)
    
    # Create global stroke mask
    global_stroke_mask = np.zeros((h_img, w_img), dtype=np.uint8)
    global_stroke_mask[y1:y2, x1:x2] = stroke_mask_dilated
    
    # Inpaint only the text strokes over the original image
    return cv2.inpaint(image, global_stroke_mask, 3, cv2.INPAINT_TELEA)


def clean_sfx(image: np.ndarray, mask: np.ndarray, clean_enabled: bool = False) -> np.ndarray:
    """
    Keeps sound effects by default to retain comic book feel. If clean_enabled is True,
    it removes the sound effect by performing a content-aware style inpaint.
    """
    if not clean_enabled:
        return image
        
    if not has_opencv or image is None or image.size == 0 or mask is None or mask.size == 0:
        return image
        
    # SFX characters are typically very large and thick.
    # We extract their stroke outlines using a larger morphological kernel and inpaint them.
    h_img, w_img = image.shape[:2]
    x, y, w, h = cv2.boundingRect(mask)
    y1, y2 = max(0, y), min(h_img, y + h)
    x1, x2 = max(0, x), min(w_img, x + w)
    
    if (y2 - y1) <= 0 or (x2 - x1) <= 0:
        return image
        
    roi_img = image[y1:y2, x1:x2]
    roi_mask = mask[y1:y2, x1:x2]
    roi_gray = cv2.cvtColor(roi_img, cv2.COLOR_BGR2GRAY)
    
    # Large kernel for thick SFX characters (15x15)
    morph_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    top_hat = cv2.morphologyEx(roi_gray, cv2.MORPH_TOPHAT, morph_kernel)
    bottom_hat = cv2.morphologyEx(roi_gray, cv2.MORPH_BLACKHAT, morph_kernel)
    text_features = cv2.max(top_hat, bottom_hat)
    
    mask_pixels = text_features[roi_mask == 255]
    if len(mask_pixels) == 0:
        return image
        
    max_val = np.max(mask_pixels)
    if max_val < 20:
        return image
        
    thresh_val = max(10, int(max_val * 0.25))
    _, stroke_mask = cv2.threshold(text_features, thresh_val, 255, cv2.THRESH_BINARY)
    stroke_mask = cv2.bitwise_and(stroke_mask, roi_mask)
    
    # Dilation to fully cover the thick SFX letters and outlines
    dilate_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    stroke_mask_dilated = cv2.dilate(stroke_mask, dilate_kernel, iterations=1)
    
    global_stroke_mask = np.zeros((h_img, w_img), dtype=np.uint8)
    global_stroke_mask[y1:y2, x1:x2] = stroke_mask_dilated
    
    # Inpaint SFX text strokes
    return cv2.inpaint(image, global_stroke_mask, 5, cv2.INPAINT_TELEA)


def auto_decide_and_clean(
    original_image: np.ndarray,
    contour: np.ndarray,
    dilation: int = 0,
    inpaint_radius: int = 3,
    debug_img: Optional[np.ndarray] = None,
    clean_sfx_allowed: bool = False
) -> np.ndarray:
    """
    Extracts the crop of the contour, classifies it (heuristic first, then Gemini),
    and dispatches to the corresponding specialized cleaning function.
    Uses geometric properties (solidity and rectangularity) of the contour
    to refine routing between standard/shout bubbles and narration/borderless text.
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
        
    # Compute geometric metrics of the contour
    area = cv2.contourArea(contour)
    bbox_area = w * h
    rectangularity = area / bbox_area if bbox_area > 0 else 0
    
    hull = cv2.convexHull(contour)
    hull_area = cv2.contourArea(hull)
    solidity = area / hull_area if hull_area > 0 else 0
    
    print(f"[Cleaner] Geometry: Area={area:.1f}, Solidity={solidity:.3f}, Rectangularity={rectangularity:.3f}")

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

    # 3. DISPATCH TO SPECIALIZED CLEANING FUNCTION WITH GEOMETRIC REFINEMENT
    if category == "white_bubble":
        # Standard speech/thought bubble vs spiky shout bubble
        if solidity > 0.82:
            print(f"[Cleaner] Dispatching to clean_standard_bubble (solidity={solidity:.3f} > 0.82)")
            return clean_standard_bubble(original_image, mask, inpaint_radius)
        else:
            print(f"[Cleaner] Dispatching to clean_shout_bubble (solidity={solidity:.3f} <= 0.82)")
            return clean_shout_bubble(original_image, mask, inpaint_radius)
            
    elif category == "colored_box":
        # Narration/monologue box vs borderless/floating text
        if rectangularity > 0.78:
            print(f"[Cleaner] Dispatching to clean_narration_box (rectangularity={rectangularity:.3f} > 0.78)")
            return clean_narration_box(original_image, mask)
        else:
            print(f"[Cleaner] Dispatching to clean_borderless_text (rectangularity={rectangularity:.3f} <= 0.78)")
            return clean_borderless_text(original_image, mask)
            
    elif category == "sfx":
        print(f"[Cleaner] Dispatching to clean_sfx (sfx_clean_allowed={clean_sfx_allowed})")
        return clean_sfx(original_image, mask, clean_enabled=clean_sfx_allowed)
        
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
    custom_mask_path: Optional[str] = None,
    clean_sfx: bool = False
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
        clean_sfx (bool): Enable cleaning of sound effect regions (instead of keeping them).
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
                            original_image = auto_decide_and_clean(original_image, contour, dilation=0, inpaint_radius=inpaint_radius, debug_img=debug_img, clean_sfx_allowed=clean_sfx)
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
                            original_image = auto_decide_and_clean(original_image, contour, dilation=dilation_factor, inpaint_radius=inpaint_radius, debug_img=debug_img, clean_sfx_allowed=clean_sfx)
                            auto_processed = True
                        else:
                            cv2.drawContours(mask, [contour], -1, 255, -1)
                            bubble_detected = True
                    elif contained_letters_count >= required_letters:
                        if is_auto:
                            original_image = auto_decide_and_clean(original_image, contour, dilation=dilation_factor, inpaint_radius=inpaint_radius, debug_img=debug_img, clean_sfx_allowed=clean_sfx)
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
                                original_image = auto_decide_and_clean(original_image, contour, dilation=0, inpaint_radius=inpaint_radius, debug_img=debug_img, clean_sfx_allowed=clean_sfx)
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
    parser.add_argument("--clean_sfx", action="store_true", help="Enable cleaning of SFX regions")

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
            custom_mask_path=args.custom_mask_path,
            clean_sfx=args.clean_sfx
        )
        print("SUCCESS")
    except Exception as e:
        import sys
        print(f"ERROR: {str(e)}", file=sys.stderr)

