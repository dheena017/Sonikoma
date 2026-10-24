"""
Pydantic schemas for the canonical AI Subsystem domain (`features/ai`).

Provides plain English request and response models along with all legacy
schemas for 100% backward compatibility.
"""

from typing import List, Dict, Any, Optional, Union, Literal
from pydantic import BaseModel, Field, model_validator


# =============================================================================
# 1. Plain English Canonical Schemas
# =============================================================================

class ReadPanelRequest(BaseModel):
    """Request to read a comic panel picture."""
    picture_url: str
    story_notes: Optional[str] = None
    past_events: Optional[str] = None
    ai_provider: str = "gemini"
    model_name: Optional[str] = None


class ReadPanelResponse(BaseModel):
    """Extracted text, characters, emotion, and motion cues from panel analysis."""
    speaker: str = "Narrator"
    dialogue: str = ""
    visual_description: str = ""
    emotion: str = "neutral"
    motion: str = "zoom_in"
    confidence: float = 1.0


class ImprovePromptRequest(BaseModel):
    """Request to expand a simple idea into an art-ready prompt."""
    simple_idea: str
    output_type: Literal["image", "script", "video"] = "image"
    art_style: str = "manhwa"
    genre: str = "action"
    ai_provider: str = "gemini"


class ImprovePromptResponse(BaseModel):
    """Enhanced prompt formatted with lighting, style, and negative tags."""
    original_idea: str
    enhanced_prompt: str
    output_type: str
    art_style: str
    genre: str
    negative_prompt: str


class TranslateSpeechRequest(BaseModel):
    """Request to translate a comic speech line."""
    text: str
    to_language: str = "Japanese"
    tone: str = "natural"
    story_context: Optional[str] = None


class TranslateSpeechResponse(BaseModel):
    """Translated dialogue with preserved tone."""
    translated_text: str
    accuracy_rating: float = 1.0
    target_lang: str
    detected_tone: str


class AskAssistantRequest(BaseModel):
    """Chat message sent to the creative AI assistant."""
    user_message: str
    chat_history: Optional[List[Dict[str, str]]] = None
    story_context: Optional[str] = None
    ai_provider: str = "gemini"
    model_name: Optional[str] = None


class AskAssistantResponse(BaseModel):
    """Helpful response from the AI assistant."""
    reply: str
    role: str = "assistant"
    status: str = "success"


class PlanStoryArcRequest(BaseModel):
    """Request to plan a multi-chapter comic arc."""
    title: str
    genre: str = "Action Fantasy"
    summary: str
    chapter_count: int = 5
    characters: Optional[List[Dict[str, Any]]] = None


class MakeCoverIdeasRequest(BaseModel):
    """Request to brainstorm YouTube/Webtoon cover ideas."""
    title: str
    genre: str = "Action"
    synopsis: str
    count: int = 3


# =============================================================================
# 2. Legacy Subsystem & Image/Sequence Analysis Models
# =============================================================================

class AnalyzeImageRequest(BaseModel):
    """Analyzes a single image URL for narration and model processing."""
    url: str
    model: Optional[str] = None
    narrationStyle: Optional[str] = "long"
    voice: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None
    story_context: Optional[str] = None
    story_memory: Optional[Dict[str, Any]] = None
    generate_audio: Optional[bool] = False
    generate_dialogue_audio: Optional[bool] = False
    generate_narrative_audio: Optional[bool] = False
    enableDialogueAudio: Optional[bool] = None
    enableNarrativeAudio: Optional[bool] = None


class AnalyzeBatchRequest(BaseModel):
    """Batch processing for multiple image URLs."""
    urls: List[str]
    model: Optional[str] = None
    narrationStyle: Optional[str] = "long"
    voice: Optional[str] = "en-US-GuyNeural"
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class AnalyzeSequenceRequest(BaseModel):
    """Evaluates sequential images via URLs or visual descriptions."""
    urls: Optional[List[str]] = None
    visual_descriptions: Optional[List[str]] = None
    model: Optional[str] = None
    narrationStyle: Optional[str] = "long"
    voice: Optional[str] = "en-US-GuyNeural"
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class AnalyzePanelItem(BaseModel):
    """Individual panel item containing an ID and image URL."""
    id: Any = None
    url: str
    story_context: Optional[str] = None
    speaker_name: Optional[str] = None


class AnalyzePanelSequenceRequest(BaseModel):
    """Evaluates a structured list of panel items."""
    panels: Optional[List[AnalyzePanelItem]] = None
    urls: Optional[List[str]] = None
    model: Optional[str] = None
    narrationStyle: Optional[str] = "long"
    voice: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None
    story_context: Optional[str] = None
    story_memory: Optional[Dict[str, Any]] = None
    generate_audio: Optional[bool] = False
    generate_dialogue_audio: Optional[bool] = False
    generate_narrative_audio: Optional[bool] = False
    enableDialogueAudio: Optional[bool] = None
    enableNarrativeAudio: Optional[bool] = None

    @model_validator(mode="after")
    def coerce_urls_to_panels(self):
        if not self.panels and self.urls:
            self.panels = [
                AnalyzePanelItem(id=idx, url=url)
                for idx, url in enumerate(self.urls)
            ]
        return self


class AnalyzeNarrativeSequenceRequest(BaseModel):
    """Analyzes a sequence using visual text descriptions."""
    visual_descriptions: List[str]
    model: Optional[str] = None
    voice: Optional[str] = "en-US-GuyNeural"
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class PanelDescriptionItem(BaseModel):
    id: int
    visual_description: str


class DramatizeRequest(BaseModel):
    raw_ocr_text: List[str]
    genre: str
    scene_context: str
    model: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class ShortsScriptRequest(BaseModel):
    storyboard_summary: str
    model: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class ShortsHookRequest(BaseModel):
    title: str
    key_event: str
    model: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class PanelSFXInput(BaseModel):
    id: Optional[Union[int, str]] = None
    image_url: Optional[str] = None
    visual_description: Optional[str] = None
    sfx: Optional[str] = None


class SFXAudioRequest(BaseModel):
    visual_description: Optional[str] = None
    sfx_tag: Optional[str] = None
    project_id: Optional[str] = None
    panels: Optional[List[PanelSFXInput]] = None
    model: Optional[str] = None


class SFXOverlayRequest(BaseModel):
    visual_description: str
    speech_text: str
    sfx: str
    model: Optional[str] = None


class BGMVibeRequest(BaseModel):
    narrative_mood: str
    action_scale: str
    model: Optional[str] = None


class ThumbnailRequest(BaseModel):
    title: str
    genre: str
    plot_point: str
    model: Optional[str] = None


class ThumbnailLayoutRequest(BaseModel):
    thumbnail_concept: str
    main_character: str
    model: Optional[str] = None


class ThumbnailVisualRequest(BaseModel):
    thumbnail_concept: str
    model: Optional[str] = None


class SEORequest(BaseModel):
    title: str
    genre: str
    storyboard_summary: str
    model: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class MidrollPlacementRequest(BaseModel):
    compiled_script: str
    max_ads: Optional[int] = 3
    model: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class VoiceCastingRequest(BaseModel):
    character_name: str
    dialogue_sample: str
    visual_description: str
    model: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class TranslationRequest(BaseModel):
    text: str
    target_lang: str
    tone: Optional[str] = "natural"
    model: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class CopyrightScrubRequest(BaseModel):
    text: str
    model: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class EnhancePromptRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    apiKey: Optional[str] = None


class ListModelsRequest(BaseModel):
    apiKey: Optional[str] = None
    provider: Optional[str] = "gemini"


class TestModelLatencyRequest(BaseModel):
    provider: str
    model: str
    apiKey: Optional[str] = None
    prompt: Optional[str] = "Say: Connection Successful!"


class SmartCropRequest(BaseModel):
    url: str
    model: Optional[str] = None
    strategy: Optional[str] = "ai"
    sensitivity: Optional[float] = 30.0
    backgroundColorMode: Optional[str] = "auto"
    aspectRatio: Optional[str] = "free"
    minAreaPct: Optional[float] = 0.15
    mergeThreshold: Optional[int] = 20
    cannyLow: Optional[int] = 20
    cannyHigh: Optional[int] = 100
    closeKernelSize: Optional[int] = 15
    minHeightPx: Optional[int] = 60
    paddingPx: Optional[int] = 10
    autoSplit: Optional[bool] = True
    useYolo: Optional[bool] = True
    targetWidth: Optional[int] = None
    targetHeight: Optional[int] = None
    guidanceInstructions: Optional[str] = None
    focusMode: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class SmartCropBatchRequest(BaseModel):
    urls: List[str]
    model: Optional[str] = None
    strategy: Optional[str] = "ai"
    sensitivity: Optional[float] = 30.0
    backgroundColorMode: Optional[str] = "auto"
    aspectRatio: Optional[str] = "free"
    minAreaPct: Optional[float] = 0.15
    mergeThreshold: Optional[int] = 20
    cannyLow: Optional[int] = 20
    cannyHigh: Optional[int] = 100
    closeKernelSize: Optional[int] = 15
    minHeightPx: Optional[int] = 60
    paddingPx: Optional[int] = 10
    autoSplit: Optional[bool] = True
    useYolo: Optional[bool] = True
    targetWidth: Optional[int] = None
    targetHeight: Optional[int] = None
    guidanceInstructions: Optional[str] = None
    focusMode: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class GenerateAIRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = ""
    num_images: Optional[int] = Field(1, ge=1, le=10)
    width: Optional[int] = Field(512, ge=256, le=2048)
    height: Optional[int] = Field(512, ge=256, le=2048)
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)
    seed: Optional[int] = None
    output_dir: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class InpaintRequest(BaseModel):
    image_path: str
    mask_path: str
    prompt: str
    negative_prompt: Optional[str] = ""
    output_path: Optional[str] = None
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)
    strength: Optional[float] = Field(0.8, ge=0.1, le=1.0)
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class UpscaleRequest(BaseModel):
    image_path: str
    scale_factor: Optional[int] = Field(2, ge=2, le=4)
    output_path: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class StyleTransferRequest(BaseModel):
    image_path: str
    style_path: Optional[str] = None
    project_id: Optional[str] = None
    job_id: Optional[str] = None
    style_prompt: str
    output_path: Optional[str] = None
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)


class BatchGenerateRequest(BaseModel):
    prompts: List[str]
    width: Optional[int] = Field(512, ge=256, le=2048)
    height: Optional[int] = Field(512, ge=256, le=2048)
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)
    output_dir: Optional[str] = None


class SeriesArcRequest(BaseModel):
    title: str = Field(..., description="Title of the series")
    logline: Optional[str] = Field(None, description="Core plot premise and hook")
    genre: Optional[str] = Field("action_fantasy", description="Genre")
    format_type: Optional[str] = Field("manhwa", description="manhwa, comic_manga, or anime")
    art_style: Optional[str] = Field("manhwa_action_hunter", description="Art style preset identifier")
    total_sessions: Optional[int] = Field(1, ge=1, le=5)
    chapters_per_session: Optional[int] = Field(5, ge=1, le=25)
    panels_per_chapter: Optional[int] = Field(8, ge=2, le=24)
    pacing: Optional[str] = Field("dynamic", description="Pacing profile")
    dialogue_density: Optional[str] = Field("balanced", description="Dialogue density")
    model: Optional[str] = Field(None, description="Gemini or LLM model override")
    project_id: Optional[str] = None
    job_id: Optional[str] = None


class AnalyzeImageRequest(BaseModel):
    url: str
    model: Optional[str] = None
    voice: Optional[str] = None
    narration_style: Optional[str] = None
    story_context: Optional[str] = None
    story_memory: Optional[str] = None
    panel_index: Optional[int] = 0
    generate_audio: Optional[bool] = True


class AnalyzeSequenceRequest(BaseModel):
    panels: List[str] = []
    genre: Optional[str] = None


class SmartCropRequest(BaseModel):
    url: str
    aspect_ratio: Optional[str] = "free"
    model: Optional[str] = None
    strategy: Optional[str] = "local-cv"


class ListModelsRequest(BaseModel):
    provider: Optional[str] = "gemini"
    apiKey: Optional[str] = None


class EnhancePromptRequest(BaseModel):
    prompt: str
    target: Optional[str] = "image"
    style: Optional[str] = "anime"
    provider: Optional[str] = "gemini"
    api_key: Optional[str] = None


class TestModelLatencyRequest(BaseModel):
    provider: str = "gemini"
    model: Optional[str] = None

