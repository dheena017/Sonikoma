import sys
try:
    from engines.stable_diffusion_engine import *
    import engines.stable_diffusion_engine as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from engines.stable_diffusion_engine import *
    import engines.stable_diffusion_engine as target
sys.modules[__name__] = target
