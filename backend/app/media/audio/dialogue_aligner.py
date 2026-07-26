import sys
try:
    from services.audio.dialogue_aligner_impl import *
    import services.audio.dialogue_aligner_impl as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.audio.dialogue_aligner_impl import *
    import app.services.audio.dialogue_aligner_impl as target
sys.modules[__name__] = target
