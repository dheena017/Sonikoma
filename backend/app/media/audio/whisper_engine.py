import sys
try:
    from services.audio.whisper_engine import *
    import services.audio.whisper_engine as target
except (ModuleNotFoundError, ImportError):
    from app.services.audio.whisper_engine import *
    import app.services.audio.whisper_engine as target
sys.modules[__name__] = target
