"""
backend/features/video/operations/probe_service.py
─────────────────────────────────────────────────────────────────────────────
Technical container and stream inspection (codec, bitrate, resolution) via ffprobe.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import subprocess
import asyncio
import logging
from typing import Dict, Any

logger = logging.getLogger("sonikoma.features.video.operations.probe")


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _parse_ffprobe_json(data: Dict[str, Any]) -> Dict[str, Any]:
    """Parses raw ffprobe JSON output into normalized metadata summary."""
    format_info = data.get("format", {})
    streams = data.get("streams", [])
    v_stream = next((s for s in streams if s.get("codec_type") == "video"), {})
    a_stream = next((s for s in streams if s.get("codec_type") == "audio"), {})

    return {
        "duration": float(format_info.get("duration") or 0.0),
        "bit_rate": int(format_info.get("bit_rate") or 0),
        "width": int(v_stream.get("width") or 0),
        "height": int(v_stream.get("height") or 0),
        "video_codec": v_stream.get("codec_name", "unknown"),
        "audio_codec": a_stream.get("codec_name", "unknown"),
        "frame_rate": v_stream.get("r_frame_rate", "24/1"),
        "audio_sample_rate": int(a_stream.get("sample_rate") or 0),
        "audio_channels": int(a_stream.get("channels") or 0),
    }


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def get_video_info(
    video_path: str,
    ffprobe_path: str = "ffprobe"
) -> Dict[str, Any]:
    """Gets technical video information (resolution, duration, codec, bitrate)."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    cmd = [
        ffprobe_path,
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        video_path
    ]

    result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe execution failed: {result.stderr}")

    try:
        raw_json = json.loads(result.stdout)
        return _parse_ffprobe_json(raw_json)
    except Exception as e:
        logger.error(f"[ProbeService] Failed parsing ffprobe JSON: {e}")
        return {"error": "Invalid ffprobe metadata output"}


# Backward compatibility alias
probe_video_metadata = get_video_info

__all__ = [
    "get_video_info",
    "probe_video_metadata",
]
