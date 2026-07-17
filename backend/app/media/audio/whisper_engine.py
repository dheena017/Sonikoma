import sys
try:
    from services.audio.whisper_engine import *
    import services.audio.whisper_engine as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.audio.whisper_engine import *
    import app.services.audio.whisper_engine as target
sys.modules[__name__] = target
