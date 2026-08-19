"""
backend/app/main.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Webtoon-to-Video Compiler — FastAPI Computational Engine & API Server
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import uvicorn
from fastapi import FastAPI

# Ensure backend directory is on sys.path for top-level package resolution
APP_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(APP_DIR, ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(APP_DIR, "../.."))

for p in [APP_DIR, BACKEND_DIR, PROJECT_ROOT]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.core.config import API_VERSION, IS_PRODUCTION, BACKEND_PORT
from app.core.logging import ColoredFormatter, setup_logging, logger
from app.core.exceptions import global_exception_handler
from app.core.middleware import setup_middleware
from app.api.router import register_routers
from app.openapi.config import OPENAPI_TAGS, API_DESCRIPTION
from app.openapi.router import register_docs_routes
from app.lifespan import lifespan

# Create FastAPI app instance
app = FastAPI(
    title="Sonikoma API Engine",
    description=API_DESCRIPTION,
    version=API_VERSION,
    openapi_tags=OPENAPI_TAGS,
    docs_url=None,  # Custom Swagger documentation console mounted via docs router
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Setup middlewares
setup_middleware(app)

# Register exception handlers
app.add_exception_handler(Exception, global_exception_handler)

# Register interactive docs & category-filtered OpenAPI schemas
register_docs_routes(app)

# Register API routes, static media mounts & SPA fallback
register_routers(app)


# ─────────────────────────────────────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    log_level_name = os.getenv("LOG_LEVEL", "info" if IS_PRODUCTION else "debug").lower()

    custom_log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": ColoredFormatter,
                "use_colors": True,
            },
            "access": {
                "()": ColoredFormatter,
                "use_colors": True,
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
                "level": log_level_name.upper(),
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["default"],
                "level": log_level_name.upper(),
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["default"],
                "level": log_level_name.upper(),
                "propagate": False,
            },
        },
    }

    run_args = {
        "app": "app.main:app",
        "host": os.getenv("HOST", "0.0.0.0"),
        "port": BACKEND_PORT,
        "log_level": log_level_name,
        "log_config": custom_log_config,
        "use_colors": True,
        "reload": False,
    }
    if IS_PRODUCTION:
        run_args["workers"] = 1

    uvicorn.run(**run_args)
