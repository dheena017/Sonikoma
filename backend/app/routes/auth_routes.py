import sys
try:
    from api.v1.auth import *
    from api.v1.auth import auth_router as router
except ModuleNotFoundError:
    from app.api.v1.auth import *
    from app.api.v1.auth import auth_router as router
