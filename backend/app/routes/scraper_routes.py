import sys
try:
    from api.v1.scraper import *
    from api.v1.scraper import scraper_router as router
except ModuleNotFoundError:
    from app.api.v1.scraper import *
    from app.api.v1.scraper import scraper_router as router
