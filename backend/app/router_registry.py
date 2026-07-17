"""
backend/app/router_registry.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma FastAPI Router & Static Mount Registry
─────────────────────────────────────────────────────────────────────────────
"""

import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse

from startup import PROJECT_ROOT, IS_PRODUCTION, logger
from api.router import api_router
from api.v1.images import get_cached_stitch  # Preserved import


def register_routers(app: FastAPI):
    # Include main API router
    app.include_router(api_router)

    # Serve generated videos
    videos_path = os.path.abspath(os.path.join(PROJECT_ROOT, "data", "media"))
    os.makedirs(videos_path, exist_ok=True)
    app.mount("/videos", StaticFiles(directory=videos_path), name="videos")

    # Serve locally generated panel layer WebPs (development bypass)
    local_media_dir = os.path.abspath(os.path.join(PROJECT_ROOT, "data", "local_media"))
    os.makedirs(local_media_dir, exist_ok=True)
    app.mount("/media", StaticFiles(directory=local_media_dir), name="media")

    # Serve locally saved training data (Data Flywheel)
    training_data_dir = os.path.abspath(os.path.join(PROJECT_ROOT, "data", "training_data"))
    os.makedirs(training_data_dir, exist_ok=True)
    app.mount("/training_data", StaticFiles(directory=training_data_dir), name="training_data")

    # Static Frontend Serving (Production Only)
    dist_path = os.path.join(PROJECT_ROOT, "dist")
    if IS_PRODUCTION:
        if os.path.exists(dist_path):
            logger.info(f"Mounting static files directory: {dist_path}")
            app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
        else:
            logger.warning(f"Production mode active but dist folder not found at: {dist_path}")

    # Root redirect (matches Express server behaviour)
    @app.get("/", include_in_schema=False)
    async def root_redirect():
        return RedirectResponse(url="/api/health")

    # SPA Fallback Route for client-side routing
    @app.get("/{fallback_path:path}", include_in_schema=False)
    async def spa_fallback(fallback_path: str):
        if IS_PRODUCTION and os.path.exists(os.path.join(dist_path, "index.html")):
            return FileResponse(os.path.join(dist_path, "index.html"))
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": f"Route not found: {fallback_path}",
                "hint": "Ensure the API prefix is correct (/api/...) or check health check."
            }
        )
