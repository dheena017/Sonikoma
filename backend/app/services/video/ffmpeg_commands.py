"""
backend/app/services/video/ffmpeg_commands.py
─────────────────────────────────────────────────────────────────────────────
Pure command-line construction helpers for FFmpeg and FFprobe executions.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional
from services.video.ffmpeg_types import FilterType
from services.video.edit_helpers import get_ffmpeg_filter_string


def build_ffprobe_cmd(ffprobe_path: str, video_path: str) -> List[str]:
    """Builds the ffprobe metadata extraction command."""
    return [
        ffprobe_path,
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "format=duration,bit_rate:stream=width,height,r_frame_rate,codec_name,codec_type,bit_rate,sample_rate,channels",
        "-of", "json",
        video_path
    ]


def build_extract_frames_cmd(
    ffmpeg_path: str,
    video_path: str,
    output_pattern: str,
    fps: float = 1.0,
    start_time: float = 0.0,
    end_time: Optional[float] = None,
    width: Optional[int] = None,
    height: Optional[int] = None
) -> List[str]:
    """Builds the frame extraction command."""
    cmd = [ffmpeg_path, "-y"]
    if start_time > 0:
        cmd.extend(["-ss", str(start_time)])
    cmd.extend(["-i", video_path])
    if end_time:
        duration = end_time - start_time
        cmd.extend(["-t", str(duration)])
    
    vf_filters = f"fps={fps}"
    if width or height:
        vf_filters += f",scale={width if width else -1}:{height if height else -1}"
    
    cmd.extend(["-vf", vf_filters, output_pattern])
    return cmd


def build_extract_audio_cmd(
    ffmpeg_path: str,
    video_path: str,
    output_path: str,
    format_str: str = "mp3",
    bitrate: str = "192k"
) -> List[str]:
    """Builds the audio extraction command."""
    return [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "libmp3lame" if format_str == "mp3" else "aac",
        "-ab", bitrate,
        output_path
    ]


def build_concatenate_videos_cmd(
    ffmpeg_path: str,
    concat_file: str,
    output_path: str,
    fps: int = 24,
    width: int = 1920,
    height: int = 1080
) -> List[str]:
    """Builds the video concatenation command."""
    return [
        ffmpeg_path, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-vf", f"scale={width}:{height}",
        "-r", str(fps),
        output_path
    ]


def build_cut_video_cmd(
    ffmpeg_path: str,
    video_path: str,
    start_time: float,
    end_time: float,
    segment_path: str
) -> List[str]:
    """Builds a trim command for a single video segment."""
    return [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-ss", str(start_time),
        "-to", str(end_time),
        "-c", "copy",
        segment_path
    ]


def build_adjust_speed_cmd(
    ffmpeg_path: str,
    video_path: str,
    output_path: str,
    speed_factor: float = 1.0,
    preserve_pitch: bool = True
) -> List[str]:
    """Builds the video playback speed adjustment command."""
    video_filter = f"setpts=PTS/{speed_factor}"
    audio_filter = f"atempo={speed_factor}" if speed_factor != 1.0 else None

    cmd = [ffmpeg_path, "-y", "-i", video_path]
    if audio_filter:
        cmd.extend(["-filter:v", video_filter, "-filter:a", audio_filter])
    else:
        cmd.extend(["-filter:v", video_filter])
    cmd.extend(["-c:v", "libx264", "-preset", "fast", output_path])
    return cmd


def build_apply_filter_cmd(
    ffmpeg_path: str,
    video_path: str,
    output_path: str,
    filter_type: FilterType,
    intensity: float = 1.0
) -> List[str]:
    """Builds the visual filter application command."""
    filter_str = get_ffmpeg_filter_string(filter_type, intensity)
    if not filter_str:
        raise ValueError(f"Unknown filter: {filter_type}")

    return [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-vf", filter_str,
        "-c:v", "libx264",
        "-preset", "fast",
        output_path
    ]


def build_add_subtitles_cmd(
    ffmpeg_path: str,
    video_path: str,
    subtitle_path: str,
    output_path: str
) -> List[str]:
    """Builds the burn subtitles command."""
    escaped_path = subtitle_path.replace("\\", "\\\\").replace(":", "\\:")
    return [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-vf", f"subtitles={escaped_path}",
        "-c:v", "libx264",
        "-preset", "fast",
        output_path
    ]


def build_mix_audio_cmd(
    ffmpeg_path: str,
    video_path: str,
    audio_paths: List[str],
    audio_volumes: List[float],
    output_path: str
) -> List[str]:
    """Builds the multi-track audio mixing command."""
    cmd = [ffmpeg_path, "-y", "-i", video_path]
    for ap in audio_paths:
        cmd.extend(["-i", ap])

    audio_count = len(audio_paths)
    filter_parts = []
    for i, vol in enumerate(audio_volumes):
        filter_parts.append(f"[{i+1}]volume={vol}[a{i}]")

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
    return cmd
