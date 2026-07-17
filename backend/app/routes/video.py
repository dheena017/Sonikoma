try:
    from api.v1.video import video_router as router  # noqa: F401

    from services.video.video_service import _render_panel_segment_ffmpeg  # noqa: F401

except ModuleNotFoundError:
    pass
