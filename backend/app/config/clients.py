import sys
try:
    from core.config import *
    import core.config as target
except ModuleNotFoundError:
    from app.core.config import *
    import app.core.config as target
sys.modules[__name__] = target
