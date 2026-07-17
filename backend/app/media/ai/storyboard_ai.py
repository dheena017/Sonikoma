import sys
try:
    from services.ai.pipelines.storyboard_ai import *
    import services.ai.pipelines.storyboard_ai as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.ai.pipelines.storyboard_ai import *
    import app.services.ai.pipelines.storyboard_ai as target
sys.modules[__name__] = target
