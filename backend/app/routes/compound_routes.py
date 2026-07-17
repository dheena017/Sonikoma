try:
    from api.v1.compound import *
    from api.v1.compound import compound_router as router  # noqa: F401

except ModuleNotFoundError:
    from app.api.v1.compound import *
