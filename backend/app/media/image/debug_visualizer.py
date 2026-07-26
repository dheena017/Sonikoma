import sys
try:
    from services.image.debug_visualizer import *
    import services.image.debug_visualizer as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.image.debug_visualizer import *
    import app.services.image.debug_visualizer as target
sys.modules[__name__] = target
