import sys
try:
    from services.ai.skills.registry import *
    import services.ai.skills.registry as target
except ModuleNotFoundError:
    from app.services.ai.skills.registry import *
    import app.services.ai.skills.registry as target
sys.modules[__name__] = target
