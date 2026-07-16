import sys
try:
    from core.logging import *
    import core.logging as target
except ModuleNotFoundError:
    from app.core.logging import *
    import app.core.logging as target
sys.modules[__name__] = target
