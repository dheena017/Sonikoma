"""
backend/features/video/operations/audio_merge_service.py
─────────────────────────────────────────────────────────────────────────────
Audio stream extraction, multi-stem track mixing, and audio-video multiplexing.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import subprocess
import asyncio
import logging
from typing import List, Optional

logger = logging.getLogger("sonikoma.features.video.operations.audio_merge")


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def extract_audio(
    video_path: str,
    output_path: Optional[str] = None,
    format_str: str = "mp3",
    bitrate: str = "192k",
    ffmpeg_path: str = "ffmpeg"
) -> str:
    """Extracts the audio track from a video file."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Source video file not found: {video_path}")

    if output_path is None:
        base = os.path.splitext(video_path)[0]
        output_path = f"{base}_audio.{format_str}"

    codec = "libmp3lame" if format_str == "mp3" else "aac"
    cmd = [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-vn",
        "-acodec", codec,
        "-ab", bitrate,
        output_path
    ]

    logger.info(f"[AudioMergeService] Extracting audio from {video_path} -> {output_path}")
    result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=180)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg audio extraction failed: {result.stderr}")

    return output_path


async def mix_audio(
    video_path: str,
    audio_paths: List[str],
    audio_volumes: Optional[List[float]] = None,
    output_path: Optional[str] = None,
    ffmpeg_path: str = "ffmpeg"
) -> str:
    """Mixes one or more audio tracks into a video."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Source video file not found: {video_path}")

    for ap in audio_paths:
        if not os.path.exists(ap):
            raise FileNotFoundError(f"Audio stem file not found: {ap}")

    if output_path is None:
        base, ext = os.path.splitext(video_path)
        output_path = f"{base}_mixed{ext}"

    cmd = [ffmpeg_path, "-y", "-i", video_path]
    for ap in audio_paths:
        cmd.extend(["-i", ap])

    total_inputs = len(audio_paths) + 1
    filter_complex = f"[0:a]" + "".join(f"[{i}:a]" for i in range(1, total_inputs)) + f"amix=inputs={total_inputs}:duration=first[aout]"

    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac",
        output_path
    ])

    logger.info(f"[AudioMergeService] Mixing {len(audio_paths)} tracks into {video_path} -> {output_path}")
    result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg audio mixing failed: {result.stderr}")

    return output_path


# Backward compatibility aliases
extract_audio_from_video = extract_audio
mix_audio_into_video = mix_audio

__all__ = [
    "extract_audio",
    "mix_audio",
    "extract_audio_from_video",
    "mix_audio_into_video",
]
