import sys
try:
    from api.v1.audio import *
    from api.v1.audio import librosa_router as router
except ModuleNotFoundError:
    from app.api.v1.audio import *
    from app.api.v1.audio import librosa_router as router
