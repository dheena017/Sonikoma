"""
backend/app/core/exceptions.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Base Exceptions & FastAPI Global Exception Handlers.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.logging import logger


class SonikomaException(Exception):
    """Base exception class for all Sonikoma backend errors."""
    def __init__(self, message: str, status_code: int = 400, code: str = "SONIKOMA_ERROR"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class ServiceException(SonikomaException):
    """Raised when an internal domain service operation fails."""
    def __init__(self, message: str, status_code: int = 500, code: str = "SERVICE_ERROR"):
        super().__init__(message, status_code=status_code, code=code)


class DomainException(SonikomaException):
    """Base class for domain-level exceptions."""
    def __init__(self, message: str, status_code: int = 400, code: str = "DOMAIN_ERROR"):
        super().__init__(message, status_code=status_code, code=code)


class ResourceNotFoundException(DomainException):
    """Raised when a requested domain resource is not found."""
    def __init__(self, message: str):
        super().__init__(message, status_code=404, code="RESOURCE_NOT_FOUND")


class ProcessingException(DomainException):
    """Raised when domain processing fails."""
    def __init__(self, message: str):
        super().__init__(message, status_code=500, code="PROCESSING_ERROR")


class ProviderException(SonikomaException):
    """Raised when an external AI, storage, or cloud provider API fails."""
    def __init__(self, message: str, status_code: int = 502, code: str = "PROVIDER_ERROR"):
        super().__init__(message, status_code=status_code, code=code)


class InvalidRequestException(SonikomaException):
    """Raised when incoming client request payload fails validation."""
    def __init__(self, message: str, status_code: int = 422, code: str = "INVALID_REQUEST"):
        super().__init__(message, status_code=status_code, code=code)


class CreditException(SonikomaException):
    """Raised when a user attempts an operation with insufficient credits."""
    def __init__(self, message: str = "Insufficient credits for this operation", status_code: int = 402, code: str = "INSUFFICIENT_CREDITS"):
        super().__init__(message, status_code=status_code, code=code)


class VideoFileNotFoundException(SonikomaException):
    """Raised when a target video file cannot be found on disk or storage."""
    def __init__(self, message: str = "Video file not found", status_code: int = 404, code: str = "VIDEO_NOT_FOUND"):
        super().__init__(message, status_code=status_code, code=code)


class YouTubeExportException(SonikomaException):
    """Raised when YouTube export authentication or API publishing fails."""
    def __init__(self, message: str, status_code: int = 500, code: str = "YOUTUBE_EXPORT_ERROR"):
        super().__init__(message, status_code=status_code, code=code)


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI EXCEPTION HANDLERS
# ─────────────────────────────────────────────────────────────────────────────

from app.core.responses import PrettyJSONResponse


async def sonikoma_exception_handler(request: Request, exc: SonikomaException):
    """Handles application-level SonikomaException instances."""
    logger.error(f"SonikomaException on {request.method} {request.url.path}: {exc}")
    return PrettyJSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.message,
            "code": exc.code,
            "path": str(request.url.path),
        },
    )


async def global_exception_handler(request: Request, exc: Exception):
    """Fallback handler for unhandled server exceptions."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return PrettyJSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "path": str(request.url.path),
        },
    )
