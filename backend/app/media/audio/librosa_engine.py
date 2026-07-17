import sys
try:
    from services.audio.librosa_engine import *
    import services.audio.librosa_engine as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.audio.librosa_engine import *
    import app.services.audio.librosa_engine as target
sys.modules[__name__] = target
