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

from features.platform.projects.schemas_project import SpeechBubbleItem, EntityLabel, EntityCategory

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

    # Priority 0: Custom locally fine-tuned model (if exists in data/models)
    try:
        from app.core.config import MODELS_DIR
        custom_model_path = os.path.join(MODELS_DIR, "manga_finetuned.pt")
        if os.path.exists(custom_model_path):
            logger.info(f"[YOLO Detector] Loading custom fine-tuned YOLO model: {custom_model_path}")
            _yolo_model = YOLO(custom_model_path)
            return _yolo_model
    except Exception as e:
        logger.warning(f"[YOLO Detector] Custom model fallback: {e}")

    # Priority 1: kitsumed YOLOv8m-seg
    huggingface_api_key = os.getenv("HUGGINGFACE_API_KEY")
    try:
        model_path = hf_hub_download(
            repo_id="kitsumed/yolov8m_seg-speech-bubble",
            filename="model.pt",
            token=huggingface_api_key
        )
        _yolo_model = YOLO(model_path)
        return _yolo_model
    except Exception as e:
        logger.debug(f"[Vision Engine] kitsumed model unavailable: {e}. Trying ogkalu fallback...")

    # Priority 2: ogkalu YOLOv8m
    try:
        model_path = hf_hub_download(
            repo_id="ogkalu/comic-speech-bubble-detector-yolov8m",
            filename="comic-speech-bubble-detector.pt",
            token=huggingface_api_key
        )
        _yolo_model = YOLO(model_path)
        logger.info("[Vision Engine] Bubble Detection model loaded successfully")
        return _yolo_model
    except Exception as e:
        logger.debug(f"[Vision Engine] ogkalu model unavailable: {e}. Trying generic YOLOv8n-seg...")

    # Priority 3: Generic YOLOv8n-seg
    try:
        from database.config import DATA_DIR, _BACKEND_ROOT as base_dir
        project_model_path = os.path.join(DATA_DIR, "models", "yolov8n-seg.pt")
        if os.path.exists(project_model_path):
            _yolo_model = YOLO(project_model_path)
        else:
            _yolo_model = YOLO("yolov8n-seg.pt")
        logger.info("[Vision Engine] YOLOv8 segmentation model ready")
        return _yolo_model
    except Exception as e:
        logger.warning(f"[Vision Engine] Bubble Detection model loading failed ({e}). Using OpenCV detection.")
        _yolo_model = None
        return None


# Backward-compatible alias
get_yolo_model = get_yolo_speech_bubble_model


def _set_loaded_yolo_model(model_instance: Any):
    """Allows training workers to inject newly fine-tuned weights directly into cache."""
    global _yolo_model
    _yolo_model = model_instance


def _detect_chat_ui_bubbles(pil_img: Image.Image) -> List[SpeechBubbleItem]:
    """
    Detects smartphone text message chat bubbles, SMS bubbles, and dialog pills in comic panels.
    Captures blue (iMessage/Webtoon), green (WhatsApp/Line), and white pills on dark smartphone screens.
    """
    try:
        cv_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        h, w, _ = cv_bgr.shape
        hsv = cv2.cvtColor(cv_bgr, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(cv_bgr, cv2.COLOR_BGR2GRAY)

        # 1. Blue chat bubbles (iMessage / Android / manhwa phone UI)
        blue_mask = cv2.inRange(hsv, (95, 55, 80), (130, 255, 255))
        # 2. Green chat bubbles (WeChat / WhatsApp / Line UI)
        green_mask = cv2.inRange(hsv, (35, 55, 80), (85, 255, 255))
        color_mask = cv2.bitwise_or(blue_mask, green_mask)

        # 3. White chat pills on dark smartphone screens (Value < 75 background)
        dark_screen_mask = (cv2.inRange(hsv, (0, 0, 0), (180, 255, 75)) > 0)
        has_phone_screen = np.sum(dark_screen_mask) > (w * h * 0.04)

        chat_masks = [("blue_chat", color_mask)]
        if has_phone_screen:
            white_pill_mask = cv2.inRange(hsv, (0, 0, 180), (180, 45, 255))
            chat_masks.append(("white_chat", white_pill_mask))

        found_bubbles: List[SpeechBubbleItem] = []
        min_area = int(w * h * 0.0008)
        max_area = int(w * h * 0.20)
        idx_counter = 1

        for name, mask in chat_masks:
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            cleaned = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            cnts, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            for c in cnts:
                area = cv2.contourArea(c)
                if area < min_area or area > max_area:
                    continue
                x, y, bw, bh = cv2.boundingRect(c)
                aspect = bw / float(max(1, bh))
                if 1.0 <= aspect <= 7.0 and bw <= int(w * 0.85):
                    patch = gray[y:y+bh, x:x+bw]
                    # Genuine message bubbles contain high-frequency dialogue text strokes
                    if patch.size > 0 and float(np.std(patch)) >= 3.5:
                        # Extract smooth polygon from contour
                        poly = [[int(pt[0][0]), int(pt[0][1])] for pt in c] if len(c) >= 3 else None
                        found_bubbles.append(SpeechBubbleItem(
                            bubble_id=f"chat_{name}_{idx_counter}",
                            label=EntityLabel.BUBBLE_SPEECH.value,
                            category=EntityCategory.TEXT.value,
                            sub_type="chat_message",
                            x=x,
                            y=y,
                            width=bw,
                            height=bh,
                            polygon=poly,
                            dialogue_text=None,
                            confidence=0.88,
                            reading_order=idx_counter,
                            is_bound=False
                        ))
                        idx_counter += 1

        return found_bubbles
    except Exception as e:
        logger.debug(f"[Vision Engine] Chat bubble detection fallback: {e}")
        return []


def detect_yolo_entities(
    image_input: Any,
    conf_threshold: float = 0.25
) -> List[SpeechBubbleItem]:
    """
    Executes YOLOv8m-seg semantic inference on comic image bytes or PIL Image.
    Extracts dialogue bubbles, thought clouds, captions, chat messages, and polygon masks.
    Dynamically normalizes resolution so strips of any width/height are accurately detected.
    """
    if isinstance(image_input, Image.Image):
        pil_img = image_input
    elif isinstance(image_input, bytes):
        pil_img = Image.open(io.BytesIO(image_input))
    else:
        raise ValueError("image_input must be bytes or a PIL Image.")
    img_w, img_h = pil_img.size

    model = get_yolo_speech_bubble_model()
    is_comic_yolo = False
    if model is not None:
        model_names = getattr(model, "names", {})
        if isinstance(model_names, dict):
            names_list = list(model_names.values())
        else:
            names_list = list(model_names)
        is_coco = any(c in names_list for c in ["person", "bicycle", "car", "dog", "cat", "chair", "cup"])
        is_comic_yolo = not is_coco and any("bubble" in str(c).lower() or "text" in str(c).lower() or "balloon" in str(c).lower() or "speech" in str(c).lower() for c in names_list)

    results = []
    scale_factor = 1.0
    if is_comic_yolo and model is not None:
        try:
            # Canonical resolution normalization:
            # Narrow strips (e.g. 110px) are scaled up to standard width (~800px) so bubbles match YOLO receptive field
            if img_w < 600:
                target_w = 800
                scale_factor = target_w / float(img_w)
                target_h = int(img_h * scale_factor)
                infer_img = pil_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
            elif img_w > 1800:
                target_w = 1200
                scale_factor = target_w / float(img_w)
                target_h = int(img_h * scale_factor)
                infer_img = pil_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
            else:
                infer_img = pil_img

            results = model.predict(source=infer_img, conf=conf_threshold, verbose=False)
        except Exception as e:
            logger.warning(f"[Vision Engine] Bubble inference error: {e}")
            results = []

    gray_np = np.array(pil_img.convert("L"))
    entities: List[SpeechBubbleItem] = []
    bubble_counter = 1

    # Dynamic proportional limits based on strip width (independent of tall strip height)
    max_bubble_w = int(img_w * 0.90)
    max_bubble_h = int(img_w * 1.60)
    max_bubble_area = int(img_w * img_w * 1.25)
    min_bubble_w = max(4, int(img_w * 0.015))
    min_bubble_h = max(4, int(img_w * 0.015))

    if results:
        for r in results:
            boxes_obj = getattr(r, "boxes", None)
            masks_obj = getattr(r, "masks", None)
            boxes = boxes_obj.xyxy.cpu().numpy() if (boxes_obj is not None and hasattr(boxes_obj, "xyxy")) else []  # type: ignore
            confs = boxes_obj.conf.cpu().numpy() if (boxes_obj is not None and hasattr(boxes_obj, "conf")) else []  # type: ignore
            masks = masks_obj.xy if (masks_obj is not None and hasattr(masks_obj, "xy")) else []  # type: ignore

            for idx, (box, conf) in enumerate(zip(boxes, confs)):
                rx1, ry1, rx2, ry2 = [float(v) for v in box]
                if scale_factor != 1.0:
                    x1 = int(rx1 / scale_factor)
                    y1 = int(ry1 / scale_factor)
                    x2 = int(rx2 / scale_factor)
                    y2 = int(ry2 / scale_factor)
                else:
                    x1, y1, x2, y2 = int(rx1), int(ry1), int(rx2), int(ry2)

                w = max(4, x2 - x1)
                h = max(4, y2 - y1)

                polygon = None
                if idx < len(masks) and masks[idx] is not None and len(masks[idx]) > 2:
                    if scale_factor != 1.0:
                        polygon = [[int(pt[0] / scale_factor), int(pt[1] / scale_factor)] for pt in masks[idx]]
                    else:
                        polygon = [[int(pt[0]), int(pt[1])] for pt in masks[idx]]

                if w > max_bubble_w or h > max_bubble_h or (w * h) > max_bubble_area or w < min_bubble_w or h < min_bubble_h:
                    continue

                sub_patch = gray_np[y1:y1 + h, x1:x1 + w]
                if sub_patch.size == 0:
                    continue

                # Content verification: genuine speech bubbles contain dialogue text lettering
                patch_std = float(np.std(sub_patch))
                if patch_std < 2.0 and conf < 0.60:
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

    # Augment with smartphone text message / chat UI bubbles
    chat_bubbles = _detect_chat_ui_bubbles(pil_img)
    for cb in chat_bubbles:
        # Check IoU overlap against existing YOLO entities
        cb_x1, cb_y1, cb_x2, cb_y2 = cb.x, cb.y, cb.x + cb.width, cb.y + cb.height
        is_overlapping = False
        for ex in entities:
            ex_x1, ex_y1, ex_x2, ex_y2 = ex.x, ex.y, ex.x + ex.width, ex.y + ex.height
            inter_w = max(0, min(cb_x2, ex_x2) - max(cb_x1, ex_x1))
            inter_h = max(0, min(cb_y2, ex_y2) - max(cb_y1, ex_y1))
            inter_area = inter_w * inter_h
            if inter_area > 0:
                union_area = (cb.width * cb.height) + (ex.width * ex.height) - inter_area
                iou = inter_area / float(max(1, union_area))
                if iou >= 0.35:
                    is_overlapping = True
                    break
        if not is_overlapping:
            cb.bubble_id = f"bubble_{bubble_counter}"
            cb.reading_order = bubble_counter
            entities.append(cb)
            bubble_counter += 1

    # Adaptive Geometric Contour Speech Bubble Fallback (only when YOLO is unavailable)
    if not entities and not is_comic_yolo:
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

    logger.info(f"[SpeechBubble Detector] Detected {len(entities)} speech bubble entity/entities")
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
        logger.warning(f"[Vision Engine] Balloon segmentation error: {e}")
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
        from database.config import DATA_DIR, _BACKEND_ROOT as base_dir
        model_candidate = os.path.join(DATA_DIR, "models", "yolov8n-seg.pt")
        local_path = model_candidate if os.path.exists(model_candidate) else os.path.join(base_dir, "yolov8n-seg.pt")
        if os.path.exists(local_path):
            _yolo_char_model = YOLO(local_path)
        else:
            _yolo_char_model = YOLO("yolov8n-seg.pt")
        return _yolo_char_model
    except Exception as e:
        logger.warning(f"[Vision Engine] Character segmentation model unavailable: {e}")
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
        logger.warning(f"[Vision Engine] Character segmentation failed: {e}")
        return None
