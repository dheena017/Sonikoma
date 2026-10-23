"""
backend/features/image_editor/services/panel_detection/speech_bubble_detector.py
─────────────────────────────────────────────────────────────────────────────
YOLO Deep-Learning Comic Speech Bubble Segmentation Engine:
- Semantic extraction of dialogue bubbles, thought clouds, and captions
- Pixel-accurate segmentation masks for bubble polygons
- Chat UI / SMS pill detection in digital manhwa panels
- Dynamic model resolution normalization and geometric contour fallback
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import logging
from typing import Optional, List, Tuple, Any

import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO
from huggingface_hub import hf_hub_download

from features.platform.projects.schemas_project import (
    SpeechBubbleItem,
    EntityLabel,
    EntityCategory,
)

logger = logging.getLogger("sonikoma.services.image.panel_detection.speech_bubble_detector")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Global State
# ─────────────────────────────────────────────────────────────────────────────

_yolo_model: Optional[Any] = None


# ─────────────────────────────────────────────────────────────────────────────
# 2. Model Loading & Lifecycle
# ─────────────────────────────────────────────────────────────────────────────

def get_yolo_speech_bubble_model() -> Optional[Any]:
    """
    Lazily loads and returns the YOLO speech bubble segmentation model.
    Tries models in order of priority:
    1. Local custom fine-tuned model (backend/data/models/manga_finetuned.pt)
    2. Manga-trained HuggingFace model (kitsumed/yolov8m_seg-speech-bubble)
    3. Comic-trained HuggingFace model (ogkalu/comic-speech-bubble-detector-yolov8m)
    4. Generic YOLOv8n-seg fallback (backend/data/models/yolov8n-seg.pt or 'yolov8n-seg.pt')
    """
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model

    models_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "models")
    )

    # Priority 1: Local custom fine-tuned model
    custom_model = os.path.join(models_dir, "manga_finetuned.pt")
    if os.path.exists(custom_model):
        try:
            logger.info(f"[SpeechBubble Detector] Loading custom fine-tuned model: {custom_model}")
            _yolo_model = YOLO(custom_model)
            return _yolo_model
        except Exception as e:
            logger.debug(f"[SpeechBubble Detector] Failed to load custom model: {e}")

    # Priority 2: Hugging Face comic/manga models
    hf_models = [
        ("kitsumed/yolov8m_seg-speech-bubble", "model.pt", "kitsumed segmentation"),
        ("ogkalu/comic-speech-bubble-detector-yolov8m", "comic-speech-bubble-detector.pt", "ogkalu comic detector"),
    ]
    for repo_id, filename, name in hf_models:
        try:
            path = hf_hub_download(repo_id=repo_id, filename=filename)
            _yolo_model = YOLO(path)
            logger.info(f"[SpeechBubble Detector] Loaded {name} model successfully")
            return _yolo_model
        except Exception as e:
            logger.debug(f"[SpeechBubble Detector] {name} unavailable ({e}), trying next candidate...")

    # Priority 3: Generic YOLOv8 fallback
    local_generic = os.path.join(models_dir, "yolov8n-seg.pt")
    target = local_generic if os.path.exists(local_generic) else "yolov8n-seg.pt"
    try:
        _yolo_model = YOLO(target)
        logger.info(f"[SpeechBubble Detector] Loaded fallback YOLO model: {target}")
        return _yolo_model
    except Exception as e:
        logger.warning(
            f"[SpeechBubble Detector] All YOLO model sources failed ({e}). Using contour detection fallback."
        )
        _yolo_model = None
        return None

# ─────────────────────────────────────────────────────────────────────────────
# 4. Bubble Detection Engines
# ─────────────────────────────────────────────────────────────────────────────

def detect_chat_ui_bubbles(
    pil_img: Image.Image,
    min_confidence: float = 0.88,
) -> List[SpeechBubbleItem]:
    """
    Detects smartphone text message chat bubbles, SMS dialog pills, and messenger UI elements.

    Identifies blue bubbles (iMessage/Webtoon), green bubbles (WhatsApp/Line), and white pills
    on dark smartphone screens using HSV color thresholding and contour text stroke density checks.

    Args:
        pil_img (Image.Image): Input PIL image of the panel or frame.
        min_confidence (float, optional): Assigned detection confidence. Defaults to 0.88.

    Returns:
        List[SpeechBubbleItem]: List of detected chat bubble items with bounding boxes and polygons.
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if pil_img is None or pil_img.size[0] < 10 or pil_img.size[1] < 10:
        return []

    # Ensure 3-channel RGB image for OpenCV color conversions
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")

    # ── Stage 2: Feature Extraction & Color Masking ─────────────────────────
    try:
        cv_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        h, w, _ = cv_bgr.shape
        hsv = cv2.cvtColor(cv_bgr, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(cv_bgr, cv2.COLOR_BGR2GRAY)

        # 1. Blue chat bubbles (iMessage / Android / manhwa phone UI)
        blue_mask = cv2.inRange(
            hsv,
            np.array([95, 55, 80], dtype=np.uint8),
            np.array([130, 255, 255], dtype=np.uint8),
        )
        # 2. Green chat bubbles (WeChat / WhatsApp / Line UI)
        green_mask = cv2.inRange(
            hsv,
            np.array([35, 55, 80], dtype=np.uint8),
            np.array([85, 255, 255], dtype=np.uint8),
        )
        color_mask = cv2.bitwise_or(blue_mask, green_mask)

        # 3. White chat pills on dark smartphone screens (Value < 75 background)
        dark_screen_mask = (
            cv2.inRange(
                hsv,
                np.array([0, 0, 0], dtype=np.uint8),
                np.array([180, 255, 75], dtype=np.uint8),
            )
            > 0
        )
        has_phone_screen = np.sum(dark_screen_mask) > (w * h * 0.04)

        chat_masks = [("blue_chat", color_mask)]
        if has_phone_screen:
            white_pill_mask = cv2.inRange(
                hsv,
                np.array([0, 0, 180], dtype=np.uint8),
                np.array([180, 45, 255], dtype=np.uint8),
            )
            chat_masks.append(("white_chat", white_pill_mask))

        # ── Stage 3: Contour Verification & Text Density ────────────────────
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
                    patch = gray[y:y + bh, x:x + bw]
                    # Genuine message bubbles contain high-frequency dialogue text strokes
                    if patch.size > 0 and float(np.std(patch)) >= 3.5:
                        poly = (
                            [[int(pt[0][0]), int(pt[0][1])] for pt in c]
                            if len(c) >= 3
                            else [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]]
                        )
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
                            confidence=min_confidence,
                            reading_order=idx_counter,
                            is_bound=False,
                        ))
                        idx_counter += 1

        # ── Stage 4: Output & Logging ───────────────────────────────────────
        logger.debug(f"[SpeechBubble Detector] Detected {len(found_bubbles)} chat UI bubble(s)")
        return found_bubbles

    except Exception as e:
        logger.debug(f"[SpeechBubble Detector] Chat bubble detection error: {e}")
        return []


def detect_speech_bubbles(
    image_input: Any,
    conf_threshold: float = 0.25,
) -> List[SpeechBubbleItem]:
    """
    Executes deep-learning semantic inference on comic images to detect speech bubbles and dialogue text.

    Extracts speech balloons, thought clouds, narration captions, and messenger UI pills.
    Dynamically normalizes input resolution, verifies interior text stroke presence,
    and falls back to adaptive contour thresholding when deep-learning models are unavailable.

    Args:
        image_input (Any): Comic strip or panel frame (PIL.Image or raw image bytes).
        conf_threshold (float, optional): YOLO confidence floor. Defaults to 0.25.

    Returns:
        List[SpeechBubbleItem]: Detected entities sorted in top-to-bottom reading order.
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if image_input is None:
        return []

    if isinstance(image_input, Image.Image):
        pil_img = image_input.convert("RGB") if image_input.mode != "RGB" else image_input
    elif isinstance(image_input, bytes):
        if len(image_input) == 0:
            return []
        pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
    else:
        raise ValueError("image_input must be bytes or a PIL Image.")

    img_w, img_h = pil_img.size
    if img_w < 10 or img_h < 10:
        return []

    # ── Stage 2: Resolution Normalization & Inference ────────────────────────
    model = get_yolo_speech_bubble_model()
    is_comic_yolo = False
    if model is not None:
        model_names = getattr(model, "names", {})
        names_list = list(model_names.values()) if isinstance(model_names, dict) else list(model_names)
        is_coco = any(c in names_list for c in ["person", "bicycle", "car", "dog", "cat", "chair", "cup"])
        is_comic_yolo = not is_coco and any(
            "bubble" in str(c).lower()
            or "text" in str(c).lower()
            or "balloon" in str(c).lower()
            or "speech" in str(c).lower()
            for c in names_list
        )

    results = []
    scale_factor = 1.0
    if is_comic_yolo and model is not None:
        try:
            # Scale narrow strips to standard width (~800px) so bubbles match YOLO receptive field
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
            logger.warning(f"[SpeechBubble Detector] Bubble inference error: {e}")
            results = []

    # ── Stage 3: YOLO Entity Parsing & Content Verification ──────────────────
    gray_np = np.array(pil_img.convert("L"))
    entities: List[SpeechBubbleItem] = []
    bubble_counter = 1

    # Proportional dimensions relative to image width
    max_bubble_w = int(img_w * 0.90)
    max_bubble_h = int(img_w * 1.60)
    max_bubble_area = int(img_w * img_w * 1.25)
    min_bubble_w = max(4, int(img_w * 0.015))
    min_bubble_h = max(4, int(img_w * 0.015))

    if results:
        for r in results:
            boxes_obj = getattr(r, "boxes", None)
            masks_obj = getattr(r, "masks", None)
            boxes = boxes_obj.xyxy.cpu().numpy() if (boxes_obj is not None and hasattr(boxes_obj, "xyxy")) else []
            confs = boxes_obj.conf.cpu().numpy() if (boxes_obj is not None and hasattr(boxes_obj, "conf")) else []
            masks = masks_obj.xy if (masks_obj is not None and hasattr(masks_obj, "xy")) else []

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

                # Default fallback polygon to rectangular box
                if polygon is None:
                    polygon = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]

                if (
                    w > max_bubble_w
                    or h > max_bubble_h
                    or (w * h) > max_bubble_area
                    or w < min_bubble_w
                    or h < min_bubble_h
                ):
                    continue

                sub_patch = gray_np[y1:y1 + h, x1:x1 + w]
                if sub_patch.size == 0:
                    continue

                # Content verification: genuine speech bubbles contain dialogue text lettering
                patch_std = float(np.std(sub_patch))
                if patch_std < 2.0 and conf < 0.60:
                    continue

                entities.append(SpeechBubbleItem(
                    bubble_id=f"bubble_{bubble_counter}",
                    label=EntityLabel.BUBBLE_SPEECH.value,
                    category=EntityCategory.TEXT.value,
                    sub_type="speech",
                    x=x1,
                    y=y1,
                    width=w,
                    height=h,
                    polygon=polygon,
                    dialogue_text=None,
                    confidence=round(float(conf), 2),
                    reading_order=bubble_counter,
                    is_bound=False,
                ))
                bubble_counter += 1

    # ── Stage 4: Chat UI Dialogue Augmentation ──────────────────────────────
    chat_bubbles = detect_chat_ui_bubbles(pil_img)
    for cb in chat_bubbles:
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
            entities.append(cb)

    # ── Stage 5: Adaptive Geometric Contour Fallback ─────────────────────────
    if not entities and not is_comic_yolo:
        try:
            dyn_white_thresh = max(180.0, float(np.percentile(gray_np, 85)))
            block_size = max(11, (int(img_w * 0.02) | 1))
            thresh = cv2.adaptiveThreshold(
                gray_np, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block_size, 2
            )
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
                if (
                    mean_brightness >= dyn_white_thresh * 0.85
                    and min_stroke_limit <= stroke_count <= max_stroke_limit
                ):
                    peri = cv2.arcLength(cnt, True)
                    approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
                    poly = (
                        [[int(p[0][0]), int(p[0][1])] for p in approx]
                        if len(approx) >= 3
                        else [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]]
                    )

                    entities.append(SpeechBubbleItem(
                        bubble_id=f"bubble_{bubble_counter}",
                        label=EntityLabel.BUBBLE_SPEECH.value,
                        category=EntityCategory.TEXT.value,
                        sub_type="speech",
                        x=bx,
                        y=by,
                        width=bw,
                        height=bh,
                        polygon=poly,
                        dialogue_text=None,
                        confidence=0.90,
                        reading_order=bubble_counter,
                        is_bound=False,
                    ))
                    bubble_counter += 1
        except Exception as e:
            logger.warning(f"[SpeechBubble Detector] Contour bubble fallback error: {e}")

    # ── Stage 6: Sorting, Reading Order & Structured Output ──────────────────
    entities.sort(key=lambda b: (b.y, b.x))
    for i, b in enumerate(entities, start=1):
        b.bubble_id = f"bubble_{i}"
        b.reading_order = i

    logger.info(f"[SpeechBubble Detector] Detected {len(entities)} speech bubble entity/entities")
    return entities


def segment_speech_bubbles_and_text_balloons(
    image_path: str,
    conf_threshold: float = 0.25,
) -> Optional[np.ndarray]:
    """
    Infers text and speech balloon masks on a panel image using the YOLO model.

    Generates a single-channel binary uint8 mask (pixel value 255 for speech bubble regions).
    Supports both polygon segmentation masks (YOLOv8-seg) and filled bounding boxes (YOLO detection).

    Args:
        image_path (str): Filesystem path to the comic panel image.
        conf_threshold (float, optional): Confidence floor for mask retention. Defaults to 0.25.

    Returns:
        Optional[np.ndarray]: Single-channel binary uint8 mask array (H, W), or None if model unavailable.
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if not image_path or not os.path.exists(image_path):
        logger.warning(f"[SpeechBubble Detector] Image path does not exist: {image_path}")
        return None

    model = get_yolo_speech_bubble_model()
    if model is None:
        logger.debug("[SpeechBubble Detector] No YOLO model available for segmentation mask generation.")
        return None

    # ── Stage 2: Inference & Dimensions Resolution ──────────────────────────
    try:
        raw_results = model.predict(image_path, conf=conf_threshold, verbose=False)
        results = list(raw_results) if raw_results is not None else []
        if not results:
            return None

        result = results[0]

        if hasattr(result, "orig_shape") and result.orig_shape is not None:
            orig_shape = result.orig_shape
            height, width = int(orig_shape[0]), int(orig_shape[1])
        else:
            img = cv2.imread(image_path)
            if img is None:
                return None
            height, width = img.shape[:2]

        combined_mask = np.zeros((height, width), dtype=np.uint8)

        # ── Stage 3: Mask & Bounding-Box Binary Rasterization ────────────────
        # Case A: Instance segmentation masks available (YOLO-seg)
        if hasattr(result, "masks") and result.masks is not None and len(result.masks) > 0:
            for i, mask_instance in enumerate(result.masks.data):
                if (
                    hasattr(result, "boxes")
                    and result.boxes is not None
                    and hasattr(result.boxes, "conf")
                    and len(result.boxes.conf) > i
                ):
                    confidence = float(result.boxes.conf[i].item())
                else:
                    confidence = 1.0

                if confidence >= conf_threshold:
                    mask_np = mask_instance.cpu().numpy()
                    if mask_np.shape[:2] != (height, width):
                        mask_np = cv2.resize(mask_np, (width, height), interpolation=cv2.INTER_NEAREST)

                    binary_slice = (mask_np > 0.5).astype(np.uint8) * 255
                    combined_mask = cv2.bitwise_or(combined_mask, binary_slice)

        # Case B: Detection bounding-boxes fallback (YOLO detection without masks)
        elif hasattr(result, "boxes") and result.boxes is not None and len(result.boxes) > 0:
            boxes = result.boxes.xyxy.cpu().numpy() if hasattr(result.boxes, "xyxy") else []
            confs = result.boxes.conf.cpu().numpy() if hasattr(result.boxes, "conf") else []
            for box, conf in zip(boxes, confs):
                if float(conf) >= conf_threshold:
                    bx1, by1, bx2, by2 = [int(v) for v in box]
                    cv2.rectangle(combined_mask, (bx1, by1), (bx2, by2), 255, -1)

        # ── Stage 4: Output & Logging ───────────────────────────────────────
        active_pixels = int(np.count_nonzero(combined_mask))
        logger.debug(f"[SpeechBubble Detector] Generated mask with {active_pixels} positive pixel(s)")
        return combined_mask

    except Exception as e:
        logger.warning(f"[SpeechBubble Detector] Balloon segmentation error: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 5. Package Exports
# ─────────────────────────────────────────────────────────────────────────────

__all__ = [
    "get_yolo_speech_bubble_model",
    "detect_chat_ui_bubbles",
    "detect_speech_bubbles",
    "segment_speech_bubbles_and_text_balloons",
]



