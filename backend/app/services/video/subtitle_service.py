"""
backend/app/services/video/subtitle_service.py
─────────────────────────────────────────────────────────────────────────────
Subtitles rendering service.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import subprocess
import asyncio
from services.video.ffmpeg_commands import build_add_subtitles_cmd

logger = logging.getLogger("sonikoma.services.video.subtitles")


class SubtitleService:
    """Service to handle subtitle operations using FFmpeg."""

    def __init__(self, ffmpeg_path: str = "ffmpeg"):
        self.ffmpeg_path = ffmpeg_path

    async def add_subtitles(
        self,
        video_path: str,
        subtitle_path: str,
        output_path: str
    ) -> str:
        """Burns subtitle file (.srt) into the video."""
        cmd = build_add_subtitles_cmd(
            self.ffmpeg_path,
            video_path,
            subtitle_path,
            output_path
        )
        logger.info(f"[SubtitleService] Burning subtitles: {subtitle_path} -> {video_path}")
        
        result = await asyncio.to_thread(
            subprocess.run,
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        if result.returncode != 0:
            logger.error(f"[SubtitleService] Burning subtitles failed: {result.stderr}")
            raise RuntimeError(f"FFmpeg subtitle burn failed: {result.stderr}")
            
        logger.info(f"[SubtitleService] Burn-in complete: {output_path}")
        return output_path
