import sys
try:
    from services.image.providers.yolo import *
    import services.image.providers.yolo as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.image.providers.yolo import *
    import app.services.image.providers.yolo as target
sys.modules[__name__] = target
