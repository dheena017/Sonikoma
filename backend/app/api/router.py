"""
backend/app/api/router.py
─────────────────────────────────────────────────────────────────────────────
Consolidated API router registry & static mount manager.
Aggregates all v1 sub-routers, mounts media directories, and handles SPA fallback.
─────────────────────────────────────────────────────────────────────────────
"""

import os
from fastapi import FastAPI, APIRouter, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse

from app.core.config import PROJECT_ROOT, IS_PRODUCTION
from app.core.logging import logger

# Import all specific sub-routers directly from their modules
from api.v1.auth.router import auth_router
from api.v1.projects.router import project_router
from api.v1.scraper import scraper_router
from api.v1.proxy import proxy_router
from api.v1.panels.router import panels_router
from api.v1.ocr.router import ocr_router
from api.v1.storyboard.router import storyboard_router
from api.v1.ai.router import ai_router
from api.v1.images.router import image_router
from api.v1.audio import audio_router
from api.v1.video.router import video_router
from api.v1.jobs import jobs_router
from api.v1.export.router import export_router
from api.v1.health import health_router

api_router = APIRouter()

# ── Canonical Versioned Endpoints (Single Source of Truth in OpenAPI Docs) ───
api_router.include_router(auth_router,           prefix="/api/v1/auth")
api_router.include_router(project_router,        prefix="/api/v1/projects", tags=["02. Projects & Workspace"])
api_router.include_router(scraper_router,        prefix="/api/v1/scraper", tags=["03. Webtoon Scraping"])
api_router.include_router(proxy_router,          prefix="/api/v1/proxy", tags=["03. Webtoon Scraping"])
api_router.include_router(panels_router,         prefix="/api/v1/panels", tags=["04. Panel Splitting"])
api_router.include_router(ocr_router,            prefix="/api/v1/ocr", tags=["05. OCR & Speech Extraction"])
api_router.include_router(storyboard_router,     prefix="/api/v1/storyboard", tags=["06. Storyboard AI"])
api_router.include_router(ai_router,             prefix="/api/v1/ai")
api_router.include_router(image_router,          prefix="/api/v1/images", tags=["08. Image Canvas & Editing"])
api_router.include_router(audio_router,          prefix="/api/v1/audio", tags=["09. Audio Synthesis"])
api_router.include_router(video_router,          prefix="/api/v1/video", tags=["10. Video Rendering Engine"])
api_router.include_router(jobs_router,           prefix="/api/v1/jobs", tags=["11. Background Jobs"])
api_router.include_router(export_router,         prefix="/api/v1/export", tags=["12. Export & Archiving"])
api_router.include_router(health_router,         prefix="/api/v1/system", tags=["13. System Health & Telemetry"])




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

    # Serve Playwright Interactive Test Reports & Trace Artifacts
    e2e_report_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "e2e", "playwright-report"))
    fallback_report_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "playwright-report"))
    playwright_report_dir = e2e_report_dir if os.path.exists(e2e_report_dir) else fallback_report_dir
    os.makedirs(playwright_report_dir, exist_ok=True)
    app.mount("/playwright-report", StaticFiles(directory=playwright_report_dir, html=True), name="playwright_report")
    
    trace_dir = os.path.join(playwright_report_dir, "trace")
    if os.path.exists(trace_dir):
        app.mount("/trace", StaticFiles(directory=trace_dir, html=True), name="trace_viewer")
        
    data_dir = os.path.join(playwright_report_dir, "data")
    if os.path.exists(data_dir):
        app.mount("/data", StaticFiles(directory=data_dir), name="trace_data")

    # Static Frontend Serving & SPA Support
    frontend_dist_path = os.path.abspath(os.path.join(PROJECT_ROOT, "frontend", "dist"))
    dist_path = os.path.abspath(os.path.join(PROJECT_ROOT, "dist"))

    active_dist = None
    if os.path.exists(frontend_dist_path):
        active_dist = frontend_dist_path
        logger.info(f"Frontend SPA dist located: {frontend_dist_path}")
    elif os.path.exists(dist_path):
        active_dist = dist_path
        logger.info(f"Root dist located: {dist_path}")

    if active_dist:
        assets_dir = os.path.join(active_dist, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="spa_assets")

    # Root route - serve SPA frontend if available
    @app.get("/", include_in_schema=False)
    async def root_redirect(request: Request):
        if active_dist:
            index_file = os.path.join(active_dist, "index.html")
            if os.path.exists(index_file):
                return FileResponse(index_file)
        accept_header = request.headers.get("accept", "")
        if "text/html" in accept_header:
            return RedirectResponse(url="/api/v1/docs")
        return RedirectResponse(url="/api/v1/system/health")

    # SPA Fallback Route for client-side routing & browser navigation (/workspace/*, /editor/*, etc.)
    @app.get("/{fallback_path:path}", include_in_schema=False)
    async def spa_fallback(request: Request, fallback_path: str):
        if active_dist:
            # 1. Direct static file check
            target_file = os.path.join(active_dist, fallback_path)
            if os.path.isfile(target_file):
                return FileResponse(target_file)
            
            # 2. SPA client-side route fallback to index.html
            index_file = os.path.join(active_dist, "index.html")
            if os.path.isfile(index_file):
                return FileResponse(index_file)

        # 3. If accessed from a browser (HTML accept header), redirect to interactive Swagger docs
        accept_header = request.headers.get("accept", "")
        if "text/html" in accept_header:
            return RedirectResponse(url="/api/v1/docs")

        # 4. Return structured JSON with documentation hints
        clean_path = fallback_path.lstrip("/")
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": f"Endpoint not found via GET: /{clean_path}",
                "hint": "This route may require an HTTP POST/PUT/DELETE request or authorization token.",
                "docs_url": "/api/v1/docs",
                "redoc_url": "/api/v1/redoc",
                "health_url": "/api/v1/system/health"
            }
        )
