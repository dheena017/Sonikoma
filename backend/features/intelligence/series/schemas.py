"""backend/app/schemas/series.py
─────────────────────────────────────────────────────────────────────────────
Pydantic data models for AI Generated Multi-Session & Multi-Chapter Series:
Anime Episodes (Video), Manhwa Webtoons (Vertical Strip), and Comic/Manga (Grids).
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


class SeriesFormatType(str, Enum):
    MANHWA = "manhwa"
    COMIC_MANGA = "comic_manga"
    ANIME = "anime"


class SeriesArtStyle(str, Enum):
    MANHWA_SLICE_OF_LIFE = "manhwa_slice_of_life"
    MANHWA_PASTEL_ROMANCE = "manhwa_pastel_romance"
    MANHWA_ACTION_HUNTER = "manhwa_action_hunter"
    MANHWA_OVERPOWERED_REGRESSION = "manhwa_overpowered_regression"
    MANHWA_OTOME_ISEKAI = "manhwa_otome_isekai"
    MANHWA_MURIM_WUXIA = "manhwa_murim_wuxia"
    MANGA_SHONEN_JUMP = "manga_shonen_jump"
    MANGA_BERSERK_SEINEN = "manga_berserk_seinen"
    COMIC_WESTERN_VINTAGE = "comic_western_vintage"
    COMIC_CYBERPUNK_NEON = "comic_cyberpunk_neon"
    ANIME_UFOTABLE_CINEMATIC = "anime_ufotable_cinematic"
    ANIME_GHIBLI_WATERCOLOR = "anime_ghibli_watercolor"
    ANIME_90S_RETRO_CEL = "anime_90s_retro_cel"


class SeriesPacing(str, Enum):
    SLOW_BURN = "slow_burn"
    BALANCED = "balanced"
    DYNAMIC = "dynamic"
    HIGH_OCTANE = "high_octane"


class DialogueDensity(str, Enum):
    MINIMAL = "minimal"
    BALANCED = "balanced"
    VERBOSE = "verbose"


class ProjectStatus(str, Enum):
    PLANNING = "planning"
    DRAFT = "draft"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationPriority(str, Enum):
    TURBO_FIRST_CHAPTER = "turbo_first_chapter"
    BACKGROUND_FULL_SERIES = "background_full_series"


MediumType = Literal["anime", "manhwa", "comic", "manga", "comic_manga"]
VideoMode = Literal["image_to_video", "text_to_video"]
ActPhase = Literal["act_1", "act_2", "act_3", "act_4", "epilogue"]
ChapterStatus = Literal["draft", "scripting", "generating_art", "rendering", "ready", "failed", "completed", "generating"]


class InteractivePoint(BaseModel):
    x: float = 0.0
    y: float = 0.0


class CharacterDNA(BaseModel):
    """Locks character facial identity, hair, costume, and voice for multi-season consistency."""
    id: Optional[str] = Field(None, description="Unique character identifier")
    character_id: Optional[str] = Field(None, description="Alias for id")
    name: str = Field(..., description="Character name")
    role: str = Field("supporting", description="protagonist, antagonist, supporting, etc.")
    visual_summary: Optional[str] = Field(None, description="Concise appearance summary")
    visual_prompt: Optional[str] = Field(None, description="Detailed visual anchor tokens for image/video diffusion")
    hair_color: Optional[str] = Field(None)
    eye_color: Optional[str] = Field(None)
    clothing_palette: Optional[str] = Field(None)
    signature_traits: List[str] = Field(default_factory=list)
    voice_id: Optional[str] = Field(None, description="Dynamically selected Edge-TTS neural voice identifier")
    gender: Optional[str] = Field("neutral")
    reference_image_url: Optional[str] = Field(None)
    wardrobe_evolution: Dict[str, str] = Field(default_factory=dict)

    def model_post_init(self, __context: Any) -> None:
        if not self.id and self.character_id:
            self.id = self.character_id
        elif not self.character_id and self.id:
            self.character_id = self.id
        if not self.visual_prompt and self.visual_summary:
            self.visual_prompt = self.visual_summary
        elif not self.visual_summary and self.visual_prompt:
            self.visual_summary = self.visual_prompt


class InteractiveSpeechBubble(BaseModel):
    """Option A Interactive Floating SVG speech bubble with 1-click in-place editing."""
    id: Optional[str] = Field(None)
    bubble_id: Optional[str] = Field(None)
    panel_id: Optional[str] = Field(None)
    speaker_name: Optional[str] = Field(None)
    character_id: Optional[str] = Field(None)
    text: str = Field(..., description="Dialogue text")
    translated_texts: Dict[str, str] = Field(default_factory=dict)
    bubble_type: str = Field("speech")
    pos_x: float = Field(20.0, description="Relative X position in %")
    pos_y: float = Field(15.0, description="Relative Y position in %")
    width: float = Field(35.0, description="Relative width in %")
    height: float = Field(15.0, description="Relative height in %")
    font_family: str = Field("Bangers")
    font_size: int = Field(16)
    bg_color: str = Field("#FFFFFF")
    text_color: str = Field("#111827")
    border_color: str = Field("#000000")
    border_width: int = Field(2)
    tail_tip: Optional[InteractivePoint] = Field(None)
    box: Optional[Dict[str, float]] = Field(None)
    tail_position: Optional[str] = Field("bottom-left")
    audio_url: Optional[str] = Field(None, description="Local or streaming URL to Edge-TTS synthesized speech audio track")
    duration_seconds: Optional[float] = Field(None, description="Audio playback duration in seconds")

    def model_post_init(self, __context: Any) -> None:
        if not self.id and self.bubble_id:
            self.id = self.bubble_id
        elif not self.bubble_id and self.id:
            self.bubble_id = self.id


class AISeriesPanel(BaseModel):
    """An individual artwork panel inside an AI series chapter."""
    id: Optional[str] = Field(None)
    panel_id: Optional[str] = Field(None)
    panel_index: int = Field(1)
    order_index: int = Field(1)
    image_url: str = Field("")
    prompt: str = Field("")
    negative_prompt: str = Field("")
    camera_angle: Optional[str] = Field(None)
    motion_type: Optional[str] = Field(None)
    motion_prompt: Optional[str] = Field(None)
    motion_model: Optional[str] = Field(None)
    video_url: Optional[str] = Field(None)
    audio_url: Optional[str] = Field(None, description="Full panel voice track audio URL")
    speech_text: Optional[str] = Field(None)
    speaker_id: Optional[str] = Field(None)
    sound_effects: Optional[str] = Field(None)
    sfx: Optional[str] = Field(None)
    duration: float = Field(3.0)
    speech_bubbles: List[InteractiveSpeechBubble] = Field(default_factory=list)

    def model_post_init(self, __context: Any) -> None:
        if not self.id and self.panel_id:
            self.id = self.panel_id
        elif not self.panel_id and self.id:
            self.panel_id = self.id
        if self.panel_index and not self.order_index:
            self.order_index = self.panel_index
        elif self.order_index and not self.panel_index:
            self.panel_index = self.order_index


class ComicPage(BaseModel):
    """Paginated spread layout for Comic and Manga reader."""
    page_number: int = Field(1)
    grid_template: str = Field("classic_4")
    panels: List[AISeriesPanel] = Field(default_factory=list)


class ChapterSession(BaseModel):
    """Represents a single chapter or watchable anime episode in a multi-season series."""
    id: Optional[str] = Field(None)
    chapter_id: Optional[str] = Field(None)
    session_number: int = Field(1, ge=1, le=5)
    chapter_number: int = Field(1, ge=1, le=25)
    absolute_episode_number: Optional[int] = Field(1)
    title: str = Field("Chapter 1: The Awakening")
    synopsis: Optional[str] = Field("")
    summary: Optional[str] = Field("")
    pacing_role: Optional[str] = Field("rising_action")
    act_phase: Optional[str] = Field("act_1")
    medium_type: Optional[str] = Field("manhwa")
    status: Union[ProjectStatus, str] = Field(ProjectStatus.DRAFT)
    progress_percent: float = Field(0.0)
    current_stage_label: str = Field("Ready to generate")
    panels: List[AISeriesPanel] = Field(default_factory=list)
    speech_bubbles: List[InteractiveSpeechBubble] = Field(default_factory=list)
    video_url: Optional[str] = Field(None)
    video_duration: Optional[float] = Field(None)
    webtoon_strip_urls: List[str] = Field(default_factory=list)
    comic_pages: List[ComicPage] = Field(default_factory=list)
    is_series_finale: bool = Field(False)
    guaranteed_resolution_notes: Optional[str] = Field(None)
    created_at: Optional[str] = Field("")
    updated_at: Optional[str] = Field("")

    def model_post_init(self, __context: Any) -> None:
        if not self.id and self.chapter_id:
            self.id = self.chapter_id
        elif not self.chapter_id and self.id:
            self.chapter_id = self.id
        if not self.summary and self.synopsis:
            self.summary = self.synopsis
        elif not self.synopsis and self.summary:
            self.synopsis = self.summary


class SeriesSession(BaseModel):
    """A major narrative Season (Session) containing 1 to 25 chapters."""
    id: Optional[str] = Field(None)
    session_number: int = Field(1, ge=1, le=5)
    title: str = Field("Season 1: Foundation & Awakening")
    synopsis: Optional[str] = Field("")
    summary: Optional[str] = Field("")
    total_chapters: int = Field(5, ge=1, le=25)
    chapters: List[ChapterSession] = Field(default_factory=list)
    status: Union[ProjectStatus, str] = Field(ProjectStatus.DRAFT)

    def model_post_init(self, __context: Any) -> None:
        if not self.id:
            self.id = f"session_{self.session_number}"
        if not self.summary and self.synopsis:
            self.summary = self.synopsis
        elif not self.synopsis and self.summary:
            self.synopsis = self.summary


class AISeriesProject(BaseModel):
    """Top-level Franchise Project representing an AI Generated Multi-Season Series."""
    id: Optional[str] = Field(None)
    series_id: Optional[str] = Field(None)
    title: str = Field("The Shadow Monarch")
    synopsis: Optional[str] = Field("A thrilling saga.")
    logline: Optional[str] = Field(None)
    genre: str = Field("action_fantasy")
    format_type: Union[SeriesFormatType, str] = Field(SeriesFormatType.MANHWA)
    medium_type: Optional[str] = Field("manhwa")
    video_mode: Optional[str] = Field("image_to_video")
    art_style: Union[SeriesArtStyle, str] = Field(SeriesArtStyle.MANHWA_ACTION_HUNTER)
    audio_language: str = Field("ja-JP")
    image_model: str = Field("flux-anime")
    storyboard_model: Optional[str] = Field("gemini-2.5-flash")
    voice_model: Optional[str] = Field("edge-tts")
    cast: List[CharacterDNA] = Field(default_factory=list)
    character_cast: List[CharacterDNA] = Field(default_factory=list)
    world_bible: Dict[str, Any] = Field(default_factory=dict)
    total_sessions: int = Field(1, ge=1, le=5)
    chapters_per_session: int = Field(5, ge=1, le=25)
    panels_per_chapter: int = Field(8, ge=2, le=24, description="Panels synthesized per chapter/episode")
    total_episodes: int = Field(5)
    pacing: Union[SeriesPacing, str] = Field(SeriesPacing.DYNAMIC)
    dialogue_density: Union[DialogueDensity, str] = Field(DialogueDensity.BALANCED)
    generation_priority: Union[GenerationPriority, str] = Field(GenerationPriority.TURBO_FIRST_CHAPTER)
    narrative_outline: Dict[str, Any] = Field(default_factory=dict)
    sessions: List[SeriesSession] = Field(default_factory=list)
    cover_image_url: Optional[str] = Field(None)
    user_id: str = Field("creator_default")
    status: Union[ProjectStatus, str] = Field(ProjectStatus.PLANNING)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    def model_post_init(self, __context: Any) -> None:
        if not self.id and self.series_id:
            self.id = self.series_id
        elif not self.series_id and self.id:
            self.series_id = self.id
        if not self.cast and self.character_cast:
            self.cast = self.character_cast
        elif not self.character_cast and self.cast:
            self.character_cast = self.cast
        if not self.medium_type and self.format_type:
            self.medium_type = str(self.format_type)
        if not self.logline and self.synopsis:
            self.logline = self.synopsis
        elif not self.synopsis and self.logline:
            self.synopsis = self.logline
        self.total_episodes = self.total_sessions * self.chapters_per_session


class CreateAISeriesRequest(BaseModel):
    """User request to architect and kick off a new AI Generated Series."""
    title: str = Field(..., min_length=1, max_length=120)
    synopsis: Optional[str] = Field("A thrilling journey of power, honor, and destiny.")
    logline: Optional[str] = Field(None)
    genre: Optional[str] = Field("action_fantasy")
    format_type: Union[SeriesFormatType, str] = Field(SeriesFormatType.MANHWA)
    medium_type: Optional[str] = Field("manhwa")
    art_style: Union[SeriesArtStyle, str] = Field(SeriesArtStyle.MANHWA_ACTION_HUNTER)
    image_model: Optional[str] = Field("flux-anime")
    storyboard_model: Optional[str] = Field("gemini-2.5-flash")
    voice_model: Optional[str] = Field("edge-tts")
    video_mode: Optional[str] = Field("image_to_video")
    total_sessions: int = Field(1, ge=1, le=5)
    chapters_per_session: int = Field(5, ge=1, le=25)
    panels_per_chapter: Optional[int] = Field(8, ge=2, le=24, description="Panels synthesized per chapter/episode")
    pacing: Union[SeriesPacing, str] = Field(SeriesPacing.DYNAMIC)
    dialogue_density: Union[DialogueDensity, str] = Field(DialogueDensity.BALANCED)
    generation_priority: Union[GenerationPriority, str] = Field(GenerationPriority.TURBO_FIRST_CHAPTER)

"""Memory and learning schemas for AI Generated Series.

Includes Franchise Canon Continuity, Creator Style Preference Learning (RLHF),
and Generation Feedback tracking for continuous improvement.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CreatorStyleProfile(BaseModel):
    """User-specific artistic and cinematic preferences learned over time."""
    creator_id: str = "default_creator"
    preferred_art_style: str = "manhwa_action_hunter"
    pacing_preference: str = "dynamic"  # cinematic, fast, slow_burn, dynamic
    dialogue_density: str = "balanced"  # minimal, balanced, wordy
    color_grading: str = "vibrant_high_contrast"
    favorite_camera_angles: List[str] = Field(
        default_factory=lambda: ["low_angle_hero", "dramatic_close_up", "dynamic_tilt"]
    )
    vfx_intensity: float = 0.8  # 0.0 to 1.0
    learned_prompt_modifiers: List[str] = Field(default_factory=list)
    bubble_styling_preferences: Dict[str, Any] = Field(
        default_factory=lambda: {
            "font_family": "Bangers",
            "bg_color": "#FFFFFF",
            "text_color": "#111827",
            "border_color": "#000000",
            "border_width": 2,
        }
    )
    total_generations_rated: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FranchiseContinuityMemory(BaseModel):
    """Deep canon and timeline memory for an AI Generated Series."""
    series_id: str
    active_characters: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Character states, current outfits, battle scars, power levels"
    )
    world_rules: List[str] = Field(
        default_factory=list,
        description="Core immutable laws of physics/magic in this universe"
    )
    lore_revelations: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Timeline of revealed secrets, key lore discoveries by chapter"
    )
    unresolved_threads: List[str] = Field(
        default_factory=list,
        description="Mysteries and narrative arcs that must be tied up before finale"
    )
    resolved_threads: List[str] = Field(
        default_factory=list,
        description="Arcs successfully resolved in past chapters"
    )
    canonical_locations: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Key locations, architectural traits, visual references"
    )
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class GenerationFeedbackEvent(BaseModel):
    """User feedback event captured during studio editing (RLHF loop)."""
    feedback_id: str
    series_id: str
    chapter_id: Optional[str] = None
    panel_id: Optional[str] = None
    event_type: str  # bubble_edit, prompt_tweak, panel_reroll, motion_speed_adjust, audio_retake
    original_value: Any = None
    adjusted_value: Any = None
    rating: Optional[int] = None  # 1 to 5 stars
    creator_notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MemoryOptimizationSuggestion(BaseModel):
    """AI self-improvement recommendation based on historical memory."""
    suggestion_id: str
    target_area: str  # prompt_dna, panel_composition, character_consistency, audio_pacing
    recommended_action: str
    reasoning: str
    confidence_score: float = 0.95
