"""
backend/app/core/exceptions.py
─────────────────────────────────────────────────────────────────────────────
Centralized exception definitions and base classes for the Sonikoma backend.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Optional

class SonikomaException(Exception):
    """Base exception for all Sonikoma application errors."""
    def __init__(self, message: str, status_code: int = 500, code: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code or self.__class__.__name__


class ServiceException(SonikomaException):
    """Exception raised for errors occurring in the business service layer."""
    pass


class ProviderException(SonikomaException):
    """Exception raised when an external API provider (Gemini, SD, etc.) fails."""
    pass


class InvalidRequestException(SonikomaException):
    """Exception raised for invalid payload, parameter, or query requests."""
    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class CreditException(SonikomaException):
    """Exception raised when a user has insufficient credits to run an action."""
    def __init__(self, message: str):
        super().__init__(message, status_code=402)


class VideoFileNotFoundException(ServiceException):
    """Exception raised when a requested video file is missing."""
    def __init__(self, message: str = "Video file not found."):
        super().__init__(message, status_code=404)


class YouTubeExportException(ServiceException):
    """Exception raised when the YouTube upload/export workflow fails."""
    def __init__(self, message: str):
        super().__init__(message, status_code=500)

