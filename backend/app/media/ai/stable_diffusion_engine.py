import sys
try:
    from services.ai.pipelines.stable_diffusion_engine import *
    import services.ai.pipelines.stable_diffusion_engine as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.ai.pipelines.stable_diffusion_engine import *
    import app.services.ai.pipelines.stable_diffusion_engine as target
sys.modules[__name__] = target
