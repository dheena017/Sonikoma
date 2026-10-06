"""
backend/common/utils/formatting.py
─────────────────────────────────────────────────────────────────────────────
Common formatting functions for byte sizes, durations, slugs, and media types.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
from typing import Union


def format_bytes(size: Union[int, float]) -> str:
    """
    Converts a byte count into a human-readable string (e.g. 1.25 MB, 500.00 KB).
    """
    if size is None or size < 0:
        return "0.00 B"

    power = 2**10
    n = 0
    power_labels = {0: 'B', 1: 'KB', 2: 'MB', 3: 'GB', 4: 'TB', 5: 'PB'}
    size_float = float(size)
    while size_float >= power and n < 5:
        size_float /= power
        n += 1
    return f"{size_float:.2f} {power_labels[n]}"


def get_asset_type(filename: str) -> str:
    """
    Classifies a file's extension into canonical media categories:
    - 'image', 'audio', 'video', 'document', or 'reference'
    """
    if not filename:
        return "reference"

    ext = os.path.splitext(filename)[1].lower()
    if ext in ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff'):
        return "image"
    elif ext in ('.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'):
        return "audio"
    elif ext in ('.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'):
        return "video"
    elif ext in ('.pdf', '.epub', '.cbr', '.cbz', '.txt', '.json', '.xml'):
        return "document"
    return "reference"


get_media_type = get_asset_type  # Alias for consumers


def format_duration(seconds: Union[int, float]) -> str:
    """
    Formats a duration in seconds into 'MM:SS' or 'HH:MM:SS'.
    """
    if seconds is None or seconds < 0:
        return "00:00"

    total_secs = int(round(seconds))
    hours = total_secs // 3600
    minutes = (total_secs % 3600) // 60
    secs = total_secs % 60

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def slugify(text: str, separator: str = "-") -> str:
    """
    Converts arbitrary string into an ASCII URL/slug-friendly string.
    Example: 'My Comic Episode #1!' -> 'my-comic-episode-1'
    """
    if not text:
        return ""
    # Normalize and lower
    cleaned = re.sub(r'[^\w\s-]', '', text.lower()).strip()
    return re.sub(r'[-\s]+', separator, cleaned)


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncates text cleanly at word boundaries if exceeding max_length."""
    if not text or len(text) <= max_length:
        return text or ""
    cut_length = max_length - len(suffix)
    return text[:cut_length].rsplit(' ', 1)[0] + suffix


__all__ = [
    "format_bytes",
    "get_asset_type",
    "get_media_type",
    "format_duration",
    "slugify",
    "truncate_text",
]
