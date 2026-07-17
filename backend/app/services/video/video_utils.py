"""
backend/app/services/video/video_utils.py
─────────────────────────────────────────────────────────────────────────────
Shared utilities for video and audio processing, path creation, and validation.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging

logger = logging.getLogger("sonikoma.services.video.utils")


def validate_file_path(path: str) -> None:
    """Checks if a file path is valid and accessible."""
    if not path:
        raise ValueError("File path cannot be empty.")
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")


def get_file_size_kb(path: str) -> float:
    """Returns the size of a file in kilobytes."""
    validate_file_path(path)
    return round(os.path.getsize(path) / 1024, 1)


def estimate_narration_duration(text: str, words_per_minute: float = 130.0) -> float:
    """Estimates audio narration duration based on text length."""
    if not text:
        return 0.0
    words = len(text.split())
    # Convert WPM to seconds per word
    sec_per_word = 60.0 / words_per_minute
    return round(words * sec_per_word, 1)
