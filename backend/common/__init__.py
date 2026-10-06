"""
backend/common/__init__.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Common Package:
Shared domain utilities, universal models, media resolvers, audio, video, image,
and background job runners accessible globally throughout all backend features.

Sub-packages:
- common.utils:    HTTP helpers, formatting, ID generation, datetime
- common.schemas:  Standard message, status, pagination, and base models
- common.media:    Image and asset resolver for URLs, buffers, and base64
- common.jobs:     Unified asynchronous background job manager and models
- common.image:    Image dimensions, metadata inspection, brightness, placeholders
- common.video:    Standard resolutions, even dimension alignment, cinematic motion
- common.audio:    Audio formats, speech duration estimation, script sanitation
─────────────────────────────────────────────────────────────────────────────
"""

# Re-export commonly used utilities directly at package root
from .utils import (
    get_client_ip,
    extract_bearer_token,
    get_user_agent,
    format_bytes,
    get_asset_type,
    get_media_type,
    format_duration,
    slugify,
    truncate_text,
    generate_uuid,
    generate_short_id,
    generate_project_id,
    generate_timestamp_id,
    utc_now,
    utc_iso,
    utc_timestamp,
    parse_iso,
)

# Re-export common schemas directly at package root
from .schemas import (
    StandardMessageResponse,
    SuccessResponse,
    ErrorResponse,
    StatusResponse,
    PaginationParams,
    PageMetadata,
    PaginatedResponse,
)

# Re-export media resolver directly at package root
from .media import (
    resolve_image_to_buffer,
    resolve_url_to_buffer,
)

# Re-export background jobs directly at package root
from .jobs import (
    job_manager,
    JobType,
    JobStage,
    JobStatusResponse,
    JobListResponse,
)

# Re-export image primitives directly at package root
from .image import (
    calculate_aspect_ratio,
    get_standard_aspect_ratio_name,
    fit_dimensions_within_bounds,
    get_image_metadata,
    compute_image_brightness,
    convert_image_format,
    create_placeholder_image,
    create_svg_placeholder,
    trim_image_borders,
    crop_auto_borders,
)

# Re-export video primitives directly at package root
from .video import (
    STANDARD_RESOLUTIONS,
    resolve_resolution,
    ensure_even_dimensions,
    calculate_video_bitrate,
    CinematicMotionType,
    VALID_MOTIONS,
    DEFAULT_FPS,
    DEFAULT_FRAME_DURATION,
    calculate_total_frames,
    format_timecode,
)

# Re-export audio primitives directly at package root
from .audio import (
    SUPPORTED_AUDIO_FORMATS,
    AUDIO_MIME_TYPES,
    STANDARD_SAMPLE_RATES,
    DEFAULT_SAMPLE_RATE,
    DEFAULT_WPM,
    estimate_speech_duration,
    clean_speech_script,
    format_audio_duration,
    to_natural_sentence_case,
    normalize_comic_text_for_human_speech,
    sanitize_text_for_tts,
)

from . import utils
from . import schemas
from . import media
from . import jobs
from . import image
from . import video
from . import audio

__all__ = [
    # HTTP & Client
    "get_client_ip",
    "extract_bearer_token",
    "get_user_agent",
    # Formatting
    "format_bytes",
    "get_asset_type",
    "get_media_type",
    "format_duration",
    "slugify",
    "truncate_text",
    # ID Generation
    "generate_uuid",
    "generate_short_id",
    "generate_project_id",
    "generate_timestamp_id",
    # Datetime
    "utc_now",
    "utc_iso",
    "utc_timestamp",
    "parse_iso",
    # Schemas
    "StandardMessageResponse",
    "SuccessResponse",
    "ErrorResponse",
    "StatusResponse",
    "PaginationParams",
    "PageMetadata",
    "PaginatedResponse",
    # Media
    "resolve_image_to_buffer",
    "resolve_url_to_buffer",
    # Jobs
    "job_manager",
    "JobType",
    "JobStage",
    "JobStatusResponse",
    "JobListResponse",
    # Image
    "calculate_aspect_ratio",
    "get_standard_aspect_ratio_name",
    "fit_dimensions_within_bounds",
    "get_image_metadata",
    "compute_image_brightness",
    "convert_image_format",
    "create_placeholder_image",
    "create_svg_placeholder",
    "trim_image_borders",
    "crop_auto_borders",
    # Video
    "STANDARD_RESOLUTIONS",
    "resolve_resolution",
    "ensure_even_dimensions",
    "calculate_video_bitrate",
    "CinematicMotionType",
    "VALID_MOTIONS",
    "DEFAULT_FPS",
    "DEFAULT_FRAME_DURATION",
    "calculate_total_frames",
    "format_timecode",
    # Audio
    "SUPPORTED_AUDIO_FORMATS",
    "AUDIO_MIME_TYPES",
    "STANDARD_SAMPLE_RATES",
    "DEFAULT_SAMPLE_RATE",
    "DEFAULT_WPM",
    "estimate_speech_duration",
    "clean_speech_script",
    "format_audio_duration",
    "to_natural_sentence_case",
    "normalize_comic_text_for_human_speech",
    "sanitize_text_for_tts",
    # Sub-packages
    "utils",
    "schemas",
    "media",
    "jobs",
    "image",
    "video",
    "audio",
]
