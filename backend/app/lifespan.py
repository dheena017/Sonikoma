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

from app.core.utils.banner import _print_startup_banner
from app.core.logging import logger, ColoredFormatter, setup_logging
from app.core.logging.filters import EndpointFilter
from app.core.logging.handlers import UIStreamLogHandler

SERVER_START = time.time()


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
    # Initialize global logging handlers and formatting
    setup_logging()

    # Step 1: Environment Security Validation
    required_envs = ["SUPABASE_URL", "GEMINI_API_KEY"]
    missing_envs = [env for env in required_envs if not os.getenv(env)]
    if missing_envs:
        print(f"\n\x1b[1;33m[WARNING] Missing Optional Environment Variables: {', '.join(missing_envs)}\x1b[0m")
        if os.getenv("NODE_ENV", "development").lower() == "production":
            print("\x1b[1;31mProduction requires DATABASE_URL and SUPABASE_URL to be set for Supabase connectivity.\x1b[0m\n")
        else:
            print("\x1b[1;33mSome AI and cloud features may be disabled. Local SQLite will be used if DATABASE_URL is unset.\x1b[0m\n")

    # Filter out noisy system-logs polling/SSE stream logs and subprocess dumps
    for logger_name in ("uvicorn.access", "uvicorn.error", "uvicorn"):
        logging.getLogger(logger_name).addFilter(EndpointFilter())
    for noisy in ("pydub", "pydub.logging_utils", "PIL", "httpcore", "httpx", "urllib3", "asyncio", "watchfiles", "google", "absl"):
        logging.getLogger(noisy).setLevel(logging.INFO)
    logging.getLogger().addFilter(EndpointFilter())

    # Initialize database inside the worker process
    from database.bootstrap import init_db
    init_db()

    # Clean up stale training lock file on startup
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(base_dir, ".."))
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
            from features.platform.dashboard.repositories.logs import prune_system_logs
            pruned = prune_system_logs()
            if pruned > 0:
                logger.info(f"[System] Startup maintenance: Pruned {pruned} old log entries.")
        except Exception as e:
            logger.warning(f"[System] Log pruning failed during startup: {e}")

        try:
            from database import config as db_cfg
            if os.path.exists(db_cfg.TEMP_DIR):
                now_ts = time.time()
                cleaned_temp = 0
                for f in os.listdir(db_cfg.TEMP_DIR):
                    if f.startswith('.'):
                        continue
                    fp = os.path.join(db_cfg.TEMP_DIR, f)
                    if os.path.isfile(fp) and (now_ts - os.path.getmtime(fp) > 86400):
                        try:
                            os.remove(fp)
                            cleaned_temp += 1
                        except Exception:
                            pass
                if cleaned_temp > 0:
                    logger.info(f"[Startup] Purged {cleaned_temp} stale temporary files (>24h old).")
        except Exception as e:
            logger.debug(f"[Startup] Temp directory sweep note: {e}")

        try:
            from ai_engine.skills import registry
            registry.load_skills()
        except Exception as e:
            logger.warning(f"[System] Skill registry initialization failed during startup: {e}")

        # Pre-warm vision models unless disabled (default to lazy-loading in development for fast startup)
        from app.core.config import IS_PRODUCTION
        default_skip = "false" if IS_PRODUCTION else "true"
        skip_prewarm = (
            os.getenv("SKIP_MODEL_PREWARM", default_skip).lower() in ("1", "true", "yes")
            or os.getenv("RENDER") is not None
        )
        if not skip_prewarm:
            try:
                from features.image_editor.services.layer_separation.sam import get_rembg_session
                from features.image_editor.services.panel_detection.speech_bubble_detector import get_yolo_speech_bubble_model
                from features.image_editor.services.ocr.ocr_engine import _load_ocr_reader
                await asyncio.to_thread(get_rembg_session)
                await asyncio.to_thread(get_yolo_speech_bubble_model)
                await asyncio.to_thread(_load_ocr_reader, ["en"])
            except Exception as e:
                logger.warning(f"[Startup] Model pre-warm failed (non-critical, will lazy-load on first request): {e}")
        else:
            logger.info("[Startup] Skipping AI model pre-warming (models will lazy-load on demand to preserve memory).")

        # Start automatic training background monitor service if enabled
        if os.getenv("ENABLE_TRAINING_MONITOR", "false").lower() == "true":
            try:
                from features.intelligence.services_training.training_monitor import start_background_monitor
                start_background_monitor()
            except Exception as e:
                logger.warning(f"[Startup] Failed to start training data monitor service: {e}")
        else:
            logger.info("[Startup] Training monitor is disabled via ENABLE_TRAINING_MONITOR.")

        # Warm up persistent image cache in background
        try:
            from app.core.cache import stitched_cache, edit_history
            n_stitched = stitched_cache.warm_up()
            n_history = edit_history.warm_up()
            if n_stitched > 0 or n_history > 0:
                logger.info(f"[Cache] Warm-up complete — loaded {n_stitched} panel images, {n_history} edit history entries from disk")
        except Exception as e:
            logger.warning(f"[Cache] Warm-up failed (non-critical): {e}")

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

    logger.info("Server ready - waiting for requests")

    yield
    uptime = round(time.time() - SERVER_START, 1)
    logger.info(f"FastAPI engine shutting down after {uptime}s uptime.")
