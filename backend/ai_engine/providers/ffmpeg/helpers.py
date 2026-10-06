"""
backend/app/providers/ffmpeg/helpers.py
─────────────────────────────────────────────────────────────────────────────
FFmpeg command-builder utilities and filter-string helpers.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional
from ai_engine.providers.ffmpeg.types import FilterType


# ─── Filter Strings ───────────────────────────────────────────────────────────

def get_ffmpeg_filter_string(filter_type: FilterType, intensity: float = 1.0) -> str:
    """Return the FFmpeg vf filter string for the given visual filter."""
    filters = {
        FilterType.BLUR:       f"boxblur={intensity}",
        FilterType.BRIGHTEN:   f"eq=brightness={intensity}",
        FilterType.DARKEN:     f"eq=brightness=-{intensity}",
        FilterType.SATURATE:   f"eq=saturation={1.0 + intensity}",
        FilterType.DESATURATE: f"eq=saturation={1.0 - intensity}",
        FilterType.GRAYSCALE:  "format=gray",
        FilterType.SEPIA:      "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
        FilterType.INVERT:     "negate",
        FilterType.SHARPEN:    f"unsharp=5:5:{intensity}",
        FilterType.DENOISE:    "nlmeans=s=10:p=4:r=16",
    }
    return filters.get(filter_type, "")


# ─── Probe & Inspection ───────────────────────────────────────────────────────

def build_ffprobe_cmd(ffprobe_path: str, video_path: str) -> List[str]:
    """Build the ffprobe metadata extraction command."""
    return [
        ffprobe_path,
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries",
        "format=duration,bit_rate:stream=width,height,r_frame_rate,codec_name,codec_type,bit_rate,sample_rate,channels",
        "-of", "json",
        video_path,
    ]


# ─── Frame & Audio Extraction ─────────────────────────────────────────────────

def build_extract_frames_cmd(
    ffmpeg_path: str,
    video_path: str,
    output_pattern: str,
    fps: float = 1.0,
    start_time: float = 0.0,
    end_time: Optional[float] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
) -> List[str]:
    """Build the frame extraction command."""
    cmd = [ffmpeg_path, "-y"]
    if start_time > 0:
        cmd.extend(["-ss", str(start_time)])
    cmd.extend(["-i", video_path])
    if end_time:
        cmd.extend(["-t", str(end_time - start_time)])

    vf = f"fps={fps}"
    if width or height:
        vf += f",scale={width if width else -1}:{height if height else -1}"
    cmd.extend(["-vf", vf, output_pattern])
    return cmd


def build_extract_audio_cmd(
    ffmpeg_path: str,
    video_path: str,
    output_path: str,
    format_str: str = "mp3",
    bitrate: str = "192k",
) -> List[str]:
    """Build the audio extraction command."""
    return [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "libmp3lame" if format_str == "mp3" else "aac",
        "-ab", bitrate,
        output_path,
    ]


# ─── Video Editing ────────────────────────────────────────────────────────────

def build_concatenate_videos_cmd(
    ffmpeg_path: str,
    concat_file: str,
    output_path: str,
    fps: int = 24,
    width: int = 1920,
    height: int = 1080,
) -> List[str]:
    """Build the video concatenation command (concat demuxer)."""
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
        output_path,
    ]


def build_cut_video_cmd(
    ffmpeg_path: str,
    video_path: str,
    start_time: float,
    end_time: float,
    segment_path: str,
) -> List[str]:
    """Build a trim command for a single video segment (stream copy)."""
    return [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-ss", str(start_time),
        "-to", str(end_time),
        "-c", "copy",
        segment_path,
    ]


def build_adjust_speed_cmd(
    ffmpeg_path: str,
    video_path: str,
    output_path: str,
    speed_factor: float = 1.0,
    preserve_pitch: bool = True,
) -> List[str]:
    """Build the playback speed adjustment command."""
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
    intensity: float = 1.0,
) -> List[str]:
    """Build the visual filter application command."""
    filter_str = get_ffmpeg_filter_string(filter_type, intensity)
    if not filter_str:
        raise ValueError(f"Unknown filter type: {filter_type}")
    return [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-vf", filter_str,
        "-c:v", "libx264",
        "-preset", "fast",
        output_path,
    ]


# ─── Subtitle ─────────────────────────────────────────────────────────────────

def build_add_subtitles_cmd(
    ffmpeg_path: str,
    video_path: str,
    subtitle_path: str,
    output_path: str,
) -> List[str]:
    """Build the burn-in subtitles command."""
    escaped = subtitle_path.replace("\\", "\\\\").replace(":", "\\:")
    return [
        ffmpeg_path, "-y",
        "-i", video_path,
        "-vf", f"subtitles={escaped}",
        "-c:v", "libx264",
        "-preset", "fast",
        output_path,
    ]


# ─── Audio Mixing ─────────────────────────────────────────────────────────────

def build_mix_audio_cmd(
    ffmpeg_path: str,
    video_path: str,
    audio_paths: List[str],
    audio_volumes: List[float],
    output_path: str,
) -> List[str]:
    """Build the multi-track audio mixing command."""
    cmd = [ffmpeg_path, "-y", "-i", video_path]
    for ap in audio_paths:
        cmd.extend(["-i", ap])

    filter_parts = [f"[{i+1}]volume={vol}[a{i}]" for i, vol in enumerate(audio_volumes)]
    mix_inputs = "".join(f"[a{i}]" for i in range(len(audio_paths)))
    filter_parts.append(f"{mix_inputs}amix=inputs={len(audio_paths)}:duration=first[aout]")

    cmd.extend([
        "-filter_complex", ";".join(filter_parts),
        "-map", "0:v:0",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac",
        output_path,
    ])
    return cmd


__all__ = [
    # Filter utilities
    "get_ffmpeg_filter_string",
    # Probe
    "build_ffprobe_cmd",
    # Extraction
    "build_extract_frames_cmd",
    "build_extract_audio_cmd",
    # Editing
    "build_concatenate_videos_cmd",
    "build_cut_video_cmd",
    "build_adjust_speed_cmd",
    "build_apply_filter_cmd",
    # Subtitles
    "build_add_subtitles_cmd",
    # Audio
    "build_mix_audio_cmd",
]
