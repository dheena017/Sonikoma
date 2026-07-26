"""
backend/app/schemas/ai.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for ai.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class AnalyzeImageRequest(BaseModel):
    url: str
    model: Optional[str] = "gemini-2.5-flash"
    narrationStyle: Optional[str] = "long"  # 'long' = detailed YouTube recap, 'short' = quick subtitles
    voice: Optional[str] = "en-US-GuyNeural"


class AnalyzeBatchRequest(BaseModel):
    urls: List[str]
    model: Optional[str] = "gemini-2.5-flash"
    narrationStyle: Optional[str] = "long"  # 'long' = detailed YouTube recap, 'short' = quick subtitles
    voice: Optional[str] = "en-US-GuyNeural"


class AnalyzeSequenceRequest(BaseModel):
    urls: List[str]
    model: Optional[str] = "gemini-2.5-flash"
    narrationStyle: Optional[str] = "long"
    voice: Optional[str] = "en-US-GuyNeural"


class AnalyzeNarrativeSequenceRequest(BaseModel):
    visual_descriptions: List[str]
    model: Optional[str] = "gemini-2.5-flash"
    voice: Optional[str] = "en-US-GuyNeural"


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
    model: Optional[str] = "gemini-2.5-flash"
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
    autoSplit: Optional[bool] = True
    targetWidth: Optional[int] = None
    targetHeight: Optional[int] = None
    guidanceInstructions: Optional[str] = None
    focusMode: Optional[str] = None


class SmartCropBatchRequest(BaseModel):
    urls: List[str]
    model: Optional[str] = "gemini-2.5-flash"
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
    autoSplit: Optional[bool] = True
    targetWidth: Optional[int] = None
    targetHeight: Optional[int] = None
    guidanceInstructions: Optional[str] = None
    focusMode: Optional[str] = None


class DramatizeRequest(BaseModel):
    raw_ocr_text: List[str]
    genre: str
    scene_context: str
    model: Optional[str] = "gemini-2.5-flash"


class SFXAudioRequest(BaseModel):
    visual_description: str
    sfx_tag: str
    model: Optional[str] = "gemini-2.5-flash"


class ThumbnailRequest(BaseModel):
    title: str
    genre: str
    plot_point: str
    model: Optional[str] = "gemini-2.5-flash"


class TranslationRequest(BaseModel):
    text: str
    target_lang: str
    model: Optional[str] = "gemini-2.5-flash"


class SEORequest(BaseModel):
    title: str
    genre: str
    storyboard_summary: str
    model: Optional[str] = "gemini-2.5-flash"


class VoiceCastingRequest(BaseModel):
    character_name: str
    dialogue_sample: str
    visual_description: str
    model: Optional[str] = "gemini-2.5-flash"


class ThumbnailLayoutRequest(BaseModel):
    thumbnail_concept: str
    main_character: str
    model: Optional[str] = "gemini-2.5-flash"


class SeriesIntroHookRequest(BaseModel):
    title: str
    premise_summary: str
    genre: str
    model: Optional[str] = "gemini-2.5-flash"


class CharacterBioRequest(BaseModel):
    dialogue: str
    model: Optional[str] = "gemini-2.5-flash"


class NarrativePacingRequest(BaseModel):
    visual_description: str
    speech_text: str
    sfx: str
    model: Optional[str] = "gemini-2.5-flash"


class BGMVibeRequest(BaseModel):
    narrative_mood: str
    action_scale: str
    model: Optional[str] = "gemini-2.5-flash"


class ShortsScriptRequest(BaseModel):
    storyboard_summary: str
    model: Optional[str] = "gemini-2.5-flash"


class TitleABRequest(BaseModel):
    title: str
    key_climax_event: str
    model: Optional[str] = "gemini-2.5-flash"


class SFXOverlayRequest(BaseModel):
    visual_description: str
    speech_text: str
    sfx: str
    model: Optional[str] = "gemini-2.5-flash"


class CameraShakeRequest(BaseModel):
    visual_description: str
    sfx: str
    model: Optional[str] = "gemini-2.5-flash"


class SceneCompositionRequest(BaseModel):
    visual_description: str
    speech_text: str
    model: Optional[str] = "gemini-2.5-flash"


class SubtitleStylerRequest(BaseModel):
    visual_description: str
    speech_text: str
    model: Optional[str] = "gemini-2.5-flash"


class GenerateThumbnailRequest(BaseModel):
    title: str
    genre: str
    panels: List[Dict[str, Any]]
    model: Optional[str] = "gemini-2.5-flash"


class YouTubeChapterRequest(BaseModel):
    compiled_script: str
    model: Optional[str] = "gemini-2.5-flash"


class MidrollPlacementRequest(BaseModel):
    compiled_script: str
    max_ads: Optional[int] = 3
    model: Optional[str] = "gemini-2.5-flash"


class ShortsHookRequest(BaseModel):
    title: str
    key_event: str
    model: Optional[str] = "gemini-2.5-flash"


class CharacterEmotionRequest(BaseModel):
    visual_description: str
    speech_text: str
    model: Optional[str] = "gemini-2.5-flash"


class TransitionSpeedRequest(BaseModel):
    visual_description: str
    speech_text: str
    model: Optional[str] = "gemini-2.5-flash"


class ThumbnailVisualRequest(BaseModel):
    thumbnail_concept: str
    model: Optional[str] = "gemini-2.5-flash"


class CopyrightScrubRequest(BaseModel):
    text: str
    model: Optional[str] = "gemini-2.5-flash"


class CopyrightScrubBatchRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = "gemini-2.5-flash"


class PanelDescriptionItem(BaseModel):
    id: int
    visual_description: str


class GenerateSequenceNarrativeRequest(BaseModel):
    panels: List[PanelDescriptionItem]
    model: Optional[str] = "gemini-2.5-flash"
    voice: Optional[str] = "en-US-GuyNeural"


class EnhancePromptRequest(BaseModel):
    prompt: str
    model: Optional[str] = "gemini-2.5-flash"
    apiKey: Optional[str] = None



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


class InpaintRequest(BaseModel):
    image_path: str
    mask_path: str
    prompt: str
    negative_prompt: Optional[str] = ""
    output_path: Optional[str] = None
    guidance_scale: Optional[float] = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: Optional[int] = Field(50, ge=1, le=150)
    strength: Optional[float] = Field(0.8, ge=0.1, le=1.0)


class UpscaleRequest(BaseModel):
    image_path: str
    scale_factor: Optional[int] = Field(2, ge=2, le=4)
    output_path: Optional[str] = None


class StyleTransferRequest(BaseModel):
    image_path: str
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

