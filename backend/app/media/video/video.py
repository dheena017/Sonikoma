import sys
try:
    from services.video.video import *
    import services.video.video as target
except (ModuleNotFoundError, ImportError):
    from app.services.video.video import *
    import app.services.video.video as target
sys.modules[__name__] = target
