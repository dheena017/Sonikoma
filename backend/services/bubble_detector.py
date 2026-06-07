import os
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


def heuristic_classify(crop_img) -> str:
    """
    Classifies a crop image based on color characteristics.
    Returns: 'white_bubble', 'colored_box', or 'uncertain'.
    """
    if not has_opencv or crop_img is None or crop_img.size == 0:
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


def classify_cropped_region(crop_img) -> str:
    """
    Calls the Gemini Vision API to classify a cropped text region.
    Returns: 'white_bubble', 'colored_box', or 'sfx'.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[Gemini Cleaner] No GEMINI_API_KEY found. Defaulting to 'white_bubble'.")
        return "white_bubble"

    if not has_opencv or crop_img is None or crop_img.size == 0:
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
