import sys
try:
    from services.compound.compound_processor import *
    import services.compound.compound_processor as target
except ModuleNotFoundError:
    from app.services.compound.compound_processor import *
    import app.services.compound.compound_processor as target
sys.modules[__name__] = target
