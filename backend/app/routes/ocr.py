try:
    from api.v1.images import *
    from api.v1.images import ocr_router as router  # noqa: F401

except ModuleNotFoundError:
    from app.api.v1.images import *
