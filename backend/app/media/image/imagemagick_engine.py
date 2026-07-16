import sys
try:
    from services.image.imagemagick_engine import *
    import services.image.imagemagick_engine as target
except ModuleNotFoundError:
    from app.services.image.imagemagick_engine import *
    import app.services.image.imagemagick_engine as target
sys.modules[__name__] = target
