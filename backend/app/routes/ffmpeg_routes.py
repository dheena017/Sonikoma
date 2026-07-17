import sys
try:
    from api.v1.video import ffmpeg_router as router
except ModuleNotFoundError:
    from app.api.v1.video import ffmpeg_router as router
