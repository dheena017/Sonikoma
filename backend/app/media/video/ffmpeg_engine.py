import sys
try:
    from services.video.ffmpeg_engine import *
    import services.video.ffmpeg_engine as target
except (ModuleNotFoundError, ImportError):
    from app.services.video.ffmpeg_engine import *
    import app.services.video.ffmpeg_engine as target
sys.modules[__name__] = target
