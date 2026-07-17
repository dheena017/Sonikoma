"""
backend/app/exception_handlers.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma FastAPI Exception Handlers
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from startup import logger


async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "path": str(request.url.path),
        },
    )
