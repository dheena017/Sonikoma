import sys
try:
    from engines.whisper import *
    import engines.whisper as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.engines.whisper import *
    import app.engines.whisper as target
sys.modules[__name__] = target
