"""
backend/app/api/router.py
─────────────────────────────────────────────────────────────────────────────
Consolidated API router registry & static mount manager.
Aggregates all v1 sub-routers, mounts media directories, and handles SPA fallback.
─────────────────────────────────────────────────────────────────────────────
"""

import os
from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse

from app.core.config import PROJECT_ROOT, IS_PRODUCTION
from app.core.logging import logger

# Import all specific sub-routers directly from their router modules
from api.v1.auth.router import auth_router
from api.v1.projects.router import project_router, panel_router
from api.v1.images.router import image_router, cleaner_router, imagemagick_router
from api.v1.video.router import video_router, ffmpeg_router
from api.v1.ai.router import ai_router, stable_diffusion_router
from api.v1.scraper import scraper_router
from api.v1.export.router import export_router
from api.v1.health import health_router
from api.v1.proxy import proxy_router
from api.v1.audio import audio_router, librosa_router, whisper_router
from api.v1.compound import compound_router

api_router = APIRouter()

# Include all sub-routers with exact prefixes matching application contracts
api_router.include_router(health_router,         prefix="/api", tags=["Health & System"])
api_router.include_router(auth_router,           prefix="/api/auth")
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


def register_routers(app: FastAPI):
    """Registers API routers and static mounts onto the FastAPI application."""
    # Include main API router
    app.include_router(api_router)

    # Serve generated videos (public static mount)
    videos_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "media"))
    os.makedirs(videos_path, exist_ok=True)
    app.mount("/videos", StaticFiles(directory=videos_path), name="videos")

    # Serve locally generated panel layer WebPs
    local_media_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "local_media"))
    os.makedirs(local_media_dir, exist_ok=True)
    app.mount("/media", StaticFiles(directory=local_media_dir), name="media")

    # Serve locally saved training data
    training_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "training_data"))
    os.makedirs(training_data_dir, exist_ok=True)
    app.mount("/training_data", StaticFiles(directory=training_data_dir), name="training_data")

    # Static Frontend Serving (Production Only)
    dist_path = os.path.join(PROJECT_ROOT, "dist")
    repo_root = os.path.abspath(os.path.join(PROJECT_ROOT, ".."))
    frontend_dist_path = os.path.join(repo_root, "frontend", "dist")
    if IS_PRODUCTION:
        if os.path.exists(dist_path):
            logger.info(f"Mounting static files directory: {dist_path}")
            app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
        elif os.path.exists(frontend_dist_path):
            logger.info(f"Mounting static files directory from frontend build: {frontend_dist_path}")
            app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="static")
        else:
            logger.warning(
                "Production mode active but no frontend build folder was found. "
                f"Checked: {dist_path} and {frontend_dist_path}"
            )

    # Root redirect
    @app.get("/", include_in_schema=False)
    async def root_redirect():
        return RedirectResponse(url="/api/health")

    # SPA Fallback Route for client-side routing
    @app.get("/{fallback_path:path}", include_in_schema=False)
    async def spa_fallback(fallback_path: str):
        index_file = None
        if IS_PRODUCTION:
            if os.path.exists(os.path.join(dist_path, "index.html")):
                index_file = os.path.join(dist_path, "index.html")
            elif os.path.exists(os.path.join(frontend_dist_path, "index.html")):
                index_file = os.path.join(frontend_dist_path, "index.html")

        if index_file:
            return FileResponse(index_file)

        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": f"Route not found: {fallback_path}",
                "hint": "Ensure the API prefix is correct (/api/...) or check health check."
            }
        )
