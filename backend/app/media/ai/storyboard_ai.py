import sys
try:
    from services.ai.pipelines.storyboard_ai import *
    import services.ai.pipelines.storyboard_ai as target
except ModuleNotFoundError:
    from app.services.ai.pipelines.storyboard_ai import *
    import app.services.ai.pipelines.storyboard_ai as target
sys.modules[__name__] = target
