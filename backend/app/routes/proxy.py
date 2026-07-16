import sys
try:
    from api.v1.proxy import *
    from api.v1.proxy import proxy_router as router
except ModuleNotFoundError:
    from app.api.v1.proxy import *
    from app.api.v1.proxy import proxy_router as router
