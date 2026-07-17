import sys
try:
    from services.audio.audio import *
    import services.audio.audio as target
except (ModuleNotFoundError, ImportError):
    from app.services.audio.audio import *
    import app.services.audio.audio as target
sys.modules[__name__] = target
