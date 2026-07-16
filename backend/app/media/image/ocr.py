import sys
try:
    from services.image.ocr import *
    import services.image.ocr as target
except ModuleNotFoundError:
    from app.services.image.ocr import *
    import app.services.image.ocr as target
sys.modules[__name__] = target
