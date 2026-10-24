"""
backend/features/video/export/export_presets.py
─────────────────────────────────────────────────────────────────────────────
Platform-specific export profiles (YouTube, TikTok, Instagram Reels, WebP).
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, Any

_PLATFORM_PROFILES: Dict[str, Dict[str, Any]] = {
    "youtube_1080p": {
        "width": 1920,
        "height": 1080,
        "fps": 30,
        "video_bitrate": "8M",
        "audio_bitrate": "192k",
        "aspect_ratio": "16:9",
        "container": "mp4",
        "video_codec": "libx264",
        "audio_codec": "aac",
    },
    "youtube_4k": {
        "width": 3840,
        "height": 2160,
        "fps": 60,
        "video_bitrate": "35M",
        "audio_bitrate": "320k",
        "aspect_ratio": "16:9",
        "container": "mp4",
        "video_codec": "libx264",
        "audio_codec": "aac",
    },
    "tiktok_vertical": {
        "width": 1080,
        "height": 1920,
        "fps": 30,
        "video_bitrate": "6M",
        "audio_bitrate": "192k",
        "aspect_ratio": "9:16",
        "container": "mp4",
        "video_codec": "libx264",
        "audio_codec": "aac",
    },
    "reels_vertical": {
        "width": 1080,
        "height": 1920,
        "fps": 30,
        "video_bitrate": "6M",
        "audio_bitrate": "192k",
        "aspect_ratio": "9:16",
        "container": "mp4",
        "video_codec": "libx264",
        "audio_codec": "aac",
    },
    "instagram_square": {
        "width": 1080,
        "height": 1080,
        "fps": 30,
        "video_bitrate": "5M",
        "audio_bitrate": "192k",
        "aspect_ratio": "1:1",
        "container": "mp4",
        "video_codec": "libx264",
        "audio_codec": "aac",
    },
}


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def get_export_preset(platform: str = "youtube_1080p") -> Dict[str, Any]:
    """Gets the export settings for a target video platform."""
    clean = platform.lower().strip()
    return _PLATFORM_PROFILES.get(clean, _PLATFORM_PROFILES["youtube_1080p"]).copy()


# Backward compatibility alias
get_platform_export_profile = get_export_preset

__all__ = [
    "get_export_preset",
    "get_platform_export_profile",
]
