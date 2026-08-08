import sys
try:
    from services.image.ocr.ocr_engine import *
    import services.image.ocr.ocr_engine as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.image.ocr.ocr_engine import *
    import app.services.image.ocr.ocr_engine as target
sys.modules[__name__] = target
