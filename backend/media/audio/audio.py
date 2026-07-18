import sys
try:
    from services.audio.audio_service import *
    import services.audio.audio_service as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.audio.audio_service import *
    import app.services.audio.audio_service as target
sys.modules[__name__] = target
