import sys
try:
    from api.v1.projects import *
    from api.v1.projects import panel_router as router
except ModuleNotFoundError:
    from app.api.v1.projects import *
    from app.api.v1.projects import panel_router as router
