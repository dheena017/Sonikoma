"""
backend/app/core/constants.py
─────────────────────────────────────────────────────────────────────────────
Global constants for the Sonikoma computational engine.
─────────────────────────────────────────────────────────────────────────────
"""

VALID_MOTIONS = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down']
MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']
LOW_BALANCE_THRESHOLD = 20

# Supported image formats
SUPPORTED_IMAGE_FORMATS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}

# Default connection timeouts
DEFAULT_TIMEOUT = 30.0

# Max upload/proxy file size (20 MB default)
MAX_UPLOAD_SIZE = 20 * 1024 * 1024
