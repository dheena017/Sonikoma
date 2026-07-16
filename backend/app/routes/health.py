import sys
try:
    from api.v1.health import *
    from api.v1.health import health_router as router
except ModuleNotFoundError:
    from app.api.v1.health import *
    from app.api.v1.health import health_router as router
