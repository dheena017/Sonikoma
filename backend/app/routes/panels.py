try:
    from api.v1.projects import *
    from api.v1.projects import panel_router as router  # noqa: F401

except ModuleNotFoundError:
    from app.api.v1.projects import *
