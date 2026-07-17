import sys
try:
    from engines.librosa import *
    import engines.librosa as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.engines.librosa import *
    import app.engines.librosa as target
sys.modules[__name__] = target
