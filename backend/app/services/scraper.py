import sys
try:
    from services.scraper.scraper import *
    import services.scraper.scraper as target
except ModuleNotFoundError:
    from app.services.scraper.scraper import *
    import app.services.scraper.scraper as target
sys.modules[__name__] = target
