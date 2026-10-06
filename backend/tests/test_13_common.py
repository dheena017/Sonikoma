"""
backend/tests/test_13_common.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive unit test suite for the unified backend/common package:
- common.utils (http, formatting, id_generator, datetime_utils)
- common.schemas (base, pagination)
- common.image (dimensions, processing, svg fallback, border trimming)
- common.video (resolutions, bitrate, motion enums, timecode)
- common.audio (duration estimation, speech cleaning, text normalization)
- common.media (buffer resolver)
- common.jobs (background job manager)
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
import io
from PIL import Image

import common
from common import (
    # Utils
    get_client_ip,
    format_bytes,
    get_asset_type,
    format_duration,
    slugify,
    generate_uuid,
    generate_short_id,
    generate_project_id,
    utc_now,
    utc_iso,
    # Schemas
    StandardMessageResponse,
    SuccessResponse,
    StatusResponse,
    PaginationParams,
    PageMetadata,
    PaginatedResponse,
    # Image
    calculate_aspect_ratio,
    get_standard_aspect_ratio_name,
    fit_dimensions_within_bounds,
    get_image_metadata,
    compute_image_brightness,
    create_placeholder_image,
    create_svg_placeholder,
    trim_image_borders,
    # Video
    STANDARD_RESOLUTIONS,
    resolve_resolution,
    ensure_even_dimensions,
    calculate_video_bitrate,
    CinematicMotionType,
    VALID_MOTIONS,
    calculate_total_frames,
    format_timecode,
    # Audio
    estimate_speech_duration,
    clean_speech_script,
    format_audio_duration,
    to_natural_sentence_case,
    normalize_comic_text_for_human_speech,
    sanitize_text_for_tts,
    # Jobs
    job_manager,
    JobType,
    JobStage,
)


def test_common_utils_formatting():
    assert format_bytes(500) == "500.00 B"
    assert format_bytes(1024 * 1024) == "1.00 MB"
    assert get_asset_type("audio.mp3") == "audio"
    assert get_asset_type("image.webp") == "image"
    assert get_asset_type("clip.mp4") == "video"
    assert slugify("Episode 1: The Awakening!!", separator="_") == "episode_1_the_awakening"
    assert format_duration(65) == "01:05"


def test_common_utils_id_and_datetime():
    uid = generate_uuid()
    assert len(uid) == 36
    assert len(generate_short_id(8)) == 8
    pid = generate_project_id("my-slug")
    assert "my-slug" in pid
    now_iso = utc_iso()
    assert "T" in now_iso


def test_common_schemas():
    msg = StandardMessageResponse(message="Hello World")
    assert msg.message == "Hello World"
    succ = SuccessResponse(data={"key": "val"})
    assert succ.success is True
    page = PaginatedResponse(
        items=["item1", "item2"],
        page=1,
        limit=10,
        total=2,
        total_pages=1,
    )
    assert len(page.items) == 2


def test_common_image_geometry_and_processing():
    assert calculate_aspect_ratio(1920, 1080) == 1.7778
    assert get_standard_aspect_ratio_name(1920, 1080) == "16:9"
    assert get_standard_aspect_ratio_name(1080, 1920) == "9:16"
    assert get_standard_aspect_ratio_name(1000, 1000) == "1:1"

    fw, fh = fit_dimensions_within_bounds(3840, 2160, 1920, 1080)
    assert fw <= 1920 and fh <= 1080

    # Generate synthetic image and test metadata & brightness
    img = Image.new("RGB", (200, 200), color=(100, 100, 100))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    meta = get_image_metadata(img_bytes)
    assert meta["width"] == 200
    assert meta["height"] == 200
    assert meta["format"] == "PNG"

    brightness = compute_image_brightness(img_bytes)
    assert 90 <= brightness <= 110

    # Test SVG and PNG placeholder generation
    svg_data = create_svg_placeholder(title="Chapter 1", subtitle="Processing")
    assert svg_data.startswith("data:image/svg+xml")

    png_ph = create_placeholder_image(400, 300, text="Test")
    assert len(png_ph) > 0

    # Test trim_image_borders
    trimmed = trim_image_borders(img_bytes)
    assert "data" in trimmed


def test_common_video_resolutions_and_motion():
    w, h = resolve_resolution("1080p")
    assert (w, h) == (1920, 1080)
    w_vert, h_vert = resolve_resolution("9:16")
    assert (w_vert, h_vert) == (1080, 1920)

    # Even dimensions
    ew, eh = ensure_even_dimensions(1919, 1079)
    assert ew % 2 == 0 and eh % 2 == 0

    # Bitrate
    bitrate = calculate_video_bitrate(1920, 1080)
    assert bitrate in ("8M", "12M")

    # Motion enum
    assert CinematicMotionType.ZOOM_IN.value == "zoom_in"
    assert CinematicMotionType.CAMERA_SHAKE.value == "camera_shake"
    assert "pan_down" in VALID_MOTIONS

    # Frames and timecode
    assert calculate_total_frames(2.0, fps=30) == 60
    assert format_timecode(65.0, fps=30) == "00:01:05:00"


def test_common_audio_helpers_and_speech():
    est = estimate_speech_duration("This is a spoken line for our motion comic episode.")
    assert est >= 1.5

    clean = clean_speech_script("[Dramatic impact] What are you doing here?! (whispering)")
    assert clean == "What are you doing here?!"

    dur_str = format_audio_duration(125.5)
    assert dur_str == "02:05.5"

    # Comic text normalization
    manga_text = "WHAT ARE YOU DOING HERE?! NOOOOO!"
    norm = normalize_comic_text_for_human_speech(manga_text)
    assert "What are you doing here?" in norm
    assert sanitize_text_for_tts(manga_text) == norm


def test_common_jobs_manager():
    job = job_manager.create_job(
        job_type=JobType.RENDER_VIDEO,
        user_id="test_user",
        project_id="test_proj",
    )
    assert job.job_id.startswith("job_")
    assert job.status.value.upper() == "QUEUED"

    retrieved = job_manager.get_job(job.job_id)
    assert retrieved is not None
    assert retrieved.job_id == job.job_id

    # Update progress and stage
    retrieved = job_manager.update_progress(job.job_id, progress=50.0, stage=JobStage.SYNTHESIZING_AUDIO)
    assert retrieved is not None
    assert retrieved.progress == 50.0
    assert retrieved.stage == JobStage.SYNTHESIZING_AUDIO

    # Complete job
    completed = job_manager.complete_job(job.job_id, result={"video_url": "/media/test.mp4"})
    assert completed is not None
    assert completed.status.value.upper() == "COMPLETED"
