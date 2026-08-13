"""
backend/app/lifespan.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma FastAPI Lifespan Manager (startup and shutdown lifecycle events).
─────────────────────────────────────────────────────────────────────────────
"""

import os
import time
import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.config import IS_PRODUCTION, API_VERSION, BACKEND_PORT
from app.core.utils.banner import _print_startup_banner
from app.core.logging import logger, ColoredFormatter
from app.core.logging.handlers import UIStreamLogHandler

SERVER_START = time.time()


class EndpointFilter(logging.Filter):
    """Filter noisy system-logs and status endpoints."""
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
            if any(path in msg for path in ["/system-logs", "/api/metrics", "/api/health", "/metrics", "/health", "/api/auth/credits", "auth/credits"]):
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
    # Step 1: Environment Security Validation
    required_envs = ["SUPABASE_URL", "GEMINI_API_KEY"]
    missing_envs = [env for env in required_envs if not os.getenv(env)]
    if missing_envs:
        print(f"\n\x1b[1;33m[WARNING] Missing Optional Environment Variables: {', '.join(missing_envs)}\x1b[0m")
        if os.getenv("NODE_ENV", "development").lower() == "production":
            print("\x1b[1;31mProduction requires DATABASE_URL and SUPABASE_URL to be set for Supabase connectivity.\x1b[0m\n")
        else:
            print("\x1b[1;33mSome AI and cloud features may be disabled. Local SQLite will be used if DATABASE_URL is unset.\x1b[0m\n")

    # Filter out noisy system-logs polling/SSE stream logs
    for logger_name in ("uvicorn.access", "uvicorn.error", "uvicorn"):
        logging.getLogger(logger_name).addFilter(EndpointFilter())
    logging.getLogger().addFilter(EndpointFilter())

    # Initialize database inside the worker process
    from app.database.bootstrap import init_db
    init_db()

    # Clean up stale training lock file on startup
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
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
            from app.repositories.system.logs import prune_system_logs
            pruned = prune_system_logs()
            if pruned > 0:
                logger.info(f"[System] Startup maintenance: Pruned {pruned} old log entries.")
        except Exception as e:
            logger.warning(f"[System] Log pruning failed during startup: {e}")

        try:
            from app.services.ai.skills import registry
            registry.load_skills()
        except Exception as e:
            logger.warning(f"[System] Skill registry initialization failed during startup: {e}")

        # Pre-warm vision models unless disabled
        skip_prewarm = (
            os.getenv("SKIP_MODEL_PREWARM", "").lower() in ("1", "true", "yes")
            or os.getenv("RENDER") is not None
        )
        if not skip_prewarm:
            try:
                from services.image.layer_separation.sam import get_rembg_session
                from services.image.panel_detection.speech_bubble_detector import get_yolo_model
                logger.debug("[Startup] Pre-warming rembg U-2-Net session...")
                await asyncio.to_thread(get_rembg_session)
                logger.debug("[Startup] Pre-warming YOLO manga-segmentation model...")
                await asyncio.to_thread(get_yolo_model)
                logger.debug("[Startup] rembg U-2-Net and YOLO models pre-warmed successfully — first request will be fast.")
            except Exception as e:
                logger.warning(f"[Startup] Model pre-warm failed (non-critical, will lazy-load on first request): {e}")
        else:
            logger.info("[Startup] Skipping AI model pre-warming (models will lazy-load on demand to preserve memory).")

        # Start automatic training background monitor service if enabled
        if os.getenv("ENABLE_TRAINING_MONITOR", "false").lower() == "true":
            try:
                from app.services.training.training_monitor import start_background_monitor
                start_background_monitor()
            except Exception as e:
                logger.warning(f"[Startup] Failed to start training data monitor service: {e}")
        else:
            logger.info("[Startup] Training monitor is disabled via ENABLE_TRAINING_MONITOR.")

    # Launch background maintenance non-blocking
    asyncio.create_task(_startup_maintenance())

    # Purge stale temporary workspace directories
    _clean_temp_workspace()

    # Apply ColoredFormatter to console loggers
    def _should_use_colors() -> bool:
        force_color = os.getenv("FORCE_COLOR", "").strip().lower()
        if force_color in ("0", "false", "no"):
            return False
        return True

    for name in list(logging.root.manager.loggerDict.keys()):
        l = logging.getLogger(name)
        for h in l.handlers:
            if not isinstance(h, UIStreamLogHandler):
                h.setFormatter(ColoredFormatter(use_colors=_should_use_colors()))

    for h in logging.getLogger().handlers:
        if not isinstance(h, UIStreamLogHandler):
            h.setFormatter(ColoredFormatter(use_colors=_should_use_colors()))

    _print_startup_banner()

    # Warm up persistent image cache
    try:
        from app.core.cache import stitched_cache, edit_history
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
