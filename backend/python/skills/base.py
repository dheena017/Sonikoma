"""
backend/python/skills/base.py
─────────────────────────────────────────────────────────────────────────────
Base AISkill class loading prompts directly from Markdown files.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import time
import logging
import asyncio
from typing import Dict, Any, Optional, Type, List
from pydantic import BaseModel, Field

from config.clients import ai_initialized, call_gemini_with_retry, genai_client
from google.genai import types

logger = logging.getLogger("sonikoma.skills.base")

# ─── Structured Response Pydantic Models ──────────────────────────────────────

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


# ─── Pydantic Dynamic Schema Mapper ───────────────────────────────────────────

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
    "YouTubeChapterModel":     YouTubeChapterModel
}


# ─── Utility Parsers & Handlers ────────────────────────────────────────────────

def parse_simple_yaml(text: str) -> dict:
    """Robust, zero-dependency parser for flat YAML frontmatter blocks."""
    result = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip()
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            if val.startswith('[') and val.endswith(']'):
                items = [item.strip().strip('"').strip("'") for item in val[1:-1].split(",") if item.strip()]
                result[key] = items
            else:
                result[key] = val
    return result


class FallbackCoordinator:
    """Dynamic fallback provider for gracefully handling API failures."""
    @staticmethod
    def get_programmatic_fallback(skill_name: str, **kwargs) -> dict:
        if skill_name == "panel_analysis":
            return {
                "speech_text": "Cinematic panel capture.",
                "sfx": "[Impact]",
                "duration": 4.5,
                "motion_type": "zoom_in",
                "visual_description": "Static panel segment rendering."
            }
        elif skill_name == "translation":
            return {"translated_text": kwargs.get("text", "Text translation unavailable."), "accuracy_rating": 0.0}
        elif skill_name == "storyboard_narrative":
            return {
                "panels": [
                    {"speech_text": f"Chapter segment recap: {kwargs.get('title', 'Untitled')}.", "sfx": "[Sound]", "motion_type": "zoom_in"}
                    for _ in range(kwargs.get("active_slices_count", 5))
                ]
            }
        elif skill_name == "character_emotion_class":
            return {
                "emotional_state": "analytical",
                "voice_stability": 0.9,
                "expression_reasoning": "Determined posture with centered focal gaze."
            }
        elif skill_name == "copyright_scrubber":
            return {
                "contains_violation": False,
                "violation_type": "none",
                "sanitized_text": kwargs.get("text", "Clean narration."),
                "explanation": "Narration conforms to PG-13 community guidelines."
            }
        elif skill_name == "midroll_placement_ref":
            return {
                "placements": [
                    {"timestamp": "01:15", "tension_reason": "High cliffhanger point before revelation."}
                ]
            }
        elif skill_name == "outro_cta_generator":
            return {
                "outro_script": f"Subscribe to read the next peak chapter of {kwargs.get('title', 'this series')}!",
                "cta_focus": "subscribe"
            }
        elif skill_name == "scene_composition_desc":
            return {
                "visual_prompt": "Cinematic manhwa page close-up, dramatic shadows, soft backlight",
                "camera_angle": "low angle",
                "lighting": "dramatic backlighting",
                "style_description": "detailed manhwa"
            }
        elif skill_name == "shorts_retention_hook":
            return {
                "hook_sentence": "This S-Rank just unlocked absolute ruin!",
                "psychological_trigger": "curiosity"
            }
        elif skill_name == "subtitle_styler":
            return {
                "font_name": "Montserrat",
                "scale_size": 1.5,
                "primary_fill_color": "#FFCC00",
                "outline_stroke_thickness": 4.0,
                "bounce_animation_style": "pop"
            }
        elif skill_name == "thumbnail_visual_comp":
            return {
                "background_style": "Dark radial purple smoke",
                "split_screen_ratio": "50/50",
                "highlight_borders": ["yellow glow", "red overlay arrow"],
                "layout_margins": "safe bottom right corner"
            }
        elif skill_name == "transition_speed_tuner":
            return {
                "transition_style": "crossfade",
                "duration_frames": 15,
                "pacing_rationale": "Soft dialogue transitions."
            }
        elif skill_name == "youtube_chapter_gen":
            return {
                "chapters": [
                    {"timestamp": "00:00", "title": "Introduction"},
                    {"timestamp": "01:30", "title": "Climax Reveal"}
                ]
            }

        # Generic default response matching dynamic key-value schemas
        return {"success": False, "source": "fallback:error"}



class SkillLogger:
    """Helper to stream structured terminal logs compatible with frontend outputs."""
    def __init__(self):
        self.logger = logging.getLogger("sonikoma.skills.execution")

    def log_execution(self, skill_name: str, latency_ms: int, success: bool, inputs: dict, outputs: dict, prompt_tokens: int = 0, candidates_tokens: int = 0):
        status = "success" if success else "failed"
        tokens_str = f" | Tok: {prompt_tokens} / {candidates_tokens}" if success and (prompt_tokens > 0 or candidates_tokens > 0) else ""
        # Standard prefix formatting to match console log hooks
        self.logger.info(f"[AI Model] Executed skill: {skill_name} in {latency_ms}ms. Status: {status}{tokens_str}")
def get_provider_and_model(model_name: str) -> tuple[str, str]:
    if not model_name:
        return "gemini", "gemini-2.5-flash"
    m_lower = model_name.lower()

    # Strip common prefixes if any
    if m_lower.startswith("openai/"):
        return "openai", model_name[len("openai/"):]
    if m_lower.startswith("anthropic/"):
        return "anthropic", model_name[len("anthropic/"):]
    if m_lower.startswith("huggingface/"):
        return "huggingface", model_name[len("huggingface/"):]
    if m_lower.startswith("gemini/"):
        return "gemini", model_name[len("gemini/"):]

    # Check known prefixes
    if m_lower.startswith("gpt-") or m_lower.startswith("o1-") or m_lower.startswith("o3-"):
        return "openai", model_name
    if m_lower.startswith("claude-"):
        return "anthropic", model_name
    if m_lower.startswith("gemini-"):
        return "gemini", model_name

    # Hugging Face models are repo IDs: e.g. "Qwen/Qwen2.5-3B-Instruct"
    if "/" in model_name:
        return "huggingface", model_name

    # Default fallback
    return "gemini", model_name

def extract_json(text: str) -> str:
    # Find ```json ... ```
    match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()

    start_bracket = text.find("[")
    start_brace = text.find("{")
    end_bracket = text.rfind("]")
    end_brace = text.rfind("}")

    start = -1
    end = -1

    if start_bracket != -1 and start_brace != -1:
        start = min(start_bracket, start_brace)
    elif start_bracket != -1:
        start = start_bracket
    elif start_brace != -1:
        start = start_brace

    if end_bracket != -1 and end_brace != -1:
        end = max(end_bracket, end_brace)
    elif end_bracket != -1:
        end = end_bracket
    elif end_brace != -1:
        end = end_brace

    if start != -1 and end != -1 and start < end:
        return text[start:end+1].strip()
    return text.strip()

def resolve_api_key(provider: str, user_api_key: Any = None, user_keys: Optional[dict] = None) -> Optional[str]:
    # 1. Check user_keys dict first
    if user_keys and isinstance(user_keys, dict) and user_keys.get(provider):
        return user_keys.get(provider)
    # 2. Check user_api_key override
    if user_api_key:
        if isinstance(user_api_key, dict):
            if user_api_key.get(provider):
                return user_api_key.get(provider)
        else:
            return user_api_key
    # 3. Fallback to server env variables
    if provider == "openai":
        return os.getenv("OPENAI_API_KEY")
    elif provider == "anthropic":
        return os.getenv("ANTHROPIC_API_KEY")
    elif provider == "huggingface":
        return os.getenv("HUGGINGFACE_API_KEY")
    else:
        return os.getenv("GEMINI_API_KEY")


class BaseAISkill:
    """Parses and executes an AI skill defined in a Markdown file."""
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.name = ""
        self.description = ""
        self.default_model = "gemini-2.5-flash"
        self.response_schema_name = ""
        self.prompt_template = ""
        self.logger = SkillLogger()
        self.last_input_tokens = 0
        self.last_output_tokens = 0
        self.load()

    def load(self):
        """Loads and parses the .md file."""
        if not os.path.exists(self.filepath):
            raise FileNotFoundError(f"Markdown skill file not found: {self.filepath}")

        with open(self.filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Parse YAML frontmatter delimited by ---
        match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
        if match:
            yaml_block = match.group(1)
            self.prompt_template = match.group(2).strip()

            yaml_data = parse_simple_yaml(yaml_block)
            self.name = yaml_data.get("name", "")
            self.description = yaml_data.get("description", "")
            self.default_model = yaml_data.get("model", "gemini-2.5-flash")
            self.response_schema_name = yaml_data.get("response_schema", "")
        else:
            self.prompt_template = content.strip()
            self.name = os.path.splitext(os.path.basename(self.filepath))[0]

    @property
    def response_schema(self) -> Optional[Type[BaseModel]]:
        if self.response_schema_name:
            return SCHEMA_MAP.get(self.response_schema_name)
        return None

    def build_prompt(self, **kwargs) -> str:
        """Dynamically inserts key-value contexts into prompt brackets."""
        # Clean double braces to allow formatting templates smoothly
        safe_template = self.prompt_template

        # Format the parameters
        try:
            return safe_template.format(**kwargs)
        except KeyError as e:
            logger.warning(f"Missing parameter '{e}' during dynamic variable replacement in skill '{self.name}'. Injecting empty string.")
            # Graceful replacement for missing parameters
            kwargs[str(e).strip("'")] = ""
            return safe_template.format(**kwargs)
        except Exception as e:
            logger.error(f"Failed to compile prompt template for '{self.name}': {e}")
            return safe_template

    async def execute(self, model: Optional[str] = None, image_bytes: Optional[bytes] = None, api_key: Optional[str] = None, user_keys: Optional[dict] = None, **kwargs) -> Any:
        """Invokes the chosen provider model (Gemini, OpenAI, Anthropic, or HF) for skill execution."""
        start_time = time.monotonic()
        target_model = model or self.default_model

        provider, clean_model_id = get_provider_and_model(target_model)
        logger.info(f"[base.py] Resolved skill execution request to provider={provider}, model={clean_model_id}")

        prompt = self.build_prompt(**kwargs)
        last_exception = None

        try:
            if provider == "gemini":
                # Translate gemini-3.5 fallbacks if passed from frontend
                if "gemini-3.5" in clean_model_id.lower():
                    if "pro" in clean_model_id.lower():
                        clean_model_id = "gemini-2.5-pro"
                    else:
                        clean_model_id = "gemini-2.5-flash"
                    logger.info(f"[base.py] Translated gemini-3.5 model selection in '{self.name}' to: {clean_model_id}")

                key_to_use = resolve_api_key("gemini", api_key, user_keys)
                if not ai_initialized and not key_to_use:
                    raise RuntimeError("Gemini is not initialized and no API key was provided.")

                # Configure structured schemas
                config_args = {}
                schema = self.response_schema
                if schema:
                    config_args["response_mime_type"] = "application/json"
                    config_args["response_schema"] = schema

                config = types.GenerateContentConfig(**config_args)

                # Build multipart contents
                contents = []
                if image_bytes:
                    contents.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
                contents.append(prompt)

                # Use local client if api_key provided
                from google import genai
                client_to_use = genai.Client(api_key=key_to_use) if key_to_use else genai_client

                # Gemini generation using retry helper
                response = await call_gemini_with_retry(
                    lambda: client_to_use.models.generate_content(
                        model=clean_model_id,
                        contents=contents,
                        config=config
                    )
                )

                # Record execution metadata
                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                raw_text = response.text or "{}"

                # Simple validation check
                import json
                try:
                    parsed_json = json.loads(raw_text)
                except Exception:
                    parsed_json = {"raw_text": raw_text}

                # Retrieve actual token counts from response
                usage = getattr(response, 'usage_metadata', None)
                p_tokens = getattr(usage, 'prompt_token_count', 0) if usage else 0
                c_tokens = getattr(usage, 'candidates_token_count', 0) if usage else 0

                self.last_input_tokens = p_tokens
                self.last_output_tokens = c_tokens
                self.logger.log_execution(self.name, elapsed_ms, True, kwargs, parsed_json, p_tokens, c_tokens)
                return raw_text

            elif provider == "openai":
                import requests
                import base64
                import json

                key_to_use = resolve_api_key("openai", api_key, user_keys)
                if not key_to_use:
                    raise RuntimeError("Missing OpenAI API Key.")

                headers = {
                    "Authorization": f"Bearer {key_to_use}",
                    "Content-Type": "application/json"
                }

                messages = []
                if image_bytes:
                    base64_image = base64.b64encode(image_bytes).decode("utf-8")
                    messages = [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ]
                else:
                    messages = [
                        {"role": "user", "content": prompt}
                    ]

                payload = {
                    "model": clean_model_id,
                    "messages": messages,
                }

                # Add schema format if available
                schema = self.response_schema
                if schema:
                    try:
                        if hasattr(schema, "model_json_schema"):
                            schema_dict = schema.model_json_schema()
                        else:
                            schema_dict = schema.schema()

                        payload["response_format"] = {
                            "type": "json_schema",
                            "json_schema": {
                                "name": schema.__name__,
                                "strict": True,
                                "schema": schema_dict
                            }
                        }
                    except Exception as schema_err:
                        logger.warning(f"Failed to generate JSON schema for OpenAI: {schema_err}")

                loop = asyncio.get_running_loop()
                url = "https://api.openai.com/v1/chat/completions"

                def make_request():
                    return requests.post(url, json=payload, headers=headers, timeout=60)

                response = await loop.run_in_executor(None, make_request)

                if response.status_code != 200:
                    raise RuntimeError(f"OpenAI API request failed (HTTP {response.status_code}): {response.text}")

                res_data = response.json()
                raw_text = res_data["choices"][0]["message"]["content"]

                # Token usage
                usage = res_data.get("usage", {})
                self.last_input_tokens = usage.get("prompt_tokens", 0)
                self.last_output_tokens = usage.get("completion_tokens", 0)

                cleaned_json_text = extract_json(raw_text)
                try:
                    parsed_json = json.loads(cleaned_json_text)
                except Exception:
                    parsed_json = {"raw_text": raw_text}
                    cleaned_json_text = raw_text

                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                self.logger.log_execution(self.name, elapsed_ms, True, kwargs, parsed_json, self.last_input_tokens, self.last_output_tokens)
                return cleaned_json_text

            elif provider == "anthropic":
                import requests
                import base64
                import json

                key_to_use = resolve_api_key("anthropic", api_key, user_keys)
                if not key_to_use:
                    raise RuntimeError("Missing Anthropic API Key.")

                headers = {
                    "x-api-key": key_to_use,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }

                # Format system prompt with JSON schema requirement
                system_prompt = "You are a helpful AI assistant."
                schema = self.response_schema
                if schema:
                    try:
                        if hasattr(schema, "model_json_schema"):
                            schema_dict = schema.model_json_schema()
                        else:
                            schema_dict = schema.schema()
                        system_prompt = f"You MUST return ONLY a valid JSON object matching this schema:\n{json.dumps(schema_dict)}\nNo other conversational text, no explanations, no wrapping except clean JSON."
                    except Exception as schema_err:
                        pass

                messages = []
                if image_bytes:
                    base64_image = base64.b64encode(image_bytes).decode("utf-8")
                    messages = [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": "image/jpeg",
                                        "data": base64_image
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                else:
                    messages = [
                        {"role": "user", "content": prompt}
                    ]

                payload = {
                    "model": clean_model_id,
                    "max_tokens": 4096,
                    "system": system_prompt,
                    "messages": messages,
                }

                loop = asyncio.get_running_loop()
                url = "https://api.anthropic.com/v1/messages"

                def make_request():
                    return requests.post(url, json=payload, headers=headers, timeout=60)

                response = await loop.run_in_executor(None, make_request)

                if response.status_code != 200:
                    raise RuntimeError(f"Anthropic API request failed (HTTP {response.status_code}): {response.text}")

                res_data = response.json()
                raw_text = res_data["content"][0]["text"]

                # Token usage
                usage = res_data.get("usage", {})
                self.last_input_tokens = usage.get("input_tokens", 0)
                self.last_output_tokens = usage.get("output_tokens", 0)

                cleaned_json_text = extract_json(raw_text)
                try:
                    parsed_json = json.loads(cleaned_json_text)
                except Exception:
                    parsed_json = {"raw_text": raw_text}
                    cleaned_json_text = raw_text

                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                self.logger.log_execution(self.name, elapsed_ms, True, kwargs, parsed_json, self.last_input_tokens, self.last_output_tokens)
                return cleaned_json_text

            elif provider == "huggingface":
                import requests
                import json

                key_to_use = resolve_api_key("huggingface", api_key, user_keys)
                if not key_to_use:
                    raise RuntimeError("Missing Hugging Face Token.")

                headers = {
                    "Authorization": f"Bearer {key_to_use}",
                    "Content-Type": "application/json"
                }

                payload = {
                    "inputs": prompt,
                    "parameters": {"max_new_tokens": 1000}
                }

                loop = asyncio.get_running_loop()
                url = f"https://api-inference.huggingface.co/models/{clean_model_id}"

                def make_request():
                    return requests.post(url, json=payload, headers=headers, timeout=60)

                response = await loop.run_in_executor(None, make_request)

                if response.status_code != 200:
                    raise RuntimeError(f"Hugging Face request failed (HTTP {response.status_code}): {response.text}")

                res_data = response.json()
                if isinstance(res_data, list) and len(res_data) > 0:
                    raw_text = res_data[0].get("generated_text", str(res_data))
                elif isinstance(res_data, dict):
                    raw_text = res_data.get("generated_text", str(res_data))
                else:
                    raw_text = str(res_data)

                self.last_input_tokens = len(prompt) // 4
                self.last_output_tokens = len(raw_text) // 4

                cleaned_json_text = extract_json(raw_text)
                try:
                    parsed_json = json.loads(cleaned_json_text)
                except Exception:
                    parsed_json = {"raw_text": raw_text}
                    cleaned_json_text = raw_text

                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                self.logger.log_execution(self.name, elapsed_ms, True, kwargs, parsed_json, self.last_input_tokens, self.last_output_tokens)
                return cleaned_json_text

        except Exception as e:
            last_exception = e

        if last_exception:
            elapsed_ms = int((time.monotonic() - start_time) * 1000)
            logger.error(f"Skill '{self.name}' execution failed: {last_exception}", exc_info=True)

            fallback = FallbackCoordinator.get_programmatic_fallback(self.name, **kwargs)
            self.logger.log_execution(self.name, elapsed_ms, False, kwargs, fallback)

            if last_exception is None:
                last_exception = RuntimeError(f"Skill '{self.name}' failed to execute.")
            raise last_exception
