import sys
try:
    from core.system import *
    import core.system as target
except ModuleNotFoundError:
    from app.core.system import *
    import app.core.system as target
sys.modules[__name__] = target
