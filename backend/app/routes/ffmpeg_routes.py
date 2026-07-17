try:
    from api.v1.video import ffmpeg_router as router  # noqa: F401

except ModuleNotFoundError:
    pass
