"""
backend/app/providers/whisper/helpers.py
─────────────────────────────────────────────────────────────────────────────
Whisper formatting helpers: SRT/VTT subtitle timecode formatters and builders.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List
from app.providers.whisper.types import TranscriptionSegment


def format_srt_time(seconds: float) -> str:
    """Format seconds into SubRip (SRT) timestamp format: HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_vtt_time(seconds: float) -> str:
    """Format seconds into WebVTT timestamp format: HH:MM:SS.mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def segments_to_srt(segments: List[TranscriptionSegment]) -> str:
    """Convert transcription segments into full SRT subtitle content."""
    srt_lines: List[str] = []
    for segment in segments:
        start_str = format_srt_time(segment.start_time)
        end_str = format_srt_time(segment.end_time)
        srt_lines.append(f"{segment.id + 1}")
        srt_lines.append(f"{start_str} --> {end_str}")
        srt_lines.append(segment.text.strip())
        srt_lines.append("")
    return "\n".join(srt_lines)


def segments_to_vtt(segments: List[TranscriptionSegment]) -> str:
    """Convert transcription segments into full WebVTT subtitle content."""
    vtt_lines: List[str] = ["WEBVTT", ""]
    for segment in segments:
        start_str = format_vtt_time(segment.start_time)
        end_str = format_vtt_time(segment.end_time)
        vtt_lines.append(f"{start_str} --> {end_str}")
        vtt_lines.append(segment.text.strip())
        vtt_lines.append("")
    return "\n".join(vtt_lines)
