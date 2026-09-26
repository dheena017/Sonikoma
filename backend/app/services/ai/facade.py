"""
backend/app/services/ai/facade.py
─────────────────────────────────────────────────────────────────────────────
AI Subsystem Facade coordinating image analysis, batch processing, narratives,
smart cropping, skill executions, and multi-provider model registrations.
─────────────────────────────────────────────────────────────────────────────
"""


import uuid
import os
import io
import time
import logging
import asyncio
import tempfile
import json
import re
from typing import List, Optional, Dict, Any, Union, Tuple
from PIL import Image

from app.core.config import call_gemini_with_retry
from app.core.config import GEMINI_MODEL_PRIMARY
from services.ai.skills.registry import registry
from services.ai.skills.base import get_provider_and_model, resolve_api_key
from services.ai.skills.utils import robust_parse_json
from services.ai.orchestrator import AIOrchestrator, AIErrorCode
from services.image.utils.panel_box_utils import PanelBounds
from core.cache import stitched_cache, edit_history
from services.audio import generate_panel_audio
import services.image.utils.image_utils as img_utils

logger = logging.getLogger("sonikoma.services.ai.facade")

VALID_MOTIONS = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down']


def estimate_duration_from_speech(speech: str) -> float:
    if not speech or not speech.strip():
        return 0.0
    words = len(speech.strip().split())
    estimated = (words / 2.2) + 0.8
    return round(estimated, 1)


class StoryMemoryTracker:
    """Maintains cognitive narrative continuity, character rosters, and dialogue turns across comic panels."""
    def __init__(self, initial_state: Optional[Union[str, Dict[str, Any]]] = None):
        if isinstance(initial_state, str):
            self.current_scene = initial_state[:300]
            self.characters: Dict[str, Dict[str, Any]] = {}
            self.dialogue_history: List[Dict[str, Any]] = []
            self.scene_history: List[Dict[str, Any]] = []
        elif isinstance(initial_state, dict):
            self.current_scene = str(initial_state.get("current_scene", ""))[:300]
            self.characters = initial_state.get("characters", {}) if isinstance(initial_state.get("characters"), dict) else {}
            self.dialogue_history = list(initial_state.get("dialogue_history", [])) if isinstance(initial_state.get("dialogue_history"), list) else []
            self.scene_history = list(initial_state.get("scene_history", [])) if isinstance(initial_state.get("scene_history"), list) else []
        else:
            self.current_scene = ""
            self.characters = {}
            self.dialogue_history = []
            self.scene_history = []

    def format_for_prompt(self) -> str:
        parts = []
        if self.scene_history:
            past_scenes = [s.get("scene", "") for s in self.scene_history[-2:] if s.get("scene")]
            if past_scenes:
                parts.append(f"Preceding Story Arc: {'; '.join(past_scenes)}")
        if self.current_scene:
            parts.append(f"Ongoing Scene: {self.current_scene}")
        if self.characters:
            char_list = [f"{name} ({info.get('gender', 'unknown')})" for name, info in list(self.characters.items())[:8]]
            parts.append(f"Active Characters: {', '.join(char_list)}")
        if self.dialogue_history:
            last = self.dialogue_history[-1]
            speaker = f"{last.get('speaker')}: " if last.get('speaker') else ""
            emotion = f"[{last.get('emotion')}] " if last.get('emotion') and last.get('emotion') != 'neutral' else ""
            parts.append(f"Preceding Dialogue: {speaker}{emotion}\"{last.get('text', '')}\"")
        return " | ".join(parts)

    def update_from_analysis(self, analysis: Dict[str, Any], panel_index: int = 0):
        # 1. Handle Scene Transitions
        if analysis.get("is_scene_transition"):
            if self.current_scene:
                self.scene_history.append({"scene": self.current_scene, "end_panel": max(0, panel_index - 1)})
            self.dialogue_history.clear()
            scene = analysis.get("scene_context") or analysis.get("visual_description")
            self.current_scene = scene[:250] if scene else "New Scene"
        else:
            scene = analysis.get("scene_context") or analysis.get("visual_description")
            if scene:
                self.current_scene = scene[:250]

        # 2. Update Character Roster
        speaker = (analysis.get("speaker_name") or "").strip()
        gender = (analysis.get("speaker_gender") or "neutral").strip().lower()
        if gender not in ("male", "female", "child", "neutral"):
            gender = "neutral"

        if speaker and speaker.lower() not in ("narrator", "none", "unknown", "off-screen voice", ""):
            default_voice = "en-US-JennyNeural" if gender == "female" else ("en-US-AnaNeural" if gender == "child" else "en-US-GuyNeural")
            if speaker not in self.characters:
                self.characters[speaker] = {
                    "gender": gender,
                    "voice": default_voice,
                    "is_user_locked": False,
                    "panels_seen": [panel_index]
                }
            else:
                if not self.characters[speaker].get("is_user_locked"):
                    if gender != "neutral":
                        self.characters[speaker]["gender"] = gender
                if panel_index not in self.characters[speaker].get("panels_seen", []):
                    self.characters[speaker].setdefault("panels_seen", []).append(panel_index)

        # 3. Sliding Working Dialogue Buffer (keep last 4 turns)
        speech = (analysis.get("speech_text") or "").strip()
        emotion = (analysis.get("emotion") or "neutral").strip()
        if speech:
            self.dialogue_history.append({
                "panel_index": panel_index,
                "speaker": speaker,
                "gender": gender,
                "emotion": emotion,
                "text": speech[:300]
            })
            if len(self.dialogue_history) > 4:
                self.dialogue_history.pop(0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "current_scene": self.current_scene,
            "characters": self.characters,
            "dialogue_history": self.dialogue_history,
            "scene_history": self.scene_history,
            "last_updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }


def validate_analysis(raw: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raw = {}
    speech = raw.get("speech_text", "")
    sfx = raw.get("sfx", "")
    vis = raw.get("visual_description", "")
    motion = raw.get("motion_type", "")
    narrative = raw.get("narrative") or raw.get("narrativeText") or ""
    speaker_name = (raw.get("speaker_name") or "").strip()[:100]
    speaker_gender = (raw.get("speaker_gender") or "neutral").strip().lower()
    if speaker_gender not in ("male", "female", "child", "neutral"):
        speaker_gender = "neutral"
    emotion = (raw.get("emotion") or "neutral").strip().lower()
    if emotion not in ("neutral", "tender", "whisper", "shouting", "panicked"):
        emotion = "neutral"
    scene_context = (raw.get("scene_context") or "").strip()[:400]
    is_scene_transition = bool(raw.get("is_scene_transition", False))
    is_internal_thought = bool(raw.get("is_internal_thought", False))
    dialogue_turns = raw.get("dialogue_turns", [])
    if not isinstance(dialogue_turns, list):
        dialogue_turns = []

    raw_duration = raw.get("duration")
    try:
        suggested_duration = float(raw_duration) if raw_duration is not None else 0.0
    except (ValueError, TypeError):
        suggested_duration = 0.0

    if suggested_duration > 0:
        suggested_duration = max(2.0, min(45.0, suggested_duration))

    speech_val = speech.strip()[:800] if isinstance(speech, str) and speech.strip() else ""
    speech_duration = estimate_duration_from_speech(speech_val)
    if suggested_duration > 0 or speech_duration > 0:
        final_duration = max(suggested_duration, speech_duration)
        final_duration = max(2.0, min(45.0, round(final_duration, 1)))
    else:
        final_duration = 0.0

    narrative_val = narrative.strip()[:1000] if isinstance(narrative, str) and narrative.strip() else ""

    return {
        "speech_text": speech_val,
        "dialogue_turns": dialogue_turns,
        "speaker_name": speaker_name,
        "speaker_gender": speaker_gender,
        "emotion": emotion,
        "scene_context": scene_context,
        "is_scene_transition": is_scene_transition,
        "is_internal_thought": is_internal_thought,
        "sfx": sfx.strip()[:50] if isinstance(sfx, str) and sfx.strip() else "",
        "duration": final_duration,
        "motion_type": motion if motion in VALID_MOTIONS else "",
        "visual_description": vis.strip()[:400] if isinstance(vis, str) and vis.strip() else "",
        "narrative": narrative_val,
        "narrativeText": narrative_val,
    }


async def facade_list_models(provider: str, api_key: Optional[str]) -> Dict[str, Any]:
    """Exposes available models for the given provider from user key or server .env."""
    if not api_key:
        if provider == "gemini":
            api_key = os.getenv("GEMINI_API_KEY")
        elif provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
        elif provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")
        elif provider == "huggingface":
            api_key = os.getenv("HUGGINGFACE_API_KEY")

    if not api_key:
        return {"success": False, "error": f"No API key was provided for {provider} (check website vault or server .env)."}

    if provider == "gemini":
        from google import genai
        result_list = []
        try:
            client = genai.Client(api_key=api_key)
            models = list(client.models.list())
            for m in models:
                raw_name = m.name or ""
                clean_name = raw_name.replace("models/", "")
                lower_name = clean_name.lower()

                # Determine category
                if "imagen" in lower_name or "banana" in lower_name or "veo" in lower_name:
                    category = "Multi-modal generative models"
                elif "tts" in lower_name or "audio" in lower_name or "omni" in lower_name:
                    category = "Multi-modal generative models"
                elif "embedding" in lower_name:
                    category = "Other models"
                elif "robotics" in lower_name or "gemma" in lower_name or "grounding" in lower_name:
                    category = "Other models"
                elif "live" in lower_name:
                    category = "Live API"
                else:
                    category = "Text-out models"

                # Define default RPM / TPM / RPD quotas matching Google AI Studio tier specifications
                if "3.6-flash" in lower_name or "3.6" in lower_name:
                    rpm, tpm, rpd = "5 / 5", "250K", "20 / 20"
                elif "3.5-flash" in lower_name:
                    rpm, tpm, rpd = "5 / 5", "250K", "20 / 20"
                elif "2.5-flash" in lower_name:
                    rpm, tpm, rpd = "5 / 5", "250K", "20 / 20"
                elif "1.5-pro" in lower_name or "2.5-pro" in lower_name or "3.1-pro" in lower_name:
                    rpm, tpm, rpd = "2 / 5", "1M", "50 / 50"
                elif "imagen" in lower_name:
                    rpm, tpm, rpd = "0 / 25", "-", "25 / 25"
                elif "embedding" in lower_name:
                    rpm, tpm, rpd = "100 / 100", "30K", "1K / 1K"
                else:
                    rpm, tpm, rpd = "5 / 5", "250K", "20 / 20"

                result_list.append({
                    "name": clean_name,
                    "fullName": raw_name,
                    "displayName": m.display_name or clean_name,
                    "description": m.description or "",
                    "category": category,
                    "rpm": rpm,
                    "tpm": tpm,
                    "rpd": rpd,
                    "inputTokenLimit": getattr(m, "input_token_limit", None),
                    "outputTokenLimit": getattr(m, "output_token_limit", None),
                    "supportedActions": getattr(m, "supported_actions", [])
                })
        except Exception as exc:
            logger.error(f"Failed to fetch dynamic Gemini models: {exc}")
            return {"success": False, "error": f"Failed to fetch Gemini models: {str(exc)}"}

        return {"success": True, "provider": "gemini", "total": len(result_list), "models": result_list}


    elif provider == "openai":
        import requests
        from requests.exceptions import RequestException

        headers = {"Authorization": f"Bearer {api_key}"}
        try:
            models_res = requests.get("https://api.openai.com/v1/models", headers=headers, timeout=10)
        except RequestException as exc:
            logger.error(f"Failed to fetch OpenAI models: {exc}")
            return {"success": False, "error": f"Failed to connect to OpenAI: {exc}", "status_code": 503}

        if models_res.status_code != 200:
            return {"success": False, "error": f"OpenAI Authorization Failed: {models_res.text}", "status_code": 400}
        models = models_res.json().get("data", [])
        result_list = []
        for m in models:
            model_id = m.get("id", "")
            result_list.append({
                "name": model_id,
                "fullName": model_id,
                "displayName": model_id,
                "description": f"OpenAI model owned by {m.get('owned_by', 'N/A')}",
                "inputTokenLimit": None,
                "outputTokenLimit": None,
                "supportedActions": ["chat"] if "gpt" in model_id or "o1" in model_id else []
            })
        return {"success": True, "provider": "openai", "total": len(result_list), "models": result_list}

    elif provider == "anthropic":
        import requests
        from requests.exceptions import RequestException

        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
        try:
            models_res = requests.get("https://api.anthropic.com/v1/models", headers=headers, timeout=10)
        except RequestException as exc:
            logger.error(f"Failed to fetch Anthropic models: {exc}")
            return {"success": False, "error": f"Failed to connect to Anthropic: {exc}", "status_code": 503}

        if models_res.status_code != 200:
            return {"success": False, "error": f"Anthropic Authorization Failed: {models_res.text}", "status_code": 400}
        models = models_res.json().get("data", [])
        result_list = []
        for m in models:
            model_id = m.get("id", "")
            result_list.append({
                "name": model_id,
                "fullName": model_id,
                "displayName": m.get("display_name") or model_id,
                "description": f"Anthropic model created at {m.get('created_at', 'N/A')}",
                "inputTokenLimit": None,
                "outputTokenLimit": None,
                "supportedActions": ["chat"]
            })
        return {"success": True, "provider": "anthropic", "total": len(result_list), "models": result_list}

    elif provider == "huggingface":
        import requests
        from requests.exceptions import RequestException

        headers = {"Authorization": f"Bearer {api_key}"}
        try:
            auth_res = requests.get("https://huggingface.co/api/whoami-v2", headers=headers, timeout=10)
        except RequestException as exc:
            logger.error(f"Failed to authenticate with Hugging Face Hub: {exc}")
            return {"success": False, "error": f"Failed to connect to Hugging Face: {exc}", "status_code": 503}

        if auth_res.status_code != 200:
            return {"success": False, "error": f"Hugging Face Authorization Failed: {auth_res.text}", "status_code": 400}

        params = {"limit": 150, "sort": "downloads", "direction": -1}
        try:
            models_res = requests.get("https://huggingface.co/api/models", params=params, headers=headers, timeout=10)
        except RequestException as exc:
            logger.error(f"Failed to fetch Hugging Face models: {exc}")
            return {"success": False, "error": f"Failed to connect to Hugging Face: {exc}", "status_code": 503}

        if models_res.status_code != 200:
            return {"success": False, "error": f"Failed to fetch models from Hugging Face Hub: {models_res.text}", "status_code": 400}

        models = models_res.json()
        result_list = []
        for m in models:
            pipeline_tag = m.get("pipeline_tag")
            if pipeline_tag not in ("text-generation", "text2text-generation", "conversational"):
                continue
            result_list.append({
                "name": m.get("id", ""),
                "fullName": m.get("id", ""),
                "displayName": m.get("id", ""),
                "description": f"Hugging Face repository model. Library: {m.get('library_name','N/A')}",
                "inputTokenLimit": None,
                "outputTokenLimit": None,
                "supportedActions": [pipeline_tag] if pipeline_tag else []
            })
        return {"success": True, "provider": "huggingface", "total": len(result_list), "models": result_list}

    elif provider in ("groq", "deepseek", "elevenlabs", "deepl", "edgetts", "stablediffusion", "whisper"):
        catalog = ModelRegistry.get_catalog_for_providers([provider])
        result_list = []
        for m in catalog:
            result_list.append({
                "name": m["id"],
                "fullName": m.get("name", m["id"]),
                "displayName": m.get("name", m["id"]),
                "description": m.get("category", "") + (" - " + ", ".join(m.get("recommended_for", [])) if m.get("recommended_for") else ""),
                "inputTokenLimit": m.get("context_window"),
                "outputTokenLimit": m.get("max_output_tokens"),
                "supportedActions": m.get("capabilities", [])
            })
        return {"success": True, "provider": provider, "total": len(result_list), "models": result_list}

async def _synthesize_tts_to_cache(text: str, voice: str, target_dur: float) -> Tuple[Optional[str], Optional[float]]:
    """Synthesizes text using Edge TTS and saves to stitched_cache, returning (cached_url, actual_duration)."""
    # Safety cap: truncate extremely long text to prevent native memory crashes in pydub
    MAX_TTS_CHARS = 500
    if len(text) > MAX_TTS_CHARS:
        truncated = text[:MAX_TTS_CHARS]
        # Try to cut at the last sentence boundary for natural speech
        last_period = max(truncated.rfind(". "), truncated.rfind("! "), truncated.rfind("? "))
        if last_period > MAX_TTS_CHARS // 2:
            truncated = truncated[:last_period + 1]
        text = truncated
        logger.debug(f"[_synthesize_tts_to_cache] Text truncated to {len(text)} chars for TTS safety")
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
        temp_audio_path = tmp_audio.name
    try:
        try:
            _, actual_dur = await generate_panel_audio(
                dialogue_list=[text],
                target_duration=target_dur,
                output_path=temp_audio_path,
                voice=voice,
                force_duration=False
            )
        except Exception as v_err:
            logger.warning(f"[_synthesize_tts_to_cache] Voice {voice} failed: {v_err}. Retrying with en-US-GuyNeural.")
            _, actual_dur = await generate_panel_audio(
                dialogue_list=[text],
                target_duration=target_dur,
                output_path=temp_audio_path,
                voice="en-US-GuyNeural",
                force_duration=False
            )
        if os.path.exists(temp_audio_path) and os.path.getsize(temp_audio_path) > 0:
            with open(temp_audio_path, "rb") as f:
                audio_bytes = f.read()
            unique_id = f"audio_{uuid.uuid4().hex[:8]}" if 'uuid' in globals() else f"audio_{os.urandom(4).hex()}"
            stitched_cache.set(unique_id, {"data": audio_bytes, "content_type": "audio/mpeg"})
            return f"/api/v1/images/cached/{unique_id}", actual_dur
    except Exception as exc:
        logger.warning(f"[_synthesize_tts_to_cache] TTS failed: {exc}")
    finally:
        if os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except Exception:
                pass
    return None, None


async def facade_analyze_image(
    url: str,
    model: Optional[str] = None,
    voice: Optional[str] = None,
    narration_style: Optional[str] = None,
    user_keys: Optional[Dict[str, str]] = None,
    story_context: Optional[Union[str, Dict[str, Any]]] = None,
    story_memory: Optional[Dict[str, Any]] = None,
    panel_index: int = 0,
    generate_audio: bool = True,
    generate_dialogue_audio: Optional[bool] = None,
    generate_narrative_audio: Optional[bool] = None,
) -> Dict[str, Any]:
    """Generates narration script, SFX, voice audio, and cognitive memory continuity for a single panel."""
    start_time = time.time()
    try:
        resolved = await img_utils.resolve_image_to_buffer(url)
        img_buffer = resolved["data"]
    except Exception as exc:
        logger.warning(f"[facade_analyze_image] Failed to download or resolve image: {exc}")
        mem_obj = StoryMemoryTracker(story_memory or story_context)
        return {
            "success": False,
            "error": f"Failed to resolve image buffer: {str(exc)}",
            "analysis": {},
            "audio_url": None,
            "story_memory": mem_obj.to_dict()
        }

    memory_tracker = StoryMemoryTracker(story_memory or story_context)
    story_context_section = memory_tracker.format_for_prompt()

    brightness = None
    try:
        brightness = img_utils.compute_brightness(img_buffer)
    except Exception:
        pass

    target_model = model or GEMINI_MODEL_PRIMARY
    tone_hint = ""
    if brightness is not None:
        if brightness < 80:
            tone_hint = " The panel appears dark or moody — favour dramatic or tense SFX."
        elif brightness > 200:
            tone_hint = " The panel appears bright and vibrant — favour action or triumphant SFX."

    style_val = (narration_style or "long").lower()
    if style_val == "short":
        narrative_length_hint = "35-55 words, punchy, impactful, and dramatic for quick subtitles or shorts."
    elif style_val == "medium":
        narrative_length_hint = "65-95 words, vivid, balanced, and immersive for standard manga episodes."
    else:
        narrative_length_hint = "85-150 words, rich, cinematic, and deeply engaging YouTube manga/manhwa recap storytelling that brings the atmosphere, character psychology, and high stakes fully to life."

    skill = registry.get("panel_analysis")
    formatted_context = f"STORY CONTEXT & PRECEDING MEMORY:\n{story_context_section}\n" if story_context_section else ""
    ocr_text = ""
    try:
        raw_text = await skill.execute(
            model=model,
            image_bytes=img_buffer,
            user_keys=user_keys or {},
            tone_hint=tone_hint,
            narrative_length_hint=narrative_length_hint,
            story_context_section=formatted_context
        )
        parsed_json = json.loads(raw_text) if isinstance(raw_text, str) else raw_text
        analysis = validate_analysis(parsed_json)
    except Exception as exc:
        logger.warning(f"[facade_analyze_image] Panel analysis vision execution failed: {exc}. Falling back to OCR.")
        ocr_text = ""
        try:
            from services.image.ocr.ocr_engine import extract_dialogue_from_panel
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_ocr:
                tmp_ocr.write(img_buffer)
                tmp_ocr_path = tmp_ocr.name
            ocr_dialogue = await extract_dialogue_from_panel(tmp_ocr_path, langs=['en'])
            if os.path.exists(tmp_ocr_path):
                os.remove(tmp_ocr_path)
            if ocr_dialogue:
                ocr_text = " ".join([t.strip() for t in ocr_dialogue if t.strip()]).strip()
        except Exception:
            pass
        analysis = validate_analysis({
            "speech_text": ocr_text,
            "visual_description": "Comic panel scene (vision unavailable).",
            "motion_type": "",
            "duration": None,
            "sfx": "",
            "narrative": "The scene unfolds as the characters confront the situation before them with quiet tension.",
            "scene_context": memory_tracker.current_scene or ""
        })

    # Format dialogue turns separated onto distinct lines if multiple turns exist
    turns = analysis.get("dialogue_turns", [])
    if isinstance(turns, list) and len(turns) > 1:
        separated_lines = []
        for t in turns:
            t_text = (t.get("text") or "").strip()
            # Strip any speaker prefixes like "Father:" or "Mother:"
            t_text = re.sub(r'^(Father|Mother|Child|Man|Woman|Character|\w+):\s*', '', t_text, flags=re.IGNORECASE).strip().strip('"').strip("'").strip()
            if t_text:
                separated_lines.append(f'"{t_text}"')
        if separated_lines:
            analysis["speech_text"] = "\n\n".join(separated_lines)
    elif analysis.get("speech_text"):
        # Ensure any raw speech_text lines don't have unwanted "Speaker: " prefixes
        cleaned_lines = []
        for line in analysis["speech_text"].split("\n"):
            cleaned_line = re.sub(r'^(Father|Mother|Child|Man|Woman|Character|\w+):\s*', '', line.strip(), flags=re.IGNORECASE).strip().strip('"').strip("'").strip()
            if cleaned_line:
                cleaned_lines.append(f'"{cleaned_line}"')
        if cleaned_lines:
            analysis["speech_text"] = "\n\n".join(cleaned_lines)

    # Guard against title logos / credits / episode headers contaminating speech_text
    is_cover_or_credit = False
    ocr_lower = ocr_text.lower()
    for marker in ("episode", "spin-off", "story-art", "chapter", "vol.", "d jun", "credits", "author", "the past"):
        if marker in ocr_lower:
            is_cover_or_credit = True
            break

    # If Gemini didn't return speech_text but OCR found visible dialogue, use OCR as fallback
    if not analysis.get("speech_text") and ocr_text and not is_cover_or_credit:
        analysis["speech_text"] = ocr_text

    # Guard against dialogue/narrative duplication: ensure narrative NEVER mirrors speech_text
    curr_speech = (analysis.get("speech_text") or "").strip()
    curr_narrative = (analysis.get("narrative") or "").strip()

    def _normalize_txt(s: str) -> str:
        return re.sub(r'[\W_]+', '', s.lower())

    if (curr_speech and curr_narrative and _normalize_txt(curr_speech) == _normalize_txt(curr_narrative)) or not curr_narrative:
        logger.info("[facade_analyze_image] Narrative was identical to dialogue or empty. Synthesizing distinct narrative recap.")
        scene_ctx = (analysis.get("scene_context") or memory_tracker.current_scene or "").rstrip('.')
        vis_desc = (analysis.get("visual_description") or "").rstrip('.')

        narrative_parts = []
        if scene_ctx:
            narrative_parts.append(f"In this moment, {scene_ctx}.")
        if curr_speech:
            narrative_parts.append("A tender yet crucial exchange takes place between them, each spoken word carrying the weight of their unspoken hopes.")
        elif vis_desc:
            narrative_parts.append(f"{vis_desc}, capturing a poignant stillness as their story moves forward.")
        else:
            narrative_parts.append("An unspoken tension settles over the space, marking a quiet turning point in their ongoing journey.")

        analysis["narrative"] = " ".join(narrative_parts)

    # Update working memory state
    memory_tracker.update_from_analysis(analysis, panel_index)

    # Dynamic Voice Resolution
    speaker_name = (analysis.get("speaker_name") or "").strip()
    speaker_gender = (analysis.get("speaker_gender") or "neutral").strip().lower()

    if voice and voice.strip() and voice.strip().lower() not in ("undefined", "null", "default"):
        target_voice = voice
    elif speaker_name and speaker_name in memory_tracker.characters and memory_tracker.characters[speaker_name].get("voice"):
        target_voice = memory_tracker.characters[speaker_name]["voice"]
    elif speaker_gender == "female":
        target_voice = "en-US-JennyNeural"
    elif speaker_gender == "child":
        target_voice = "en-US-AnaNeural"
    else:
        target_voice = "en-US-GuyNeural"

    audio_url = None
    narrative_audio_url = None

    do_dialogue_tts = generate_dialogue_audio if generate_dialogue_audio is not None else False
    do_narrative_tts = generate_narrative_audio if generate_narrative_audio is not None else (generate_audio if not do_dialogue_tts else True)

    speech_text = (analysis.get("speech_text") or "").strip()
    narrative_text = (analysis.get("narrative") or analysis.get("narrativeText") or "").strip()

    # 1. Synthesize character dialogue audio if enabled
    if do_dialogue_tts and speech_text:
        audio_url, actual_dur = await _synthesize_tts_to_cache(speech_text, target_voice, analysis.get("duration", 4.0))
        if actual_dur:
            analysis["duration"] = actual_dur

    # 2. Synthesize story recap narrative audio if enabled
    if do_narrative_tts and narrative_text:
        narr_voice = voice or "en-US-GuyNeural"
        narrative_audio_url, narr_dur = await _synthesize_tts_to_cache(narrative_text, narr_voice, analysis.get("duration", 4.0))
        if narr_dur and not audio_url:
            analysis["duration"] = narr_dur

    # Fallback duration estimation if no TTS was generated
    if not analysis.get("duration") or analysis["duration"] <= 0:
        ref_text = narrative_text if do_narrative_tts else speech_text
        if ref_text:
            analysis["duration"] = estimate_duration_from_speech(ref_text)

    elapsed = int((time.time() - start_time) * 1000)
    meta = getattr(skill, "last_execution_meta", {}) or {}
    model_used = meta.get("model") or model or "gemini-2.5-flash"
    narrative_val = analysis.get("narrative") or ""

    return {
        "success": True,
        "analysis": analysis,
        "narrative": narrative_val,
        "narrativeText": narrative_val,
        "audio_url": audio_url,
        "narrative_audio_url": narrative_audio_url,
        "dialogue_turns": analysis.get("dialogue_turns", []),
        "speaker_name": analysis.get("speaker_name"),
        "speaker_gender": analysis.get("speaker_gender"),
        "emotion": analysis.get("emotion"),
        "scene_context": analysis.get("scene_context"),
        "story_memory": memory_tracker.to_dict(),
        "source": meta.get("provider", "gemini"),
        "model": model_used,
        "latencyMs": meta.get("latency_ms", elapsed),
        "latency_ms": meta.get("latency_ms", elapsed),
        "inputTokens": getattr(skill, "last_input_tokens", 0),
        "outputTokens": getattr(skill, "last_output_tokens", 0)
    }


async def _fallback_individual_batch(
    panels: List[Any],
    model: Optional[str],
    voice: Optional[str],
    narration_style: Optional[str],
    user_keys: Optional[Dict[str, str]],
    story_context: Optional[Union[str, Dict[str, Any]]],
    story_memory: Optional[Dict[str, Any]],
    start_index: int,
    generate_audio: bool,
    generate_dialogue_audio: Optional[bool] = None,
    generate_narrative_audio: Optional[bool] = None,
) -> Dict[str, Any]:
    """Helper to concurrently process panels with facade_analyze_image if batch execution fails."""
    rolling_memory = story_memory or ({"current_scene": story_context} if story_context else None)
    used_model = model or "gemini-2.5-flash"

    async def _analyze_single(i, p):
        p_id = getattr(p, "id", None) if not isinstance(p, dict) else p.get("id")
        p_url = getattr(p, "url", None) if not isinstance(p, dict) else p.get("url")
        p_voice = getattr(p, "voice", None) or voice
        p_context = getattr(p, "story_context", None)
        try:
            res = await facade_analyze_image(
                url=p_url,
                model=model,
                voice=p_voice,
                narration_style=narration_style,
                user_keys=user_keys,
                story_context=p_context,
                story_memory=rolling_memory,
                panel_index=start_index + i,
                generate_audio=generate_audio,
                generate_dialogue_audio=generate_dialogue_audio,
                generate_narrative_audio=generate_narrative_audio,
            )
            return {"id": p_id, "url": p_url, **res}
        except Exception as exc:
            return {
                "id": p_id,
                "url": p_url,
                "success": False,
                "error": str(exc),
            }

    results = await asyncio.gather(*(_analyze_single(i, p) for i, p in enumerate(panels)))
    results = list(results)

    for r in results:
        if r.get("story_memory"):
            rolling_memory = r["story_memory"]
        if r.get("model"):
            used_model = r["model"]

    return {
        "success": any(r.get("success") for r in results),
        "results": results,
        "story_memory": rolling_memory,
        "model": used_model
    }


async def facade_analyze_batch(
    panels: List[Any],
    model: Optional[str] = None,
    voice: Optional[str] = None,
    narration_style: Optional[str] = None,
    user_keys: Optional[Dict[str, str]] = None,
    story_context: Optional[Union[str, Dict[str, Any]]] = None,
    story_memory: Optional[Dict[str, Any]] = None,
    start_index: int = 0,
    generate_audio: bool = False,
    generate_dialogue_audio: Optional[bool] = None,
    generate_narrative_audio: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    Analyzes storyboard panels in parallel batch AI vision calls.
    Divides large sequences into optimal chunks of up to 6 panels and processes
    all chunks concurrently via asyncio.gather for near-instant execution.
    Maintains memory continuity and formats results to match storyboard panel schema.
    """
    start_time = time.time()
    memory_tracker = StoryMemoryTracker(story_memory or story_context)
    story_context_section = memory_tracker.format_for_prompt()

    # 1. Concurrently resolve all image buffers
    async def _resolve_one(p):
        p_url = getattr(p, "url", None) if not isinstance(p, dict) else p.get("url")
        try:
            res = await img_utils.resolve_image_to_buffer(p_url)
            return res["data"]
        except Exception as exc:
            logger.warning(f"[facade_analyze_batch] Failed to resolve image buffer for {p_url}: {exc}")
            return None

    img_buffers = await asyncio.gather(*(_resolve_one(p) for p in panels))
    img_buffers = list(img_buffers)

    # 1x1 blank fallback if any specific image buffer failed to load
    BLANK_JPEG = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'
    img_buffers = [b if b else BLANK_JPEG for b in img_buffers]

    style_val = (narration_style or "long").lower()
    if style_val == "short":
        narrative_length_hint = "35-50 words, punchy and dramatic."
    elif style_val == "medium":
        narrative_length_hint = "50-75 words, vivid and immersive."
    else:
        narrative_length_hint = "65-100 words, rich, cinematic YouTube manhwa recap storytelling."

    skill = registry.get("batch_panel_analysis")
    formatted_context = f"STORY CONTEXT & PRECEDING MEMORY:\n{story_context_section}\n" if story_context_section else ""

    # 2. Execute full sequence in a single unified AI vision call (calls AI API once)
    tone_hint = ""
    try:
        brightness = img_utils.compute_brightness(img_buffers[0])
        if brightness is not None:
            if brightness < 80:
                tone_hint = " The sequence appears dark or moody — favour dramatic or tense SFX."
            elif brightness > 200:
                tone_hint = " The sequence appears bright and vibrant — favour action or triumphant SFX."
    except Exception:
        pass

    batch_items = []
    overall_scene_summary = ""
    single_call_success = False

    logger.info(f"[AI Analysis] Executing single unified batch vision analysis for {len(panels)} panels (Model: {model or 'default'})...")
    try:
        raw_text = await skill.execute(
            model=model,
            image_bytes=img_buffers,
            user_keys=user_keys or {},
            panel_count=len(panels),
            tone_hint=tone_hint,
            narrative_length_hint=narrative_length_hint,
            story_context_section=formatted_context
        )
        parsed_json = robust_parse_json(raw_text) if isinstance(raw_text, str) else raw_text
        if isinstance(parsed_json, dict) and "panels" in parsed_json and len(parsed_json.get("panels", [])) > 0:
            raw_items = parsed_json.get("panels", [])
            items_by_idx = {it.get("panel_index"): it for it in raw_items if isinstance(it, dict) and isinstance(it.get("panel_index"), int)}
            for idx in range(len(panels)):
                item = items_by_idx.get(idx + 1) or (raw_items[idx] if idx < len(raw_items) else {})
                if not isinstance(item, dict):
                    item = {}
                batch_items.append(item)
            overall_scene_summary = parsed_json.get("overall_scene_summary", "")

            if len(batch_items) == len(panels):
                single_call_success = True
                logger.info(f"[AI Analysis] Single unified batch analysis succeeded for all {len(panels)} panels in 1 API call.")
            else:
                logger.warning(f"[AI Analysis] Single batch returned {len(batch_items)} items for {len(panels)} panels.")
    except Exception as single_err:
        logger.warning(f"[AI Analysis] Single batch vision execution failed: {single_err}.")

    if not single_call_success:
        if batch_items and len(batch_items) > 0:
            logger.info(f"[AI Analysis] Assembling {len(batch_items)} parsed panels and padding remaining to {len(panels)}.")
            while len(batch_items) < len(panels):
                batch_items.append({})
        else:
            logger.warning(f"[AI Analysis] Single batch vision returned no items; initializing default structures for {len(panels)} panels (NO 1-by-1 API fallback).")
            batch_items = [{} for _ in range(len(panels))]

    # 3. Assemble results and update rolling memory
    meta = getattr(skill, "last_execution_meta", {}) or {}
    model_used = meta.get("model") or model or "gemini-2.5-flash"
    elapsed = int((time.time() - start_time) * 1000)

    results = []
    for i, p in enumerate(panels):
        p_id = getattr(p, "id", None) if not isinstance(p, dict) else p.get("id")
        p_url = getattr(p, "url", None) if not isinstance(p, dict) else p.get("url")
        raw_analysis = batch_items[i] if i < len(batch_items) else {}
        analysis = validate_analysis(raw_analysis)

        # Format dialogue turns separated onto distinct lines if multiple turns exist
        turns = analysis.get("dialogue_turns", [])
        if isinstance(turns, list) and len(turns) > 1:
            separated_lines = []
            for t in turns:
                txt = (t.get("text") or "").strip()
                if txt:
                    separated_lines.append(txt)
            if separated_lines:
                analysis["speech_text"] = "\n\n".join(separated_lines)

        global_panel_idx = start_index + i
        memory_tracker.update_from_analysis(analysis, global_panel_idx)

        # Granular audio generation
        audio_url = None
        narrative_audio_url = None

        speech_text = (analysis.get("speech_text") or "").strip()
        narrative_text = (analysis.get("narrative") or analysis.get("narrativeText") or "").strip()

        do_dialogue_tts = generate_dialogue_audio if generate_dialogue_audio is not None else False
        do_narrative_tts = generate_narrative_audio if generate_narrative_audio is not None else (generate_audio if not do_dialogue_tts else True)

        speaker_name = (analysis.get("speaker_name") or "").strip()
        speaker_gender = (analysis.get("speaker_gender") or "neutral").strip().lower()
        if voice and voice.strip() and voice.strip().lower() not in ("undefined", "null", "default"):
            target_voice = voice
        elif speaker_name and speaker_name in memory_tracker.characters and memory_tracker.characters[speaker_name].get("voice"):
            target_voice = memory_tracker.characters[speaker_name]["voice"]
        elif speaker_gender == "female":
            target_voice = "en-US-JennyNeural"
        elif speaker_gender == "child":
            target_voice = "en-US-AnaNeural"
        else:
            target_voice = "en-US-GuyNeural"

        if do_dialogue_tts and speech_text:
            audio_url, actual_dur = await _synthesize_tts_to_cache(speech_text, target_voice, analysis.get("duration", 4.0))
            if actual_dur:
                analysis["duration"] = actual_dur

        if do_narrative_tts and narrative_text:
            narr_voice = voice or "en-US-GuyNeural"
            narrative_audio_url, narr_dur = await _synthesize_tts_to_cache(narrative_text, narr_voice, analysis.get("duration", 4.0))
            if narr_dur and not audio_url:
                analysis["duration"] = narr_dur

        if not analysis.get("duration") or analysis["duration"] <= 0:
            ref_text = narrative_text if do_narrative_tts else speech_text
            if ref_text:
                analysis["duration"] = estimate_duration_from_speech(ref_text)

        narrative_val = analysis.get("narrative") or ""
        results.append({
            "id": p_id,
            "url": p_url,
            "success": True,
            "analysis": analysis,
            "narrative": narrative_val,
            "narrativeText": narrative_val,
            "audio_url": audio_url,
            "narrative_audio_url": narrative_audio_url,
            "dialogue_turns": analysis.get("dialogue_turns", []),
            "speaker_name": analysis.get("speaker_name"),
            "speaker_gender": analysis.get("speaker_gender"),
            "emotion": analysis.get("emotion"),
            "scene_context": analysis.get("scene_context"),
            "story_memory": memory_tracker.to_dict(),
            "source": meta.get("provider", "gemini"),
            "model": model_used,
            "latencyMs": elapsed,
            "latency_ms": elapsed,
        })

    return {
        "success": True,
        "results": results,
        "story_memory": memory_tracker.to_dict(),
        "model": model_used,
        "overall_scene_summary": overall_scene_summary
    }


def _crop_panels_server_side(img_buffer: bytes, panels: List[Dict[str, Any]], source_url: Optional[str] = None) -> None:
    """
    Crop each detected panel from the image buffer directly in memory (server-side).

    All panel coordinates are parsed into canonical immutable PanelBounds objects before crop execution.
    Bounds are validated against image dimensions with detailed diagnostic logging for any clamped bounds.
    """
    try:
        full_img = Image.open(io.BytesIO(img_buffer))
        if full_img.mode not in ("RGB", "RGBA"):
            full_img = full_img.convert("RGB")
        img_w, img_h = full_img.size
    except Exception as exc:
        logger.warning(f"[_crop_panels_server_side] Failed to open image buffer: {exc}")
        return

    ts = int(time.time() * 1000)
    for idx, panel in enumerate(panels):
        try:
            bounds: Optional[PanelBounds] = None

            if "x" in panel and "y" in panel and "width" in panel and "height" in panel:
                bounds = PanelBounds.from_pixels(
                    x=panel["x"], y=panel["y"], width=panel["width"], height=panel["height"], space="panel_dict"
                )
            elif "cropTop" in panel and "cropBottom" in panel and "cropLeft" in panel and "cropRight" in panel:
                c_top = float(panel.get("cropTop", 0.0))
                c_bot = float(panel.get("cropBottom", 0.0))
                c_left = float(panel.get("cropLeft", 0.0))
                c_right = float(panel.get("cropRight", 0.0))

                # Normalize whether cropBottom / cropRight are absolute Y2/X2 percentages vs bottom/right insets
                if c_bot > c_top and c_bot > 50.0:
                    bounds = PanelBounds.from_absolute_percent(c_top, c_bot, c_left, c_right, img_w, img_h, space="ai_absolute")
                else:
                    bounds = PanelBounds.from_inset_percent(c_top, c_bot, c_left, c_right, img_w, img_h, space="frontend_css")

            if bounds is None:
                continue

            # Non-silent validation & diagnostic clamping
            if not bounds.is_valid(img_w, img_h):
                clamped_bounds = bounds.clamp(img_w, img_h)
                logger.warning(
                    f"[_crop_panels_server_side] Panel #{idx+1} requested bounds "
                    f"(x={bounds.x}, y={bounds.y}, w={bounds.width}, h={bounds.height}) "
                    f"in space '{bounds.coordinate_space}' exceed canvas ({img_w}x{img_h}). "
                    f"Clamped to -> (x={clamped_bounds.x}, y={clamped_bounds.y}, w={clamped_bounds.width}, h={clamped_bounds.height})"
                )
                bounds = clamped_bounds

            if bounds.width < 5 or bounds.height < 5:
                continue

            cropped = full_img.crop((bounds.x, bounds.y, bounds.x2, bounds.y2))

            # Ensure RGB (no alpha) for JPEG output
            if cropped.mode == "RGBA":
                bg = Image.new("RGB", cropped.size, (255, 255, 255))
                bg.paste(cropped, mask=cropped.split()[3])
                cropped = bg
            elif cropped.mode != "RGB":
                cropped = cropped.convert("RGB")

            out = io.BytesIO()
            cropped.save(out, format="JPEG", quality=90)
            cropped_bytes = out.getvalue()

            import hashlib
            img_hash = hashlib.md5(source_url.encode()).hexdigest()[:8] if source_url else "img"
            panel_num = f"{idx + 1:02d}" if len(panels) >= 10 else f"{idx + 1}"
            geom_hash = hashlib.md5(f"{bounds.x}_{bounds.y}_{bounds.width}_{bounds.height}".encode()).hexdigest()[:8]
            cache_key = f"panel_crop_{img_hash}_{geom_hash}_{panel_num}"
            cached_url = f"/api/v1/images/cached/{cache_key}"
            stitched_cache.set(cache_key, {"data": cropped_bytes, "content_type": "image/jpeg"})
            if source_url:
                edit_history.set(cached_url, source_url)
            panel["croppedUrl"] = cached_url

        except Exception as exc:
            logger.warning(f"[_crop_panels_server_side] Error cropping panel {idx+1}: {exc}")
            # Leave croppedUrl unset; frontend will fall back to a separate edit call

    try:
        full_img.close()
    except Exception:
        pass


async def facade_smart_crop(
    url: str,
    aspect_ratio: Optional[str] = "free",
    model: Optional[str] = None,
    user_keys: Optional[Dict[str, str]] = None,
    strategy: Optional[str] = "local-cv",
    sensitivity: float = 30.0,
    background_color_mode: str = "auto",
    min_area_pct: float = 0.15,
    merge_threshold: int = 20,
    canny_low: int = 20,
    canny_high: int = 100,
    close_kernel_size: int = 15,
    min_height_px: int = 60,
    padding_px: int = 10,
    auto_split: bool = True,
    use_yolo: bool = True,
    guidance_instructions: Optional[str] = None,
    focus_mode: Optional[str] = None,
    job_id: Optional[str] = None
) -> Dict[str, Any]:
    """Uses LLM or local OpenCV panel detection based on strategy & configuration."""
    logger.info(f"[{job_id}] Starting facade_smart_crop for URL: {url[:60]}... (strategy={strategy})")

    resolved = await img_utils.resolve_image_to_buffer(url)
    img_buffer = resolved["data"]

    with Image.open(io.BytesIO(img_buffer)) as img:
        w_img, h_img = img.size

    aspect_ratio = aspect_ratio or "free"
    user_keys = user_keys or {}
    is_tall_strip = (h_img / max(1, w_img) > 1.7)

    # 1. Directly execute local OpenCV detection if user explicitly chose local-cv strategy
    if strategy == "local-cv":
        tmp_in_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                tmp_in.write(img_buffer)
                tmp_in_path = tmp_in.name

            from services.image.panel_detection.panel_detector import run_cv_detection
            cv_panels = run_cv_detection(
                image_path=tmp_in_path,
                sensitivity=sensitivity,
                bg_mode=background_color_mode,
                min_width_pct=min_area_pct,
                min_height_px=min_height_px,
                merge_threshold=merge_threshold,
                aspect_ratio_str=aspect_ratio,
                canny_low=canny_low,
                canny_high=canny_high,
                close_kernel_size=close_kernel_size,
                auto_split=auto_split,
                padding_px=padding_px,
                use_yolo=use_yolo,
                job_id=job_id
            )
            if len(cv_panels) > 0:
                # Crop all panels server-side in one pass (image[y:y+h, x:x+w])
                # so the frontend gets croppedUrl on each panel and skips extra API calls
                await asyncio.to_thread(_crop_panels_server_side, img_buffer, cv_panels, url)
                logger.info(f"[{job_id}] Successfully returned {len(cv_panels)} detected panels.")
                return {
                    "success": True,
                    "total_panels": len(cv_panels),
                    "imageWidth": w_img,
                    "imageHeight": h_img,
                    "panels": cv_panels,
                    "provider": "opencv_webtoon" if is_tall_strip else "opencv",
                    "isTallStrip": is_tall_strip,
                    "job_id": job_id,
                }
        finally:
            if tmp_in_path and os.path.exists(tmp_in_path):
                try:
                    os.remove(tmp_in_path)
                except Exception:
                    pass

    # 2. Otherwise execute AI detection with skill (with automatic provider/model fallback)
    candidates = AIOrchestrator.resolve_execution_candidates("smart_crop", requested_model=model)

    panels_raw = []
    last_exc = None
    successful_model = None

    for provider, m in candidates:
        try:
            skill = registry.get("smart_crop")
            raw_text = await skill.execute(
                model=m,
                image_bytes=img_buffer,
                user_keys=user_keys,
                guidance_instructions=guidance_instructions or ""
            )
            data = json.loads(raw_text)
            panels = data.get("panels", [])
            if panels:
                panels_raw = panels
                successful_model = m
                logger.info(f"[facade_smart_crop] Successfully detected panels using model '{m}' ({provider})")
                break
        except Exception as exc:
            last_exc = exc
            logger.warning(f"[facade_smart_crop] Model '{m}' ({provider}) failed: {exc}. Trying next fallback model...")
            continue

    if not panels_raw:
        logger.warning(f"[facade_smart_crop] AI detection returned 0 panels ({last_exc}). Falling back to local OpenCV panel detection...")
        tmp_in_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                tmp_in.write(img_buffer)
                tmp_in_path = tmp_in.name

            from services.image.panel_detection.panel_detector import run_cv_detection
            cv_panels = run_cv_detection(
                image_path=tmp_in_path,
                sensitivity=sensitivity,
                bg_mode=background_color_mode,
                min_width_pct=min_area_pct,
                min_height_px=min_height_px,
                merge_threshold=merge_threshold,
                aspect_ratio_str=aspect_ratio,
                canny_low=canny_low,
                canny_high=canny_high,
                close_kernel_size=close_kernel_size,
                auto_split=auto_split,
                padding_px=padding_px
            )
            # Crop all panels server-side before returning
            await asyncio.to_thread(_crop_panels_server_side, img_buffer, cv_panels, url)
            return {
                "success": True,
                "total_panels": len(cv_panels),
                "imageWidth": w_img,
                "imageHeight": h_img,
                "panels": cv_panels,
                "provider": "opencv_fallback",
                "isTallStrip": is_tall_strip,
            }
        except Exception as cv_exc:
            logger.error(f"[facade_smart_crop] Local OpenCV fallback also failed: {cv_exc}")
            raise RuntimeError(
                f"AI Smart Engine (Gemini) failed ({last_exc}). OpenCV fallback failed: {cv_exc}"
            ) from last_exc
        finally:
            if tmp_in_path and os.path.exists(tmp_in_path):
                try:
                    os.remove(tmp_in_path)
                except Exception:
                    pass


    final_panels = []
    safe_h = max(1, h_img)
    safe_w = max(1, w_img)

    for p in panels_raw:
        top_val = float(p.get("cropTop", 0.0))
        bot_val = float(p.get("cropBottom", 100.0))
        left_val = float(p.get("cropLeft", 0.0))
        right_val = float(p.get("cropRight", 100.0))

        if bot_val > top_val and bot_val > 50.0:
            pb = PanelBounds.from_absolute_percent(top_val, bot_val, left_val, right_val, safe_w, safe_h, space="ai_absolute")
        else:
            pb = PanelBounds.from_inset_percent(top_val, bot_val, left_val, right_val, safe_w, safe_h, space="ai_inset")

        pb = pb.clamp(safe_w, safe_h)

        from services.image.utils.panel_box_utils import adjust_to_aspect_ratio
        x, y, w_box, h_box = adjust_to_aspect_ratio(pb.x, pb.y, pb.width, pb.height, safe_w, safe_h, aspect_ratio)

        final_pb = PanelBounds.from_pixels(x, y, w_box, h_box, space="smart_crop_final").clamp(safe_w, safe_h)
        insets = final_pb.to_inset_percentages(safe_w, safe_h)

        final_panels.append({
            "x": int(final_pb.x),
            "y": int(final_pb.y),
            "width": int(final_pb.width),
            "height": int(final_pb.height),
            "cropTop": insets["cropTop"],
            "cropBottom": insets["cropBottom"],
            "cropLeft": insets["cropLeft"],
            "cropRight": insets["cropRight"],
            "area": int(final_pb.area)
        })

    # Sort strictly top-to-bottom (by pixel y), then left-to-right (by pixel x).
    # The old row-band approach (cropTop / 4.0) caused wrong ordering on tall webtoon strips.
    sorted_final_panels = sorted(
        final_panels,
        key=lambda b: (b.get("y", 0), b.get("x", 0))
    )
    # Crop all AI-detected panels server-side before returning
    await asyncio.to_thread(_crop_panels_server_side, img_buffer, sorted_final_panels, url)
    return {
        "success": True,
        "total_panels": len(sorted_final_panels),
        "imageWidth": w_img,
        "imageHeight": h_img,
        "panels": sorted_final_panels,
        "isTallStrip": is_tall_strip,
    }


async def facade_analyze_narrative_sequence(
    visual_descriptions: List[str],
    model: Optional[str],
    voice: Optional[str],
    user_keys: Dict[str, str]
) -> Dict[str, Any]:
    """Generates chronological narrative voiceover texts via AI Orchestrator, then synthesizes TTS audio for each."""
    from services.ai.skills.utils import extract_json

    scenes_prompt = "\n".join([f"Scene {i+1}: {desc}" for i, desc in enumerate(visual_descriptions)])
    system_instruction = (
        f"Generate a JSON array of strings containing exactly "
        f"{len(visual_descriptions)} narrative voiceover sentences for these visual scenes:\n{scenes_prompt}"
    )

    res = await AIOrchestrator.execute_capability(
        capability="storyboard_narrative",
        prompt=system_instruction,
        model=model,
        user_keys=user_keys,
    )
    raw_res = res.get("result", [])
    if isinstance(raw_res, list):
        narrative_texts = raw_res
    elif isinstance(raw_res, dict) and "panels" in raw_res:
        narrative_texts = [p.get("speech_text") or p.get("narrative", "") for p in raw_res["panels"]]
    elif isinstance(raw_res, dict) and "raw_output" in raw_res:
        try:
            narrative_texts = json.loads(extract_json(str(raw_res["raw_output"])))
        except Exception:
            narrative_texts = [str(raw_res["raw_output"])]
    elif isinstance(raw_res, str):
        try:
            narrative_texts = json.loads(extract_json(raw_res))
        except Exception:
            narrative_texts = [raw_res]
    else:
        narrative_texts = [str(v) for v in visual_descriptions]

    semaphore = asyncio.Semaphore(5)


    async def process_narrative_audio(idx: int, text: str):
        async with semaphore:
            audio_url = None
            try:
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
                    temp_audio_path = tmp_audio.name

                voice_code = voice or "en-US-GuyNeural"
                _, actual_dur = await generate_panel_audio(
                    dialogue_list=[text],
                    target_duration=0.0,
                    output_path=temp_audio_path,
                    voice=voice_code,
                    force_duration=False
                )

                if os.path.exists(temp_audio_path) and os.path.getsize(temp_audio_path) > 0:
                    with open(temp_audio_path, "rb") as f:
                        audio_bytes = f.read()
                    unique_audio_id = f"narrative_{uuid.uuid4().hex[:8]}"
                    stitched_cache.set(unique_audio_id, {"data": audio_bytes, "content_type": "audio/mpeg"})
                    audio_url = f"/api/v1/images/cached/{unique_audio_id}"

                if os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)
            except Exception as audio_err:
                logger.error(f"[Narrative Sequence] Audio gen failed for idx {idx}: {audio_err}")

            return {"narrative": text, "narrative_audio_url": audio_url}

    results = await asyncio.gather(*[process_narrative_audio(i, t) for i, t in enumerate(narrative_texts)])
    return {"success": True, "results": list(results)}


async def facade_enhance_prompt(
    prompt: str,
    model: Optional[str],
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """Uses centralized AIOrchestrator to enhance/optimize a user's text prompt."""
    enhanced = await AIOrchestrator.generate_text(
        prompt=f"Enhance and optimize this creative prompt for vivid visual details:\n{prompt}",
        model=model,
        api_key=api_key
    )
    return {"success": True, "enhanced_prompt": enhanced}

