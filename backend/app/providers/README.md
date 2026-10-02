# Sonikoma AI & Media Providers Directory (`backend/app/providers`)

Central unified registry and interface layer for all AI Foundation Models, Generative Diffusion Engines, Neural Speech Synthesizers, and Media Processing Systems.

---

## 🏗️ Architectural Standardization Pattern

Every provider under `backend/app/providers/` strictly adheres to the standard **4-pillar design**:

```
backend/app/providers/<provider_name>/
├── __init__.py      # Package barrel export: defines public API and __all__
├── types.py         # Type contracts: Enums, Dataclasses, schemas, models
├── helpers.py       # Pure helpers: sanitizers, URL/prompt builders, math
└── client.py        # Client interface (or engine.py / commands.py)
```

---

## 📂 Provider Directory Structure

```
backend/app/providers/
├── __init__.py                     # Unified root barrel export (37 standardized symbols)
├── README.md                       # This developer architectural guide
│
├── 🧠 1. Foundation & Reasoning LLMs
│   ├── gemini/                     # Google Gemini Provider (Primary Vision & Story Brain)
│   │   ├── types.py                # GeminiModel, GeminiGenerationConfig
│   │   ├── helpers.py              # build_config_dict, sanitize_prompt
│   │   ├── client.py               # GeminiClient / GeminiProvider
│   │   └── __init__.py             # Public barrel exports
│   ├── anthropic/                  # Anthropic Claude Provider
│   │   ├── types.py                # AnthropicModel, AnthropicMessage
│   │   ├── helpers.py              # normalize_messages, build_message_params
│   │   ├── client.py               # AnthropicClient / AnthropicProvider
│   │   └── __init__.py             # Public barrel exports
│   ├── openai/                     # OpenAI Provider
│   │   ├── types.py                # OpenAIModel, OpenAIMessage
│   │   ├── helpers.py              # sanitize_messages, build_completion_params
│   │   ├── client.py               # OpenAIClient / OpenAIProvider
│   │   └── __init__.py             # Public barrel exports
│   ├── deepseek/                   # DeepSeek AI Provider
│   │   ├── types.py                # DeepSeekModel, DeepSeekMessage
│   │   ├── helpers.py              # build_deepseek_headers, build_chat_payload
│   │   ├── client.py               # DeepSeekClient / DeepSeekProvider
│   │   └── __init__.py             # Public barrel exports
│   └── groq/                       # Groq Ultra-Fast LPU Provider
│       ├── types.py                # GroqModel, GroqMessage
│       ├── helpers.py              # build_groq_headers, build_groq_payload
│       ├── client.py               # GroqClient / GroqProvider
│       └── __init__.py             # Public barrel exports
│
├── 🎨 2. Generative Diffusion & Image Synthesis
│   ├── huggingface/                # Hugging Face Inference API Provider
│   │   ├── types.py                # HuggingFaceModel, ImageGenerationOptions
│   │   ├── helpers.py              # trim_prompt, encode_image_bytes, resize_image_if_needed
│   │   ├── client.py               # HuggingFaceClient / HuggingFaceProvider
│   │   └── __init__.py             # Public barrel exports
│   ├── pollinations/               # Pollinations.ai Multi-Model Diffusion Provider
│   │   ├── types.py                # PollinationsModel, MODEL_FALLBACK_CHAINS
│   │   ├── helpers.py              # build_pollinations_url, DEFAULT_BASE_URL
│   │   ├── client.py               # PollinationsClient / PollinationsProvider
│   │   └── __init__.py             # Public barrel exports
│   └── stable_diffusion/           # Local Diffusers Stable Diffusion Engine
│       ├── types.py                # StableDiffusionModel, GeneratedImage
│       ├── helpers.py              # generate_seed, sanitize_prompt, format_seed_filename
│       ├── client.py               # StableDiffusionClient
│       ├── engine.py               # PyTorch / CUDA local inference pipeline
│       └── __init__.py             # Public barrel exports
│
├── 🎙️ 3. Neural Speech & Audio Studios
│   ├── edge_tts/                   # Microsoft Edge Neural TTS Provider
│   │   ├── types.py                # DEFAULT_VOICES, VOICE_LIST
│   │   ├── helpers.py              # sanitize_speech_text
│   │   ├── client.py               # EdgeTTSClient / EdgeTTSProvider
│   │   └── __init__.py             # Public barrel exports
│   ├── elevenlabs/                 # ElevenLabs Voice AI Provider
│   │   ├── types.py                # ElevenLabsModel, VoiceSettings, DEFAULT_ELEVENLABS_VOICES
│   │   ├── helpers.py              # resolve_voice_id, build_tts_payload
│   │   ├── client.py               # ElevenLabsClient / ElevenLabsProvider
│   │   └── __init__.py             # Public barrel exports
│   └── whisper/                    # OpenAI Whisper Speech-to-Text Engine
│       ├── types.py                # WhisperModel, TranscriptionSegment, TranscriptionResult
│       ├── helpers.py              # format_srt_time, format_vtt_time, segments_to_srt, segments_to_vtt
│       ├── client.py               # WhisperClient REST wrapper
│       ├── engine.py               # Local CUDA/CPU PyTorch inference engine
│       └── __init__.py             # Public barrel exports
│
├── 🎬 4. Video & Motion Compilation Engines
│   ├── video/                      # High-Level Video Composition Engine
│   │   ├── types.py                # Video types re-exported from ffmpeg.types
│   │   ├── edit_helpers.py         # Visual filter string mapping utilities
│   │   ├── render_engine.py        # Frame extraction, cutting, audio mixing, concatenation
│   │   ├── subtitle_engine.py      # Subtitle burn-in and sync
│   │   └── __init__.py             # Public barrel exports
│   ├── ffmpeg/                     # FFmpeg Core Execution Engine
│   │   ├── types.py                # VideoMetadata, TransitionType, FilterType, TransitionSpec, CutSpec
│   │   ├── commands.py             # FFmpeg command string builders
│   │   ├── engine.py               # Subprocess execution facade
│   │   └── __init__.py             # Public barrel exports
│   └── librosa/                    # Audio Analysis & Feature Extraction Engine
│       ├── types.py                # AudioFeatures, SilenceSegment, EnergySegment
│       ├── helpers.py              # frames_to_time, time_to_frames, amplitude_to_db
│       ├── engine.py               # Librosa acoustic processing engine
│       └── __init__.py             # Public barrel exports
│
│
└── 📦 5. Model Catalog Specs
    Each provider folder now contains its own localized `catalog.json` loaded dynamically
    by `ModelRegistry` (e.g. `gemini/catalog.json`, `anthropic/catalog.json`, etc.).
```

---

## 💻 Developer Import Guidelines

### 1. From the unified barrel export (`app.providers`):
```python
from app.providers import (
    GeminiProvider,
    HuggingFaceProvider,
    PollinationsClient,
    EdgeTTSClient,
    ElevenLabsClient,
    OpenAIProvider,
    AnthropicProvider,
    DeepSeekProvider,
    GroqProvider,
    WhisperEngine,
    VideoEngine,
    VideoClient,
    FFmpegEngine,
    LibrosaEngine,
    StableDiffusionEngine,
)
```

### 2. From domain-specific subpackages:
```python
from app.providers.whisper import WhisperEngine, WhisperModel, segments_to_srt
from app.providers.pollinations import PollinationsClient, PollinationsModel
from app.providers.edge_tts import EdgeTTSClient, DEFAULT_VOICES
from app.providers.video import VideoEngine, VideoClient, get_ffmpeg_filter_string, format_duration
from app.providers.elevenlabs import ElevenLabsClient, ElevenLabsModel
from app.providers.ffmpeg import FFmpegEngine, FilterType, VideoMetadata
```
