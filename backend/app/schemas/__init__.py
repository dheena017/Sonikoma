"""
backend/app/schemas/__init__.py
─────────────────────────────────────────────────────────────────────────────
Centralized Pydantic schema exports for the Sonikoma application.
─────────────────────────────────────────────────────────────────────────────
"""
from .domain import (
    Scene,
    Dialogue,
    Narration,
    Panel,
    Project,
    Series,
    TokenLog,
)
from .ai import (
    # Image & Sequence Analysis
    AnalyzeImageRequest,
    AnalyzeBatchRequest,
    AnalyzeSequenceRequest,
    AnalyzePanelItem,
    AnalyzePanelSequenceRequest,
    AnalyzeNarrativeSequenceRequest,
    PanelDescriptionItem,
    GenerateSequenceNarrativeRequest,
    # AI Skills & Creative Generators
    DramatizeRequest,
    ShortsScriptRequest,
    ShortsHookRequest,
    SFXAudioRequest,
    SFXOverlayRequest,
    BGMVibeRequest,
    ThumbnailRequest,
    ThumbnailLayoutRequest,
    ThumbnailVisualRequest,
    SEORequest,
    MidrollPlacementRequest,
    VoiceCastingRequest,
    TranslationRequest,
    CopyrightScrubRequest,
    EnhancePromptRequest,
    # AI Model Management & Latency
    ListModelsRequest,
    TestModelLatencyRequest,
    # Smart Crop
    SmartCropRequest,
    SmartCropBatchRequest,
    # Stable Diffusion & Image Generation
    GenerateAIRequest,
    InpaintRequest,
    UpscaleRequest,
    StyleTransferRequest,
    BatchGenerateRequest,
)

from .audio import (
    # Speech Synthesis & Dialogue Alignment
    AlignDialogueRequest,
    AudioGenerateRequest,
    # Audio Analysis & Segmentation
    AudioPathRequest,
    SilenceDetectRequest,
    EnergySegmentRequest,
    # Transcription & Subtitles (Whisper)
    TranscribeRequest,
    SubtitleRequest,
    ExtractWordsRequest,
    BatchTranscribeRequest,
)

from .auth import (
    # User Authentication & Profile
    UserRegister,
    UserLogin,
    Token,
    ForgotPasswordRequest,
    PasswordUpdate,
    ProfileUpdate,
    MfaUpdate,
    # Billing, Credits & API Keys
    ApiKeyCreate,
    RedeemPointsRequest,
    SaveCardRequest,
    PurchaseCreditsRequest,
    # Admin Operations
    AdminUpdateUser,
    AdminAddCreditsRequest,
    AdminBulkAction,
    AdminUpdateSettings,
    AdminUpdateProject,
    AnnouncementCreateRequest,
)

from .compound import (
    VideoCutSpec,
    VideoEditingWorkflowRequest,
    AudioEnhancementWorkflowRequest,
    ImageGenerationWorkflowRequest,
)

from .export import (
    YouTubeExportRequest,
    YouTubeProfileRequest,
    YouTubeCredentialsRequest,
)

from .health import (
    CustomLogPayload,
)

from .image import (
    # Image Editing & Transformations
    EditImageRequest,
    UndoEditRequest,
    TransformImageRequest,
    StitchImagesRequest,
    SplitImagesRequest,
    BatchResizeRequest,
    CompositeRequest,
    ImagePathRequest,
    MetadataRequest as ImageMetadataRequest,
    # Bubble Removal & Layer Cleaning
    RemoveBubblesRequest,
    RemoveBubblesBatchRequest,
    ProcessLayersRequest,
    CleanerBase64Request,
    # OCR & Utilities
    OCRBase64Request,
    DownloadZipRequest,
)

from .project import (
    ProjectCreateRequest,
    PanelSaveItem,
    PanelsSaveRequest,
    ProjectUpdateRequest,
    TokenIncrementRequest,
    BatchDeleteRequest,
    DetectPanelsBase64Request,
)

from .scraper import (
    # Scraping & Episode Ingestion
    ScrapeImagesRequest,
    ProcessUrlRequest,
    SaveScrapedImagesRequest,
    ScrapeEpisodesRequest,
    ScrapeEpisodesAdvancedRequest,
    BatchScrapeSeriesRequest,
    BatchScrapeRequest,
    # Script & Storyboard Generation
    GenerateStoryboardOnlyRequest,
    GenerateStoryboardRequest,
    ExtractScriptRequest,
    SmartSplitRequest,
    # Export
    ExportArchiveRequest,
)

from .video import (
    # Timeline & Rendering Structure
    PanelLayersData,
    DialogueSegmentData,
    PanelSyncMapData,
    PanelData,
    RenderRequest,
    # FFmpeg Video Operations
    MetadataRequest as VideoMetadataRequest,
    CutSpecRequest,
    CutVideoRequest,
    ExtractAudioRequest,
    MixAudioRequest,
    SubtitlesRequest,
    ApplyFilterRequest,
    AdjustSpeedRequest,
    ConcatenateVideosRequest,
    TransitionSpecRequest,
    ConcatenateWithTransitionsRequest,
)

__all__ = [
    # ai.py
    "AnalyzeImageRequest",
    "AnalyzeBatchRequest",
    "AnalyzeSequenceRequest",
    "AnalyzePanelItem",
    "AnalyzePanelSequenceRequest",
    "AnalyzeNarrativeSequenceRequest",
    "PanelDescriptionItem",
    "GenerateSequenceNarrativeRequest",
    "DramatizeRequest",
    "ShortsScriptRequest",
    "ShortsHookRequest",
    "SFXAudioRequest",
    "SFXOverlayRequest",
    "BGMVibeRequest",
    "ThumbnailRequest",
    "ThumbnailLayoutRequest",
    "ThumbnailVisualRequest",
    "SEORequest",
    "MidrollPlacementRequest",
    "VoiceCastingRequest",
    "TranslationRequest",
    "CopyrightScrubRequest",
    "EnhancePromptRequest",
    "ListModelsRequest",
    "TestModelLatencyRequest",
    "SmartCropRequest",
    "SmartCropBatchRequest",
    "GenerateAIRequest",
    "InpaintRequest",
    "UpscaleRequest",
    "StyleTransferRequest",
    "BatchGenerateRequest",
    # audio.py
    "AlignDialogueRequest",
    "AudioGenerateRequest",
    "AudioPathRequest",
    "SilenceDetectRequest",
    "EnergySegmentRequest",
    "TranscribeRequest",
    "SubtitleRequest",
    "ExtractWordsRequest",
    "BatchTranscribeRequest",
    # auth.py
    "UserRegister",
    "UserLogin",
    "Token",
    "ForgotPasswordRequest",
    "PasswordUpdate",
    "ProfileUpdate",
    "MfaUpdate",
    "ApiKeyCreate",
    "RedeemPointsRequest",
    "SaveCardRequest",
    "PurchaseCreditsRequest",
    "AdminUpdateUser",
    "AdminAddCreditsRequest",
    "AdminBulkAction",
    "AdminUpdateSettings",
    "AdminUpdateProject",
    "AnnouncementCreateRequest",
    # compound.py
    "VideoCutSpec",
    "VideoEditingWorkflowRequest",
    "AudioEnhancementWorkflowRequest",
    "ImageGenerationWorkflowRequest",
    # export.py
    "YouTubeExportRequest",
    "YouTubeProfileRequest",
    "YouTubeCredentialsRequest",
    # health.py
    "CustomLogPayload",
    # image.py
    "EditImageRequest",
    "UndoEditRequest",
    "TransformImageRequest",
    "StitchImagesRequest",
    "SplitImagesRequest",
    "BatchResizeRequest",
    "CompositeRequest",
    "ImagePathRequest",
    "ImageMetadataRequest",
    "RemoveBubblesRequest",
    "RemoveBubblesBatchRequest",
    "ProcessLayersRequest",
    "CleanerBase64Request",
    "OCRBase64Request",
    "DownloadZipRequest",
    # project.py
    "ProjectCreateRequest",
    "PanelSaveItem",
    "PanelsSaveRequest",
    "ProjectUpdateRequest",
    "TokenIncrementRequest",
    "BatchDeleteRequest",
    "DetectPanelsBase64Request",
    # scraper.py
    "ScrapeImagesRequest",
    "ProcessUrlRequest",
    "SaveScrapedImagesRequest",
    "ScrapeEpisodesRequest",
    "ScrapeEpisodesAdvancedRequest",
    "BatchScrapeSeriesRequest",
    "BatchScrapeRequest",
    "GenerateStoryboardOnlyRequest",
    "GenerateStoryboardRequest",
    "ExtractScriptRequest",
    "SmartSplitRequest",
    "ExportArchiveRequest",
    # video.py
    "PanelLayersData",
    "DialogueSegmentData",
    "PanelSyncMapData",
    "PanelData",
    "RenderRequest",
    "VideoMetadataRequest",
    "CutSpecRequest",
    "CutVideoRequest",
    "ExtractAudioRequest",
    "MixAudioRequest",
    "SubtitlesRequest",
    "ApplyFilterRequest",
    "AdjustSpeedRequest",
    "ConcatenateVideosRequest",
    "TransitionSpecRequest",
    "ConcatenateWithTransitionsRequest",
]
