"""
backend/app/providers/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified package entry point for Sonikoma Media Processing & AI Provider Clients:
- gemini: Google Gemini GenAI SDK client
- huggingface: Hugging Face Inference FLUX.1 diffusion engine
- pollinations: Pollinations.ai multi-model diffusion generator
- edge_tts: Microsoft Edge Neural TTS synthesis provider
- elevenlabs: ElevenLabs Voice AI synthesis provider
- openai: OpenAI GPT-4o / DALL-E 3 / TTS provider
- anthropic: Anthropic Claude 3.5 Sonnet provider
- deepseek: DeepSeek V3 / R1 reasoning provider
- groq: Groq LPU ultra-fast inference provider
- stable_diffusion: Local diffusers text-to-image engine & client
- ffmpeg: FFmpeg video execution & command builder engine
- librosa: Librosa audio feature extraction engine
- video: Video rendering & subtitle compilation engine
- whisper: Whisper speech transcription engine & client
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.gemini import GeminiProvider, GEMINI_AVAILABLE
from app.providers.huggingface import HuggingFaceProvider, HUGGINGFACE_AVAILABLE
from app.providers.pollinations import PollinationsProvider, PollinationsClient
from app.providers.edge_tts import (
    EdgeTTSProvider,
    EdgeTTSClient,
    EDGE_TTS_AVAILABLE,
    DEFAULT_VOICES,
    VOICE_LIST,
)
from app.providers.elevenlabs import (
    ElevenLabsProvider,
    ElevenLabsClient,
)
from app.providers.openai import OpenAIProvider, OPENAI_AVAILABLE
from app.providers.anthropic import AnthropicProvider, ANTHROPIC_AVAILABLE
from app.providers.deepseek import DeepSeekProvider
from app.providers.groq import GroqProvider
from app.providers.ffmpeg import (
    FFmpegEngine,
    get_ffmpeg_engine,
)
from app.providers.librosa import (
    LibrosaEngine,
    get_librosa_engine,
    LIBROSA_AVAILABLE,
)
from app.providers.stable_diffusion import (
    StableDiffusionEngine,
    StableDiffusionClient,
    get_stable_diffusion_engine,
    DIFFUSERS_AVAILABLE,
)
from app.providers.video import (
    VideoEngine,
    VideoClient,
    get_video_engine,
    get_ffmpeg_filter_string,
    format_duration,
)
from app.providers.whisper import (
    WhisperEngine,
    WhisperClient,
    WhisperProvider,
    get_whisper_engine,
    WHISPER_AVAILABLE,
    WhisperModel,
)

__all__ = [
    # AI Foundation & Diffusion Providers
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

    # Voice & Audio Providers
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

    # Video & Media Compilation Engines
    "FFmpegEngine",
    "get_ffmpeg_engine",
    "VideoEngine",
    "VideoClient",
    "get_video_engine",
    "get_ffmpeg_filter_string",
    "format_duration",
]
