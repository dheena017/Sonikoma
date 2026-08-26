"""
backend/app/services/image/panel_detection/speech_bubble_detector.py
─────────────────────────────────────────────────────────────────────────────
YOLO Deep-Learning Comic Speech Bubble & Character Segmentation Engine:
- Semantic extraction of dialogue bubbles, thought clouds, and captions
- Pixel-accurate segmentation masks for bubble and character silhouettes
- Dynamic model resolution and fallback mechanisms
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import logging
import importlib.util
import numpy as np
import cv2
from PIL import Image
from typing import Optional, Dict, List, Tuple, Any

from schemas.project import SpeechBubbleItem, EntityLabel, EntityCategory

logger = logging.getLogger("sonikoma.services.image.panel_detection.speech_bubble_detector")

# Dependency guard
has_yolo_dependencies = False
try:
    if (
        importlib.util.find_spec("ultralytics") is not None
        and importlib.util.find_spec("huggingface_hub") is not None
    ):
        has_yolo_dependencies = True
except Exception:
    has_yolo_dependencies = False
    logger.warning("[YOLO Detector] ultralytics or huggingface_hub check failed. YOLO segmentation disabled.")

_yolo_model = None
_yolo_char_model = None


def get_yolo_speech_bubble_model():
    """
    Lazily downloads and initializes the YOLO manga/comic speech bubble segmentation model.
    Tries models in priority order:
    1. kitsumed/yolov8m_seg-speech-bubble (Pixel masks, manga trained)
    2. ogkalu/comic-speech-bubble-detector-yolov8m (Broader comic coverage)
    3. Generic YOLOv8n-seg
    """
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model

    if not has_yolo_dependencies:
        return None

    from ultralytics import YOLO
    from huggingface_hub import hf_hub_download

    # Priority 0: Custom locally fine-tuned model (if exists)
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        custom_model_path = os.path.join(base_dir, "local_media", "models", "manga_finetuned.pt")
        if os.path.exists(custom_model_path):
            logger.info(f"[YOLO Detector] Loading custom fine-tuned YOLO model: {custom_model_path}")
            _yolo_model = YOLO(custom_model_path)
            return _yolo_model
    except Exception as e:
        logger.warning(f"[YOLO Detector] Custom model fallback: {e}")

    # Priority 1: kitsumed YOLOv8m-seg
    hf_token = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
    try:
        model_path = hf_hub_download(
            repo_id="kitsumed/yolov8m_seg-speech-bubble",
            filename="model.pt",
            token=hf_token
        )
        _yolo_model = YOLO(model_path)
        return _yolo_model
    except Exception as e:
        logger.warning(f"[YOLO Detector] kitsumed model unavailable: {e}. Trying ogkalu fallback...")

    # Priority 2: ogkalu YOLOv8m
    try:
        model_path = hf_hub_download(
            repo_id="ogkalu/comic-speech-bubble-detector-yolov8m",
            filename="comic-speech-bubble-detector.pt",
            token=hf_token
        )
        _yolo_model = YOLO(model_path)
        logger.info("[YOLO Detector] ogkalu fallback model loaded successfully.")
        return _yolo_model
    except Exception as e:
        logger.warning(f"[YOLO Detector] ogkalu model unavailable: {e}. Trying generic YOLOv8n-seg...")

    # Priority 3: Generic YOLOv8n-seg
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        project_model_path = os.path.join(base_dir, "data", "models", "yolov8n-seg.pt")
        if os.path.exists(project_model_path):
            _yolo_model = YOLO(project_model_path)
        else:
            _yolo_model = YOLO("yolov8n-seg.pt")
        logger.info("[YOLO Detector] Generic YOLOv8n-seg loaded.")
        return _yolo_model
    except Exception as e:
        logger.error(f"[YOLO Detector] All YOLO model loading failed: {e}", exc_info=True)
        _yolo_model = None
        return None


def _set_loaded_yolo_model(model_instance: Any):
    """Allows training workers to inject newly fine-tuned weights directly into cache."""
    global _yolo_model
    _yolo_model = model_instance


def detect_yolo_entities(
    image_bytes: bytes,
    conf_threshold: float = 0.30
) -> List[SpeechBubbleItem]:
    """
    Executes YOLOv8m-seg semantic inference on comic image bytes.
    Extracts dialogue bubbles, thought clouds, captions, and polygon masks.
    """
    pil_img = Image.open(io.BytesIO(image_bytes))
    img_w, img_h = pil_img.size

    model = get_yolo_speech_bubble_model()
    # If YOLO model is available and trained on comic entities, use YOLO
    is_comic_yolo = False
    if model is not None:
        model_names = getattr(model, "names", {})
        if isinstance(model_names, dict):
            names_list = list(model_names.values())
        else:
            names_list = list(model_names)
        # Check if model has comic/speech bubble classes
        is_coco = any(c in names_list for c in ["person", "bicycle", "car", "dog", "cat", "chair", "cup"])
        is_comic_yolo = not is_coco and any("bubble" in str(c).lower() or "text" in str(c).lower() or "balloon" in str(c).lower() or "speech" in str(c).lower() for c in names_list)
    else:
        pass

    if is_comic_yolo and model is not None:
        try:
            results = model.predict(source=pil_img, conf=conf_threshold, verbose=False)
        except Exception as e:
            logger.error(f"[YOLO Detector] Inference error: {e}", exc_info=True)
            results = []
    else:
        results = []

    gray_np = np.array(pil_img.convert("L"))
    otsu_val, _ = cv2.threshold(gray_np, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    dyn_white_thresh = max(150.0, min(240.0, float(otsu_val) * 1.12))

    entities: List[SpeechBubbleItem] = []
    bubble_counter = 1

    # Dynamic image-proportional bubble limits
    is_tall_webtoon = img_h > (img_w * 2.5)
    max_bubble_w = int(img_w * 0.75) if is_tall_webtoon else int(img_w * 0.40)
    max_bubble_h = int(img_w * 0.50) if is_tall_webtoon else int(img_h * 0.25)
    max_bubble_area = int(img_w * min(img_h, int(img_w * 2.0)) * 0.15)
    min_bubble_w = max(10, int(img_w * 0.02))
    min_bubble_h = max(10, int(img_h * 0.008)) if is_tall_webtoon else max(10, int(img_w * 0.015))

    if results:
        for r in results:
            boxes = r.boxes.xyxy.cpu().numpy() if r.boxes is not None else []
            confs = r.boxes.conf.cpu().numpy() if r.boxes is not None else []
            masks = r.masks.xy if r.masks is not None else []

            for idx, (box, conf) in enumerate(zip(boxes, confs)):
                x1, y1, x2, y2 = [int(v) for v in box]
                w = max(10, x2 - x1)
                h = max(10, y2 - y1)

                polygon = None
                if idx < len(masks) and masks[idx] is not None and len(masks[idx]) > 2:
                    polygon = [[int(pt[0]), int(pt[1])] for pt in masks[idx]]

                if w > max_bubble_w or h > max_bubble_h or (w * h) > max_bubble_area or w < min_bubble_w or h < min_bubble_h:
                    continue

                sub_patch = gray_np[y1:y1 + h, x1:x1 + w]
                if sub_patch.size == 0:
                    continue
                
                white_ratio = float(np.mean(sub_patch > dyn_white_thresh))
                if white_ratio < 0.50:
                    continue

                aspect = w / float(h)
                if aspect > 2.5:
                    bubble_type = "caption"
                    label = EntityLabel.CAPTION_NARRATION.value
                elif conf > 0.85:
                    bubble_type = "speech"
                    label = EntityLabel.BUBBLE_SPEECH.value
                else:
                    bubble_type = "thought"
                    label = EntityLabel.BUBBLE_THOUGHT.value


                entities.append(SpeechBubbleItem(
                    bubble_id=f"bubble_{bubble_counter}",
                    label=label,
                    category=EntityCategory.TEXT.value,
                    sub_type=bubble_type,
                    x=x1,
                    y=y1,
                    width=w,
                    height=h,
                    polygon=polygon,
                    dialogue_text=None,
                    confidence=round(float(conf), 2),
                    reading_order=bubble_counter,
                    is_bound=False
                ))
                bubble_counter += 1

    # Adaptive Geometric Contour Speech Bubble Fallback
    if not entities:
        try:
            block_size = max(11, (int(img_w * 0.02) | 1))
            thresh = cv2.adaptiveThreshold(gray_np, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block_size, 2)
            contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            min_area_thresh = max(100.0, float(img_w * img_h * 0.0003))
            
            for cnt in contours:
                bx, by, bw, bh = cv2.boundingRect(cnt)
                b_area = float(bw * bh)
                if bw > max_bubble_w or bh > max_bubble_h or bw < min_bubble_w or bh < min_bubble_h:
                    continue
                if b_area < min_area_thresh or b_area > max_bubble_area:
                    continue
                
                sub_patch = gray_np[by:by + bh, bx:bx + bw]
                if sub_patch.size == 0 or sub_patch.shape[1] <= 1:
                    continue
                
                dyn_grad_thresh = max(8.0, float(np.std(sub_patch) * 0.5))
                stroke_count = int(np.sum(np.abs(np.diff(sub_patch.astype(float), axis=1)) > dyn_grad_thresh))
                mean_brightness = float(np.mean(sub_patch))
                
                min_stroke_limit = max(2, int(bw * 0.04))
                max_stroke_limit = int(bw * bh * 0.20)
                
                # Must be a bright speech bubble interior containing text strokes
                if mean_brightness >= dyn_white_thresh * 0.85 and min_stroke_limit <= stroke_count <= max_stroke_limit:
                    peri = cv2.arcLength(cnt, True)
                    approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
                    poly = [[int(p[0][0]), int(p[0][1])] for p in approx] if len(approx) >= 3 else None
                    
                    aspect = bw / float(bh)
                    bubble_type = "caption" if aspect > 2.5 else "speech"
                    label = EntityLabel.CAPTION_NARRATION.value if aspect > 2.5 else EntityLabel.BUBBLE_SPEECH.value
                    
                    entities.append(SpeechBubbleItem(
                        bubble_id=f"bubble_{bubble_counter}",
                        label=label,
                        category=EntityCategory.TEXT.value,
                        sub_type=bubble_type,
                        x=bx,
                        y=by,
                        width=bw,
                        height=bh,
                        polygon=poly,
                        dialogue_text=None,
                        confidence=0.90,
                        reading_order=bubble_counter,
                        is_bound=False
                    ))
                    bubble_counter += 1
        except Exception as e:
            logger.warning(f"[SpeechBubble Detector] Contour bubble fallback error: {e}")

    entities.sort(key=lambda b: (b.y, b.x))
    for i, b in enumerate(entities):
        b.reading_order = i + 1

    return entities


def segment_speech_bubbles_and_text_balloons(
    image_path: str,
    conf_threshold: float = 0.25
) -> Optional[np.ndarray]:
    """
    Infers text and speech balloon masks on a panel image using the YOLO model.
    Returns single-channel binary mask (numpy uint8 array, 255 for detected regions).
    """
    if not has_yolo_dependencies:
        return None

    model = get_yolo_speech_bubble_model()
    if model is None:
        return None

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image path does not exist for YOLO segmentation: {image_path}")

    try:
        raw_results = model.predict(image_path, conf=conf_threshold, verbose=False)
        results = list(raw_results) if raw_results is not None else []
        if not results:
            return None

        result = results[0]
        if not hasattr(result, "masks") or result.masks is None or len(result.masks) == 0:
            return None

        if hasattr(result, "orig_shape") and result.orig_shape is not None:
            orig_shape = result.orig_shape
            height, width = int(orig_shape[0]), int(orig_shape[1])
        else:
            img = cv2.imread(image_path)
            if img is not None:
                height, width = img.shape[:2]
            else:
                return None

        combined_mask = np.zeros((height, width), dtype=np.uint8)

        for i, mask_instance in enumerate(result.masks.data):
            if hasattr(result, "boxes") and result.boxes is not None and hasattr(result.boxes, "conf") and len(result.boxes.conf) > i:
                confidence = float(result.boxes.conf[i].item())
            else:
                confidence = 1.0

            if confidence >= conf_threshold:
                mask_np = mask_instance.cpu().numpy()
                if mask_np.shape[:2] != (height, width):
                    mask_np = cv2.resize(mask_np, (width, height), interpolation=cv2.INTER_NEAREST)

                binary_slice = (mask_np > 0.5).astype(np.uint8) * 255
                combined_mask = cv2.bitwise_or(combined_mask, binary_slice)

        if np.any(combined_mask > 0):
            return combined_mask
        else:
            return np.zeros((height, width), dtype=np.uint8)

    except Exception as e:
        logger.error(f"[YOLO Detector] Error running YOLO balloon segmentation: {e}", exc_info=True)
        return None


def get_yolo_character_segmentation_model():
    """Lazily loads the YOLOv8-seg model for character detection."""
    global _yolo_char_model
    if _yolo_char_model is not None:
        return _yolo_char_model

    if not has_yolo_dependencies:
        return None

    try:
        from ultralytics import YOLO
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        local_path = os.path.join(base_dir, "yolov8n-seg.pt")
        if os.path.exists(local_path):
            _yolo_char_model = YOLO(local_path)
        else:
            _yolo_char_model = YOLO("yolov8n-seg.pt")
        return _yolo_char_model
    except Exception as e:
        logger.error(f"[YOLO Detector] Failed to load character model: {e}", exc_info=True)
        return None


def segment_character_foreground(
    image_path: str,
    conf_threshold: float = 0.25
) -> Optional[np.ndarray]:
    """Detects character foreground silhouettes using YOLOv8-seg."""
    if not has_yolo_dependencies:
        return None

    model = get_yolo_character_segmentation_model()
    if model is None:
        return None

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image path does not exist: {image_path}")

    try:
        raw_results = model.predict(image_path, conf=conf_threshold, verbose=False)
        results = list(raw_results) if raw_results is not None else []
        if not results:
            return None

        result = results[0]
        if not hasattr(result, "masks") or result.masks is None or len(result.masks) == 0:
            img = cv2.imread(image_path)
            if img is not None:
                return np.zeros(img.shape[:2], dtype=np.uint8)
            return None

        if hasattr(result, "orig_shape") and result.orig_shape is not None:
            height, width = int(result.orig_shape[0]), int(result.orig_shape[1])
        else:
            img = cv2.imread(image_path)
            if img is not None:
                height, width = img.shape[:2]
            else:
                return None

        combined_mask = np.zeros((height, width), dtype=np.uint8)

        for i, mask_instance in enumerate(result.masks.data):
            if hasattr(result, "boxes") and result.boxes is not None and hasattr(result.boxes, "cls") and len(result.boxes.cls) > i and hasattr(result.boxes, "conf") and len(result.boxes.conf) > i:
                cls_id = int(result.boxes.cls[i].item())
                confidence = float(result.boxes.conf[i].item())
            else:
                cls_id = 0
                confidence = 1.0

            if cls_id == 0 and confidence >= conf_threshold:
                mask_np = mask_instance.cpu().numpy()
                if mask_np.shape[:2] != (height, width):
                    mask_np = cv2.resize(mask_np, (width, height), interpolation=cv2.INTER_NEAREST)

                binary_slice = (mask_np > 0.5).astype(np.uint8) * 255
                combined_mask = cv2.bitwise_or(combined_mask, binary_slice)

        return combined_mask

    except Exception as e:
        logger.error(f"[YOLO Detector] Error running character segmentation: {e}", exc_info=True)
        return None
