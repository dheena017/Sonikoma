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

from app.startup import PROJECT_ROOT, IS_PRODUCTION, logger
from api.router import api_router


def register_routers(app: FastAPI):
    # Include main API router
    app.include_router(api_router)

    # Serve generated videos
    videos_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "media"))
    os.makedirs(videos_path, exist_ok=True)
    app.mount("/videos", StaticFiles(directory=videos_path), name="videos")

    # Serve locally generated panel layer WebPs (development bypass)
    local_media_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "local_media"))
    os.makedirs(local_media_dir, exist_ok=True)
    app.mount("/media", StaticFiles(directory=local_media_dir), name="media")

    # Serve locally saved training data (Data Flywheel)
    training_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "training_data"))
    os.makedirs(training_data_dir, exist_ok=True)
    app.mount("/training_data", StaticFiles(directory=training_data_dir), name="training_data")

    # Static Frontend Serving (Production Only)
    possible_dist_paths = [
        os.path.join(PROJECT_ROOT, "frontend", "dist"),
        os.path.join(PROJECT_ROOT, "dist"),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist")),
    ]
    dist_path = next((p for p in possible_dist_paths if os.path.exists(p)), None)

    if IS_PRODUCTION and dist_path:
        logger.info(f"Mounting static frontend directory: {dist_path}")
        assets_dir = os.path.join(dist_path, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    elif IS_PRODUCTION:
        logger.info("[INFO] Static dist folder not found. Running in API-only mode.")

    # Root redirect (matches Express server behaviour & Render health check)
    @app.get("/", include_in_schema=False)
    async def root_redirect():
        if dist_path and os.path.exists(os.path.join(dist_path, "index.html")):
            return FileResponse(os.path.join(dist_path, "index.html"))
        return RedirectResponse(url="/api/health")

    # SPA Fallback Route for client-side routing
    @app.get("/{fallback_path:path}", include_in_schema=False)
    async def spa_fallback(fallback_path: str):
        if dist_path and os.path.exists(os.path.join(dist_path, "index.html")):
            return FileResponse(os.path.join(dist_path, "index.html"))
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": f"Route not found: {fallback_path}",
                "hint": "Ensure the API prefix is correct (/api/...) or check health check at /api/health."
            }
        )
