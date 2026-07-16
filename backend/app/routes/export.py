import sys
try:
    from api.v1.export import *
    from api.v1.export import export_router as router
except ModuleNotFoundError:
    from app.api.v1.export import *
    from app.api.v1.export import export_router as router
