"""
backend/providers/core/config.py
─────────────────────────────────────────────────────────────────────────────
Autonomous, self-contained AI configuration & credential provider.
Can run standalone in any project without external framework dependencies.
─────────────────────────────────────────────────────────────────────────────
"""

import os
from typing import Dict, Any, Optional

from dotenv import load_dotenv

load_dotenv()


class AIConfig:
    """Universal configuration container for AI providers & models."""

    # API Keys & Secrets
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY")
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    ELEVENLABS_API_KEY: Optional[str] = os.getenv("ELEVENLABS_API_KEY")
    HUGGINGFACE_API_KEY: Optional[str] = os.getenv("HUGGINGFACE_API_KEY")

    # Local Engine Binaries / Flags
    FFMPEG_PATH: str = os.getenv("FFMPEG_PATH", "ffmpeg")
    FFPROBE_PATH: str = os.getenv("FFPROBE_PATH", "ffprobe")

    @classmethod
    def get_configured_providers(cls) -> Dict[str, bool]:
        """Returns availability status for all known providers."""
        return {
            "gemini": bool(cls.GEMINI_API_KEY),
            "openai": bool(cls.OPENAI_API_KEY),
            "anthropic": bool(cls.ANTHROPIC_API_KEY),
            "deepseek": bool(cls.DEEPSEEK_API_KEY),
            "groq": bool(cls.GROQ_API_KEY),
            "elevenlabs": bool(cls.ELEVENLABS_API_KEY),
            "huggingface": bool(cls.HUGGINGFACE_API_KEY),
            # Free / Local providers always available
            "pollinations": True,
            "edge_tts": True,
            "whisper": True,
            "stable_diffusion": True,
            "ffmpeg": True,
        }

    @classmethod
    def is_provider_configured(cls, provider_id: str) -> bool:
        provider_id = (provider_id or "").lower().strip()
        configured = cls.get_configured_providers()
        return configured.get(provider_id, False)


ai_config = AIConfig()
