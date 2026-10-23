"""
backend/features/image_editor/services/layer_separation/character_layer_extractor.py
─────────────────────────────────────────────────────────────────────────────
Character, Visual Effects & Background Layer Extraction Service:
- Deep learning character segmentation (YOLOv8-seg -> SAM 2 -> U-2-Net)
- Multi-character subject decomposition via connected components
- Visual aura & energy effects layer generation
- Pyramidal guided inpainting of background holes
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple

import cv2
import numpy as np
from PIL import Image

from features.image_editor.services.detector.main_service_detector.detect_characters_service import (
    segment_character_foreground as segment_characters,
)
from features.image_editor.services.layer_separation.inpainting import (
    create_blank_png,
    pyramid_guided_inpaint,
)
from features.image_editor.services.layer_separation.sam import (
    extract_character_layer,
    has_rembg,
    has_sam,
)

logger = logging.getLogger("sonikoma.services.image.layer_separation.character_layer_extractor")


def extract_characters_and_background(
    original_img: np.ndarray,
    textless_img: np.ndarray,
    image_path: str,
) -> Tuple[List[Dict[str, Any]], bytes, bytes, np.ndarray]:
    """
    Extracts individual character subjects, creates visual effects/aura layers,
    and inpaints the backgroundplate using Pyramidal Guided Inpainting.

    Args:
        original_img: Source 3-channel BGR image.
        textless_img: Inpainted image with text/bubbles already removed.
        image_path: Path to panel image for YOLO model input.

    Returns:
        (individual_char_layers, effects_layer_bytes, bg_layer_bytes, char_mask)
    """
    height, width = original_img.shape[:2]
    char_mask = np.zeros((height, width), dtype=np.uint8)
    yolo_success = False

    # 1. Primary Character Segmentation: YOLOv8-seg
    try:
        yolo_mask = segment_characters(image_path, conf_threshold=0.25)
        if yolo_mask is not None and np.any(yolo_mask > 0):
            char_mask = yolo_mask
            yolo_success = True
            logger.info("[Character Extraction] YOLOv8-seg successfully segmented character mask.")
    except Exception as e:
        logger.warning(f"[Character Extraction] YOLOv8-seg error: {e}. Trying SAM/rembg fallback...")

    # 2. Resilient Fallback: SAM 2 / U-2-Net cascade
    if not yolo_success:
        try:
            if has_sam or has_rembg:
                pil_textless = Image.fromarray(cv2.cvtColor(textless_img, cv2.COLOR_BGR2RGB))
                char_pil = extract_character_layer(pil_textless)
                if char_pil is not None:
                    char_np = np.array(char_pil)
                    if char_np.ndim == 3 and char_np.shape[2] == 4:
                        char_mask = char_np[:, :, 3]
                        logger.info("[Character Extraction] Fallback (SAM/rembg) segmented character mask.")
        except Exception as e:
            logger.error(f"[Character Extraction] Fallback segmentation failed: {e}", exc_info=True)

    # 3. Extract Visual Effects & Aura Layer
    try:
        if np.any(char_mask > 0):
            dilated_char_aura = cv2.dilate(char_mask, np.ones((15, 15), np.uint8), iterations=3)
            aura_region = cv2.bitwise_and(dilated_char_aura, cv2.bitwise_not(char_mask))
            effects_layer = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
            effects_layer[aura_region == 0] = [0, 0, 0, 0]
            _, buffer = cv2.imencode(".png", effects_layer)
            effects_layer_bytes = buffer.tobytes()
        else:
            effects_layer_bytes = create_blank_png(width, height)
    except Exception as e:
        logger.error(f"Error compiling visual effects layer: {e}", exc_info=True)
        effects_layer_bytes = create_blank_png(width, height)

    # 4. Multi-Character Subject Splitting
    individual_char_layers: List[Dict[str, Any]] = []

    if np.any(char_mask > 0):
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(char_mask, connectivity=8)
        min_char_area = max(50, int((width * height) * 0.003))

        char_components = []
        for label_idx in range(1, num_labels):
            area = stats[label_idx, cv2.CC_STAT_AREA]
            if area >= min_char_area:
                x_pos = stats[label_idx, cv2.CC_STAT_LEFT]
                char_components.append((x_pos, label_idx, area))

        # Order characters left-to-right
        char_components.sort(key=lambda item: item[0])

        if not char_components:
            char_components = [(0, 1, int(np.sum(char_mask > 0)))]
            labels = (char_mask > 0).astype(int)

        for c_idx, (_, label_idx, _) in enumerate(char_components):
            single_char_mask = (labels == label_idx).astype(np.uint8) * 255
            char_layer_single = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
            smooth_alpha = single_char_mask.astype(float) / 255.0
            smooth_alpha = cv2.GaussianBlur(smooth_alpha.astype(np.float32), (3, 3), 0)
            char_layer_single[:, :, 3] = (smooth_alpha * 255.0).astype(np.uint8)

            _, buffer = cv2.imencode(".png", char_layer_single)
            char_num = c_idx + 1
            individual_char_layers.append({
                "char_num": char_num,
                "name": f"Character {char_num}",
                "filename": f"char_{char_num}.png",
                "bytes": buffer.tobytes(),
            })
    else:
        individual_char_layers.append({
            "char_num": 1,
            "name": "Character 1",
            "filename": "char_1.png",
            "bytes": create_blank_png(width, height),
        })

    # 5. Clean Background Inpainting
    try:
        if np.any(char_mask > 0):
            dilated_char = cv2.dilate(char_mask, np.ones((7, 7), np.uint8), iterations=2)
            clean_bg = pyramid_guided_inpaint(textless_img, dilated_char, radius=20)
        else:
            clean_bg = textless_img

        bg_layer = cv2.cvtColor(clean_bg, cv2.COLOR_BGR2BGRA)
        _, buffer = cv2.imencode(".png", bg_layer)
        bg_layer_bytes = buffer.tobytes()
    except Exception as e:
        logger.error(f"Error generating background layer: {e}", exc_info=True)
        bg_layer = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
        _, buffer = cv2.imencode(".png", bg_layer)
        bg_layer_bytes = buffer.tobytes()

    return individual_char_layers, effects_layer_bytes, bg_layer_bytes, char_mask


__all__ = ["extract_characters_and_background"]
