import sys
try:
    from services.audio.audio import *
    import services.audio.audio as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.audio.audio import *
    import app.services.audio.audio as target
sys.modules[__name__] = target
