"""
backend/app/providers/video/client.py
─────────────────────────────────────────────────────────────────────────────
Video probe and metadata inspection client wrapper.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from typing import Optional, Dict, Any
from app.providers.ffmpeg.client import FFmpegClient
from app.providers.ffmpeg.helpers import build_ffprobe_cmd
from app.providers.ffmpeg.types import VideoMetadata

logger = logging.getLogger("sonikoma.providers.video.client")


class VideoClient:
    """Client for probing and validating video and audio stream properties."""

    def __init__(self, ffprobe_path: str = "ffprobe"):
        self.ffprobe_path = FFmpegClient.get_ffprobe_path(ffprobe_path)

    async def get_metadata(self, video_path: str) -> Optional[VideoMetadata]:
        """Inspect video file and return structured VideoMetadata."""
        cmd = build_ffprobe_cmd(self.ffprobe_path, video_path)
        returncode, stdout, stderr = await FFmpegClient.execute_command(cmd)

        if returncode != 0:
            logger.error(f"[VideoClient] ffprobe failed: {stderr}")
            return None

        try:
            data = json.loads(stdout)
            format_info = data.get("format", {})
            duration = float(format_info.get("duration", 0.0))
            bitrate = format_info.get("bit_rate", "0")

            width, height, fps, codec = 1920, 1080, 24.0, "h264"
            has_audio, audio_bitrate, sample_rate = False, None, None

            for stream in data.get("streams", []):
                if stream.get("codec_type") == "video":
                    width = int(stream.get("width", width))
                    height = int(stream.get("height", height))
                    codec = stream.get("codec_name", codec)
                    r_fps = stream.get("r_frame_rate", "24/1")
                    if "/" in r_fps:
                        num, den = map(float, r_fps.split("/"))
                        fps = num / den if den != 0 else 24.0
                elif stream.get("codec_type") == "audio":
                    has_audio = True
                    audio_bitrate = stream.get("bit_rate")
                    sample_rate = int(stream.get("sample_rate", 44100))

            return VideoMetadata(
                duration=duration,
                width=width,
                height=height,
                fps=fps,
                bitrate=bitrate,
                codec=codec,
                has_audio=has_audio,
                audio_bitrate=audio_bitrate,
                sample_rate=sample_rate,
            )
        except Exception as e:
            logger.error(f"[VideoClient] Failed to parse metadata: {e}")
            return None
