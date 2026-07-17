try:
    from api.v1.proxy import *
    from api.v1.proxy import proxy_router as router  # noqa: F401

except ModuleNotFoundError:
    from app.api.v1.proxy import *
