import sys
try:
    from core.settings import *
    import core.settings as target
except ModuleNotFoundError:
    from app.core.settings import *
    import app.core.settings as target
sys.modules[__name__] = target
