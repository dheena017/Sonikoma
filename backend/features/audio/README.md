# Audio Domain (`backend/features/audio`)

Canonical standalone domain for all speech synthesis, multi-track audio mixing, subtitles, dialogue synchronization, and audio signal analysis across Sonikoma.

## Architecture

```
backend/features/audio/
├── speech/         # Speech generation (panel speech, batch speech, voice previews, voice catalog)
├── mixer/          # Multi-track mixing (music ducking, looping, volume balancing)
├── subtitles/      # Speech-to-text (Whisper transcription, SRT/VTT export, word timers)
├── sync/           # Timing synchronization (comic bubble sync, sound waves, backup pacing)
├── analysis/       # Sound analysis (silence finder, energy split, sound info, audio cutter)
├── settings/       # Audio settings and curated character presets
├── utils/          # Foundational tools (clean text, audio math, audio file caching)
├── router/         # FastAPI web controllers mounted on /api/v1/audio
├── schemas.py      # Pydantic request/response data contracts
├── service.py      # Unified AudioService facade & singleton
└── __init__.py     # Top-level package entrypoint
```

## Quick Start

```python
from features.audio import audio_service, audio_router

# 1. Synthesize speech for a panel
result = await audio_service.make_panel_speech(
    dialogue_list=["Don't move! Stay back!"],
    voice="en-US-GuyNeural"
)

# 2. Mix dialogue with background music
mix_result = await audio_service.mix_tracks(
    voice_audio_base64=result["audio_base64"],
    bgm_audio_url="https://example.com/bgm.mp3",
    auto_ducking=True
)
```
