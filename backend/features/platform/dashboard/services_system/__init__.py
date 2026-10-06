"""
backend/app/services/system/__init__.py
─────────────────────────────────────────────────────────────────────────────
System diagnostic, health probe, and status services.
─────────────────────────────────────────────────────────────────────────────
"""

from .status_service import get_comprehensive_backend_status

__all__ = ["get_comprehensive_backend_status"]
