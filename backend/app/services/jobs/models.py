"""
backend/app/services/jobs/models.py
─────────────────────────────────────────────────────────────────────────────
Unified Job models, statuses, and types for all Sonikoma background operations.
─────────────────────────────────────────────────────────────────────────────
"""

from enum import Enum
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class JobType(str, Enum):
    # ── Scraping ─────────────────────────────────────────────────────────────
    SCRAPE_CHAPTER = "SCRAPE_CHAPTER"           # Single chapter → ChapterResult
    DISCOVER_EPISODES = "DISCOVER_EPISODES"     # Series episode list discovery
    BATCH_SCRAPE = "BATCH_SCRAPE"               # Multiple chapter URLs batch
    BATCH_SERIES = "BATCH_SERIES"               # Multiple series batch
    PROCESS_URL = "PROCESS_URL"                 # Generic URL metadata resolution

    # ── Panel Processing ─────────────────────────────────────────────────────
    PANEL_SPLIT = "PANEL_SPLIT"                 # Vertical strip → discrete panels
    PANEL_DETECT = "PANEL_DETECT"               # Bounding box panel detection
    PANEL_DETECT_B64 = "PANEL_DETECT_B64"       # Panel detection from base64
    PANEL_TRANSFORM = "PANEL_TRANSFORM"         # Scale / rotate / flip
    PANEL_CLEAN = "PANEL_CLEAN"                 # Background remove / clean
    PANEL_INPAINT = "PANEL_INPAINT"             # Inpainting / content fill
    PANEL_UPSCALE = "PANEL_UPSCALE"             # Super-resolution upscale
    PANEL_COMPRESS = "PANEL_COMPRESS"           # Lossless / lossy compression
    PANEL_WATERMARK = "PANEL_WATERMARK"         # Watermark application

    # ── OCR / Text ───────────────────────────────────────────────────────────
    OCR = "OCR"                                 # Speech bubble dialogue extraction
    OCR_B64 = "OCR_B64"                         # OCR from base64 image
    OCR_FULL = "OCR_FULL"                       # Full bounding-box dialogue map
    TRANSCRIBE_AUDIO = "TRANSCRIBE_AUDIO"       # Whisper speech-to-text

    # ── AI Generation ─────────────────────────────────────────────────────────
    GENERATE_STORYBOARD = "GENERATE_STORYBOARD" # AI storyboard script generation
    GENERATE_NARRATION = "GENERATE_NARRATION"   # AI voice-over narration script
    GENERATE_SEO = "GENERATE_SEO"               # AI SEO title / description / tags
    GENERATE_PLAYLIST = "GENERATE_PLAYLIST"     # AI YouTube playlist metadata
    STABLE_DIFFUSION = "STABLE_DIFFUSION"       # SD image generation / img2img
    AI_DETECT_PANELS = "AI_DETECT_PANELS"       # AI-powered panel detection

    # ── Audio ─────────────────────────────────────────────────────────────────
    SYNTHESIZE_AUDIO = "SYNTHESIZE_AUDIO"       # TTS voice synthesis
    ANALYZE_AUDIO = "ANALYZE_AUDIO"             # Librosa audio analysis
    MIX_AUDIO = "MIX_AUDIO"                     # Audio track mixing

    # ── Video ─────────────────────────────────────────────────────────────────
    GENERATE_VIDEO = "GENERATE_VIDEO"           # Full scrape + compile pipeline
    RENDER_VIDEO = "RENDER_VIDEO"               # FFmpeg video render / encode
    COMPILE_VIDEO = "COMPILE_VIDEO"             # Panel sequence compilation
    TRANSCODE_VIDEO = "TRANSCODE_VIDEO"         # Re-encode existing video

    # ── Export ────────────────────────────────────────────────────────────────
    EXPORT_ARCHIVE = "EXPORT_ARCHIVE"           # CBZ / ZIP comic archive
    EXPORT_YOUTUBE = "EXPORT_YOUTUBE"           # Publish video to YouTube
    EXPORT_PDF = "EXPORT_PDF"                   # PDF export
    EXPORT_IMAGES = "EXPORT_IMAGES"             # Bulk image pack export

    # ── Image Editing ─────────────────────────────────────────────────────────
    IMAGE_METADATA = "IMAGE_METADATA"           # Extract image specs / metadata
    IMAGE_MAGICK = "IMAGE_MAGICK"               # ImageMagick transformation batch

    # ── Project Lifecycle ─────────────────────────────────────────────────────
    PROJECT_CREATE = "PROJECT_CREATE"           # Initialize new project
    PROJECT_PROMOTE = "PROJECT_PROMOTE"         # Promote temp to permanent
    PROJECT_SYNC = "PROJECT_SYNC"               # Supabase sync / backup
    BATCH_DELETE = "BATCH_DELETE"               # Bulk project deletion

    # ── Platform / Maintenance ────────────────────────────────────────────────
    CACHE_PURGE = "CACHE_PURGE"                 # LRU cache flush
    TEMP_FLUSH = "TEMP_FLUSH"                   # Delete temp worker files
    COPYRIGHT_CHECK = "COPYRIGHT_CHECK"         # YouTube copyright check


class JobStage(str, Enum):
    # Generic lifecycle
    QUEUED = "QUEUED"
    STARTING = "STARTING"
    FINALIZING = "FINALIZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

    # Scraper stages
    ANALYZING_URL = "ANALYZING_URL"
    FETCHING = "FETCHING"
    DETECTING_READER = "DETECTING_READER"
    EXTRACTING = "EXTRACTING"
    VALIDATING_IMAGES = "VALIDATING_IMAGES"

    # Panel stages
    SPLITTING = "SPLITTING"
    DETECTING_PANELS = "DETECTING_PANELS"
    TRANSFORMING = "TRANSFORMING"
    CLEANING = "CLEANING"
    UPSCALING = "UPSCALING"
    COMPRESSING = "COMPRESSING"

    # OCR / Text stages
    PROCESSING_OCR = "PROCESSING_OCR"
    EXTRACTING_DIALOGUE = "EXTRACTING_DIALOGUE"

    # AI stages
    GENERATING_STORYBOARD = "GENERATING_STORYBOARD"
    GENERATING_NARRATION = "GENERATING_NARRATION"
    GENERATING_SEO = "GENERATING_SEO"
    AI_INFERENCE = "AI_INFERENCE"

    # Audio stages
    SYNTHESIZING_AUDIO = "SYNTHESIZING_AUDIO"
    ANALYZING_AUDIO = "ANALYZING_AUDIO"
    TRANSCRIBING = "TRANSCRIBING"
    MIXING_AUDIO = "MIXING_AUDIO"

    # Video stages
    RENDERING_VIDEO = "RENDERING_VIDEO"
    ENCODING_VIDEO = "ENCODING_VIDEO"
    COMPILING_FRAMES = "COMPILING_FRAMES"

    # Export stages
    PACKAGING_ARCHIVE = "PACKAGING_ARCHIVE"
    UPLOADING = "UPLOADING"
    PUBLISHING = "PUBLISHING"


class JobRecord(BaseModel):
    """Authoritative representation of an asynchronous processing job."""
    job_id: str
    type: JobType
    status: JobStatus = JobStatus.QUEUED
    progress: float = 0.0
    stage: str = JobStage.QUEUED.value
    project_id: Optional[str] = None
    created_at: float
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
