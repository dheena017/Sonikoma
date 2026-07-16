import sys
try:
    from api.v1.videos import *
    from api.v1.videos import ffmpeg_router as router
except ModuleNotFoundError:
    from app.api.v1.videos import *
    from app.api.v1.videos import ffmpeg_router as router
