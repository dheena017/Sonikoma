import sys
try:
    from services.image.processing.panel_cleaner import *
    import services.image.processing.panel_cleaner as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.image.processing.panel_cleaner import *
    import app.services.image.processing.panel_cleaner as target
sys.modules[__name__] = target
