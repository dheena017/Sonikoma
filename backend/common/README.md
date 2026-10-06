# Common Backend Package (`backend/common/`)

## 1. Overview
The **Common Package** provides cross-cutting, shared utilities, domain schemas, image processing, video generation primitives, audio helpers, media resolvers, and background job systems designed for reuse across all backend feature domains (`admin/`, `auth/`, `image_editor/`, `intelligence/`, `platform/`, `profile/`, `video_editor/`, and `workspace/`).

By establishing clean, centralized contracts outside of individual feature folders, features remain decoupled from one another and follow standard Single Responsibility Principles.

---

## 2. Directory Structure

```
backend/common/
├── __init__.py               # Re-exports top-level utilities, image, video, audio, schemas
├── utils/                    # Core utilities and formatting functions
│   ├── __init__.py           # Unified utils exports
│   ├── http.py               # get_client_ip, extract_bearer_token, get_user_agent
│   ├── formatting.py         # format_bytes, get_asset_type, format_duration, slugify
│   ├── id_generator.py       # generate_uuid, generate_project_id, generate_short_id
│   └── datetime_utils.py     # utc_now, utc_iso, parse_iso
├── image/                    # Common image processing primitives
│   ├── __init__.py           # Unified image exports
│   ├── dimensions.py         # calculate_aspect_ratio, fit_dimensions_within_bounds
│   └── processing.py         # get_image_metadata, compute_image_brightness, create_placeholder_image, create_svg_placeholder, trim_image_borders
├── video/                    # Common video generation primitives
│   ├── __init__.py           # Unified video exports
│   ├── resolutions.py        # STANDARD_RESOLUTIONS, resolve_resolution, ensure_even_dimensions, calculate_video_bitrate
│   └── motion.py             # CinematicMotionType, VALID_MOTIONS, calculate_total_frames, format_timecode
├── audio/                    # Common audio processing primitives
│   ├── __init__.py           # Unified audio exports
│   ├── constants.py          # SUPPORTED_AUDIO_FORMATS, AUDIO_MIME_TYPES, STANDARD_SAMPLE_RATES
│   └── helpers.py            # estimate_speech_duration, clean_speech_script, format_audio_duration, to_natural_sentence_case, normalize_comic_text_for_human_speech, sanitize_text_for_tts
├── schemas/                  # Shared Pydantic data models
│   ├── __init__.py           # Unified schemas exports
│   ├── base.py               # StandardMessageResponse, SuccessResponse, StatusResponse
│   └── pagination.py         # PaginationParams, PaginatedResponse, PageMetadata
├── media/                    # Cross-feature media resolvers
│   ├── __init__.py           # Unified media exports
│   └── resolver.py           # resolve_image_to_buffer, resolve_url_to_buffer
├── jobs/                     # Unified asynchronous background job system
│   └── __init__.py           # job_manager, JobType, JobStage, JobStatusResponse
└── README.md                 # Architecture documentation
```

---

## 3. Usage Examples

### HTTP Client IP Resolution
```python
from common import get_client_ip

@router.post("/action")
async def handle_action(request: Request):
    ip = get_client_ip(request)
```

### Video Resolutions & Encoder Dimensions
```python
from common import resolve_resolution, ensure_even_dimensions, CinematicMotionType

width, height = resolve_resolution("1080p")  # (1920, 1080)
w, h = ensure_even_dimensions(1919, 1079)     # (1918, 1078)
motion = CinematicMotionType.ZOOM_IN.value     # "zoom_in"
```

### Image Dimensions & Metadata
```python
from common import calculate_aspect_ratio, fit_dimensions_within_bounds, get_image_metadata

meta = get_image_metadata(img_bytes)
aspect = calculate_aspect_ratio(1920, 1080)  # 1.7778
fitted_w, fitted_h = fit_dimensions_within_bounds(2400, 1600, 1920, 1080)
```

### Audio Duration & Script Cleaning
```python
from common import estimate_speech_duration, clean_speech_script

clean_text = clean_speech_script("[Heavy Sigh] Welcome to Sonikoma!")  # "Welcome to Sonikoma!"
est_duration = estimate_speech_duration(clean_text)                     # ~1.9s
```

### Media Buffer Resolution
```python
from common import resolve_image_to_buffer

buffer_res = await resolve_image_to_buffer("https://example.com/panel.jpg")
raw_bytes = buffer_res["data"]
```

### Background Job Execution
```python
from common import job_manager, JobType, JobStage

job = job_manager.create_job(
    job_type=JobType.RENDER_VIDEO,
    user_id=user_id,
    project_id=project_id,
)
```
