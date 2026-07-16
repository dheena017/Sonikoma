import sys
try:
    from services.image.train_yolo import *
    import services.image.train_yolo as target
except ModuleNotFoundError:
    from app.services.image.train_yolo import *
    import app.services.image.train_yolo as target
sys.modules[__name__] = target
