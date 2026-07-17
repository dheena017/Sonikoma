try:
    from api.v1.ai import *
    from api.v1.ai import ai_router as router  # noqa: F401

except ModuleNotFoundError:
    from app.api.v1.ai import *
