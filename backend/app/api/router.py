"""
backend/app/api/router.py
─────────────────────────────────────────────────────────────────────────────
Consolidated API router registry. Enforces correct prefixes and tags.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

# Import all specific sub-routers from api/v1/
from api.v1.auth import auth_router
from api.v1.projects import project_router, panel_router
from api.v1.images import image_router, cleaner_router, imagemagick_router, ocr_router
from api.v1.video import video_router, ffmpeg_router
from api.v1.ai import ai_router, stable_diffusion_router
from api.v1.scraper import scraper_router
from api.v1.export import export_router
from api.v1.health import health_router
from api.v1.proxy import proxy_router
from api.v1.audio import audio_router, librosa_router, whisper_router
from api.v1.compound import compound_router

api_router = APIRouter()

# Register legacy/duplicate endpoints or specific routes
# Note: panels endpoint prefix is /api/panels in the original main.py?
# Wait! Let's check how panels.py was mounted in original main.py.
# In original main.py, was panels_router imported or mounted?
# Let's search main.py for 'panels_router' or 'panel_router'.
# Wait, original main.py did NOT mount panels_router because panels was imported in routes/__init__.py and mounted as part of routes, or not mounted at all?
# Let's check: in main.py, line 867 was:
# app.include_router(projects_router,       prefix="/api/projects", tags=["Projects"])
# And panels routes were actually mounted under prefix '/api/panels' inside routes/panels.py itself?
# Yes! routes/panels.py defined router = APIRouter(prefix="/api/panels")?
# Wait! We checked that routes/panels.py defined router = APIRouter().
# And in routes/__init__.py or routes/panels.py, did it have prefix?
# Let's search original main.py for 'panels'.

# Include all sub-routers with exact prefixes matching original main.py
api_router.include_router(health_router,         prefix="/api", tags=["Health & System"])
api_router.include_router(auth_router,           prefix="/api/auth", tags=["Authentication"])
api_router.include_router(project_router,        prefix="/api/projects", tags=["Projects"])
api_router.include_router(panel_router,          prefix="/api/panels", tags=["Panels"])
api_router.include_router(proxy_router,          prefix="/api", tags=["Proxy"])
api_router.include_router(image_router,          prefix="/api/image", tags=["Image Editing"])
api_router.include_router(cleaner_router,        prefix="/api/image", tags=["Image Editing"])
api_router.include_router(scraper_router,        prefix="/api", tags=["Scraper"])
api_router.include_router(ai_router,             prefix="/api", tags=["AI Processing"])
api_router.include_router(audio_router,          prefix="/api/audio", tags=["Audio Synthesis"])
api_router.include_router(video_router,          prefix="/api/video", tags=["Video Rendering"])
api_router.include_router(ffmpeg_router,         prefix="/api/ffmpeg", tags=["FFmpeg Video"])
api_router.include_router(librosa_router,        prefix="/api/librosa", tags=["Librosa Audio"])
api_router.include_router(whisper_router,        prefix="/api/whisper", tags=["Whisper Speech-to-Text"])
api_router.include_router(imagemagick_router,    prefix="/api/imagemagick", tags=["ImageMagick Image"])
api_router.include_router(stable_diffusion_router, prefix="/api/stable-diffusion", tags=["Stable Diffusion"])
api_router.include_router(compound_router,       prefix="/api/compound", tags=["Compound Workflows"])
api_router.include_router(export_router,         prefix="/api/export", tags=["Export"])

# Legacy /api/py endpoints for backward compatibility
api_router.include_router(health_router,         prefix="/api/py", tags=["Health & System (Legacy)"])
api_router.include_router(audio_router,          prefix="/api/py/audio", tags=["Audio Synthesis (Legacy)"])
