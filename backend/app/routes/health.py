try:
    from api.v1.health import *
    from api.v1.health import health_router as router  # noqa: F401

except ModuleNotFoundError:
    from app.api.v1.health import *
