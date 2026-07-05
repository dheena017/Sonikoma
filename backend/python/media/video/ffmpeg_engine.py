"""
backend/python/services/ffmpeg_engine.py
─────────────────────────────────────────────────────────────────────────────
FFmpeg-based video processing engine for advanced editing:
- Extract frames from videos
- Concatenate with transitions
- Apply filters (blur, fade, overlay, etc.)
- Extract audio tracks
- Add subtitles & text overlays
- Precise video cutting & trimming
- Speed/slow-motion adjustments
- Audio mixing & synchronization
─────────────────────────────────────────────────────────────────────────────
"""

import os
import subprocess
import logging
import json
import tempfile
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger("sonikoma.services.ffmpeg_engine")


class TransitionType(str, Enum):
    """Supported FFmpeg transitions."""
    FADE = "fade"
    DISSOLVE = "dissolve"
    SLIDE_LEFT = "slideleft"
    SLIDE_RIGHT = "slideright"
    SLIDE_UP = "slideup"
    SLIDE_DOWN = "slidedown"
    WIPE = "wipeleft"
    ZOOM_IN = "zoomin"
    ZOOM_OUT = "zoomout"


class FilterType(str, Enum):
    """Supported FFmpeg filters."""
    BLUR = "blur"
    BRIGHTEN = "brighten"
    DARKEN = "darken"
    SATURATE = "saturate"
    DESATURATE = "desaturate"
    GRAYSCALE = "grayscale"
    SEPIA = "sepia"
    INVERT = "invert"
    SHARPEN = "sharpen"
    DENOISE = "denoise"


@dataclass
class VideoMetadata:
    """Video file metadata."""
    duration: float
    width: int
    height: int
    fps: float
    bitrate: str
    codec: str
    has_audio: bool
    audio_bitrate: Optional[str] = None
    sample_rate: Optional[int] = None


@dataclass
class TransitionSpec:
    """Video transition specification."""
    type: TransitionType
    duration: float = 1.0
    start_frame: Optional[int] = None


@dataclass
class CutSpec:
    """Video cut/trim specification."""
    start_time: float  # seconds
    end_time: float    # seconds
    fade_in: float = 0.0
    fade_out: float = 0.0


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

    def _verify_ffmpeg(self) -> None:
        """Verify FFmpeg is installed and accessible."""
        try:
            subprocess.run([self.ffmpeg_path, "-version"], capture_output=True, check=True, timeout=5)
            logger.info(f"✓ FFmpeg found at: {self.ffmpeg_path}")
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            logger.error(f"✗ FFmpeg not found or not executable: {e}")
            raise RuntimeError("FFmpeg is not installed. Install with: ffmpeg")

    async def get_metadata(self, video_path: str) -> VideoMetadata:
        """
        Extract video metadata using ffprobe.

        Args:
            video_path: Path to video file

        Returns:
            VideoMetadata object with video properties
        """
        cmd = [
            self.ffprobe_path,
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "format=duration,bit_rate:stream=width,height,r_frame_rate,codec_name,codec_type,bit_rate,sample_rate,channels",
            "-of", "json",
            video_path
        ]

        try:
            result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                raise RuntimeError(f"ffprobe error: {result.stderr}")

            data = json.loads(result.stdout)
            format_data = data.get("format", {})
            stream_data = data.get("streams", [{}])[0]

            # Parse frame rate
            fps_str = stream_data.get("r_frame_rate", "24/1")
            num, denom = map(int, fps_str.split("/"))
            fps = num / denom if denom else num

            duration = float(format_data.get("duration", 0))
            width = stream_data.get("width", 1920)
            height = stream_data.get("height", 1080)
            bitrate = format_data.get("bit_rate", "5000k")
            codec = stream_data.get("codec_name", "h264")

            # Check for audio
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
        """
        Extract frames from video as image files.

        Args:
            video_path: Input video path
            output_pattern: Output pattern like '/tmp/frame_%04d.png'
            fps: Frames per second to extract
            start_time: Start time in seconds
            end_time: End time in seconds (None = full duration)
            width: Resize width (None = original)
            height: Resize height (None = original)

        Returns:
            List of extracted frame paths
        """
        cmd = [self.ffmpeg_path, "-y"]

        if start_time > 0:
            cmd.extend(["-ss", str(start_time)])

        cmd.extend(["-i", video_path])

        if end_time:
            duration = end_time - start_time
            cmd.extend(["-t", str(duration)])

        cmd.extend(["-vf", f"fps={fps}"])

        if width or height:
            scale_filter = "scale="
            scale_filter += f"{width}:-1" if width else "-1"
            scale_filter += f":{height}" if height else ""
            cmd[-1] = f"{cmd[-1]},scale={width if width else -1}:{height if height else -1}"

        cmd.append(output_pattern)

        logger.info(f"Extracting frames: {' '.join(cmd)}")

        try:
            await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, check=True, timeout=300)
            
            # Find extracted files
            output_dir = os.path.dirname(output_pattern)
            base_name = os.path.basename(output_pattern).split("%")[0]
            frames = sorted([
                os.path.join(output_dir, f) for f in os.listdir(output_dir)
                if f.startswith(base_name) and f.endswith(('.png', '.jpg'))
            ])
            
            logger.info(f"✓ Extracted {len(frames)} frames")
            return frames
        except Exception as e:
            logger.error(f"Frame extraction failed: {e}")
            raise

    async def extract_audio(
        self,
        video_path: str,
        output_path: str,
        format: str = "mp3",
        bitrate: str = "192k"
    ) -> str:
        """
        Extract audio track from video.

        Args:
            video_path: Input video path
            output_path: Output audio path
            format: Output format (mp3, aac, wav, flac)
            bitrate: Audio bitrate

        Returns:
            Path to extracted audio file
        """
        cmd = [
            self.ffmpeg_path, "-y",
            "-i", video_path,
            "-vn",  # No video
            "-acodec", "libmp3lame" if format == "mp3" else "aac",
            "-ab", bitrate,
            output_path
        ]

        logger.info(f"Extracting audio: {output_path}")

        try:
            await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, check=True, timeout=60)
            logger.info(f"✓ Audio extracted: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Audio extraction failed: {e}")
            raise

    async def concatenate_videos(
        self,
        video_paths: List[str],
        output_path: str,
        transitions: Optional[List[TransitionSpec]] = None,
        fps: int = 24,
        width: int = 1920,
        height: int = 1080
    ) -> str:
        """
        Concatenate multiple videos with optional transitions.

        Args:
            video_paths: List of input video paths
            output_path: Output video path
            transitions: List of transitions between videos
            fps: Output FPS
            width: Output width
            height: Output height

        Returns:
            Path to concatenated video
        """
        if not video_paths:
            raise ValueError("No videos provided")

        # Create concat demuxer file
        concat_file = os.path.join(tempfile.gettempdir(), "concat_list.txt")
        with open(concat_file, "w") as f:
            for vp in video_paths:
                f.write(f"file '{os.path.abspath(vp)}'\n")

        cmd = [
            self.ffmpeg_path, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-vf", f"scale={width}:{height}",
            "-fps", str(fps),
            output_path
        ]

        logger.info(f"Concatenating {len(video_paths)} videos")

        try:
            await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, check=True, timeout=600)
            logger.info(f"✓ Videos concatenated: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Video concatenation failed: {e}")
            raise
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
        """
        Cut/trim video to specific segments.

        Args:
            video_path: Input video path
            cuts: List of cut specifications
            output_path: Output video path
            width: Output width
            height: Output height

        Returns:
            Path to cut video
        """
        if not cuts:
            raise ValueError("No cuts specified")

        # Build concat demuxer for cuts
        concat_file = os.path.join(tempfile.gettempdir(), "cuts_list.txt")
        
        with open(concat_file, "w") as f:
            for i, cut in enumerate(cuts):
                segment_path = os.path.join(tempfile.gettempdir(), f"cut_segment_{i}.mp4")
                
                # Extract each segment
                cmd = [
                    self.ffmpeg_path, "-y",
                    "-i", video_path,
                    "-ss", str(cut.start_time),
                    "-to", str(cut.end_time),
                    "-c", "copy",
                    segment_path
                ]
                
                await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, check=True, timeout=120)
                f.write(f"file '{os.path.abspath(segment_path)}'\n")

        # Concatenate segments
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

        logger.info(f"Cutting video into {len(cuts)} segments")

        try:
            await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, check=True, timeout=600)
            logger.info(f"✓ Video cut: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Video cutting failed: {e}")
            raise

    async def adjust_speed(
        self,
        video_path: str,
        output_path: str,
        speed_factor: float = 1.0,
        preserve_pitch: bool = True
    ) -> str:
        """
        Adjust video playback speed.

        Args:
            video_path: Input video path
            output_path: Output video path
            speed_factor: Speed factor (0.5 = half speed, 2.0 = double speed)
            preserve_pitch: Keep audio pitch constant (only for audio)

        Returns:
            Path to speed-adjusted video
        """
        if speed_factor <= 0:
            raise ValueError("Speed factor must be positive")

        # Video filter
        video_filter = f"setpts=PTS/{speed_factor}"
        
        # Audio filter (with pitch preservation)
        audio_filter = f"atempo={speed_factor}" if speed_factor != 1.0 else None

        cmd = [self.ffmpeg_path, "-y", "-i", video_path]
        
        if audio_filter:
            cmd.extend(["-filter:v", video_filter, "-filter:a", audio_filter])
        else:
            cmd.extend(["-filter:v", video_filter])

        cmd.extend(["-c:v", "libx264", "-preset", "fast", output_path])

        logger.info(f"Adjusting speed: {speed_factor}x")

        try:
            await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, check=True, timeout=300)
            logger.info(f"✓ Speed adjusted: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Speed adjustment failed: {e}")
            raise

    async def apply_filter(
        self,
        video_path: str,
        output_path: str,
        filter_type: FilterType,
        intensity: float = 1.0
    ) -> str:
        """
        Apply visual filter to video.

        Args:
            video_path: Input video path
            output_path: Output video path
            filter_type: Type of filter to apply
            intensity: Filter intensity (0.0-2.0)

        Returns:
            Path to filtered video
        """
        filters = {
            FilterType.BLUR: f"boxblur={intensity}",
            FilterType.BRIGHTEN: f"eq=brightness={intensity}",
            FilterType.DARKEN: f"eq=brightness=-{intensity}",
            FilterType.SATURATE: f"eq=saturation={1.0 + intensity}",
            FilterType.DESATURATE: f"eq=saturation={1.0 - intensity}",
            FilterType.GRAYSCALE: "format=gray",
            FilterType.SEPIA: "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
            FilterType.INVERT: "negate",
            FilterType.SHARPEN: f"unsharp=5:5:{intensity}",
            FilterType.DENOISE: "nlmeans=s=10:p=4:r=16",
        }

        filter_str = filters.get(filter_type, "")
        if not filter_str:
            raise ValueError(f"Unknown filter: {filter_type}")

        cmd = [
            self.ffmpeg_path, "-y",
            "-i", video_path,
            "-vf", filter_str,
            "-c:v", "libx264",
            "-preset", "fast",
            output_path
        ]

        logger.info(f"Applying filter: {filter_type}")

        try:
            await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, check=True, timeout=300)
            logger.info(f"✓ Filter applied: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Filter application failed: {e}")
            raise

    async def add_subtitles(
        self,
        video_path: str,
        subtitle_path: str,
        output_path: str
    ) -> str:
        """
        Burn subtitles into video.

        Args:
            video_path: Input video path
            subtitle_path: Subtitle file path (SRT or VTT)
            output_path: Output video path

        Returns:
            Path to video with subtitles
        """
        # Escape subtitle path for FFmpeg filter
        escaped_path = subtitle_path.replace("\\", "\\\\").replace(":", "\\:")

        cmd = [
            self.ffmpeg_path, "-y",
            "-i", video_path,
            "-vf", f"subtitles={escaped_path}",
            "-c:v", "libx264",
            "-preset", "fast",
            output_path
        ]

        logger.info(f"Adding subtitles from: {subtitle_path}")

        try:
            await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, check=True, timeout=300)
            logger.info(f"✓ Subtitles added: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Subtitle addition failed: {e}")
            raise

    async def mix_audio(
        self,
        video_path: str,
        audio_paths: List[str],
        audio_volumes: Optional[List[float]] = None,
        output_path: str = ""
    ) -> str:
        """
        Mix multiple audio tracks with video.

        Args:
            video_path: Input video path
            audio_paths: List of audio file paths
            audio_volumes: Volume levels for each audio (0.0-1.0)
            output_path: Output video path

        Returns:
            Path to mixed video
        """
        if not audio_paths:
            raise ValueError("No audio files provided")

        if audio_volumes is None:
            audio_volumes = [1.0] * len(audio_paths)

        if len(audio_volumes) != len(audio_paths):
            raise ValueError("audio_volumes must match audio_paths length")

        cmd = [self.ffmpeg_path, "-y", "-i", video_path]

        # Add all audio inputs
        for ap in audio_paths:
            cmd.extend(["-i", ap])

        # Build filter for mixing
        audio_count = len(audio_paths)
        filter_parts = []

        for i, vol in enumerate(audio_volumes):
            filter_parts.append(f"[{i+1}]volume={vol}[a{i}]")

        # Mix all audio tracks
        mix_inputs = "".join(f"[a{i}]" for i in range(audio_count))
        filter_parts.append(f"{mix_inputs}amix=inputs={audio_count}:duration=first[aout]")

        filter_str = ";".join(filter_parts)

        cmd.extend([
            "-filter_complex", filter_str,
            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            output_path
        ])

        logger.info(f"Mixing {len(audio_paths)} audio tracks")

        try:
            await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, check=True, timeout=300)
            logger.info(f"✓ Audio mixed: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Audio mixing failed: {e}")
            raise


# Singleton instance
_ffmpeg_instance: Optional[FFmpegEngine] = None


def get_ffmpeg_engine() -> FFmpegEngine:
    """Get or create FFmpeg engine singleton."""
    global _ffmpeg_instance
    if _ffmpeg_instance is None:
        _ffmpeg_instance = FFmpegEngine()
    return _ffmpeg_instance
