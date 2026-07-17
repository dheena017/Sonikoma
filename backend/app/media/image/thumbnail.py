import sys
try:
    from services.image.thumbnail import *
    import services.image.thumbnail as target
except (ModuleNotFoundError, ImportError):
    from app.services.image.thumbnail import *
    import app.services.image.thumbnail as target
sys.modules[__name__] = target
