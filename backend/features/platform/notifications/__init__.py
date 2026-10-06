"""
backend/app/features/platform/notifications
"""
from .router import router
from .service import notification_service

__all__ = ["router", "notification_service"]
