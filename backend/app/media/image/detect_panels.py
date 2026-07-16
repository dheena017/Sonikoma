import sys
try:
    from services.image.detect_panels import *
    import services.image.detect_panels as target
except ModuleNotFoundError:
    from app.services.image.detect_panels import *
    import app.services.image.detect_panels as target
sys.modules[__name__] = target
