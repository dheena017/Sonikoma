import sys
try:
    from services.audio.dialogue_aligner import *
    import services.audio.dialogue_aligner as target
except ModuleNotFoundError:
    from app.services.audio.dialogue_aligner import *
    import app.services.audio.dialogue_aligner as target
sys.modules[__name__] = target
