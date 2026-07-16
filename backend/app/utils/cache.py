import sys
try:
    from core.cache import *
    import core.cache as target
except ModuleNotFoundError:
    from app.core.cache import *
    import app.core.cache as target
sys.modules[__name__] = target
