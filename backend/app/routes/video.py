import sys
try:
    from api.v1.video import video_router as router
    from services.video.video_service import _render_panel_segment_ffmpeg
except ModuleNotFoundError:
    from app.api.v1.video import video_router as router
    from app.services.video.video_service import _render_panel_segment_ffmpeg
