# Video Sub-domain (`features/video_editor/video`)

## Overview
The `video` sub-domain manages comic panel compilation, animation rendering, cinematic pan/zoom (Ken Burns), layer composites, subtitle overlays, and FFmpeg/MoviePy rendering pipelines.

## Structure
```
video/
├── __init__.py         # Unified sub-domain exports
├── README.md           # Sub-domain documentation
├── router.py           # Video APIRouter endpoints (/render and ffmpeg)
├── schemas.py          # Pydantic schemas and transition/filter types
├── service.py          # VideoService class & video_service singleton instance
└── services/           # Separated video compilation & rendering engine
    ├── frame_builder.py# Frame layout, letterboxing, blur & subtitle overlays
    ├── motion_engine.py# Cinematic camera motions (pan, zoom, camera shake)
    ├── video_compiler.py # Multi-panel sequence assembly & FFmpeg encoder
    ├── render_job.py   # Asynchronous render job workflow
    └── __init__.py     # Re-exports compiler & rendering services
```

## Usage
```python
from features.video_editor.video import video_service, video_router
from features.video_editor.video.schemas import RenderRequest

# In background worker or service:
await video_service.compile_video(panels=[...], output_filename="render.mp4")
```
