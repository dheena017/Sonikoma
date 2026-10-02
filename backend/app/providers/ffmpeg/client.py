"""
backend/app/providers/ffmpeg/client.py
─────────────────────────────────────────────────────────────────────────────
FFmpeg process execution client: binary verification and subprocess invocation.
─────────────────────────────────────────────────────────────────────────────
"""

import shutil
import asyncio
import subprocess
import logging
from typing import List, Tuple, Optional

logger = logging.getLogger("sonikoma.providers.ffmpeg.client")


class FFmpegClient:
    """Low-level execution client that checks binaries and runs FFmpeg subprocesses."""

    @staticmethod
    def get_ffmpeg_path(custom_path: str = "ffmpeg") -> str:
        """Verify and return the FFmpeg binary path."""
        resolved = shutil.which(custom_path)
        return resolved or custom_path

    @staticmethod
    def get_ffprobe_path(custom_path: str = "ffprobe") -> str:
        """Verify and return the FFprobe binary path."""
        resolved = shutil.which(custom_path)
        return resolved or custom_path

    @classmethod
    async def execute_command(
        cls,
        cmd: List[str],
        timeout: int = 300,
    ) -> Tuple[int, str, str]:
        """Execute an arbitrary FFmpeg / FFprobe command asynchronously."""
        logger.debug(f"[FFmpegClient] Executing: {' '.join(cmd)}")
        result = await asyncio.to_thread(
            subprocess.run,
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return result.returncode, result.stdout, result.stderr
