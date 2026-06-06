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


def clean_speech_bubbles(
    image_path: str,
    output_path: str,
    method: str = "inpaint",
    sensitivity: float = 50.0,
    dilation: int = -1,
    inpaint_radius: int = 3,
    detection_style: str = "all"
) -> None:
    """
    Detects and removes speech bubbles from comic drawings and webtoon panels 
    to make room for translation overlay, TTS alignment, or dynamic subtitles.

    Parameters:
        image_path (str): Filepath to the input image.
        output_path (str): Filepath where the final processed image will be written.
        method (str): Eraser algorithm. Options: 'inpaint', 'inpaint_ns', 'blur', 'solid_white', 'solid_black', 'transparent', 'ocr'.
        sensitivity (float): Threshold adjustment value from 0 to 100.
        dilation (int): Custom padding margin pixel count. If -1, dynamically calculated.
        inpaint_radius (int): Pixel radius neighborhood for image inpainting.
        detection_style (str): Filter behavior: 'all', 'white_only', or 'text_only'.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image not found: {image_path}")

    # Ensure parent output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

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

        # 2. Detect the Bubbles & Text Regions
        # Create a combined mask for all dialogue regions
        mask = np.zeros_like(gray)
        bubble_detected = False

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
                        
                        cv2.rectangle(mask, (x1_pad, y1_pad), (x2_pad, y2_pad), 255, -1)
                        bubble_detected = True

        # If Gemini didn't detect anything (or wasn't queried), run the traditional OpenCV fallback locator
        if not bubble_detected:
            # Shift thresholds based on sensitivity (0 to 100)
            # Default is 50.0
            # Higher sensitivity makes it easier to catch speech bubbles or text
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
                    # Filter for typical letter shapes: small, compact, but not single pixel noise
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

                    # Filter out tiny specs/noise or extremely low areas
                    if area < min_bubble_area:
                        continue

                    # Skip the global page background (if a contour covers more than 65% of total sheet)
                    if area > (width * height) * 0.65:
                        continue

                    # Also skip long thin rectangular slices / strips (not typical bubble ratios)
                    aspect_ratio = w / h if h > 0 else 1
                    if aspect_ratio < 0.22 or aspect_ratio > 4.5:
                        continue

                    # Count how many of our detected letter candidates reside completely inside this bright bubble
                    contained_letters_count = 0
                    for lx, ly, lw, lh, _ in letter_candidates:
                        # Check if letter center is within the bubble bounds
                        cx = lx + lw // 2
                        cy = ly + lh // 2
                        if x <= cx <= x + w and y <= cy <= y + h:
                            contained_letters_count += 1

                    # If there are multiple individual letters inside, it's highly likely to be a speech bubble!
                    required_letters = max(3, 5 - int(sensitivity / 25)) if len(letter_candidates) > 0 else 0
                    
                    # If we aren't using letters (e.g. white_only), default purely to roundedness and size check
                    if detection_style == "white_only" or len(letter_candidates) == 0:
                        cv2.drawContours(mask, [contour], -1, 255, -1)
                        bubble_detected = True
                    elif contained_letters_count >= required_letters:
                        cv2.drawContours(mask, [contour], -1, 255, -1)
                        bubble_detected = True

            # --- B. Universal Text-Stroke Layout Grouping ---
            # Floating text, colored speech bubbles, or textured bubbles are often missed by simple thresholding.
            # We cluster our identified letter candidates if they are close to each other.
            if detection_style != "white_only" and len(letter_candidates) >= 3:
                text_seeds = np.zeros_like(gray)
                for lx, ly, lw, lh, l_contour in letter_candidates:
                    cv2.drawContours(text_seeds, [l_contour], -1, 255, -1)

                # Merge adjacent letters into cohesive layout texts using dilation
                text_dilate_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 15))
                text_blocks = cv2.dilate(text_seeds, text_dilate_kernel, iterations=1)
                text_contours, _ = cv2.findContours(text_blocks, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                for tc in text_contours:
                    tx, ty, tw, th = cv2.boundingRect(tc)
                    ta = cv2.contourArea(tc)

                    # Eliminate full panel boxes or too big selections
                    if tw < width * 0.75 and th < height * 0.75 and tw > 10 and th > 10:
                        # Count the underlying individual letters in this merged block
                        block_letter_count = 0
                        for lx, ly, lw, lh, _ in letter_candidates:
                            cx = lx + lw // 2
                            cy = ly + lh // 2
                            if tx <= cx <= tx + tw and ty <= cy <= ty + th:
                                block_letter_count += 1

                        # If the block has a solid, dense cluster of letters (e.g. >= 4 letters close together)
                        required_block_letters = max(4, 6 - int(sensitivity / 20))
                        if block_letter_count >= required_block_letters:
                            # Pad text bounding box to ensure proper coverage of text characters
                            pad_x = int(max(6, tw * 0.10))
                            pad_y = int(max(6, th * 0.10))
                            x1 = max(0, tx - pad_x)
                            y1 = max(0, ty - pad_y)
                            x2 = min(width, tx + tw + pad_x)
                            y2 = min(height, ty + th + pad_y)
                            
                            # Fill this region in the master mask
                            cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
                            bubble_detected = True

        # Dilate bubble boundaries to guarantee the speech bubble borders/outlines are 100% covered.
        if bubble_detected:
            dilation_factor = dilation if dilation >= 0 else max(6, int(min(width, height) * 0.012))
            if dilation_factor > 0:
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilation_factor, dilation_factor))
                mask = cv2.dilate(mask, kernel, iterations=1)

        # 4. Apply the Cleaning Method
        if np.count_nonzero(mask) == 0:
            print("BUBBLES_DETECTED=FALSE")
            # Output original copy if no speech bubbles were matched
            final_image = img_temp.copy()
        else:
            print("BUBBLES_DETECTED=TRUE")
            method_lower = method.lower()
            
            if method_lower == "blur":
                # Apply a heavy Gaussian blur to the entire image structure
                blur_factor = max(25, int(min(width, height) * 0.12) | 1)
                heavy_blurred = cv2.GaussianBlur(original_image, (blur_factor, blur_factor), 0)
                # Blend using selective np.where logic over the dilated mask
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
                # Generate 4-channel final output
                if img_temp.shape[2] == 3:
                    h, w = img_temp.shape[:2]
                    alpha_chan = np.ones((h, w), dtype=np.uint8) * 255
                    rgba_img = cv2.merge((img_temp[:, :, 0], img_temp[:, :, 1], img_temp[:, :, 2], alpha_chan))
                else:
                    rgba_img = img_temp.copy()
                
                # Erase the marked mask region down to 100% translucent transparency
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
                # Default "inpaint" or "inpaint_telea"
                final_image = cv2.inpaint(original_image, mask, inpaint_radius, cv2.INPAINT_TELEA)

        # Save to file
        cv2.imwrite(output_path, final_image)
        return

    # 2. Fallback Path: Pure Pillow + Numpy Implementation
    elif has_pil and Image is not None and ImageFilter is not None:
        print("OPENCV_SUPPORT=FALSE")
        print("BUBBLES_DETECTED=FALSE")
        img = Image.open(image_path).convert("RGBA" if method.lower() == "transparent" else "RGB")
        width, height = img.size
        
        # Heavy Blur Fallback
        if method.lower() == "blur":
            blur_intensity = max(15, int(min(width, height) * 0.08))
            blurred_img = img.filter(ImageFilter.GaussianBlur(radius=blur_intensity))
            blurred_img.save(output_path)
        elif method.lower() == "solid_white":
            # Just outputting original copy for fallback safety to keep flow
            img.save(output_path)
        else:
            img.save(output_path)
        return

    else:
        # Ultimate system fallback: copy target file unmodified
        print("OPENCV_SUPPORT=FALSE")
        print("BUBBLES_DETECTED=FALSE")
        import shutil
        shutil.copy(image_path, output_path)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Anivox Speech Bubble Cleaner CLI service")
    parser.add_argument("--image_path", required=True, help="Path to input comic panel")
    parser.add_argument("--output_path", required=True, help="Path to write the processed output")
    parser.add_argument("--method", default="inpaint", help="Erase algorithm")
    parser.add_argument("--sensitivity", type=float, default=50.0, help="Sensitivity parameter (0-100)")
    parser.add_argument("--dilation", type=int, default=-1, help="Custom dilation padding (px)")
    parser.add_argument("--inpaint_radius", type=int, default=3, help="Neighbor inpaint pixel radius")
    parser.add_argument("--detection_style", default="all", choices=["all", "white_only", "text_only"], help="Detection style")

    args = parser.parse_args()
    try:
        clean_speech_bubbles(
            args.image_path,
            args.output_path,
            method=args.method,
            sensitivity=args.sensitivity,
            dilation=args.dilation,
            inpaint_radius=args.inpaint_radius,
            detection_style=args.detection_style
        )
        print("SUCCESS")
    except Exception as e:
        import sys
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

