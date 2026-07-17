try:
    from api.v1.scraper import *
    from api.v1.scraper import scraper_router as router  # noqa: F401

except ModuleNotFoundError:
    from app.api.v1.scraper import *
