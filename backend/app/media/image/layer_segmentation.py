import sys
try:
    from services.image.layer_segmentation import *
    import services.image.layer_segmentation as target
except (ModuleNotFoundError, ImportError):
    from app.services.image.layer_segmentation import *
    import app.services.image.layer_segmentation as target
sys.modules[__name__] = target
