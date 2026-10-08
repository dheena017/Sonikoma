"""
backend/app/main.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Webtoon-to-Video Compiler — FastAPI Computational Engine & API Server
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys

# Ensure backend directory is on sys.path for top-level package resolution
BACKEND_DIR = os.path.abspath(os.path.dirname(__file__))
APP_DIR = os.path.abspath(os.path.join(BACKEND_DIR, "app"))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))

for p in [BACKEND_DIR, APP_DIR, PROJECT_ROOT]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.core.config import API_VERSION, IS_PRODUCTION, BACKEND_PORT
from app.core.logging import ColoredFormatter, setup_logging, logger
from app.core.logging.filters import EndpointFilter

# ─────────────────────────────────────────────────────────────────────────────
# CLI ENTRYPOINT (Supervisor Process)
# Fast path: launch uvicorn immediately without loading routers/ML libraries
# in the supervisor process. The worker process will load main:app once.
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    log_level_name = os.getenv("LOG_LEVEL", "info" if IS_PRODUCTION else "debug").lower()

    custom_log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {
            "endpoint_filter": {
                "()": EndpointFilter,
            },
        },
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
                "filters": ["endpoint_filter"],
            },
        },
        "root": {
            "handlers": ["default"],
            "level": log_level_name.upper(),
        },
        "loggers": {
            "sonikoma": {
                "handlers": ["default"],
                "level": log_level_name.upper(),
                "propagate": False,
            },
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
            "PIL": {
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
            "pydub": {
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
            "pydub.logging_utils": {
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
            "httpcore": {
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
            "httpx": {
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
            "urllib3": {
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
            "google": {
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
            "google.genai": {
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
            "h11": {
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
        },
    }

    run_args = {
        "app": "main:app",
        "host": os.getenv("HOST", "0.0.0.0"),
        "port": BACKEND_PORT,
        "log_level": log_level_name,
        "log_config": custom_log_config,
        "use_colors": True,
        "reload": not IS_PRODUCTION,
    }
    if IS_PRODUCTION:
        run_args["workers"] = 1

    uvicorn.run(**run_args)
    sys.exit(0)


# ─────────────────────────────────────────────────────────────────────────────
# APPLICATION INSTANTIATION (Worker Process / Imported as main:app)
# ─────────────────────────────────────────────────────────────────────────────
from fastapi import FastAPI
from app.core.exceptions import global_exception_handler
from app.core.responses import PrettyJSONResponse
from app.core.middleware import setup_middleware
from app.router import register_routers
from openapi.config import OPENAPI_TAGS, API_DESCRIPTION
from openapi.router import register_docs_routes
from app.lifespan import lifespan

# Create FastAPI app instance with default Pretty-Printed JSON output
app = FastAPI(
    title="Sonikoma API Engine",
    description=API_DESCRIPTION,
    version=API_VERSION,
    openapi_tags=OPENAPI_TAGS,
    default_response_class=PrettyJSONResponse,
    docs_url=None,  # Custom Swagger documentation console mounted via docs router
    redoc_url=None,  # Custom ReDoc documentation console mounted via docs router
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan,
)

# Initialize global logging early
setup_logging()

# Setup middlewares
setup_middleware(app)

# Register exception handlers
app.add_exception_handler(Exception, global_exception_handler)

# Register interactive docs & category-filtered OpenAPI schemas
register_docs_routes(app)

# Register API routes, static media mounts & SPA fallback
register_routers(app)
