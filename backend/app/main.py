"""
backend/app/main.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Webtoon-to-Video Compiler — FastAPI Computational Engine & API Server
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uvicorn
from fastapi import FastAPI

# 1. Import startup FIRST to configure UTF-8, logging, colorama, and dotenv immediately
import sys

# Ensure project root is on PYTHONPATH so `import backend.*` works when launched from different CWDs.
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(PROJECT_ROOT, ".."))
APP_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(APP_DIR, ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(APP_DIR, "../.."))

for p in [APP_DIR, BACKEND_DIR, PROJECT_ROOT]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    import startup as startup
    from startup import API_VERSION, IS_PRODUCTION
except ImportError:
    import app.startup as startup
    from app.startup import API_VERSION, IS_PRODUCTION

try:
    from lifespan import lifespan
except ImportError:
    from app.lifespan import lifespan

from core.middleware import setup_middleware

try:
    from exception_handlers import global_exception_handler
except ImportError:
    from app.exception_handlers import global_exception_handler

try:
    from router import register_routers
except ImportError:
    from app.router import register_routers
from core.settings import BACKEND_PORT

# Create FastAPI app instance
app = FastAPI(
    title="Sonikoma API Engine",
    description="Unified computational and API backend for Webtoon-to-Video compiler.",
    version=API_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Setup middlewares
setup_middleware(app)

# Register exception handlers
app.add_exception_handler(Exception, global_exception_handler)

# Register routes & SPA fallback
register_routers(app)

# ─────────────────────────────────────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    custom_log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": startup.ColoredFormatter,
                "use_colors": not IS_PRODUCTION,
            },
            "access": {
                "()": startup.ColoredFormatter,
                "use_colors": not IS_PRODUCTION,
            },
        },
        "handlers": {
            "default": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }

    ENV = os.environ.get("NODE_ENV", os.environ.get("ENV", "development"))
    PORT = int(os.environ.get("PORT", os.environ.get("BACKEND_PORT", 5173)))
    HOST = os.environ.get("HOST", "0.0.0.0")

    print(f"🚀 Running in {ENV} mode on {HOST}:{PORT}")

    run_args = {
        "app": "main:app",
        "host": HOST,
        "port": PORT,
        "log_level": "info",
        "log_config": custom_log_config,
        "use_colors": not IS_PRODUCTION,
    }
    # Reload is disabled because reloading is managed externally by the Node runner
    run_args["reload"] = False
    if IS_PRODUCTION:
        run_args["workers"] = 1

    uvicorn.run(**run_args)
