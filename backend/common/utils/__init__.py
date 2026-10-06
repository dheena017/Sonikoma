"""
backend/common/utils/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified export surface for all common backend utilities:
- http: client IP detection, bearer token extraction, user agent parsing
- formatting: human byte sizes, file/media classification, duration formatting, slugify
- id_generator: UUIDv4, project IDs, random hex and timestamp tokens
- datetime_utils: UTC timezone-aware datetimes and ISO strings
─────────────────────────────────────────────────────────────────────────────
"""

from .http import (
    get_client_ip,
    extract_bearer_token,
    get_user_agent,
)
from .formatting import (
    format_bytes,
    get_asset_type,
    get_media_type,
    format_duration,
    slugify,
    truncate_text,
)
from .id_generator import (
    generate_uuid,
    generate_short_id,
    generate_project_id,
    generate_timestamp_id,
)
from .datetime_utils import (
    utc_now,
    utc_iso,
    utc_timestamp,
    parse_iso,
)

__all__ = [
    # HTTP
    "get_client_ip",
    "extract_bearer_token",
    "get_user_agent",
    # Formatting
    "format_bytes",
    "get_asset_type",
    "get_media_type",
    "format_duration",
    "slugify",
    "truncate_text",
    # ID Generation
    "generate_uuid",
    "generate_short_id",
    "generate_project_id",
    "generate_timestamp_id",
    # Datetime
    "utc_now",
    "utc_iso",
    "utc_timestamp",
    "parse_iso",
]
