import sys
try:
    from services.ai.skills.base import *
    import services.ai.skills.base as target
except ModuleNotFoundError:
    from app.services.ai.skills.base import *
    import app.services.ai.skills.base as target
sys.modules[__name__] = target
