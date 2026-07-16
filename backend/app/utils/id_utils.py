import sys
try:
    from core.utils.id_utils import *
    import core.utils.id_utils as target
except ModuleNotFoundError:
    from app.core.utils.id_utils import *
    import app.core.utils.id_utils as target
sys.modules[__name__] = target
