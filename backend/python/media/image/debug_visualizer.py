"""
debug_visualizer.py
-------------------
Draws YOLO speech-bubble detections (masks + boxes + labels) onto a panel image
and returns the annotated image as PNG bytes.
"""
import logging
import numpy as np
import cv2
from PIL import Image

logger = logging.getLogger("sonikoma.services.debug_visualizer")

# Color palette for overlays (BGR for OpenCV)
MASK_COLOR   = (0, 200, 80)   # green fill
BOX_COLOR    = (0, 200, 80)   # green border
LABEL_BG     = (0, 160, 60)
LABEL_FG     = (255, 255, 255)
ALPHA        = 0.40            # mask transparency


def draw_yolo_detections(image_path: str, conf_threshold: float = 0.25) -> bytes | None:
    """
    Run YOLO on *image_path*, draw all detected speech-bubble masks/boxes,
    and return the annotated image as PNG bytes.

    Returns None if YOLO is unavailable or produces no detections.
    """
    from media.image.segmentation_engine import get_yolo_model

    model = get_yolo_model()
    if model is None:
        logger.warning("[DebugViz] YOLO model not available — cannot draw detections.")
        return None

    # Load image
    pil_img = Image.open(image_path).convert("RGB")
    frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    h, w = frame.shape[:2]

    # Run inference
    results = model(frame, conf=conf_threshold, verbose=False)
    r = results[0]

    if r.boxes is None or len(r.boxes) == 0:
        logger.info("[DebugViz] YOLO found no detections — returning annotated image with zero-overlay.")
        annotated = _add_no_detection_banner(frame.copy())
        return _encode_png(annotated)

    # Build overlay canvas
    overlay = frame.copy()

    # Draw filled masks
    if r.masks is not None:
        for mask_tensor in r.masks.data:
            mask_np = mask_tensor.cpu().numpy()
            # Resize mask to image dimensions
            mask_resized = cv2.resize(mask_np, (w, h), interpolation=cv2.INTER_NEAREST)
            bool_mask = mask_resized > 0.5
            overlay[bool_mask] = np.array(MASK_COLOR, dtype=np.uint8)

    # Blend overlay with original
    frame = cv2.addWeighted(overlay, ALPHA, frame, 1 - ALPHA, 0)

    # Draw boxes + confidence labels
    for i, box in enumerate(r.boxes):
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        cls_name = model.names.get(cls_id, f"cls{cls_id}")

        # Bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), BOX_COLOR, 2)

        # Label background
        label = f"{cls_name} {conf:.2f}"
        (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(frame, (x1, y1 - lh - 8), (x1 + lw + 6, y1), LABEL_BG, -1)
        cv2.putText(frame, label, (x1 + 3, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, LABEL_FG, 1, cv2.LINE_AA)

    # Summary banner
    n = len(r.boxes)
    summary = f"YOLO: {n} speech bubble{'s' if n != 1 else ''} detected  (conf >= {conf_threshold})"
    _draw_banner(frame, summary)

    logger.info(f"[DebugViz] Drew {n} detections onto panel image.")
    return _encode_png(frame)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _draw_banner(frame: np.ndarray, text: str) -> None:
    """Draw a semi-transparent info bar at the top of the image."""
    h, w = frame.shape[:2]
    bar_h = 32
    bar = frame[:bar_h].copy()
    cv2.rectangle(frame, (0, 0), (w, bar_h), (20, 20, 20), -1)
    frame[:bar_h] = cv2.addWeighted(frame[:bar_h], 0.6, bar, 0.4, 0)
    cv2.putText(frame, text, (8, 22),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (220, 220, 220), 1, cv2.LINE_AA)


def _add_no_detection_banner(frame: np.ndarray) -> np.ndarray:
    _draw_banner(frame, "YOLO: No speech bubbles detected at this confidence threshold")
    return frame


def _encode_png(frame: np.ndarray) -> bytes:
    """Encode BGR numpy array to PNG bytes."""
    success, buf = cv2.imencode(".png", frame)
    if not success:
        raise RuntimeError("cv2.imencode failed")
    return buf.tobytes()
