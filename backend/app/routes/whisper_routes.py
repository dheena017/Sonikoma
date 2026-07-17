try:
    from api.v1.audio import *
    from api.v1.audio import whisper_router as router  # noqa: F401

except ModuleNotFoundError:
    from app.api.v1.audio import *
