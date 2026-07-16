import os
import logging
import numpy as np
import cv2

logger = logging.getLogger("sonikoma.services.segmentation_engine")

try:
    from ultralytics import YOLO
    from huggingface_hub import hf_hub_download
    has_yolo_dependencies = True
except ImportError:
    has_yolo_dependencies = False
    logger.warning("ultralytics or huggingface_hub is not installed. YOLO segmentation will be disabled.")

_yolo_model = None

def get_yolo_model():
    """
    Lazily downloads and initializes the YOLO manga-segmentation model.

    Tries models in priority order:
    1. kitsumed/yolov8m_seg-speech-bubble  — YOLOv8m-seg, produces pixel masks, trained on manga/comic bubbles.
    2. ogkalu/comic-speech-bubble-detector-yolov8m — YOLOv8m detection, broader comic coverage.
    3. yolov8n-seg.pt — generic pretrained segmentation (last resort; not manga-specific).

    The first successfully loaded model is cached in `_yolo_model`.
    """
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model

    if not has_yolo_dependencies:
        return None

    # Priority 0: Custom locally fine-tuned model (if exists)
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        custom_model_path = os.path.join(base_dir, "local_media", "models", "manga_finetuned.pt")
        if os.path.exists(custom_model_path):
            logger.info(f"Loading custom fine-tuned YOLO model from: {custom_model_path}")
            _yolo_model = YOLO(custom_model_path)
            logger.info("Custom fine-tuned YOLO model loaded successfully.")
            return _yolo_model
    except Exception as e:
        logger.warning(f"Failed to load custom fine-tuned model: {e}. Falling back to public models...")

    # Priority 1: kitsumed YOLOv8m-seg — produces pixel-level masks (best for our use case)

    try:
        logger.info("Downloading kitsumed/yolov8m_seg-speech-bubble (YOLOv8m-seg, manga/comic) from HuggingFace...")
        model_path = hf_hub_download(
            repo_id="kitsumed/yolov8m_seg-speech-bubble",
            filename="model.pt"  # confirmed filename via HF API
        )
        logger.info(f"Loading YOLO manga segmentation model from: {model_path}")
        _yolo_model = YOLO(model_path)
        logger.info("kitsumed/yolov8m_seg-speech-bubble model loaded successfully.")
        return _yolo_model
    except Exception as e:
        logger.warning(f"kitsumed model unavailable: {e}. Trying ogkalu fallback...")

    # Priority 2: ogkalu YOLOv8m — broader comic/webtoon coverage (detection model, no masks)
    try:
        logger.info("Downloading ogkalu/comic-speech-bubble-detector-yolov8m from HuggingFace...")
        model_path = hf_hub_download(
            repo_id="ogkalu/comic-speech-bubble-detector-yolov8m",
            filename="comic-speech-bubble-detector.pt"
        )
        logger.info(f"Loading ogkalu YOLO fallback model from: {model_path}")
        _yolo_model = YOLO(model_path)
        logger.info("ogkalu/comic-speech-bubble-detector-yolov8m fallback model loaded successfully.")
        return _yolo_model
    except Exception as e:
        logger.warning(f"ogkalu model unavailable: {e}. Trying generic YOLOv8n-seg last resort...")

    # Priority 3: Generic YOLOv8n-seg — not manga-specific but better than nothing
    try:
        logger.info("Loading generic YOLOv8n-seg pretrained model as last-resort YOLO fallback...")
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        project_model_path = os.path.join(base_dir, "data", "models", "yolov8n-seg.pt")
        if os.path.exists(project_model_path):
            logger.info(f"Loading generic YOLOv8n-seg model from project data/models: {project_model_path}")
            _yolo_model = YOLO(project_model_path)
        else:
            _yolo_model = YOLO("yolov8n-seg.pt")
        logger.info("Generic YOLOv8n-seg loaded (not manga-specific, mask quality may be low).")
        return _yolo_model
    except Exception as e:
        logger.error(f"All YOLO model loading attempts failed: {e}", exc_info=True)
        _yolo_model = None
        return None

def segment_text_and_balloons(image_path: str, conf_threshold: float = 0.25) -> np.ndarray:
    """
    Infers text and speech balloon masks on a panel image using the YOLO model.
    Returns:
      A single-channel binary mask (numpy uint8 array, 255 for detected regions, 0 elsewhere),
      or None if the model is unavailable.

    Args:
      image_path:     Absolute path to the panel image file.
      conf_threshold: Minimum confidence for a detection to be included (default 0.25).
                      Lowered from 0.5 to capture more manga-style stylized text regions.
    """
    if not has_yolo_dependencies:
        logger.warning("ultralytics or huggingface_hub is not installed. YOLO segmentation cannot run.")
        return None

    model = get_yolo_model()
    if model is None:
        logger.warning("YOLO segmentation model unavailable — falling back to OpenCV.")
        return None

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image path does not exist for YOLO segmentation: {image_path}")

    try:
        # Run inference (disable console logging to keep stdout clean)
        results = model.predict(image_path, conf=conf_threshold, verbose=False)
        if not results or len(results) == 0:
            return None

        result = results[0]
        # Check if any segmentations (masks) were detected
        if result.masks is None or len(result.masks) == 0:
            logger.info("YOLO segmentation completed: No masks found in this panel.")
            return None

        # Original image dimensions
        orig_shape = result.orig_shape  # (height, width)
        height, width = orig_shape[0], orig_shape[1]

        # Initialize unified mask
        combined_mask = np.zeros((height, width), dtype=np.uint8)

        # Loop through detected instances
        # keremberke/manga-speech-bubble-detection class schema:
        #   0: balloon (speech bubble)
        # Legacy ShadowB schema:
        #   0: frame, 1: text, 2: balloon
        # We accept ALL detected classes since this model focuses specifically on
        # speech bubbles and text regions; all are relevant for the text layer.
        for i, mask_instance in enumerate(result.masks.data):
            confidence = float(result.boxes.conf[i].item())

            if confidence >= conf_threshold:
                # Resize mask slice back to original image dimensions if needed
                mask_np = mask_instance.cpu().numpy()
                if mask_np.shape[:2] != (height, width):
                    mask_np = cv2.resize(mask_np, (width, height), interpolation=cv2.INTER_NEAREST)

                # Convert to binary mask representation
                binary_slice = (mask_np > 0.5).astype(np.uint8) * 255
                combined_mask = cv2.bitwise_or(combined_mask, binary_slice)

        if np.any(combined_mask > 0):
            mask_pixel_count = int(np.sum(combined_mask > 0))
            logger.info(f"YOLO successfully segmented text/balloon masks (conf >= {conf_threshold}, {mask_pixel_count} pixels masked)")
            return combined_mask
        else:
            logger.info(f"YOLO ran successfully but found no text/balloon regions above confidence {conf_threshold}.")
            return np.zeros((height, width), dtype=np.uint8)

    except Exception as e:
        logger.error(f"Error running YOLO text/balloon segmentation: {e}", exc_info=True)
        # Return None so the caller can fall back to OpenCV instead of hard-crashing
        return None


_yolo_char_model = None

def get_yolo_char_model():
    """
    Lazily loads the YOLOv8-seg model for character detection.
    Attempts to load local yolov8n-seg.pt or downloads it.
    """
    global _yolo_char_model
    if _yolo_char_model is not None:
        return _yolo_char_model

    if not has_yolo_dependencies:
        return None

    try:
        # Check if yolov8n-seg.pt is in backend/python/
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        local_path = os.path.join(base_dir, "yolov8n-seg.pt")
        if os.path.exists(local_path):
            logger.info(f"Loading local YOLOv8-seg character model from: {local_path}")
            _yolo_char_model = YOLO(local_path)
        else:
            logger.info("Loading generic YOLOv8n-seg model for character detection...")
            _yolo_char_model = YOLO("yolov8n-seg.pt")
        return _yolo_char_model
    except Exception as e:
        logger.error(f"Failed to load YOLOv8-seg character model: {e}", exc_info=True)
        return None


def segment_characters(image_path: str, conf_threshold: float = 0.25) -> np.ndarray:
    """
    Detects characters (class 0: person in COCO dataset) in a panel image using YOLOv8-seg model.
    Returns:
      A single-channel binary mask (numpy uint8 array, 255 for character regions, 0 elsewhere),
      or None if the model is unavailable.
    """
    if not has_yolo_dependencies:
        logger.warning("ultralytics or huggingface_hub is not installed. YOLO segmentation cannot run.")
        return None

    model = get_yolo_char_model()
    if model is None:
        logger.warning("YOLO character segmentation model unavailable.")
        return None

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image path does not exist for YOLO character segmentation: {image_path}")

    try:
        results = model.predict(image_path, conf=conf_threshold, verbose=False)
        if not results or len(results) == 0:
            return None

        result = results[0]
        if result.masks is None or len(result.masks) == 0:
            logger.info("YOLO character segmentation completed: No masks found.")
            # Return empty mask with correct dimensions
            img = cv2.imread(image_path)
            if img is not None:
                return np.zeros(img.shape[:2], dtype=np.uint8)
            return None

        height, width = result.orig_shape[0], result.orig_shape[1]
        combined_mask = np.zeros((height, width), dtype=np.uint8)

        # Merge masks for multiple characters (class index 0 for person in COCO)
        for i, mask_instance in enumerate(result.masks.data):
            cls_id = int(result.boxes.cls[i].item())
            confidence = float(result.boxes.conf[i].item())

            # Check if class is person (character) and meets confidence threshold
            if cls_id == 0 and confidence >= conf_threshold:
                mask_np = mask_instance.cpu().numpy()
                if mask_np.shape[:2] != (height, width):
                    mask_np = cv2.resize(mask_np, (width, height), interpolation=cv2.INTER_NEAREST)

                binary_slice = (mask_np > 0.5).astype(np.uint8) * 255
                combined_mask = cv2.bitwise_or(combined_mask, binary_slice)

        return combined_mask

    except Exception as e:
        logger.error(f"Error running YOLO character segmentation: {e}", exc_info=True)
        return None

