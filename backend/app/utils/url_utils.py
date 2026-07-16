import sys
try:
    from services.scraper.url_utils import *
    import services.scraper.url_utils as target
except ModuleNotFoundError:
    from app.services.scraper.url_utils import *
    import app.services.scraper.url_utils as target
sys.modules[__name__] = target
