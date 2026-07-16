import sys
try:
    from api.v1.compound import *
    from api.v1.compound import compound_router as router
except ModuleNotFoundError:
    from app.api.v1.compound import *
    from app.api.v1.compound import compound_router as router
