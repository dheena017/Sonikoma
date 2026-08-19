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


class JobExecutionInfo(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    attempt: int = 1


class JobErrorInfo(BaseModel):
    code: str
    message: str
    stage: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None


class JobStatusResponse(BaseModel):
    job_id: str
    job_type: str
    capability: Optional[str] = None
    status: str
    progress: int
    stage: str
    project_id: Optional[str] = None
    chapter_id: Optional[str] = None
    execution: Optional[JobExecutionInfo] = None
    result: Optional[Any] = None
    error: Optional[JobErrorInfo] = None


class JobListResponse(BaseModel):
    success: bool = True
    total: int
    jobs: List[JobStatusResponse]


class JobRecord(BaseModel):
    """Authoritative representation of an asynchronous processing job."""
    job_id: str
    user_id: str
    type: JobType
    status: JobStatus = JobStatus.QUEUED
    progress: float = 0.0
    stage: str = JobStage.QUEUED.value
    project_id: Optional[str] = None
    chapter_id: Optional[str] = None
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def to_status_response(self) -> JobStatusResponse:
        """Converts internal JobRecord into the canonical JobStatusResponse contract."""
        meta = self.metadata or {}
        
        # Determine execution info
        provider = meta.get("provider")
        model = meta.get("model")
        attempt = int(meta.get("attempt", 1))

        if self.error and isinstance(self.error, dict):
            provider = self.error.get("provider") or provider
            model = self.error.get("model") or model
            attempt = int(self.error.get("attempt") or attempt)

        execution = None
        if provider or model:
            execution = JobExecutionInfo(
                provider=provider,
                model=model,
                attempt=attempt
            )

        # Determine error info
        error_info = None
        if self.error and isinstance(self.error, dict):
            error_info = JobErrorInfo(
                code=self.error.get("code") or self.error.get("error_code") or "INTERNAL_ERROR",
                message=self.error.get("message") or self.error.get("error_message") or "Job encountered an unexpected failure.",
                stage=self.error.get("stage") or self.error.get("failed_stage") or self.stage.lower(),
                provider=self.error.get("provider") or provider,
                model=self.error.get("model") or model,
            )
        elif self.error:
            error_info = JobErrorInfo(
                code="INTERNAL_ERROR",
                message=str(self.error),
                stage=self.stage.lower(),
                provider=provider,
                model=model,
            )

        job_type_str = self.type.value.lower() if isinstance(self.type, JobType) else str(self.type).lower()
        capability_str = meta.get("capability") or job_type_str

        return JobStatusResponse(
            job_id=self.job_id,
            job_type=job_type_str,
            capability=capability_str,
            status=self.status.value.lower() if isinstance(self.status, JobStatus) else str(self.status).lower(),
            progress=int(round(self.progress)),
            stage=self.stage.lower(),
            project_id=self.project_id,
            chapter_id=self.chapter_id,
            execution=execution,
            result=self.result,
            error=error_info,
        )