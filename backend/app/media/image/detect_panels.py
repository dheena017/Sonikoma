import sys
try:
    from services.image.panel_detection.panel_detector import *
    import services.image.panel_detection.panel_detector as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.image.panel_detection.panel_detector import *
    import app.services.image.panel_detection.panel_detector as target
sys.modules[__name__] = target
