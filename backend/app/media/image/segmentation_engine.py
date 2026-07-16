import sys
try:
    from services.image.segmentation_engine import *
    import services.image.segmentation_engine as target
except ModuleNotFoundError:
    from app.services.image.segmentation_engine import *
    import app.services.image.segmentation_engine as target
sys.modules[__name__] = target
