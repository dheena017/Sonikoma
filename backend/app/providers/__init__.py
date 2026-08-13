"""
backend/app/providers/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified package entry point for Sonikoma Media Processing & AI Provider Clients:
- edge_tts: Edge TTS synthesis provider client
- ffmpeg: FFmpeg video execution & command builder engine
- gemini: Google Gemini GenAI SDK client
- librosa: Librosa audio feature extraction engine
- stable_diffusion: Diffusers text-to-image generation engine
- video: Video rendering & subtitle compilation engine
- whisper: Whisper speech transcription engine
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.edge_tts import EdgeTTSProvider
from app.providers.ffmpeg import get_ffmpeg_engine
from app.providers.gemini import GeminiProvider, GEMINI_AVAILABLE
from app.providers.librosa import get_librosa_engine, LIBROSA_AVAILABLE
from app.providers.stable_diffusion import get_stable_diffusion_engine, DIFFUSERS_AVAILABLE
from app.providers.video import RenderEngine, SubtitleEngine
from app.providers.whisper import get_whisper_engine, WHISPER_AVAILABLE, WhisperModel

__all__ = [
    "EdgeTTSProvider",
    "get_ffmpeg_engine",
    "GeminiProvider",
    "GEMINI_AVAILABLE",
    "get_librosa_engine",
    "LIBROSA_AVAILABLE",
    "get_stable_diffusion_engine",
    "DIFFUSERS_AVAILABLE",
    "RenderEngine",
    "SubtitleEngine",
    "get_whisper_engine",
    "WHISPER_AVAILABLE",
    "WhisperModel",
]
