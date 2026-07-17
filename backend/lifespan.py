"""
backend/app/lifespan.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma FastAPI Lifespan Manager
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import logging
import platform
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI

from backend.startup import (
    logger,
    IS_PRODUCTION,
    ColoredFormatter,
    _print_startup_banner,
    API_VERSION,
    SERVER_START
)
from core.settings import BACKEND_PORT


class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
            if any(path in msg for path in ["/system-logs", "/api/metrics", "/api/health", "/metrics", "/health"]):
                return False
        except Exception:
            pass
        return True


def _clean_temp_workspace():
    import tempfile
    import shutil
    temp_dir = os.path.join(tempfile.gettempdir(), "webtoon_workspace")
    if os.path.exists(temp_dir):
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
            logger.info(f"[Backend] Cleaned up temporary workspace directory: {temp_dir}")
        except Exception as e:
            logger.warning(f"[Backend] Failed to clean up temporary workspace: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Step 15: Environment Security Validation (Warn Only)
    required_envs = ["SUPABASE_URL", "GEMINI_API_KEY"]
    missing_envs = [env for env in required_envs if not os.getenv(env)]
    if missing_envs:
        print(f"\n\x1b[1;33m[WARNING] Missing Optional Environment Variables: {', '.join(missing_envs)}\x1b[0m")
        print("\x1b[1;33mSome AI and cloud features may be disabled. Local SQLite will be used if DATABASE_URL is unset.\x1b[0m\n")

    # Filter out noisy system-logs polling/SSE stream logs
    for logger_name in ("uvicorn.access", "uvicorn.error", "uvicorn"):
        logging.getLogger(logger_name).addFilter(EndpointFilter())
    logging.getLogger().addFilter(EndpointFilter())

    # Initialize database inside the worker process and defer some maintenance work
    from database.bootstrap import init_db
    init_db()

    # Clean up stale training lock file on startup (safely using local paths)
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__)) # backend/app
        project_root = os.path.abspath(os.path.join(base_dir, "..", ".."))
        training_dir = os.path.join(project_root, "data", "training_data")
        lock_file = os.path.join(training_dir, "training.lock")
        if os.path.exists(lock_file):
            os.remove(lock_file)
            logger.info("[Startup] Cleaned up stale training.lock file from previous run.")
    except Exception as e:
        logger.warning(f"[Startup] Failed to clean up stale training lock file: {e}")

    # Run startup maintenance asynchronously so the API can start responding quickly
    async def _startup_maintenance():
        try:
            from repositories.system.logs import prune_system_logs
            pruned = prune_system_logs()
            if pruned > 0:
                logger.info(f"[System] Startup maintenance: Pruned {pruned} old log entries.")
        except Exception as e:
            logger.warning(f"[System] Log pruning failed during startup: {e}")

        try:
            from skills.registry import registry
            registry.load_skills()
        except Exception as e:
            logger.warning(f"[System] Skill registry initialization failed during startup: {e}")

        # Pre-warm rembg U-2-Net and YOLO segmentation models so the first
        # /process-layers request does not pay the cold-start model-loading penalty.
        try:
            from backend.media.image.layer_segmentation import get_rembg_session
            from providers.vision.yolo import get_yolo_model
            logger.info("[Startup] Pre-warming rembg U-2-Net session...")
            await asyncio.to_thread(get_rembg_session)
            logger.info("[Startup] Pre-warming YOLO manga-segmentation model...")
            await asyncio.to_thread(get_yolo_model)
            logger.info("[Startup] rembg U-2-Net and YOLO models pre-warmed successfully — first request will be fast.")
        except Exception as e:
            logger.warning(f"[Startup] Model pre-warm failed (non-critical, will lazy-load on first request): {e}")

        # Start automatic training background monitor service
        try:
            from services.training.training_monitor import start_background_monitor
            start_background_monitor()
        except Exception as e:
            logger.warning(f"[Startup] Failed to start training data monitor service: {e}")

    asyncio.create_task(_startup_maintenance())

    # Purge stale temporary workspace directories
    _clean_temp_workspace()

    # Re-apply ColoredFormatter to all non-UI handlers for beautiful console output.
    # UIStreamLogHandler keeps its own plain formatter so log entries reach the frontend cleanly.
    from utils.log_interceptor import UIStreamLogHandler as _UIStreamLogHandler
    for name in list(logging.root.manager.loggerDict.keys()):
        l = logging.getLogger(name)
        for h in l.handlers:
            if not isinstance(h, _UIStreamLogHandler):
                h.setFormatter(ColoredFormatter(use_colors=not IS_PRODUCTION))
    for h in logging.getLogger().handlers:
        if not isinstance(h, _UIStreamLogHandler):
            h.setFormatter(ColoredFormatter(use_colors=not IS_PRODUCTION))

    _print_startup_banner()

    # Emit structured startup logs so the frontend terminal shows them on connect.
    # (banner uses print() which bypasses the handler; these go through the buffer)
    logger.info(f"Sonikoma Compute Engine v{API_VERSION} started on port {BACKEND_PORT}")
    logger.info(f"Python {sys.version.split(' ')[0]} | {platform.system()} {platform.machine()}")
    logger.info(f"Swagger docs available at http://localhost:{BACKEND_PORT}/api/docs")

    # Capability probe results
    caps = {
        "OpenCV (cv2)": "cv2",
        "MoviePy": "moviepy",
        "EasyOCR": "easyocr",
        "Edge TTS": "edge_tts",
        "Google GenAI": "google.genai",
    }
    for label, mod in caps.items():
        try:
            __import__(mod)
            logger.success(f"{label} loaded successfully")
        except ImportError:
            logger.warning(f"{label} not available - some features may be disabled")

    # API key status
    if os.getenv("GEMINI_API_KEY"):
        logger.success("GEMINI_API_KEY detected - AI features enabled")
    else:
        logger.warning("GEMINI_API_KEY not set - AI panel analysis disabled")

    # Warm up the persistent image cache — loads all previously scraped panel images
    # from disk back into memory so they survive server restarts without 404s.
    try:
        from utils.cache import stitched_cache, edit_history
        n_stitched = stitched_cache.warm_up()
        n_history = edit_history.warm_up()
        if n_stitched > 0 or n_history > 0:
            logger.info(f"[Cache] Warm-up complete — loaded {n_stitched} panel images, {n_history} edit history entries from disk")
    except Exception as e:
        logger.warning(f"[Cache] Warm-up failed (non-critical): {e}")

    logger.success("Server ready - waiting for requests")

    yield
    uptime = round(time.time() - SERVER_START, 1)
    logger.info(f"FastAPI engine shutting down after {uptime}s uptime.")
