"""
backend/app/schemas/ai.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for AI models, analysis, skills, crop, and generation.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field, root_validator
from typing import List, Dict, Any, Optional


# =============================================================================
# 1. Image & Sequence Analysis
# =============================================================================

class AnalyzeImageRequest(BaseModel):
    """Analyzes a single image URL for narration and model processing."""
    url: str
    model: Optional[str] = None
    narrationStyle: Optional[str] = "long"  # 'long' = detailed YouTube recap, 'short' = quick subtitles
    voice: Optional[str] = "en-US-GuyNeural"


class AnalyzeBatchRequest(BaseModel):
    """Batch processing for multiple image URLs."""
    urls: List[str]
    model: Optional[str] = None
    narrationStyle: Optional[str] = "long"
    voice: Optional[str] = "en-US-GuyNeural"


class AnalyzeSequenceRequest(BaseModel):
    """Evaluates sequential images via URLs or visual descriptions."""
    urls: Optional[List[str]] = None
    visual_descriptions: Optional[List[str]] = None
    model: Optional[str] = None
    narrationStyle: Optional[str] = "long"
    voice: Optional[str] = "en-US-GuyNeural"

    @root_validator(pre=True)
    def require_urls_or_visual_descriptions(cls, values):
        if not values.get("urls") and not values.get("visual_descriptions"):
            raise ValueError("Either 'urls' or 'visual_descriptions' is required.")
        return values


class AnalyzePanelItem(BaseModel):
    """Individual panel item containing an ID and image URL."""
    id: int
    url: str


class AnalyzePanelSequenceRequest(BaseModel):
    """Evaluates a structured list of panel items."""
    panels: List[AnalyzePanelItem]
    model: Optional[str] = None
    narrationStyle: Optional[str] = "long"
    voice: Optional[str] = "en-US-GuyNeural"


class AnalyzeNarrativeSequenceRequest(BaseModel):
    """Analyzes a sequence using visual text descriptions."""
    visual_descriptions: List[str]
    model: Optional[str] = None
    voice: Optional[str] = "en-US-GuyNeural"


class PanelDescriptionItem(BaseModel):
    """Panel description for narrative sequence generation."""
    id: int
    visual_description: str


class GenerateSequenceNarrativeRequest(BaseModel):
    """Generates a narrative script from panel descriptions."""
    panels: List[PanelDescriptionItem]
    model: Optional[str] = None
    voice: Optional[str] = "en-US-GuyNeural"


# =============================================================================
# 2. AI Skills & Creative Generators
# =============================================================================

# --- Narrative & Storytelling ---

class DramatizeRequest(BaseModel):
    """Dramatizes raw OCR text into cinematic dialogue."""
    raw_ocr_text: List[str]
    genre: str
    scene_context: str
    model: Optional[str] = None


class SeriesIntroHookRequest(BaseModel):
    """Generates an engaging introduction hook for a series."""
    title: str
    premise_summary: str
    genre: str
    model: Optional[str] = None


class CharacterBioRequest(BaseModel):
    """Generates character background bio from dialogue snippets."""
    dialogue: str
    model: Optional[str] = None


class NarrativePacingRequest(BaseModel):
    """Determines optimal narrative pacing for scene elements."""
    visual_description: str
    speech_text: str
    sfx: str
    model: Optional[str] = None


class ShortsScriptRequest(BaseModel):
    """Generates a vertical YouTube Shorts / TikTok script."""
    storyboard_summary: str
    model: Optional[str] = None


class ShortsHookRequest(BaseModel):
    """Generates a high-retention opening hook for short-form content."""
    title: str
    key_event: str
    model: Optional[str] = None


# --- Audio & Sound ---

class SFXAudioRequest(BaseModel):
    """Suggests sound effect tags for scene descriptions."""
    visual_description: str
    sfx_tag: str
    model: Optional[str] = None


class SFXOverlayRequest(BaseModel):
    """Determines SFX placement and overlay timing."""
    visual_description: str
    speech_text: str
    sfx: str
    model: Optional[str] = None


class BGMVibeRequest(BaseModel):
    """Recommends background music vibe and mood."""
    narrative_mood: str
    action_scale: str
    model: Optional[str] = None


# --- Thumbnails & Visuals ---

class ThumbnailRequest(BaseModel):
    """Generates thumbnail concepts based on title, genre, and plot."""
    title: str
    genre: str
    plot_point: str
    model: Optional[str] = None


class ThumbnailLayoutRequest(BaseModel):
    """Generates thumbnail layout and composition directives."""
    thumbnail_concept: str
    main_character: str
    model: Optional[str] = None


class GenerateThumbnailRequest(BaseModel):
    """Generates thumbnail prompt/image specifications from panel data."""
    title: str
    genre: str
    panels: List[Dict[str, Any]]
    model: Optional[str] = None


class ThumbnailVisualRequest(BaseModel):
    """Refines visual focus elements for thumbnail graphics."""
    thumbnail_concept: str
    model: Optional[str] = None


# --- YouTube & SEO ---

class SEORequest(BaseModel):
    """Generates SEO tags, title variations, and descriptions."""
    title: str
    genre: str
    storyboard_summary: str
    model: Optional[str] = None


class YouTubeChapterRequest(BaseModel):
    """Generates timestamped YouTube video chapters."""
    compiled_script: str
    model: Optional[str] = None


class MidrollPlacementRequest(BaseModel):
    """Recommends mid-roll ad placements within video script."""
    compiled_script: str
    max_ads: Optional[int] = 3
    model: Optional[str] = None


class TitleABRequest(BaseModel):
    """Generates A/B test variations for video titles."""
    title: str
    key_climax_event: str
    model: Optional[str] = None


# --- Character & Direction ---

class VoiceCastingRequest(BaseModel):
    """Matches character traits with optimal voice profiles."""
    character_name: str
    dialogue_sample: str
    visual_description: str
    model: Optional[str] = None


class CharacterEmotionRequest(BaseModel):
    """Analyzes character facial emotion and expression."""
    visual_description: str
    speech_text: str
    model: Optional[str] = None


class CameraShakeRequest(BaseModel):
    """Determines camera shake intensity for dramatic impact."""
    visual_description: str
    sfx: str
    model: Optional[str] = None


class SceneCompositionRequest(BaseModel):
    """Analyzes scene framing, lighting, and composition."""
    visual_description: str
    speech_text: str
    model: Optional[str] = None


class SubtitleStylerRequest(BaseModel):
    """Recommends subtitle font styling and animations."""
    visual_description: str
    speech_text: str
    model: Optional[str] = None


class TransitionSpeedRequest(BaseModel):
    """Calculates ideal transition speeds between scene cuts."""
    visual_description: str
    speech_text: str
    model: Optional[str] = None


# --- Utility ---

class TranslationRequest(BaseModel):
    """Translates text content into target languages."""
    text: str
    target_lang: str
    model: Optional[str] = None


class CopyrightScrubRequest(BaseModel):
    """Scrubs copyrighted or protected terms from text."""
    text: str
    model: Optional[str] = None


class CopyrightScrubBatchRequest(BaseModel):
    """Batch copyright scrubbing across multiple text inputs."""
    texts: List[str]
    model: Optional[str] = None


class EnhancePromptRequest(BaseModel):
    """Enhances raw prompt into detailed AI generation prompt."""
    prompt: str
    model: Optional[str] = None
    apiKey: Optional[str] = None


# =============================================================================
# 3. AI Model Management & Latency
# =============================================================================

class ListModelsRequest(BaseModel):
    """Queries available AI models for a given provider."""
    apiKey: Optional[str] = None
    provider: Optional[str] = "gemini"


class TestModelLatencyRequest(BaseModel):
    """Tests connection speed and response latency for an AI model."""
    provider: str
    model: str
    apiKey: Optional[str] = None
    prompt: Optional[str] = "Say: Connection Successful!"


# =============================================================================
# 4. Smart Crop
# =============================================================================

class SmartCropRequest(BaseModel):
    """Configuration parameters for AI/Canny-based panel splitting on a single image."""
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


class SmartCropBatchRequest(BaseModel):
    """Batch smart-crop operations across multiple image URLs."""
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


# =============================================================================
# 5. Stable Diffusion & Image Generation
# =============================================================================

class GenerateAIRequest(BaseModel):
    """Parameters for text-to-image generation."""
    prompt: str
    negative_prompt: Optional[str] = ""
    num_images: Optional[int] = Field(1, ge=1, le=10)
    width: Optional[int] = Field(512, ge=256, le=2048)
    height: Optional[int] = Field(512, ge=256, le=2048)
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)
    seed: Optional[int] = None
    output_dir: Optional[str] = None


class InpaintRequest(BaseModel):
    """Image inpainting configuration using masks and prompts."""
    image_path: str
    mask_path: str
    prompt: str
    negative_prompt: Optional[str] = ""
    output_path: Optional[str] = None
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)
    strength: Optional[float] = Field(0.8, ge=0.1, le=1.0)


class UpscaleRequest(BaseModel):
    """Resolution upscaling parameters."""
    image_path: str
    scale_factor: Optional[int] = Field(2, ge=2, le=4)
    output_path: Optional[str] = None


class StyleTransferRequest(BaseModel):
    """Transfers visual styles onto existing images."""
    image_path: str
    style_prompt: str
    output_path: Optional[str] = None
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)


class BatchGenerateRequest(BaseModel):
    """Batch text-to-image prompt generation."""
    prompts: List[str]
    width: Optional[int] = Field(512, ge=256, le=2048)
    height: Optional[int] = Field(512, ge=256, le=2048)
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)
    output_dir: Optional[str] = None
