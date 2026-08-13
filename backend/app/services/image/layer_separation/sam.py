"""
backend/app/services/image/layer_separation/sam.py
─────────────────────────────────────────────────────────────────────────────
U-2-Net and SAM (Segment Anything) Vision Segmentation for comic character layers.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from PIL import Image

logger = logging.getLogger("sonikoma.services.image.layer_separation.sam")

_rembg_session = None
_rembg_remove_fn = None
has_rembg = True


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
        logger.debug("Initializing rembg session (U-2-Net)")
        try:
            import torch
            use_gpu = torch.cuda.is_available()
        except ImportError:
            use_gpu = False
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if use_gpu else ["CPUExecutionProvider"]
        _rembg_session = new_session("u2net", providers=providers)
    return _rembg_session


def segment_character_u2net(pil_img: Image.Image) -> Optional[Image.Image]:
    """
    Applies U-2-Net based background removal (rembg) to isolate characters/subjects.
    Returns the isolated character as an RGBA PIL Image, or None if rembg is unavailable.
    """
    session = get_rembg_session()
    if session is None or _rembg_remove_fn is None:
        return None
    return _rembg_remove_fn(pil_img, session=session)
