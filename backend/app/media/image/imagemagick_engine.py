import sys
try:
    from services.image.providers.imagemagick import *
    import services.image.providers.imagemagick as target
except (ModuleNotFoundError, ImportError):
    from app.services.image.providers.imagemagick import *
    import app.services.image.providers.imagemagick as target
sys.modules[__name__] = target
