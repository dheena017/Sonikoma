"""
backend/providers/core/hub.py
─────────────────────────────────────────────────────────────────────────────
Unified AI Center Hub (AIHub).
The single universal entry point for all AI capabilities:
- Text Generation & Chat
- Image Generation & Diffusion
- Speech Synthesis (TTS) & Audio Transcription (STT)
- Multimodal Vision & OCR
- AI Skills & Prompt Templates
─────────────────────────────────────────────────────────────────────────────
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional, List, Union

from ai_engine.core.registry import ModelRegistry
from ai_engine.core.orchestrator import AIOrchestrator, AIErrorCode, AIExecutionError
from ai_engine.skills.registry import registry as skills_registry

logger = logging.getLogger("sonikoma.providers.hub")


class AIHubSkillsAccessor:
    """Convenience accessor for AI skills by name or attribute."""

    def __init__(self, hub: 'AIHub'):
        self._hub = hub

    def list(self) -> Dict[str, str]:
        """Lists all registered skill names and their descriptions."""
        return skills_registry.list_skills()

    async def execute(self, skill_name: str, model: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Executes a named skill with kwargs."""
        return await self._hub.execute_skill(skill_name, model=model, **kwargs)


class AIHub:
    """
    The Universal AI Center Hub.
    Portable and self-contained: can be dropped into any project.
    """

    def __init__(self):
        self.registry = ModelRegistry
        self.orchestrator = AIOrchestrator
        self.skills = AIHubSkillsAccessor(self)

    # ── Text & Chat ──────────────────────────────────────────────────────────

    async def chat(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generates text or conversational responses using the active/requested model
        with automatic multi-provider fallback.
        """
        res = await self.orchestrator.execute_capability(
            capability="chat_completion",
            prompt=prompt,
            system_instruction=system_instruction,
            requested_model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if isinstance(res, dict):
            return res.get("text", res.get("result", str(res)))
        return str(res)

    # ── Image Generation ─────────────────────────────────────────────────────

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        model: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates an image via Pollinations, HuggingFace Flux, OpenAI DALL-E, or Stable Diffusion.
        """
        res = await self.orchestrator.execute_capability(
            capability="image_diffusion",
            prompt=prompt,
            negative_prompt=negative_prompt,
            requested_model=model,
            width=width,
            height=height,
            output_path=output_path,
        )
        return res if isinstance(res, dict) else {"result": res}

    # ── Speech Synthesis (TTS) ───────────────────────────────────────────────

    async def synthesize_speech(
        self,
        text: str,
        voice: Optional[str] = None,
        output_path: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes spoken audio from text using EdgeTTS or ElevenLabs.
        """
        res = await self.orchestrator.execute_capability(
            capability="speech_synthesis",
            text=text,
            voice=voice,
            output_path=output_path,
            requested_model=model,
        )
        return res if isinstance(res, dict) else {"result": res}

    # ── Audio Transcription (STT) ───────────────────────────────────────────

    async def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Transcribes speech from an audio file using Whisper.
        """
        res = await self.orchestrator.execute_capability(
            capability="speech_to_text",
            audio_path=audio_path,
            language=language,
            requested_model=model,
        )
        return res if isinstance(res, dict) else {"text": str(res)}

    # ── Multimodal Vision & OCR ──────────────────────────────────────────────

    async def vision_analyze(
        self,
        image_path: str,
        prompt: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes an image using Vision LLMs (Gemini / GPT-4o / Claude).
        """
        res = await self.orchestrator.execute_capability(
            capability="panel_analysis",
            image_path=image_path,
            prompt=prompt or "Analyze this image in detail.",
            requested_model=model,
        )
        return res if isinstance(res, dict) else {"result": res}

    # ── Dialogue & Text Translation ──────────────────────────────────────────

    async def translate(
        self,
        text: str,
        target_language: str = "en",
        source_language: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Translates dialogue or text while preserving tone, slang, and context.
        """
        res = await self.orchestrator.execute_capability(
            capability="translate",
            text=text,
            target_language=target_language,
            source_language=source_language,
            requested_model=model,
        )
        return res if isinstance(res, dict) else {"translated_text": str(res)}

    # ── Dynamic Skills Execution ─────────────────────────────────────────────

    async def execute_skill(
        self,
        skill_name: str,
        model: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executes any of the registered markdown AI skills (e.g. 'script_dramatization',
        'voice_casting', 'storyboard_narrative', 'smart_crop', etc.).
        """
        skill = skills_registry.get(skill_name)
        if not skill:
            raise KeyError(f"Skill '{skill_name}' not found in skills registry.")
        return await skill.execute(model=model, **kwargs)


# Global singleton hub instance
ai_hub = AIHub()
