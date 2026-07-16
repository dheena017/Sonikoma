import sys
try:
    from api.v1.videos import *
    from api.v1.videos import video_router as router
    from api.v1.videos import _render_panel_segment_ffmpeg
except ModuleNotFoundError:
    from app.api.v1.videos import *
    from app.api.v1.videos import video_router as router
    from app.api.v1.videos import _render_panel_segment_ffmpeg
