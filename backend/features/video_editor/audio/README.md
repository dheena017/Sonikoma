# Audio Sub-domain (`features/video_editor/audio`)

## Overview
The `audio` sub-domain manages speech synthesis (Edge-TTS), comic speech normalization, curated voice catalogs, automated audio-to-dialogue synchronization, audio signal analysis (Librosa), audio track mixing with ducking (Pydub), and speech-to-text subtitle transcription (Whisper).

## Architecture & Layout
Following the standard feature design pattern:
- **`router/`**: Multi-file HTTP controllers delegating request validation to FastAPI.
- **`services/`**: Focused modular business logic and engine integrations.
- **`schemas.py`**: Clean Pydantic models for validation and responses.
- **`service.py`**: Unified `AudioService` facade and `audio_service` singleton.

```
audio/
├── __init__.py             # Sub-domain package exports
├── README.md               # Sub-domain documentation
├── router/                 # Audio API endpoints (thin controllers)
│   ├── alignment.py        # Dialogue OCR text and audio timestamp alignment routes
│   ├── analysis.py         # Audio signal analysis and energy segmentation routes
│   ├── mixer.py            # Audio track mixing and background music routes
│   ├── settings.py         # Audio settings and preset routes
│   ├── transcription.py    # Speech-to-text and subtitle generation routes
│   ├── tts.py              # Text-to-speech generation and voice preview routes
│   └── __init__.py         # Unified audio_router assembly
├── schemas.py              # Pydantic schemas for audio requests & responses
├── service.py              # AudioService facade class & audio_service singleton
└── services/               # Underlying audio engine implementations
    ├── alignment.py        # Dialogue aligner and peak extractor
    ├── mixer.py            # Multi-track mixing with auto-ducking & looping
    ├── processing.py       # Librosa audio signal processor
    ├── settings.py         # Persistent audio settings & curated presets
    ├── text_normalizer.py  # Comic speech bubble text normalizer for TTS
    ├── transcription.py    # Whisper speech transcriber and subtitle generator
    ├── tts.py              # Edge-TTS voice generation engine
    ├── voice_catalog.py    # Edge-TTS voice mappings and metadata
    └── __init__.py         # Unified services re-export
```

## Usage
```python
from features.video_editor.audio import audio_service, audio_router
from features.video_editor.audio.schemas import AudioGenerateRequest

# TTS Synthesis
audio_data = await audio_service.generate_tts(text="Hello world!", voice="en-US-GuyNeural")

# Audio Mixing with Auto-Ducking
mix_result = await audio_service.mix_tracks(
    voice_audio_path="voice.mp3",
    bgm_audio_url="bgm.mp3",
    auto_ducking=True,
    ducking_factor=0.25
)
```
