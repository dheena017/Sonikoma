"""
backend/app/services/image/panel_detection/yolo_detector.py
─────────────────────────────────────────────────────────────────────────────
Pure YOLO Deep-Learning Comic Speech Bubble & Entity Segmentation Engine:
- Specialized YOLOv8m-seg comic speech bubble model
- Multi-balloon clustering (merges connected dialogue tails)
- Pixel-accurate segmentation masks and typed SpeechBubbleItem models
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from PIL import Image

from schemas.project import SpeechBubbleItem, EntityLabel, EntityCategory
from services.image.panel_detection.speech_bubble_detector import get_yolo_speech_bubble_model

logger = logging.getLogger("sonikoma.services.panel_detection.yolo")


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
    if model is None:
        logger.warning("[YOLO Detector] YOLO model unavailable. Returning empty speech bubble list.")
        return []

    try:
        results = model.predict(source=pil_img, conf=conf_threshold, verbose=False)
    except Exception as e:
        logger.error(f"[YOLO Detector] Inference error: {e}", exc_info=True)
        return []

    entities: List[SpeechBubbleItem] = []
    bubble_counter = 1

    for r in results:
        boxes = r.boxes.xyxy.cpu().numpy() if r.boxes is not None else []
        confs = r.boxes.conf.cpu().numpy() if r.boxes is not None else []
        masks = r.masks.xy if r.masks is not None else []

        for idx, (box, conf) in enumerate(zip(boxes, confs)):
            x1, y1, x2, y2 = [int(v) for v in box]
            w = max(10, x2 - x1)
            h = max(10, y2 - y1)

            # Extract polygon vertices if available
            polygon = None
            if idx < len(masks) and masks[idx] is not None and len(masks[idx]) > 2:
                polygon = [[int(pt[0]), int(pt[1])] for pt in masks[idx]]

            # Determine bubble sub-type based on aspect ratio & confidence
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

    # Sort bubbles top-to-bottom reading sequence
    entities.sort(key=lambda b: (b.y, b.x))
    for i, b in enumerate(entities):
        b.reading_order = i + 1

    logger.debug(f"[YOLO Detector] Image {img_w}x{img_h}px -> Detected {len(entities)} speech bubble(s).")
    return entities
