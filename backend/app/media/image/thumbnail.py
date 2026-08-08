import sys
try:
    from services.image.thumbnails.thumbnail_generator import *
    import services.image.thumbnails.thumbnail_generator as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from app.services.image.thumbnails.thumbnail_generator import *
    import app.services.image.thumbnails.thumbnail_generator as target
sys.modules[__name__] = target
