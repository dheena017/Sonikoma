"""
backend/tests/test_21_video_domain_consolidation.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive tests for the unified features.video domain services and utilities.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
import numpy as np
from PIL import Image

from features.video.utils.resolutions import (
    make_even_dimensions,
    get_resolution,
    get_bitrate,
    ensure_even_dimensions,
    resolve_resolution,
    calculate_video_bitrate,
    STANDARD_RESOLUTIONS,
)
from features.video.utils.timecodes import (
    get_total_frames,
    format_timecode,
    parse_timecode,
    calculate_total_frames,
    parse_timecode_to_seconds,
)
from features.video.composition.frame_builder import build_frame, build_panel_frame_image
from features.video.composition.subtitle_overlay import (
    SubtitleOverlay,
    create_subtitles,
    create_subtitle_overlay,
)
from features.video.composition.sfx_visualizer import add_sfx_text, overlay_manga_sfx
from features.video.composition.watermark_overlay import add_watermark, apply_video_watermark
from features.video.compiler.timeline_engine import build_timeline, build_multi_track_timeline
from features.video.compiler.audio_sync_engine import sync_dialogue, align_dialogue_with_audio
from features.video.export.export_presets import get_export_preset, get_platform_export_profile
from features.video.service import VideoService, video_service


# ─── 1. Resolution & Dimension Utilities ────────────────────────────────────

def test_make_even_dimensions():
    """H.264 mandates dimensions divisible by 2."""
    assert make_even_dimensions(1920, 1080) == (1920, 1080)
    assert make_even_dimensions(1921, 1079) == (1920, 1078)
    assert make_even_dimensions(1, 1) == (2, 2)
    # Check alias
    assert ensure_even_dimensions(1921, 1079) == (1920, 1078)


def test_get_resolution_presets():
    """Standard presets and custom aspect strings."""
    assert get_resolution("1080p") == (1920, 1080)
    assert get_resolution("9:16") == (1080, 1920)
    assert get_resolution("vertical_1080p") == (1080, 1920)
    assert get_resolution("1280x720") == (1280, 720)
    assert get_resolution("invalid_unknown", default=(1920, 1080)) == (1920, 1080)
    # Check alias
    assert resolve_resolution("1080p") == (1920, 1080)


def test_get_bitrate():
    """Bitrate recommendations based on resolution."""
    assert get_bitrate(3840, 2160, fps=30) == "25M"
    assert get_bitrate(1920, 1080, fps=30) == "8M"
    assert get_bitrate(1280, 720, fps=30) == "4M"
    assert get_bitrate(640, 360, fps=30) == "2M"
    # Check alias
    assert calculate_video_bitrate(1920, 1080, fps=30) == "8M"


# ─── 2. Timecodes & Frame Math ──────────────────────────────────────────────

def test_timecode_calculations():
    """Total frame calculations and SMPTE formatting."""
    assert get_total_frames(3.0, fps=30) == 90
    assert get_total_frames(0, fps=30) == 0
    assert calculate_total_frames(3.0, fps=30) == 90
    assert format_timecode(65.5, fps=30) == "00:01:05:15"
    assert parse_timecode("00:01:05:15", fps=30) == pytest.approx(65.5, abs=0.05)
    assert parse_timecode_to_seconds("00:01:05:15", fps=30) == pytest.approx(65.5, abs=0.05)


# ─── 3. Frame Composition & Overlays ────────────────────────────────────────

def test_build_frame():
    """Centering with blurred background fill."""
    fg = Image.new("RGB", (800, 600), (255, 0, 0))
    bg = Image.new("RGB", (800, 600), (0, 0, 255))
    frame = build_frame(bg, fg, target_width=1280, target_height=720)
    assert frame.size == (1280, 720)
    assert isinstance(frame, Image.Image)

    frame_alias = build_panel_frame_image(bg, fg, target_width=1280, target_height=720)
    assert frame_alias.size == (1280, 720)


def test_create_subtitles():
    """Subtitle pill banner generation and alpha blending."""
    overlay = create_subtitles("Hello World Dialogue", target_width=1280)
    assert overlay is not None
    assert isinstance(overlay, SubtitleOverlay)
    assert overlay.height == 105

    canvas = np.zeros((720, 1280, 3), dtype=np.uint8)
    overlay.apply_to(canvas, target_width=1280)
    assert canvas[-50, 640].sum() > 0  # Sample inside the pill bounds

    overlay_alias = create_subtitle_overlay("Hello World Dialogue", target_width=1280)
    assert overlay_alias is not None


def test_add_sfx_text():
    """Action text and radial speed lines."""
    frame = Image.new("RGB", (640, 480), (100, 100, 100))
    result = add_sfx_text(frame, "BOOM!!", impact_level="high")
    assert result.size == (640, 480)
    assert isinstance(result, Image.Image)

    result_alias = overlay_manga_sfx(frame, "BOOM!!", impact_level="high")
    assert result_alias.size == (640, 480)


def test_add_watermark():
    """Watermark stamp positioning."""
    frame = Image.new("RGB", (800, 600), (200, 200, 200))
    logo = Image.new("RGBA", (100, 50), (255, 0, 0, 255))
    watermarked = add_watermark(frame, logo, position="bottom-right", opacity=0.8)
    assert watermarked.size == (800, 600)

    watermarked_alias = apply_video_watermark(frame, logo, position="bottom-right", opacity=0.8)
    assert watermarked_alias.size == (800, 600)


# ─── 4. Timeline & Sync Engines ─────────────────────────────────────────────

def test_build_timeline():
    """Timeline model generation with tracks."""
    panels = [
        {"id": "p1", "image_url": "http://example.com/p1.jpg", "duration": 3.0, "audio_url": "http://example.com/a1.mp3"},
        {"id": "p2", "image_url": "http://example.com/p2.jpg", "duration": 4.5},
    ]
    timeline = build_timeline(panels, bgm_track="http://example.com/bgm.mp3")
    assert timeline["master_duration"] == 7.5
    assert len(timeline["tracks"]["video"]) == 2
    assert len(timeline["tracks"]["dialogue"]) == 1
    assert timeline["tracks"]["bgm"] is not None

    timeline_alias = build_multi_track_timeline(panels, bgm_track="http://example.com/bgm.mp3")
    assert timeline_alias["master_duration"] == 7.5


def test_sync_dialogue():
    """Dialogue duration adaptation."""
    res = sync_dialogue("A short sentence spoken aloud.", audio_duration=3.2, audio_peaks=[1.2, 2.4])
    assert res["has_audio_sync"] is True
    assert res["duration"] >= 3.2
    assert len(res["action_cues"]) == 2

    res_alias = align_dialogue_with_audio("A short sentence spoken aloud.", audio_duration=3.2, audio_peaks=[1.2, 2.4])
    assert res_alias["duration"] == res["duration"]


# ─── 5. Export Profiles & Service Facade ─────────────────────────────────────

def test_get_export_preset():
    """Target platform presets."""
    yt = get_export_preset("youtube_1080p")
    assert yt["width"] == 1920
    assert yt["height"] == 1080

    tiktok = get_export_preset("tiktok_vertical")
    assert tiktok["width"] == 1080
    assert tiktok["height"] == 1920
    assert tiktok["aspect_ratio"] == "9:16"

    yt_alias = get_platform_export_profile("youtube_1080p")
    assert yt_alias["width"] == 1920


def test_video_service_singleton():
    """Canonical VideoService facade."""
    assert video_service is not None
    assert isinstance(video_service, VideoService)
    assert hasattr(video_service, "compile_video")
    assert hasattr(video_service, "render_job")
