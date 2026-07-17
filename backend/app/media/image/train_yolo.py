import sys
try:
    from providers.vision.yolo import *
    import providers.vision.yolo as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.providers.vision.yolo import *
    import app.providers.vision.yolo as target
sys.modules[__name__] = target
