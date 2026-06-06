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


def detect_bubble_regions_via_gemini(image_path: str) -> list:
    """
    Calls the Gemini REST API directly to detect speech bounding boxes
    and text overlays. Extremely robust, style-agnostic, and AI-powered.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[Gemini Cleaner] No GEMINI_API_KEY environment variable found.")
        return []

    try:
        with open(image_path, "rb") as f:
            encoded_string = base64.b64encode(f.read()).decode('utf-8')
        
        prompt = (
            "Identify all speech bubbles, dialogue boxes, text overlays, and floating text in this comic/webtoon panel image. "
            "Return the 2D bounding boxes for each of these text regions. "
            "For each bounding box, provide the normalized coordinates [ymin, xmin, ymax, xmax] as integers between 0 and 1000. "
            "Format the output strictly as a JSON object with a key 'regions' containing a list of objects, "
            "each object having 'box' (representing [ymin, xmin, ymax, xmax]) and 'text' (representing the text content inside, if readable). "
            "Only return the JSON and nothing else."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": "image/png",
                                "data": encoded_string
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        # We prefer gemini-2.5-flash as the fast, multimodal developer default
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "aistudio-build"
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            
        candidates = res_data.get("candidates", [])
        if not candidates:
            return []
            
        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        data = json.loads(text)
        return data.get("regions", [])
    except Exception as e:
        print(f"[Gemini Cleaner Warning] AI-assisted speech bubble detection failed: {e}")
        return []


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


def heuristic_classify(crop_img: np.ndarray) -> str:
    """
    Classifies a crop image based on color characteristics.
    Returns: 'white_bubble', 'colored_box', or 'uncertain'.
    """
    if crop_img is None or crop_img.size == 0:
        return "white_bubble"
    
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(crop_img, cv2.COLOR_BGR2GRAY)
        total_pixels = gray.size
        if total_pixels == 0:
            return "white_bubble"
        
        # Calculate percentage of very bright pixels (white background)
        bright_pixels = np.sum(gray > 240)
        bright_ratio = bright_pixels / total_pixels
        
        # Calculate mean brightness
        mean_val = np.mean(gray)
        
        # If the background is predominantly white, classify as white_bubble
        if bright_ratio > 0.65:
            return "white_bubble"
        
        # If the crop has almost no white background and is generally darker, classify as colored_box
        if bright_ratio < 0.05 and mean_val < 130:
            return "colored_box"
            
        # Otherwise, background is intermediate or standard deviation is high -> uncertain
        return "uncertain"
    except Exception as e:
        print(f"[Cleaner Heuristic Warning] Error in heuristic_classify: {e}")
        return "uncertain"


def classify_cropped_region(crop_img: np.ndarray) -> str:
    """
    Calls the Gemini Vision API to classify a cropped text region.
    Returns: 'white_bubble', 'colored_box', or 'sfx'.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[Gemini Cleaner] No GEMINI_API_KEY found. Defaulting to 'white_bubble'.")
        return "white_bubble"

    try:
        # Encode cropped image to base64
        _, buffer = cv2.imencode('.png', crop_img)
        encoded_string = base64.b64encode(buffer).decode('utf-8')
        
        prompt = (
            "Analyze this cropped comic/webtoon panel text region image. "
            "Classify it into one of these categories:\n"
            "1. 'white_bubble': Any speech, thought, shout, or action bubble with a solid white or near-white background. "
            "This includes standard ovals, fluffy clouds, rounded rectangles, starburst/spiky outlines, or angular concave shapes (such as tense or magic-shaking bubbles) containing dark text.\n"
            "2. 'colored_box': A narration box, monologue box, or borderless/floating text on a colored, dark, gradient, or textured background.\n"
            "3. 'sfx': Sound effects (massive stylized letters drawn directly into the art like BOOM, SWOOSH, CRASH, BAM).\n\n"
            "Return a JSON object with a single key 'type' whose value is one of these three strings: 'white_bubble', 'colored_box', or 'sfx'. "
            "Only return the JSON and nothing else."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": "image/png",
                                "data": encoded_string
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        # We prefer gemini-2.5-flash as the fast, multimodal developer default
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "aistudio-build"
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            
        candidates = res_data.get("candidates", [])
        if not candidates:
            return "white_bubble"
            
        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        data = json.loads(text)
        category = data.get("type", "white_bubble").strip().lower()
        
        # Map different possible classification outputs to our 3 canonical options
        if "white" in category or "bubble" in category:
            return "white_bubble"
        elif "color" in category or "box" in category or "text" in category or "borderless" in category:
            return "colored_box"
        elif "sfx" in category or "sound" in category:
            return "sfx"
            
        return "white_bubble"
    except Exception as e:
        print(f"[Gemini Cleaner Warning] AI classification failed: {e}. Defaulting to 'white_bubble'.")
        return "white_bubble"


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
    debug_path: Optional[str] = None
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

        # 2. Detect the Bubbles & Text Regions
        # Create a combined mask for all dialogue regions (used for non-auto modes)
        mask = np.zeros_like(gray)
        bubble_detected = False

        # We compute dilation_factor early
        dilation_factor = dilation if dilation >= 0 else max(6, int(min(width, height) * 0.012))

        # Try AI-assisted Gemini bubble locator first (unless restricted to white only)
        if detection_style != "white_only":
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

            # Threshold to identify white, off-white, cream, and high-luminance speech bubbles
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

                text_dilate_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 15))
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
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilation_factor, dilation_factor))
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
                reader = easyocr.Reader(['en'], gpu=False)
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
            debug_path=args.debug_path
        )
        print("SUCCESS")
    except Exception as e:
        import sys
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

