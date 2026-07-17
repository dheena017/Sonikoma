import sys
try:
    from services.image.cleaner import *
    import services.image.cleaner as target
except (ModuleNotFoundError, ImportError):
    from app.services.image.cleaner import *
    import app.services.image.cleaner as target
sys.modules[__name__] = target
