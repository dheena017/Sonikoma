"""
backend/core/utils/__init__.py
─────────────────────────────────────────────────────────────────────────────
Core utilities module exports with seamless bridge to common utilities.
─────────────────────────────────────────────────────────────────────────────
"""

from .id_utils import generate_project_id, generate_uuid
from .banner import _print_startup_banner
from common.utils import (
    get_client_ip,
    extract_bearer_token,
    format_bytes,
    get_asset_type,
    get_media_type,
    format_duration,
    slugify,
    utc_now,
    utc_iso,
)

__all__ = [
    "generate_project_id",
    "generate_uuid",
    "_print_startup_banner",
    "get_client_ip",
    "extract_bearer_token",
    "format_bytes",
    "get_asset_type",
    "get_media_type",
    "format_duration",
    "slugify",
    "utc_now",
    "utc_iso",
]
