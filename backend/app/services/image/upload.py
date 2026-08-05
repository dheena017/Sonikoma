"""
backend/app/services/image/upload.py
─────────────────────────────────────────────────────────────────────────────
Backward-compatibility proxy.
Re-exports storage upload functions from `services.image.storage_uploader`.
─────────────────────────────────────────────────────────────────────────────
"""

from services.image.storage_uploader import *
