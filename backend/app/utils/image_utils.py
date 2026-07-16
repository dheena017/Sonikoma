import sys
try:
    from services.image.image_utils import *
    import services.image.image_utils as target
except ModuleNotFoundError:
    from app.services.image.image_utils import *
    import app.services.image.image_utils as target
sys.modules[__name__] = target
