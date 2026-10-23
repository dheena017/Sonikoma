"""
backend/app/services/image/layer_separation/sam.py
─────────────────────────────────────────────────────────────────────────────
SAM 2 (Segment Anything Model 2) & U-2-Net Vision Segmentation:
- Next-generation promptable comic artwork and character layer segmentation
- Bounding-box and point-guided character cutout extraction
- Zero-shot foreground silhouette generation
- Seamless fallback cascade: SAM 2 -> MobileSAM / SAM -> U-2-Net (rembg)
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import logging
from typing import Optional, List, Union, Tuple, Any
from PIL import Image
import numpy as np
import cv2

logger = logging.getLogger("sonikoma.services.image.layer_separation.sam")

_sam_model = None
_rembg_session = None
_rembg_remove_fn = None
has_rembg = True
has_sam = False

try:
    from ultralytics import SAM
    has_sam = True
except (ImportError, Exception):
    has_sam = False


# ─────────────────────────────────────────────────────────────────────────────
# 1. SAM 2 & SAM Model Management
# ─────────────────────────────────────────────────────────────────────────────

def get_sam_model(model_name: Optional[str] = None):
    """
    Lazily initializes and caches the Segment Anything Model (SAM 2 / SAM).
    Supported variants:
    - 'sam2_b.pt' / 'sam2_t.pt': SAM 2 (Segment Anything Model 2)
    - 'mobile_sam.pt': Ultra-lightweight MobileSAM for CPU environments
    - 'sam_b.pt': Classic SAM base
    """
    global _sam_model
    if _sam_model is not None:
        return _sam_model

    if not has_sam:
        logger.debug("[SAM Engine] Ultralytics SAM is not installed.")
        return None

    target_model = model_name or os.getenv("SAM_MODEL_NAME", "sam2_t.pt")

    # Search paths for local weights:
    search_paths = [
        target_model,
        os.path.join(os.getcwd(), target_model),
    ]
    try:
        from database.config import DATA_DIR, _BACKEND_ROOT as base_dir
        search_paths.append(os.path.join(base_dir, target_model))
        search_paths.append(os.path.join(DATA_DIR, "models", target_model))
    except Exception:
        pass

    try:
        from app.core.config import MODELS_DIR
        search_paths.append(os.path.join(MODELS_DIR, target_model))
    except Exception:
        pass

    candidate_path = target_model
    for p in search_paths:
        if os.path.exists(p):
            candidate_path = p
            break

    try:
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"[SAM Engine] Loading SAM model '{target_model}' on device='{device}'...")
        _sam_model = SAM(candidate_path)
        logger.info(f"[SAM Engine] Successfully loaded SAM model (is_sam2={getattr(_sam_model, 'is_sam2', False)})")
        return _sam_model
    except Exception as e:
        logger.warning(f"[SAM Engine] Failed to load SAM model '{target_model}': {e}. Falling back to lightweight SAM/U-2-Net.")
        # If SAM 2 download failed, attempt MobileSAM fallback
        if target_model != "mobile_sam.pt":
            try:
                logger.info("[SAM Engine] Attempting MobileSAM fallback...")
                _sam_model = SAM("mobile_sam.pt")
                return _sam_model
            except Exception as e2:
                logger.warning(f"[SAM Engine] MobileSAM fallback also unavailable: {e2}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 2. SAM 2 Promptable Mask Segmentation
# ─────────────────────────────────────────────────────────────────────────────

def segment_with_sam(
    image_input: Union[Image.Image, np.ndarray, str],
    bboxes: Optional[List[List[int]]] = None,
    points: Optional[List[List[int]]] = None,
    labels: Optional[List[int]] = None,
    conf_threshold: float = 0.25,
) -> Optional[np.ndarray]:
    """
    Executes SAM 2 / SAM promptable segmentation on an image:
    - bboxes: List of bounding boxes [[x1, y1, x2, y2], ...] to segment
    - points: List of coordinates [[x, y], ...] for positive/negative guidance
    - labels: List of point labels (1 for foreground, 0 for background)
    
    Returns a single-channel binary mask (uint8, 255 for selected subject, 0 for background).
    """
    model = get_sam_model()
    if model is None:
        return None

    try:
        # Normalize input to numpy array / PIL
        if isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB")
            np_img = np.array(pil_img)
        elif isinstance(image_input, np.ndarray):
            np_img = image_input
            if np_img.ndim == 2:
                np_img = cv2.cvtColor(np_img, cv2.COLOR_GRAY2RGB)
            elif np_img.shape[2] == 4:
                np_img = cv2.cvtColor(np_img, cv2.COLOR_BGRA2RGB)
            elif np_img.shape[2] == 3:
                np_img = cv2.cvtColor(np_img, cv2.COLOR_BGR2RGB)
        elif isinstance(image_input, str):
            np_img = cv2.imread(image_input)
            if np_img is None:
                return None
            np_img = cv2.cvtColor(np_img, cv2.COLOR_BGR2RGB)
        else:
            return None

        h, w = np_img.shape[:2]
        predict_kwargs = {"verbose": False}

        if bboxes and len(bboxes) > 0:
            predict_kwargs["bboxes"] = bboxes
        if points and len(points) > 0:
            predict_kwargs["points"] = points
            if labels and len(labels) == len(points):
                predict_kwargs["labels"] = labels
            else:
                predict_kwargs["labels"] = [1] * len(points)

        results = model.predict(np_img, **predict_kwargs)
        if not results or len(results) == 0:
            return None

        result = results[0]
        if not hasattr(result, "masks") or result.masks is None or len(result.masks) == 0:
            return None

        combined_mask = np.zeros((h, w), dtype=np.uint8)
        mask_data = result.masks.data.cpu().numpy()

        for m in mask_data:
            # Resize mask to original image dimensions if necessary
            if m.shape[:2] != (h, w):
                m_resized = cv2.resize((m > 0.5).astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
            else:
                m_resized = (m > 0.5).astype(np.uint8)
            combined_mask = cv2.bitwise_or(combined_mask, (m_resized * 255).astype(np.uint8))

        return combined_mask
    except Exception as e:
        logger.warning(f"[SAM Engine] Segmentation inference error: {e}")
        return None


def segment_character_sam(
    pil_img: Image.Image,
    bboxes: Optional[List[List[int]]] = None,
) -> Optional[Image.Image]:
    """
    Applies SAM 2 promptable segmentation to isolate character(s)/subject(s).
    Returns an RGBA PIL Image where background pixels have alpha = 0.
    """
    mask = segment_with_sam(pil_img, bboxes=bboxes)
    if mask is None or np.sum(mask > 0) == 0:
        return None

    rgb_img = pil_img.convert("RGB")
    rgba_np = np.array(rgb_img)
    alpha = mask.copy()

    # Smooth the alpha boundary slightly to remove edge aliasing
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)

    rgba_out = np.dstack((rgba_np, alpha))
    return Image.fromarray(rgba_out, "RGBA")


# ─────────────────────────────────────────────────────────────────────────────
# 3. U-2-Net (rembg) Legacy Fallback
# ─────────────────────────────────────────────────────────────────────────────

def _load_rembg():
    global _rembg_remove_fn
    try:
        from rembg import remove as rembg_remove
        from rembg import new_session
        _rembg_remove_fn = rembg_remove
        return rembg_remove, new_session
    except (Exception, BaseException, SystemExit):
        return None, None


def get_rembg_session():
    global _rembg_session, _rembg_remove_fn
    if _rembg_session is None:
        rembg_remove, new_session = _load_rembg()
        if new_session is None:
            logger.warning(
                "rembg/onnxruntime is not installed. Character segmentation will return a blank layer."
            )
            return None
        try:
            import torch
            use_gpu = torch.cuda.is_available()
        except ImportError:
            use_gpu = False
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if use_gpu else ["CPUExecutionProvider"]
        try:
            _rembg_session = new_session("u2net", providers=providers)
        except Exception as e:
            logger.warning(f"[rembg] Session creation failed: {e}")
            _rembg_session = None
    return _rembg_session


def segment_character_u2net(pil_img: Image.Image) -> Optional[Image.Image]:
    """
    Applies U-2-Net based background removal (rembg) to isolate characters/subjects.
    Returns the isolated character as an RGBA PIL Image, or None if rembg is unavailable.
    """
    session = get_rembg_session()
    if session is None or _rembg_remove_fn is None:
        return None
    try:
        return _rembg_remove_fn(pil_img, session=session)
    except Exception as e:
        logger.warning(f"[rembg] Background removal execution failed: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 4. Unified Character Layer Segmentation (SAM 2 -> U-2-Net)
# ─────────────────────────────────────────────────────────────────────────────

def segment_character_layer(
    pil_img: Image.Image,
    bboxes: Optional[List[List[int]]] = None,
) -> Optional[Image.Image]:
    """
    Unified subject extraction for comic layer decomposition:
    1. Attempts SAM 2 / SAM segmentation (with prompt bounding boxes if provided).
    2. Falls back to U-2-Net (rembg) if SAM is unavailable.
    Returns isolated RGBA PIL image or None.
    """
    if has_sam:
        sam_result = segment_character_sam(pil_img, bboxes=bboxes)
        if sam_result is not None:
            logger.info("[Character Segmentation] Successfully extracted layer using SAM/SAM 2.")
            return sam_result

    # Fallback to U-2-Net
    return segment_character_u2net(pil_img)

