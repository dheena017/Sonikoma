import sys
try:
    from services.image.layer_segmentation import *
    import services.image.layer_segmentation as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.image.layer_segmentation import *
    import app.services.image.layer_segmentation as target
sys.modules[__name__] = target
