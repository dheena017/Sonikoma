"""
backend/common/utils/datetime_utils.py
─────────────────────────────────────────────────────────────────────────────
Timezone-aware UTC datetime utilities.
─────────────────────────────────────────────────────────────────────────────
"""

import datetime


def utc_now() -> datetime.datetime:
    """Returns the current timezone-aware UTC datetime."""
    return datetime.datetime.now(datetime.timezone.utc)


def utc_iso() -> str:
    """Returns the current UTC time formatted as an ISO-8601 string."""
    return utc_now().isoformat()


def utc_timestamp() -> float:
    """Returns current UTC epoch timestamp as a float."""
    return utc_now().timestamp()


def parse_iso(iso_str: str) -> datetime.datetime:
    """Parses an ISO-8601 string into a timezone-aware datetime."""
    dt = datetime.datetime.fromisoformat(iso_str)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt


__all__ = [
    "utc_now",
    "utc_iso",
    "utc_timestamp",
    "parse_iso",
]
