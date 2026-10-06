"""
backend/ai_engine/__init__.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Universal AI Engine (ai_engine)
Autonomous, portable, and modular enterprise AI execution engine.
Contains:
- providers: The 14 raw AI model providers (Gemini, OpenAI, Claude, DeepSeek, etc.)
- skills: Reusable AI capabilities & prompt templates
- core: AIOrchestrator, ModelRegistry, AIConfig, and unified AIHub
- api: Production-ready FastAPI router
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.core import (
    AIHub,
    ai_hub,
    AIOrchestrator,
    ModelRegistry,
    ai_config,
    AIErrorCode,
    AIExecutionError,
)
from ai_engine.providers import (
    GeminiProvider,
    GEMINI_AVAILABLE,
    HuggingFaceProvider,
    HUGGINGFACE_AVAILABLE,
    PollinationsProvider,
    PollinationsClient,
    OpenAIProvider,
    OPENAI_AVAILABLE,
    AnthropicProvider,
    ANTHROPIC_AVAILABLE,
    DeepSeekProvider,
    GroqProvider,
    StableDiffusionEngine,
    StableDiffusionClient,
    get_stable_diffusion_engine,
    DIFFUSERS_AVAILABLE,
    EdgeTTSProvider,
    EdgeTTSClient,
    EDGE_TTS_AVAILABLE,
    DEFAULT_VOICES,
    VOICE_LIST,
    ElevenLabsProvider,
    ElevenLabsClient,
    LibrosaEngine,
    get_librosa_engine,
    LIBROSA_AVAILABLE,
    WhisperEngine,
    WhisperClient,
    WhisperProvider,
    get_whisper_engine,
    WHISPER_AVAILABLE,
    WhisperModel,
    FFmpegEngine,
    get_ffmpeg_engine,
    VideoEngine,
    VideoClient,
    get_video_engine,
    get_ffmpeg_filter_string,
    format_duration,
)

# Friendly Aliases
AIEngine = AIHub
ai_engine = ai_hub

__all__ = [
    # Core Controller & Engine Hub
    "AIEngine",
    "ai_engine",
    "AIHub",
    "ai_hub",
    "AIOrchestrator",
    "ModelRegistry",
    "ai_config",
    "AIErrorCode",
    "AIExecutionError",

    # 14 AI Providers
    "GeminiProvider",
    "GEMINI_AVAILABLE",
    "HuggingFaceProvider",
    "HUGGINGFACE_AVAILABLE",
    "PollinationsProvider",
    "PollinationsClient",
    "OpenAIProvider",
    "OPENAI_AVAILABLE",
    "AnthropicProvider",
    "ANTHROPIC_AVAILABLE",
    "DeepSeekProvider",
    "GroqProvider",
    "StableDiffusionEngine",
    "StableDiffusionClient",
    "get_stable_diffusion_engine",
    "DIFFUSERS_AVAILABLE",
    "EdgeTTSProvider",
    "EdgeTTSClient",
    "EDGE_TTS_AVAILABLE",
    "DEFAULT_VOICES",
    "VOICE_LIST",
    "ElevenLabsProvider",
    "ElevenLabsClient",
    "LibrosaEngine",
    "get_librosa_engine",
    "LIBROSA_AVAILABLE",
    "WhisperEngine",
    "WhisperClient",
    "WhisperProvider",
    "get_whisper_engine",
    "WHISPER_AVAILABLE",
    "WhisperModel",
    "FFmpegEngine",
    "get_ffmpeg_engine",
    "VideoEngine",
    "VideoClient",
    "get_video_engine",
    "get_ffmpeg_filter_string",
    "format_duration",
]
