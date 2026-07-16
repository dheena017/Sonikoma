import sys
try:
    from api.v1.images import *
    from api.v1.images import ocr_router as router
except ModuleNotFoundError:
    from app.api.v1.images import *
    from app.api.v1.images import ocr_router as router
