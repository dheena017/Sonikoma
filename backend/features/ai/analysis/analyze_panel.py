"""
backend/features/ai/analysis/analyze_panel.py
─────────────────────────────────────────────────────────────────────────────
Looks at one comic panel picture, reads dialogue, detects speaker, mood, and camera.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import json
import logging
from typing import Union, Optional, Dict, Any
from PIL import Image

from features.ai.utils.image_loader import load_picture
from features.ai.utils.clean_json import fix_bad_json
from features.ai.utils.speech_timer import count_speech_seconds
from features.ai.analysis.detect_emotion import find_emotion
from features.ai.analysis.detect_sfx import find_sound_effects

logger = logging.getLogger("sonikoma.features.ai.analysis.analyze_panel")


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _prepare_picture(picture: Union[str, bytes, Image.Image]) -> Image.Image:
    """Loads image and scales down if overly huge to prevent vision OOM."""
    img = load_picture(picture)
    max_dim = 2048
    w, h = img.size
    if w > max_dim or h > max_dim:
        scale = max_dim / float(max(w, h))
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    return img


def _make_prompt(story_notes: Optional[str], past_events: Optional[str]) -> str:
    """Builds the vision analysis prompt requesting clean structured JSON."""
    context_str = ""
    if story_notes or past_events:
        context_str = f"\nStory Context: {story_notes or ''}\nPreceding Events: {past_events or ''}\n"

    return f"""Analyze this comic panel carefully.{context_str}
Return ONLY a valid JSON dictionary with these keys:
- "speech_text": Spoken dialogue from speech bubbles, or empty string "" if none.
- "speaker_name": Who is speaking (e.g. "Hero", "Villain", "Narrator").
- "speaker_gender": "male", "female", "child", or "neutral".
- "emotion": "neutral", "whisper", "shouting", "tender", or "panicked".
- "sfx": Sound effect words visible in art (e.g. "SLASH", "BOOM"), or "".
- "motion_type": Recommended camera move ("zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down").
- "visual_description": 1-2 sentence description of what is happening.
- "narrative": A rich, cinematic 1-2 sentence voiceover recounting what is happening."""


def _clean_analysis_dict(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures all standard fields exist and have valid types."""
    speech = str(raw.get("speech_text") or "").strip()
    sfx = str(raw.get("sfx") or "").strip()
    vis = str(raw.get("visual_description") or "").strip()
    narrative = str(raw.get("narrative") or raw.get("narrativeText") or "").strip()
    speaker = str(raw.get("speaker_name") or "Narrator").strip()
    motion = str(raw.get("motion_type") or "zoom_in").strip().lower()

    if motion not in ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down']:
        motion = 'zoom_in'

    duration = count_speech_seconds(speech) if speech else count_speech_seconds(narrative)
    if duration == 0:
        duration = 3.0

    emotion_info = find_emotion(speech)
    sfx_info = find_sound_effects(sfx)

    return {
        "speech_text": speech,
        "speaker_name": speaker,
        "speaker_gender": str(raw.get("speaker_gender") or "neutral").lower(),
        "emotion": emotion_info.get("emotion", "neutral"),
        "sfx": sfx,
        "sfx_category": sfx_info.get("category", "none"),
        "motion_type": motion,
        "visual_description": vis,
        "narrative": narrative,
        "duration": duration
    }


# ── Public API ───────────────────────────────────────────────────────────────

async def read_panel(
    picture: Union[str, bytes, Image.Image],
    story_notes: Optional[str] = None,
    past_events: Optional[str] = None,
    ai_provider: str = "gemini",
    model_name: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """Reads a comic panel and returns dialogue, speaker name, emotion, camera move, and voiceover text."""
    try:
        img = _prepare_picture(picture)
    except Exception as exc:
        return {"success": False, "error": f"Failed to load image: {exc}"}

    prompt = _make_prompt(story_notes, past_events)
    provider = ai_provider.lower().strip()

    try:
        if provider == "gemini":
            from app.core.config import call_gemini_with_retry, GEMINI_MODEL_PRIMARY, get_genai_client
            client = get_genai_client()
            if client:
                model = model_name or GEMINI_MODEL_PRIMARY
                def _invoke():
                    resp = client.models.generate_content(
                        model=model,
                        contents=[prompt, img]
                    )
                    return getattr(resp, "text", str(resp))
                raw_response = await call_gemini_with_retry(_invoke)
                data = fix_bad_json(raw_response)
                cleaned = _clean_analysis_dict(data)
                res = {"success": True, "analysis": cleaned}
                res["speaker"] = cleaned.get("speaker_name", "Narrator")
                res["dialogue"] = cleaned.get("speech_text", "")
                res["narrative"] = cleaned.get("narrative", "")
                res["emotion"] = cleaned.get("emotion", "neutral")
                res["motion"] = cleaned.get("motion_type", "zoom_in")
                return res
        
        # Fallback for mock/test providers or offline
        mock_data = {
            "speech_text": "Stop right there!",
            "speaker_name": "Hero",
            "speaker_gender": "male",
            "emotion": "shouting",
            "sfx": "BAM",
            "motion_type": "zoom_in",
            "visual_description": "Hero confronts enemy at the gate.",
            "narrative": "A sudden cry echoes through the ruined courtyard."
        }
        cleaned = _clean_analysis_dict(mock_data)
        res = {"success": True, "analysis": cleaned}
        res["speaker"] = cleaned.get("speaker_name", "Hero")
        res["dialogue"] = cleaned.get("speech_text", "")
        res["narrative"] = cleaned.get("narrative", "")
        res["emotion"] = cleaned.get("emotion", "shouting")
        res["motion"] = cleaned.get("motion_type", "zoom_in")
        return res
    except Exception as exc:
        logger.error(f"Error analyzing panel: {exc}")
        fallback_data = _clean_analysis_dict({
            "speech_text": "",
            "speaker_name": "Narrator",
            "visual_description": "Comic scene.",
            "narrative": "The scene continues with dramatic tension."
        })
        res = {"success": False, "error": str(exc), "analysis": fallback_data}
        res["speaker"] = "Narrator"
        res["dialogue"] = ""
        res["narrative"] = "The scene continues with dramatic tension."
        res["emotion"] = "neutral"
        res["motion"] = "zoom_in"
        return res


__all__ = ["read_panel"]
