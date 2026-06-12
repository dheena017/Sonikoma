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

logger = logging.getLogger("anivox.skills.base")

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
    "CameraShakeModel":        CameraShakeModel
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
        
        # Generic default response matching dynamic key-value schemas
        return {"success": False, "source": "fallback:error"}


class SkillLogger:
    """Helper to stream structured terminal logs compatible with frontend outputs."""
    def __init__(self):
        self.logger = logging.getLogger("anivox.skills.execution")

    def log_execution(self, skill_name: str, latency_ms: int, success: bool, inputs: dict, outputs: dict):
        status = "success" if success else "failed"
        # Standard prefix formatting to match console log hooks
        self.logger.info(f"[AI Model] Executed skill: {skill_name} in {latency_ms}ms. Status: {status}")


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

    async def execute(self, model: Optional[str] = None, image_bytes: Optional[bytes] = None, **kwargs) -> Any:
        """Invokes the Gemini GenAI model resiliently with schema outputs and retry parameters."""
        start_time = time.monotonic()
        target_model = model or self.default_model
        
        # Translate gemini-3.5 fallbacks if passed from frontend
        if "gemini-3.5" in target_model.lower():
            if "pro" in target_model.lower():
                target_model = "gemini-2.5-pro"
            else:
                target_model = "gemini-2.5-flash"
            logger.info(f"[base.py] Translated gemini-3.5 model selection in '{self.name}' to: {target_model}")
            
        prompt = self.build_prompt(**kwargs)
        
        if not ai_initialized:
            # Route to fallback coordinator
            fallback = FallbackCoordinator.get_programmatic_fallback(self.name, **kwargs)
            self.logger.log_execution(self.name, 0, False, kwargs, fallback)
            return fallback

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
        
        # Determine candidate models to try in sequence
        candidates = [target_model]
        for fallback_model in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
            if fallback_model != target_model:
                candidates.append(fallback_model)

        last_exception = None
        for candidate_model in candidates:
            try:
                # Gemini generation using retry helper
                response = await call_gemini_with_retry(
                    lambda: genai_client.models.generate_content(
                        model=candidate_model,
                        contents=contents,
                        config=config
                    )
                )
                
                # Record execution metadata
                elapsed_ms = int((time.monotonic() - start_time) * 1000)
                raw_text = response.text or "{}"
                
                # Simple validation check (returns JSON string or parseable dict depending on route expectations)
                import json
                parsed_json = json.loads(raw_text)
                
                self.logger.log_execution(self.name, elapsed_ms, True, kwargs, parsed_json)
                return raw_text
            except Exception as e:
                logger.warning(f"Skill '{self.name}' execution failed with model {candidate_model}: {e}")
                last_exception = e
                # Continue loop to try the next model

        # If we got here, all candidate models failed
        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        logger.error(f"Skill '{self.name}' all candidate models failed. Last error: {last_exception}", exc_info=True)
        
        fallback = FallbackCoordinator.get_programmatic_fallback(self.name, **kwargs)
        self.logger.log_execution(self.name, elapsed_ms, False, kwargs, fallback)
        
        # Raise the exception so endpoints can detect failure and return success: False with the error message
        raise last_exception
