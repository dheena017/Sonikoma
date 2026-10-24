"""
backend/features/audio/utils/audio_files.py
─────────────────────────────────────────────────────────────────────────────
Audio IO, cache persistence, base64 payload decoding, and URL resolver.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import base64
import tempfile
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("sonikoma.audio.utils.audio_files")

# Base directory for audio cache
AUDIO_CACHE_DIR = os.path.join(tempfile.gettempdir(), "sonikoma_audio_cache")
os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _is_valid_base64_sound(data: str) -> bool:
    """Verifies whether a string looks like a base64 encoded audio payload."""
    if not data or not isinstance(data, str):
        return False
    clean = data.split(",")[-1].strip()
    return len(clean) > 32 and (len(clean) % 4 == 0)


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def download_audio(source: str) -> Dict[str, Any]:
    """
    Resolves an audio reference (URL, local file path, or base64 data) into raw bytes.
    Returns: {"data": bytes, "path": Optional[str], "format": str}
    """
    if not source:
        raise ValueError("Audio source cannot be empty.")

    # 1. Base64 Data URL or string
    if source.startswith("data:audio") or _is_valid_base64_sound(source):
        raw_b64 = source.split(",")[-1]
        decoded = base64.b64decode(raw_b64)
        return {"data": decoded, "path": None, "format": "mp3"}

    # 2. Remote HTTP/HTTPS URL
    if source.startswith("http://") or source.startswith("https://"):
        import httpx
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(source)
            if resp.status_code != 200:
                raise RuntimeError(f"Failed to fetch remote audio from {source} (HTTP {resp.status_code})")
            return {"data": resp.content, "path": None, "format": "mp3"}

    # 3. Local filesystem path
    if os.path.exists(source):
        with open(source, "rb") as f:
            data = f.read()
        ext = os.path.splitext(source)[-1].lstrip(".").lower() or "mp3"
        return {"data": data, "path": source, "format": ext}

    raise FileNotFoundError(f"Audio source does not exist: {source}")


def cache_audio(base64_data: str) -> Optional[str]:
    """
    Saves a base64 audio payload to disk cache and returns its accessible local URL/path.
    """
    if not base64_data:
        return None
    try:
        raw_b64 = base64_data.split(",")[-1]
        audio_bytes = base64.b64decode(raw_b64)
        import hashlib
        cache_key = hashlib.md5(audio_bytes[:2048]).hexdigest()
        filename = f"audio_{cache_key}.mp3"
        cache_path = os.path.join(AUDIO_CACHE_DIR, filename)

        if not os.path.exists(cache_path):
            with open(cache_path, "wb") as f:
                f.write(audio_bytes)

        return f"/api/v1/audio/cache/{filename}"
    except Exception as exc:
        logger.warning(f"Failed to cache audio base64: {exc}")
        return None


def save_audio(audio_bytes: bytes, filename: str, extension: str = "mp3") -> str:
    """
    Writes raw audio bytes to disk under audio cache with the given filename and format extension.
    """
    clean_ext = extension.lstrip(".").lower()
    if not filename.endswith(f".{clean_ext}"):
        full_name = f"{filename}.{clean_ext}"
    else:
        full_name = filename

    dest_path = os.path.join(AUDIO_CACHE_DIR, full_name)
    with open(dest_path, "wb") as f:
        f.write(audio_bytes)
    return dest_path


__all__ = [
    "download_audio",
    "cache_audio",
    "save_audio",
]
