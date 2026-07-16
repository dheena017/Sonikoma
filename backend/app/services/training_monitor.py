import sys
try:
    from services.training.training_monitor import *
    import services.training.training_monitor as target
except ModuleNotFoundError:
    from app.services.training.training_monitor import *
    import app.services.training.training_monitor as target
sys.modules[__name__] = target
