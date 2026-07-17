import sys
try:
    from providers.media.imagemagick import *
    import providers.media.imagemagick as target
except (ModuleNotFoundError, ImportError) as __e:
    if 'services' not in str(__e):
        raise
    from providers.media.imagemagick import *
    import providers.media.imagemagick as target
sys.modules[__name__] = target
