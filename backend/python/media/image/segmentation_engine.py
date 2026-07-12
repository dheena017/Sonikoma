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
    """Lazily downloads and initializes the YOLO manga-segmentation model."""
    global _yolo_model
    if _yolo_model is None and has_yolo_dependencies:
        try:
            logger.info("Downloading manga-segmentation YOLOv26 checkpoint from HuggingFace Hub...")
            model_path = hf_hub_download(
                repo_id="ShadowB/Manga109-panel-balloon-text-yolov26-segmentation",
                filename="best.pt"
            )
            logger.info(f"Loading YOLO model from: {model_path}")
            _yolo_model = YOLO(model_path)
        except Exception as e:
            logger.error(f"Failed to load YOLO segmentation model: {e}", exc_info=True)
            _yolo_model = None
    return _yolo_model

def segment_text_and_balloons(image_path: str, conf_threshold: float = 0.5) -> np.ndarray:
    """
    Infers text and speech balloon masks on a panel image using the YOLO model.
    Returns:
      A single-channel binary mask (numpy uint8 array, 255 for detected regions, 0 elsewhere).
    """
    if not has_yolo_dependencies:
        raise ImportError("ultralytics or huggingface_hub is not installed. YOLO segmentation cannot run.")

    model = get_yolo_model()
    if model is None:
        raise RuntimeError("YOLO segmentation model failed to load from HuggingFace Hub.")

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
            logger.info("YOLO segmentation completed successfully: No masks found.")
            return None

        # Original image dimensions
        orig_shape = result.orig_shape  # (height, width)
        height, width = orig_shape[0], orig_shape[1]

        # Initialize unified mask
        combined_mask = np.zeros((height, width), dtype=np.uint8)

        # Loop through detected instances
        for i, mask_instance in enumerate(result.masks.data):
            class_id = int(result.boxes.cls[i].item())
            confidence = float(result.boxes.conf[i].item())

            # Labels schema for the model:
            # 0: frame
            # 1: text
            # 2: balloon (speech bubble)
            if class_id in (1, 2) and confidence >= conf_threshold:
                # Resize mask slice back to original image dimensions if needed
                mask_np = mask_instance.cpu().numpy()
                if mask_np.shape[:2] != (height, width):
                    mask_np = cv2.resize(mask_np, (width, height), interpolation=cv2.INTER_NEAREST)

                # Convert to binary mask representation
                binary_slice = (mask_np > 0.5).astype(np.uint8) * 255
                combined_mask = cv2.bitwise_or(combined_mask, binary_slice)

        if np.any(combined_mask > 0):
            logger.info(f"YOLO successfully segmented text/balloon masks (confidence >= {conf_threshold})")
            return combined_mask
        else:
            # Return an empty mask if YOLO successfully ran but found no masks, which is a valid case.
            # But wait! If the user says "ensure if rembg or ultralytics fails, it does not just return null or crash silently"
            # Here, returning an empty mask is not a failure, it just means no text was found.
            # But to be safe, if we return an empty array, it's not null.
            return np.zeros((height, width), dtype=np.uint8)

    except Exception as e:
        logger.error(f"Error running YOLO text/balloon segmentation: {e}", exc_info=True)
        raise RuntimeError(f"YOLO segmentation failed: {e}")
