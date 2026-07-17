"""
backend/app/services/video/ffmpeg_engine.py
─────────────────────────────────────────────────────────────────────────────
Refactored FFmpeg video processing engine. Exposes high-level FFmpeg actions
while delegating enums/types, commands, subtitle operations, and rendering 
to sub-modules. Acts as the primary interface/facade for backward-compatibility.
─────────────────────────────────────────────────────────────────────────────
"""

import subprocess
import logging
import json
import asyncio
from typing import List, Optional, Tuple
from services.video.ffmpeg_types import TransitionType, FilterType, VideoMetadata, TransitionSpec, CutSpec
from services.video.ffmpeg_commands import build_ffprobe_cmd
from services.video.subtitle_service import SubtitleService
from services.video.render_service import RenderService

logger = logging.getLogger("sonikoma.services.video.ffmpeg_engine")


class FFmpegEngine:
    """High-level FFmpeg wrapper for video processing."""

    def __init__(self, ffmpeg_path: str = "ffmpeg", ffprobe_path: str = "ffprobe"):
        """
        Initialize FFmpeg engine.

        Args:
            ffmpeg_path: Path to ffmpeg executable
            ffprobe_path: Path to ffprobe executable (for metadata)
        """
        self.ffmpeg_path = ffmpeg_path
        self.ffprobe_path = ffprobe_path
        self._verify_ffmpeg()
        
        # Instantiate delegate sub-services
        self._render_service = RenderService(ffmpeg_path=ffmpeg_path)
        self._subtitle_service = SubtitleService(ffmpeg_path=ffmpeg_path)

    def _verify_ffmpeg(self) -> None:
        """Verify FFmpeg is installed and accessible."""
        try:
            subprocess.run([self.ffmpeg_path, "-version"], capture_output=True, check=True, timeout=5)
            logger.info(f"✓ FFmpeg found at: {self.ffmpeg_path}")
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            logger.error(f"✗ FFmpeg not found or not executable: {e}")
            raise RuntimeError("FFmpeg is not installed. Install with: ffmpeg")

    async def get_metadata(self, video_path: str) -> VideoMetadata:
        """Extract video metadata using ffprobe."""
        cmd = build_ffprobe_cmd(self.ffprobe_path, video_path)

        try:
            result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                raise RuntimeError(f"ffprobe error: {result.stderr}")

            data = json.loads(result.stdout)
            format_data = data.get("format", {})
            stream_data = data.get("streams", [{}])[0]

            fps_str = stream_data.get("r_frame_rate", "24/1")
            num, denom = map(int, fps_str.split("/"))
            fps = num / denom if denom else num

            duration = float(format_data.get("duration", 0))
            width = stream_data.get("width", 1920)
            height = stream_data.get("height", 1080)
            bitrate = format_data.get("bit_rate", "5000k")
            codec = stream_data.get("codec_name", "h264")

            has_audio = any(s.get("codec_type") == "a" for s in data.get("streams", []))
            audio_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "a"), None)
            audio_bitrate = audio_stream.get("bit_rate") if audio_stream else None
            sample_rate = audio_stream.get("sample_rate") if audio_stream else None

            return VideoMetadata(
                duration=duration,
                width=width,
                height=height,
                fps=fps,
                bitrate=bitrate,
                codec=codec,
                has_audio=has_audio,
                audio_bitrate=audio_bitrate,
                sample_rate=int(sample_rate) if sample_rate else None
            )
        except Exception as e:
            logger.error(f"Failed to extract metadata from {video_path}: {e}")
            raise

    async def extract_frames(
        self,
        video_path: str,
        output_pattern: str,
        fps: float = 1.0,
        start_time: float = 0.0,
        end_time: Optional[float] = None,
        width: Optional[int] = None,
        height: Optional[int] = None
    ) -> List[str]:
        """Extract frames from video as image files (delegated to RenderService)."""
        return await self._render_service.extract_frames(
            video_path, output_pattern, fps, start_time, end_time, width, height
        )

    async def extract_audio(
        self,
        video_path: str,
        output_path: str,
        format: str = "mp3",
        bitrate: str = "192k"
    ) -> str:
        """Extract audio track from video (delegated to RenderService)."""
        return await self._render_service.extract_audio(video_path, output_path, format, bitrate)

    async def concatenate_videos(
        self,
        video_paths: List[str],
        output_path: str,
        transitions: Optional[List[TransitionSpec]] = None,
        fps: int = 24,
        width: int = 1920,
        height: int = 1080
    ) -> str:
        """Concatenate multiple videos with optional transitions (delegated to RenderService)."""
        return await self._render_service.concatenate_videos(
            video_paths, output_path, transitions, fps, width, height
        )

    async def cut_video(
        self,
        video_path: str,
        cuts: List[CutSpec],
        output_path: str,
        width: int = 1920,
        height: int = 1080
    ) -> str:
        """Cut/trim video to specific segments (delegated to RenderService)."""
        return await self._render_service.cut_video(video_path, cuts, output_path, width, height)

    async def adjust_speed(
        self,
        video_path: str,
        output_path: str,
        speed_factor: float = 1.0,
        preserve_pitch: bool = True
    ) -> str:
        """Adjust video playback speed (delegated to RenderService)."""
        return await self._render_service.adjust_speed(video_path, output_path, speed_factor, preserve_pitch)

    async def apply_filter(
        self,
        video_path: str,
        output_path: str,
        filter_type: FilterType,
        intensity: float = 1.0
    ) -> str:
        """Apply visual filter to video (delegated to RenderService)."""
        return await self._render_service.apply_filter(video_path, output_path, filter_type, intensity)

    async def add_subtitles(
        self,
        video_path: str,
        subtitle_path: str,
        output_path: str
    ) -> str:
        """Burn subtitles into video (delegated to SubtitleService)."""
        return await self._subtitle_service.add_subtitles(video_path, subtitle_path, output_path)

    async def mix_audio(
        self,
        video_path: str,
        audio_paths: List[str],
        audio_volumes: Optional[List[float]] = None,
        output_path: str = ""
    ) -> str:
        """Mix multiple audio tracks with video (delegated to RenderService)."""
        return await self._render_service.mix_audio(video_path, audio_paths, audio_volumes, output_path)


_ffmpeg_instance: Optional[FFmpegEngine] = None


def get_ffmpeg_engine() -> FFmpegEngine:
    """Get or create FFmpeg engine singleton."""
    global _ffmpeg_instance
    if _ffmpeg_instance is None:
        _ffmpeg_instance = FFmpegEngine()
    return _ffmpeg_instance
