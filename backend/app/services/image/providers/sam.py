import logging
from typing import Optional
from PIL import Image

logger = logging.getLogger("sonikoma.services.image.providers.sam")

# Try importing dependencies safely
try:
    from rembg import remove as rembg_remove
    from rembg import new_session
    has_rembg = True
except ImportError:
    has_rembg = False
    logger.warning(
        "rembg is not installed. Character segmentation will return a blank layer. "
        "To enable character segmentation, install rembg: `pip install rembg`"
    )

# Initialize a global rembg session for U-2-Net model to prevent reloading it per request
_rembg_session = None

def get_rembg_session():
    global _rembg_session
    if _rembg_session is None and has_rembg:
        logger.info("Initializing rembg session (U-2-Net)")
        try:
            import torch
            use_gpu = torch.cuda.is_available()
        except ImportError:
            use_gpu = False
        # Rembg takes a list of ONNX Runtime execution providers
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if use_gpu else ["CPUExecutionProvider"]
        _rembg_session = new_session("u2net", providers=providers)
    return _rembg_session

def segment_character_u2net(pil_img: Image.Image) -> Optional[Image.Image]:
    """
    Applies U-2-Net based background removal (rembg) to isolate characters/subjects.
    Returns the isolated character as an RGBA PIL Image, or None if rembg is unavailable.
    """
    if not has_rembg:
        return None
    session = get_rembg_session()
    return rembg_remove(pil_img, session=session)
