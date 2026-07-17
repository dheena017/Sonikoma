import sys
try:
    from engines.ffmpeg import *
    import engines.ffmpeg as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.engines.ffmpeg import *
    import app.engines.ffmpeg as target
sys.modules[__name__] = target
