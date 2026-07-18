"""
backend/app/engines/video/render_engine.py
─────────────────────────────────────────────────────────────────────────────
Execution primitives for cutting, mixing audio, applying filters, and concatenations.
This replaces the previous `render_service.py` and exposes the engine-level API.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import subprocess
import asyncio
import tempfile
from typing import List, Optional
from engines.ffmpeg.types import TransitionSpec, CutSpec, FilterType
from engines.ffmpeg.commands import (
    build_extract_frames_cmd,
    build_extract_audio_cmd,
    build_concatenate_videos_cmd,
    build_cut_video_cmd,
    build_adjust_speed_cmd,
    build_apply_filter_cmd,
    build_mix_audio_cmd
)

logger = logging.getLogger("sonikoma.engines.video.render")


class RenderEngine:
    """Engine coordinating high-level rendering operations."""

    def __init__(self, ffmpeg_path: str = "ffmpeg"):
        self.ffmpeg_path = ffmpeg_path

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
        cmd = build_extract_frames_cmd(
            self.ffmpeg_path, video_path, output_pattern,
            fps, start_time, end_time, width, height
        )
        logger.info(f"[RenderEngine] Extracting frames: {video_path}")
        result = await asyncio.to_thread(
            subprocess.run, cmd, capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg frame extraction failed: {result.stderr}")
        
        output_dir = os.path.dirname(output_pattern)
        base_name = os.path.basename(output_pattern).split("%")[0]
        frames = sorted([
            os.path.join(output_dir, f) for f in os.listdir(output_dir)
            if f.startswith(base_name) and f.endswith(('.png', '.jpg'))
        ])
        return frames

    async def extract_audio(
        self,
        video_path: str,
        output_path: str,
        format_str: str = "mp3",
        bitrate: str = "192k"
    ) -> str:
        cmd = build_extract_audio_cmd(self.ffmpeg_path, video_path, output_path, format_str, bitrate)
        logger.info(f"[RenderEngine] Extracting audio track to: {output_path}")
        result = await asyncio.to_thread(
            subprocess.run, cmd, capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg audio extraction failed: {result.stderr}")
        return output_path

    async def concatenate_videos(
        self,
        video_paths: List[str],
        output_path: str,
        transitions: Optional[List[TransitionSpec]] = None,
        fps: int = 24,
        width: int = 1920,
        height: int = 1080
    ) -> str:
        if not video_paths:
            raise ValueError("No video paths provided for concatenation.")
        
        concat_file = os.path.join(tempfile.gettempdir(), f"concat_{os.urandom(4).hex()}.txt")
        with open(concat_file, "w") as f:
            for vp in video_paths:
                f.write(f"file '{os.path.abspath(vp)}'\n")

        cmd = build_concatenate_videos_cmd(self.ffmpeg_path, concat_file, output_path, fps, width, height)
        logger.info(f"[RenderEngine] Concatenating {len(video_paths)} videos -> {output_path}")
        try:
            result = await asyncio.to_thread(
                subprocess.run, cmd, capture_output=True, text=True, timeout=600
            )
            if result.returncode != 0:
                raise RuntimeError(f"FFmpeg video concatenation failed: {result.stderr}")
            return output_path
        finally:
            if os.path.exists(concat_file):
                os.remove(concat_file)

    async def cut_video(
        self,
        video_path: str,
        cuts: List[CutSpec],
        output_path: str,
        width: int = 1920,
        height: int = 1080
    ) -> str:
        if not cuts:
            raise ValueError("No cuts specified.")

        concat_file = os.path.join(tempfile.gettempdir(), f"cuts_{os.urandom(4).hex()}.txt")
        segments = []
        try:
            with open(concat_file, "w") as f:
                for i, cut in enumerate(cuts):
                    segment_path = os.path.join(tempfile.gettempdir(), f"cut_segment_{i}_{os.urandom(4).hex()}.mp4")
                    segments.append(segment_path)
                    
                    cmd = build_cut_video_cmd(self.ffmpeg_path, video_path, cut.start_time, cut.end_time, segment_path)
                    res = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=120)
                    if res.returncode != 0:
                        raise RuntimeError(f"Trim segment failed: {res.stderr}")
                    
                    f.write(f"file '{os.path.abspath(segment_path)}'\n")

            cmd = [
                self.ffmpeg_path, "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                output_path
            ]
            logger.info(f"[RenderEngine] Re-stitching {len(cuts)} cuts -> {output_path}")
            result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=600)
            if result.returncode != 0:
                raise RuntimeError(f"Re-stitching cuts failed: {result.stderr}")
            return output_path
        finally:
            if os.path.exists(concat_file):
                os.remove(concat_file)
            for seg in segments:
                if os.path.exists(seg):
                    try:
                        os.remove(seg)
                    except OSError:
                        pass

    async def adjust_speed(
        self,
        video_path: str,
        output_path: str,
        speed_factor: float = 1.0,
        preserve_pitch: bool = True
    ) -> str:
        if speed_factor <= 0:
            raise ValueError("Speed factor must be positive.")

        cmd = build_adjust_speed_cmd(self.ffmpeg_path, video_path, output_path, speed_factor, preserve_pitch)
        logger.info(f"[RenderEngine] Adjusting speed: {speed_factor}x")
        result = await asyncio.to_thread(
            subprocess.run, cmd, capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
            raise RuntimeError(f"Speed adjustment failed: {result.stderr}")
        return output_path

    async def apply_filter(
        self,
        video_path: str,
        output_path: str,
        filter_type: FilterType,
        intensity: float = 1.0
    ) -> str:
        cmd = build_apply_filter_cmd(self.ffmpeg_path, video_path, output_path, filter_type, intensity)
        logger.info(f"[RenderEngine] Applying visual filter: {filter_type}")
        result = await asyncio.to_thread(
            subprocess.run, cmd, capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
            raise RuntimeError(f"Filter application failed: {result.stderr}")
        return output_path

    async def mix_audio(
        self,
        video_path: str,
        audio_paths: List[str],
        audio_volumes: Optional[List[float]] = None,
        output_path: str = ""
    ) -> str:
        if not audio_paths:
            raise ValueError("No audio paths provided.")
        
        if audio_volumes is None:
            audio_volumes = [1.0] * len(audio_paths)
            
        if len(audio_volumes) != len(audio_paths):
            raise ValueError("audio_volumes must match audio_paths length.")

        cmd = build_mix_audio_cmd(self.ffmpeg_path, video_path, audio_paths, audio_volumes, output_path)
        logger.info(f"[RenderEngine] Mixing {len(audio_paths)} audio tracks -> {output_path}")
        result = await asyncio.to_thread(
            subprocess.run, cmd, capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
            raise RuntimeError(f"Audio mixing failed: {result.stderr}")
        return output_path
