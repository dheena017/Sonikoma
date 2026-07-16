import sys
try:
    from api.v1.ai import *
    from api.v1.ai import ai_router as router
except ModuleNotFoundError:
    from app.api.v1.ai import *
    from app.api.v1.ai import ai_router as router
