"""
backend/app/services/ai/skills/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas and metadata formats for AI structured responses.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Type, Optional
from pydantic import BaseModel, Field


class GeminiAnalysisModel(BaseModel):
    speech_text: str = Field(description="Captions or character dialogues")
    sfx: str = Field(description="Bracketed sound effect text")
    duration: float = Field(description="Suggested scene duration in seconds")
    motion_type: str = Field(description="Camera movement motion tag")
    visual_description: str = Field(description="Single sentence describing what is happening in the panel")


class StoryboardPanelModel(BaseModel):
    speech_text: str = Field(description="Narration or panel speech line")
    sfx: str = Field(description="Sound effect in brackets")
    motion_type: str = Field(description="Camera motion direction tag")
    visual_description: str = Field(description="Vivid description of the visual scene action and layout (10-25 words)")
    duration: float = Field(description="Suggested panel duration in seconds (typically between 3.0 and 7.0)")


class StoryboardModel(BaseModel):
    panels: List[StoryboardPanelModel] = Field(description="List of chronological panels")


class CropBox(BaseModel):
    cropTop: float = Field(description="Top coordinate (0 to 100 percentage)")
    cropBottom: float = Field(description="Bottom coordinate (0 to 100 percentage)")
    cropLeft: float = Field(description="Left coordinate (0 to 100 percentage)")
    cropRight: float = Field(description="Right coordinate (0 to 100 percentage)")


class CropList(BaseModel):
    panels: List[CropBox] = Field(description="List of panel bounding boxes detected")


class DramatizedScriptModel(BaseModel):
    narrator_line: str = Field(description="Enhanced cinematic narrator script line")
    voice_tone: str = Field(description="Target narrative voice over tone")


class SFXAudioPromptModel(BaseModel):
    audio_prompt: str = Field(description="Descriptive prompt for sound effect synthesis")
    suggested_volume: float = Field(description="Volume level from 0.0 to 1.0")


class ThumbnailConceptModel(BaseModel):
    image_generation_prompt: str = Field(description="Visual prompt for image generators")
    overlay_text: str = Field(description="Bold clickbait text overlay")
    ctr_explanation: str = Field(description="CTR justification")


class TranslationModel(BaseModel):
    translated_text: str = Field(description="Translated text content")
    accuracy_rating: float = Field(description="Confidence rating from 0.0 to 1.0")


class VideoSEOMetadataModel(BaseModel):
    youtube_title: str = Field(description="SEO-optimized title")
    youtube_description: str = Field(description="SEO-optimized description")
    tags: List[str] = Field(description="Optimized search tags")
    timestamps: List[str] = Field(description="List of timeline chapters e.g. 00:00 - Intro")


class VoiceCastingModel(BaseModel):
    gender: str = Field(description="Suggested voice gender")
    suggested_age: str = Field(description="Suggested age profile")
    voice_tone: str = Field(description="Suggested speech tone qualities")
    speech_tempo: float = Field(description="Tempo speed multiplier")
    accent: str = Field(description="Voice accent tag")


class ThumbnailLayoutModel(BaseModel):
    background_style: str = Field(description="Canvas background elements")
    subject_placement: str = Field(description="Subject alignment: left, center, right")
    glowing_elements: List[str] = Field(description="Glowing highlight overlays")
    face_expression: str = Field(description="Main character facial expression")


class SeriesIntroHookModel(BaseModel):
    hook_speech: str = Field(description="High-retention intro hook narration line")
    visual_background_prompt: str = Field(description="Visual description for intro backdrop")


class CharacterBioModel(BaseModel):
    name: str = Field(description="Character name")
    estimated_age: str = Field(description="Character age category")
    power_description: str = Field(description="Main character abilities/skills")
    clothing_color: str = Field(description="Clothing theme colors")
    active_role: str = Field(description="Role type (Protagonist, Rival, Support)")


class NarrativePacingModel(BaseModel):
    duration_multiplier: float = Field(description="Duration adjustment multiplier")
    transition_speed_sec: float = Field(description="Transition speed in seconds")
    bgm_volume_dampen: float = Field(description="BGM volume reduction ratio")


class CommentReplyModel(BaseModel):
    reply_text: str = Field(description="Engaging community reply text")
    engagement_tactic: str = Field(description="Tactic reasoning")


class BGMVibeModel(BaseModel):
    music_vibe_tags: List[str] = Field(description="Ambiance vibe keyword tags")
    target_bpm: int = Field(description="Target track tempo BPM")


class ShortsScriptModel(BaseModel):
    voiceover_script: str = Field(description="Ultra-fast Shorts voiceover transcript")
    visual_milestones: List[str] = Field(description="List of timeline visuals")


class CliffhangerModel(BaseModel):
    ending_narration: str = Field(description="Suspenseful recap concluding line")
    suspense_question: str = Field(description="Engagement question text")


class TitleABModel(BaseModel):
    title_a: str = Field(description="Curiosity gap title")
    title_b: str = Field(description="Overpowered protagonist title")
    title_c: str = Field(description="Extreme contrast title")


class SFXOverlayModel(BaseModel):
    ambient_track_type: str = Field(description="Ambient environmental sound style")
    ambient_volume_ratio: float = Field(description="Relative ambient volume")
    sfx_delay_ms: int = Field(description="Delay offset timing in milliseconds")


class CameraShakeModel(BaseModel):
    shake_amplitude: float = Field(description="Camera offset amplitude")
    shake_frequency: float = Field(description="Camera shake speed frequency")
    ffmpeg_offset_formula: str = Field(description="FFmpeg offset filter string expression")


class CharacterEmotionModel(BaseModel):
    emotional_state: str = Field(description="Categorized emotional state, e.g. terrified, smug, enraged, affectionate, analytical")
    voice_stability: float = Field(description="Target voice stability score from 0.0 to 1.0 (lower means trembling, higher means stable)")
    expression_reasoning: str = Field(description="Brief description of visual cues justifying this emotional state")


class CopyrightScrubModel(BaseModel):
    contains_violation: bool = Field(description="True if the script contains policy violations like extreme violence, hate speech, or sexual themes")
    violation_type: str = Field(description="Type of violation detected (e.g. violence, hate_speech, sexual, none)")
    sanitized_text: str = Field(description="Sanitized replacement text. If clean, returns original text.")
    explanation: str = Field(description="Explanation of what was flagged or why it is clean")


class AdPlacement(BaseModel):
    timestamp: str = Field(description="Timestamp formatting MM:SS indicating ad insertion point")
    tension_reason: str = Field(description="Justification of why this point represents a high-tension cliffhanger")


class MidrollPlacementModel(BaseModel):
    placements: List[AdPlacement] = Field(description="List of suggested midroll ad placement timestamps")


class OutroCTAModel(BaseModel):
    outro_script: str = Field(description="Recap channel subscription speech script (strictly max 15 words)")
    cta_focus: str = Field(description="Target call to action focus, e.g., subscribe, comment, next_video")


class SceneCompositionModel(BaseModel):
    visual_prompt: str = Field(description="Detailed image prompt for image generation AI (Stable Diffusion/SDXL)")
    camera_angle: str = Field(description="Suggested shot type and angle (e.g., extreme close-up, low-angle)")
    lighting: str = Field(description="Lighting style description (e.g., dramatic backlighting, neon highlights)")
    style_description: str = Field(description="Drawing or rendering style description (e.g., detailed manhwa, watercolor)")


class ShortsHookModel(BaseModel):
    hook_sentence: str = Field(description="Scroll-stopping TikTok/Shorts vertical hook sentence (max 2 seconds)")
    psychological_trigger: str = Field(description="Psychological trigger used (e.g. curiosity, shock, FOMO)")


class SubtitleStylerModel(BaseModel):
    font_name: str = Field(description="Recommended subtitle font (e.g. Impact, Montserrat, Arial, BadaBoom)")
    scale_size: float = Field(description="Font scale size multiplier (e.g., 1.0 to 2.5)")
    primary_fill_color: str = Field(description="Primary fill color hex code (e.g. #FFFFFF, #FFCC00)")
    outline_stroke_thickness: float = Field(description="Outline border thickness in pixels")
    bounce_animation_style: str = Field(description="Animation style tag (e.g., pop, shake, static, drift)")


class ThumbnailVisualModel(BaseModel):
    background_style: str = Field(description="Canvas background elements and colors description")
    split_screen_ratio: str = Field(description="Layout partition/split-screen ratio (e.g. 50/50, left-heavy)")
    highlight_borders: List[str] = Field(description="Highlights (e.g. red outlines, yellow glow, warning arrows)")
    layout_margins: str = Field(description="Margins to avoid YouTube timestamp overlays")


class ThumbnailFocalAsset(BaseModel):
    panel_index: int = Field(description="Index of the storyboard panel to extract from")
    crop_reason: str = Field(description="Why this panel was chosen (e.g. high emotion, main character face)")
    style_effect: str = Field(description="Visual effect to apply (e.g. glow, shadow, outline)")


class ThumbnailCompositionRecipeModel(BaseModel):
    focal_assets: List[ThumbnailFocalAsset] = Field(description="List of assets to extract from panels")
    background_type: str = Field(description="Type of background (e.g. blurred_panel, color_gradient, speed_lines)")
    background_panel_index: Optional[int] = Field(description="Index of panel to use for background if applicable")
    overlay_text: str = Field(description="Bold clickbait text")
    text_color: str = Field(description="Hex color for text")
    layout_archetype: str = Field(description="Layout style (e.g. split_screen, centered_hero, rule_of_thirds)")


class TransitionSpeedModel(BaseModel):
    transition_style: str = Field(description="Transition type (e.g. crossfade, cut, flash, zoom)")
    duration_frames: int = Field(description="Exact transition duration in frames at 30fps")
    pacing_rationale: str = Field(description="Pacing rationale matching dialogue/actions")


class YouTubeChapterItem(BaseModel):
    timestamp: str = Field(description="Chapter timestamp formatted as MM:SS")
    title: str = Field(description="Engaging title for this video chapter")


class YouTubeChapterModel(BaseModel):
    chapters: List[YouTubeChapterItem] = Field(description="List of chronological video chapters")


class PanelNarrativeModel(BaseModel):
    id: int = Field(description="The matching panel ID")
    narrative: str = Field(description="The storytelling narrative text for this panel (strictly 25-50 words, motion comic style)")


class SequenceNarrativeModel(BaseModel):
    panels: List[PanelNarrativeModel] = Field(description="Chronological narrative texts matching each panel")


SCHEMA_MAP: Dict[str, Type[BaseModel]] = {
    "GeminiAnalysisModel":     GeminiAnalysisModel,
    "StoryboardModel":         StoryboardModel,
    "CropList":                CropList,
    "DramatizedScriptModel":   DramatizedScriptModel,
    "SFXAudioPromptModel":     SFXAudioPromptModel,
    "ThumbnailConceptModel":   ThumbnailConceptModel,
    "TranslationModel":        TranslationModel,
    "VideoSEOMetadataModel":   VideoSEOMetadataModel,
    "VoiceCastingModel":       VoiceCastingModel,
    "ThumbnailLayoutModel":    ThumbnailLayoutModel,
    "SeriesIntroHookModel":    SeriesIntroHookModel,
    "CharacterBioModel":       CharacterBioModel,
    "NarrativePacingModel":    NarrativePacingModel,
    "CommentReplyModel":       CommentReplyModel,
    "BGMVibeModel":            BGMVibeModel,
    "ShortsScriptModel":       ShortsScriptModel,
    "CliffhangerModel":        CliffhangerModel,
    "TitleABModel":            TitleABModel,
    "SFXOverlayModel":         SFXOverlayModel,
    "CameraShakeModel":        CameraShakeModel,
    "CharacterEmotionModel":   CharacterEmotionModel,
    "CopyrightScrubModel":     CopyrightScrubModel,
    "MidrollPlacementModel":   MidrollPlacementModel,
    "OutroCTAModel":           OutroCTAModel,
    "SceneCompositionModel":   SceneCompositionModel,
    "ShortsHookModel":         ShortsHookModel,
    "SubtitleStylerModel":     SubtitleStylerModel,
    "ThumbnailVisualModel":    ThumbnailVisualModel,
    "ThumbnailCompositionRecipeModel": ThumbnailCompositionRecipeModel,
    "TransitionSpeedModel":    TransitionSpeedModel,
    "YouTubeChapterModel":     YouTubeChapterModel,
    "SequenceNarrativeModel":   SequenceNarrativeModel
}
