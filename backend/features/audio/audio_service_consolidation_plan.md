# Exhaustive Specification: Unified `backend/features/audio/` Architecture

## 1. Architectural Elevation: Elevating Audio to a Standalone Top-Level Domain

### 1.1 The Rationale for Elevation
Previously, audio capabilities were nested inside `backend/features/video_editor/audio/`. However:
1. **Multi-Domain Consumers**: Audio synthesis, speech recognition, and audio processing are not only used by the video editor, but also by **AI Series Studio** (`features/intelligence/series/`), **Autonomous Storyboard Agents** (`features/creative/agent/`), **Interactive OCR Speech Extraction** (`features/intelligence/ai/`), and the **Core API Gateway**.
2. **Architectural Symmetry**: Elevating Audio creates an elegant, standardized top-level tri-media core:
   * `backend/features/image/` ── Visual panel splitting, OCR, composite vision, layer separation.
   * `backend/features/audio/` ── Neural TTS synthesis, Whisper STT, multi-track mixing, DSP analysis.
   * `backend/features/video/` ── Canvas rendering, transition composition, and video compilation.
3. **Clean Decoupling**: Decouples audio business logic from video editor timelines and provides a clean foundation for standalone audio narration, podcast generation, voice audition, and multilingual dubbing.

### 1.2 Ecosystem Discovery: Complete Audio Map in Sonikoma

| Layer / Subsystem | Location | Description & Role | Target State |
| :--- | :--- | :--- | :--- |
| **Top-Level Domain (Canonical)** | `backend/features/audio/` | Primary standalone business logic: TTS synthesis, batch narration, track mixing, Whisper transcription, dialogue alignment, Librosa analysis, and settings. | **Canonical Home** |
| **Legacy Sub-domain (Shim)** | `backend/features/video_editor/audio/` | Legacy audio location. Maintained as a transparent backward-compatibility re-export shim to ensure zero breaking changes across existing callers. | **Compatibility Facade** |
| **Low-Level AI Engine** | `backend/ai_engine/providers/edge_tts/` | Hardware & protocol integration with Microsoft Edge-TTS streaming protocol, voice fetching, and raw file persistence. | Provider (Unchanged) |
| **Low-Level AI Engine** | `backend/ai_engine/providers/elevenlabs/` | HTTP client wrapper for ElevenLabs v1 API (voice generation, model parameterization). | Provider (Unchanged) |
| **Low-Level AI Engine** | `backend/ai_engine/providers/whisper/` | OpenAI Whisper PyTorch model lifecycle manager, CPU/GPU execution, segment emission, and SRT/VTT timestamp formatters. | Provider (Unchanged) |
| **Low-Level AI Engine** | `backend/ai_engine/providers/librosa/` | Librosa & SoundFile digital signal processing engine (audio loading, STFT, Mel spectrograms, beat tracking, and RMS). | Provider (Unchanged) |
| **Low-Level AI Engine** | `backend/ai_engine/providers/ffmpeg/` | FFmpeg subprocess engine for audio transcoding, extraction from MP4, and multi-stream multiplexing. | Provider (Unchanged) |
| **Shared Audio Utilities** | `backend/common/audio/helpers.py` | Universal text normalization for speech, OCR contraction healing, repetitive character dampening, sentence case conversion, and speech duration estimation. | Foundational Shared Util |
| **Shared Audio Constants** | `backend/common/audio/constants.py` | Audio format extensions (`.mp3`, `.wav`, `.ogg`), MIME types, standard sample rates (`24000`, `44100`, `48000`), and default WPM (`145`). | Foundational Shared Constants |
| **Series Dubbing Service** | `backend/features/intelligence/series/services/series_audio_service.py` | Multi-character comic series auto-dubbing, character DNA voice matching, and series audio disk storage under `data/media/series_audio/`. | Consumer |
| **Series Audio Router** | `backend/features/intelligence/series/router/audio.py` | Dedicated REST endpoints for chapter-wide series audio dubbing. | Consumer |
| **Workflow Consumers** | `backend/features/video_editor/video/services/video_compiler.py`<br>`backend/features/creative/agent/workflow.py`<br>`backend/features/intelligence/ai/services/facade.py` | High-level orchestration layers importing and invoking panel audio generation and mixing pipelines. | Consumers |

---

## 2. Directory Blueprint (Approved)

```
backend/features/audio/
│
├── __init__.py                               # Unified top-level package facade (re-exports all canonical services)
├── schemas.py                                # All Pydantic request/response models for audio operations
├── service.py                                # AudioService facade class & audio_service singleton
├── README.md                                 # Architecture documentation & API guide
│
├── tts/                                      # ── 4 SPEECH SYNTHESIS & VOICE SERVICES ──
│   ├── __init__.py
│   ├── panel_tts_service.py                  # 1. Single panel / dialogue speech synthesis with retry & cache
│   ├── batch_tts_service.py                  # 2. Multi-panel concurrent narration & dialogue batch synthesizer
│   ├── voice_preview_service.py              # 3. Instant voice audition & preview generator
│   └── voice_catalog_service.py              # 4. Multi-language neural voice catalogue & gender/role mapping
│
├── mixer/                                    # ── 1 MULTI-TRACK AUDIO MIXING SERVICE ──
│   ├── __init__.py
│   └── track_mixer_service.py                # 1. Voiceover + BGM + SFX mixer with auto-ducking & looping
│
├── transcription/                            # ── 4 WHISPER SPEECH RECOGNITION SERVICES ──
│   ├── __init__.py
│   ├── transcribe_service.py                 # 1. Audio to text transcription via OpenAI Whisper
│   ├── subtitle_generator_service.py         # 2. SRT and WebVTT subtitle file generator
│   ├── word_timestamp_service.py             # 3. Word-level timestamp extractor for kinetic typography
│   └── batch_transcribe_service.py           # 4. Multi-audio sequential batch transcription
│
├── alignment/                                # ── 1 DIALOGUE SYNCHRONIZATION SERVICE ──
│   ├── __init__.py
│   └── dialogue_aligner_service.py           # 1. Fuzzy OCR text-to-speech alignment & volume peak extraction
│
├── dsp/                                      # ── 3 AUDIO SIGNAL PROCESSING SERVICES ──
│   ├── __init__.py
│   ├── silence_detector_service.py           # 1. Decibel threshold silence interval detector
│   ├── energy_segmenter_service.py           # 2. Spectral energy boundary segmenter for video pacing
│   └── spectral_analyzer_service.py          # 3. Waveform summary physics (RMS, LUFS, centroid, tempo BPM)
│
├── settings/                                 # ── 2 PRESET & CONFIGURATION SERVICES ──
│   ├── __init__.py
│   ├── audio_settings_service.py             # 1. Global & user profile audio configuration manager
│   └── preset_catalog_service.py             # 2. Curated cinematic character & atmosphere presets
│
├── utils/                                    # ── PROPER FOUNDATIONAL UTILITY LAYER ──
│   ├── __init__.py                           # Clean facade exporting text normalizers and audio IO
│   ├── text_normalizer.py                    # Comic speech normalization, OCR repair & cadence pauses
│   └── audio_io.py                           # Audio buffer resolver, base64 encoder, duration math
│
└── router/                                   # ── FASTAPI ROUTER INTERFACE (/api/v1/audio) ──
    ├── __init__.py                           # Main audio_router aggregating sub-routers
    ├── tts.py                                # Routes for /synthesize-panel-audio, /list-tts-voices, /preview-tts-voice
    ├── mixer.py                              # Routes for /mix-audio-tracks
    ├── transcription.py                      # Routes for /transcribe-audio, /generate-srt-subtitles, /extract-word-timestamps
    ├── alignment.py                          # Routes for /synchronize-dialogue/{panel_id}
    ├── analysis.py                           # Routes for /analyze-audio, /detect-silence, /segment-audio-by-energy
    └── settings.py                           # Routes for /audio-settings, /list-audio-presets
```

---

## 3. Universal File Structure Rule: "Helpers at Top, Main API at Bottom"

Every single service file strictly adheres to the following structural standard:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. File Header & Docstring                                             │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Imports (Standard library, 3rd party, foundational utils)           │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Module Constants & Private Configuration                            │
├────────────────────────────────────────────────────────────────────────┤
│ 4. TOP: Internal Helper Utilities (Prefixed with `_`)                  │
│    - Private retries, conversions, and math calculations               │
│    - Sub-step implementations (e.g. `_load_segment`, `_apply_gain`)    │
├────────────────────────────────────────────────────────────────────────┤
│ 5. BOTTOM: The Canonical Public API Function                           │
│    - One single public entrypoint for the entire file                  │
│    - Takes clean typed arguments, coordinates helpers, returns result  │
├────────────────────────────────────────────────────────────────────────┤
│ 6. `__all__ = ["main_public_function"]`                                │
│    - Exports ONLY the main function; outside files NEVER call helpers! │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Standardized Function Specifications (Every File Defined)

---

### Module: `backend/features/audio/tts/`

#### 1. `panel_tts_service.py`
* **Local Helpers (Top)**:
  * `_communicate_with_retry(text: str, voice: str, temp_path: str, rate: Optional[str], pitch: Optional[str], max_retries: int) -> bool`
  * `_pad_or_trim_audio_segment(segment: AudioSegment, target_duration_ms: int, force_duration: bool) -> AudioSegment`
  * `_export_audio_payload(segment: AudioSegment, output_path: Optional[str], return_base64: bool) -> Tuple[Optional[str], Optional[str], float]`
* **Main Public API (Bottom)**:
  ```python
  async def synthesize_panel_audio(
      dialogue_list: List[str],
      target_duration: float = 4.0,
      voice: str = "en-US-GuyNeural",
      speech_rate: float = 1.0,
      speech_pitch: float = 1.0,
      output_path: Optional[str] = None,
      force_duration: bool = False,
      return_base64: bool = True
  ) -> Dict[str, Any]:
      """Synthesizes dialogue and narration audio for a panel using Microsoft Edge-TTS with duration matching."""
  ```
* **Exports**: `__all__ = ["synthesize_panel_audio"]`

#### 2. `batch_tts_service.py`
* **Local Helpers (Top)**:
  * `_prepare_panel_dialogues(item: BatchPanelAudioItem) -> List[str]`
  * `_synthesize_single_panel_worker(item: BatchPanelAudioItem, global_voice: str, rate: float, pitch: float, generate_dialogue: bool, generate_narrative: bool, force_regen: bool) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  async def batch_synthesize_panel_audio(
      panels: List[BatchPanelAudioItem],
      voice: str = "en-US-GuyNeural",
      speech_rate: float = 1.0,
      speech_pitch: float = 1.0,
      generate_dialogue: bool = True,
      generate_narrative: bool = True,
      force_regenerate: bool = False
  ) -> List[Dict[str, Any]]:
      """Concurrently synthesizes voiceover and narrative audio across all storyboard panels."""
  ```
* **Exports**: `__all__ = ["batch_synthesize_panel_audio"]`

#### 3. `voice_preview_service.py`
* **Local Helpers (Top)**:
  * `_format_rate_pitch_params(speech_rate: float, speech_pitch: float) -> Tuple[Optional[str], Optional[str]]`
* **Main Public API (Bottom)**:
  ```python
  async def preview_voice_sample(
      text: str = "Welcome to Sonikoma. Turning comic panels into cinematic stories.",
      voice: str = "en-US-GuyNeural",
      speech_rate: float = 1.0,
      speech_pitch: float = 1.0,
      return_base64: bool = True
  ) -> Dict[str, Any]:
      """Synthesizes a short audition audio sample for voice selection in UI."""
  ```
* **Exports**: `__all__ = ["preview_voice_sample"]`

#### 4. `voice_catalog_service.py`
* **Data Constants (Top)**:
  * `VOICE_MAP: Dict[str, str]`: Mapping of UI labels and aliases to canonical Edge-TTS neural codes.
  * `CATALOG_VOICES: List[Dict[str, Any]]`: Structured catalog with gender, language, accent, and style tags.
* **Local Helpers (Top)**:
  * `_match_voice_by_role(gender: str, role: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  def get_voice_catalog(
      language: Optional[str] = None,
      gender: Optional[str] = None
  ) -> List[Dict[str, Any]]:
      """Returns all supported Edge-TTS neural voices filtered by language and gender."""
  ```
* **Exports**: `__all__ = ["VOICE_MAP", "get_voice_catalog"]`

---

### Module: `backend/features/audio/mixer/`

#### 1. `track_mixer_service.py`
* **Local Helpers (Top)**:
  * `_resolve_audio_segment(source_path: Optional[str], b64_data: Optional[str], fallback_duration: float) -> AudioSegment`
  * `_fetch_remote_bgm_segment(url: str) -> Optional[AudioSegment]`
  * `_apply_ducking_envelope(bgm: AudioSegment, voice: AudioSegment, ducking_factor: float, normal_vol: float) -> AudioSegment`
* **Main Public API (Bottom)**:
  ```python
  async def mix_audio_tracks(
      voice_audio_path: Optional[str] = None,
      voice_audio_base64: Optional[str] = None,
      bgm_audio_url: Optional[str] = None,
      voice_volume: float = 1.0,
      bgm_volume: float = 0.35,
      auto_ducking: bool = True,
      ducking_factor: float = 0.25,
      target_duration: Optional[float] = None,
      output_format: Literal["mp3", "wav"] = "mp3",
      return_base64: bool = False
  ) -> Dict[str, Any]:
      """Blends voice narration and background music into a master audio file with volume control, looping, and ducking."""
  ```
* **Exports**: `__all__ = ["mix_audio_tracks"]`

---

### Module: `backend/features/audio/transcription/`

#### 1. `transcribe_service.py`
* **Local Helpers (Top)**:
  * `_get_whisper_provider(model_name: Union[WhisperModel, str], device: str) -> Any`
* **Main Public API (Bottom)**:
  ```python
  async def transcribe_speech_audio(
      audio_path: str,
      model_name: Union[WhisperModel, str] = WhisperModel.BASE,
      language: Optional[str] = None,
      task: Literal["transcribe", "translate"] = "transcribe",
      verbose: bool = False
  ) -> Dict[str, Any]:
      """Transcribes speech from audio using Whisper, returning full transcript, confidence, and segments."""
  ```
* **Exports**: `__all__ = ["transcribe_speech_audio"]`

#### 2. `subtitle_generator_service.py`
* **Local Helpers (Top)**:
  * `_format_srt_timestamp(seconds: float) -> str`
  * `_format_vtt_timestamp(seconds: float) -> str`
  * `_build_srt_content(segments: List[Any]) -> str`
  * `_build_vtt_content(segments: List[Any]) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def generate_subtitles(
      audio_path: str,
      output_format: Literal["srt", "vtt"] = "srt",
      output_path: Optional[str] = None,
      model_name: Union[WhisperModel, str] = WhisperModel.BASE,
      language: Optional[str] = None
  ) -> str:
      """Generates timestamped SRT or WebVTT subtitle caption files from spoken audio."""
  ```
* **Exports**: `__all__ = ["generate_subtitles"]`

#### 3. `word_timestamp_service.py`
* **Local Helpers (Top)**:
  * `_interpolate_word_durations(segment_text: str, start_time: float, end_time: float, segment_id: int) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def extract_word_timestamps(
      audio_path: str,
      model_name: Union[WhisperModel, str] = WhisperModel.BASE,
      language: Optional[str] = None
  ) -> List[Dict[str, Any]]:
      """Extracts word-level timestamps and confidence scores for kinetic typography and animated speech bubbles."""
  ```
* **Exports**: `__all__ = ["extract_word_timestamps"]`

#### 4. `batch_transcribe_service.py`
* **Local Helpers (Top)**:
  * `_transcribe_file_safe(provider: Any, path: str, language: Optional[str]) -> Optional[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def batch_transcribe_audio_files(
      audio_paths: List[str],
      model_name: Union[WhisperModel, str] = WhisperModel.BASE,
      language: Optional[str] = None
  ) -> List[Optional[Dict[str, Any]]]:
      """Transcribes a batch of audio files in sequence, returning individual transcript dictionaries."""
  ```
* **Exports**: `__all__ = ["batch_transcribe_audio_files"]`

---

### Module: `backend/features/audio/alignment/`

#### 1. `dialogue_aligner_service.py`
* **Local Helpers (Top)**:
  * `_fuzzy_match_ocr_with_whisper(ocr_texts: List[str], whisper_words: List[Dict[str, Any]]) -> List[Dict[str, Any]]`
  * `_extract_normalized_rms_peaks(audio_path: str) -> Tuple[List[float], float]`
  * `_algorithmic_pacing_fallback(ocr_texts: List[str], error_msg: str) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  async def align_dialogue_with_audio(
      panel_id: str,
      audio_url: str,
      ocr_texts: List[str],
      language: Optional[str] = None
  ) -> Dict[str, Any]:
      """Aligns comic OCR dialogue bubbles to speech timestamps and extracts volume peaks for animated captions."""
  ```
* **Exports**: `__all__ = ["align_dialogue_with_audio"]`

---

### Module: `backend/features/audio/dsp/`

#### 1. `silence_detector_service.py`
* **Local Helpers (Top)**:
  * `_compute_frame_silence(energy_db: np.ndarray, threshold_db: float, min_duration: float, times: np.ndarray) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def detect_silence_intervals(
      audio_path: str,
      threshold_db: float = -40.0,
      min_duration: float = 0.5
  ) -> List[Dict[str, Any]]:
      """Detects silence windows below decibel threshold persisting for at least min_duration seconds."""
  ```
* **Exports**: `__all__ = ["detect_silence_intervals"]`

#### 2. `energy_segmenter_service.py`
* **Local Helpers (Top)**:
  * `_find_energy_boundaries(energy: np.ndarray, threshold: float, num_segments: int, hop_len: int, sr: int) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def segment_audio_by_energy(
      audio_path: str,
      num_segments: int = 10,
      energy_threshold: Optional[float] = None
  ) -> List[Dict[str, Any]]:
      """Partitions an audio track into discrete energy segments for rhythmic video motion pacing."""
  ```
* **Exports**: `__all__ = ["segment_audio_by_energy"]`

#### 3. `spectral_analyzer_service.py`
* **Local Helpers (Top)**:
  * `_calculate_spectral_features(y: np.ndarray, sr: int) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  async def analyze_spectral_statistics(
      audio_path: str
  ) -> Dict[str, Any]:
      """Extracts waveform acoustic metrics: duration, sample rate, tempo BPM, RMS energy, spectral centroid, and beats."""
  ```
* **Exports**: `__all__ = ["analyze_spectral_statistics"]`

---

### Module: `backend/features/audio/settings/`

#### 1. `audio_settings_service.py`
* **Local Helpers (Top)**:
  * `_parse_user_preferences(current_user: Optional[Dict[str, Any]]) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  def get_active_audio_settings(
      current_user: Optional[Dict[str, Any]] = None
  ) -> AudioSettingsModel: ...

  def persist_audio_settings(
      settings_data: AudioSettingsModel,
      current_user: Optional[Dict[str, Any]] = None
  ) -> AudioSettingsModel: ...
  ```
* **Exports**: `__all__ = ["get_active_audio_settings", "persist_audio_settings"]`

#### 2. `preset_catalog_service.py`
* **Presets Registry (Top)**:
  * `PRESETS_REGISTRY: List[AudioPresetItem]` (Epic Narrator, Shonen Hero, Dark Anti-Hero, Sultry Romance, Anime Heroine, Cyberpunk AI, British Gentleman, Korean Manhwa Lead, Japanese Manga Lead)
* **Main Public API (Bottom)**:
  ```python
  def list_audio_presets(
      category: Optional[str] = None
  ) -> List[AudioPresetItem]:
      """Returns curated cinematic voice actor and atmospheric audio presets."""
  ```
* **Exports**: `__all__ = ["list_audio_presets"]`

---

### Module: `backend/features/audio/utils/` (Pure Foundational Layer)

#### 1. `text_normalizer.py`
* **Local Helpers (Top)**:
  * `_reduce_repeated_letters(match: re.Match) -> str`
  * `_clean_ocr_contractions(text: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  def normalize_comic_speech_text(text: str) -> str:
      """Cleans comic dialogue, removes SFX brackets, repairs broken OCR contractions, and formats natural pauses for TTS."""
  ```
* **Exports**: `__all__ = ["normalize_comic_speech_text"]`

#### 2. `audio_io.py`
* **Local Helpers (Top)**:
  * `_is_valid_base64_audio(data: str) -> bool`
* **Main Public API (Bottom)**:
  ```python
  async def resolve_audio_to_buffer(source_url_or_path: str) -> Dict[str, Any]: ...
  def cache_audio_base64_payload(b64_str: str) -> Optional[str]: ...
  def estimate_spoken_duration(text: str, wpm: int = 145) -> float: ...
  ```
* **Exports**: `__all__ = ["resolve_audio_to_buffer", "cache_audio_base64_payload", "estimate_spoken_duration"]`

---

## 5. Architectural Guarantees: Caller Discipline & Separation of Concerns

1. **Elevation to Canonical Root**:
   - `backend/features/audio/` is the sole canonical source of truth for all audio features.
   - External routers in `backend/app/router/router.py` mount:
     ```python
     from features.audio.router import audio_router
     api_router.include_router(audio_router, prefix="/api/v1/audio", tags=["09. Audio Synthesis"])
     ```
2. **Transparent Backward-Compatibility Shim**:
   - `backend/features/video_editor/audio/` maintains `__init__.py`, `service.py`, `schemas.py`, and `router/` as thin re-exports from `features.audio` to guarantee that existing references in tests, video compilation, or external agent workflows continue functioning seamlessly without breaking changes.
3. **No External Imports of `_helpers`**: Outside routers, video services, and agents call **only** the single exported public function at the bottom of each service file.
4. **Explicit Exports via `__all__`**: Every service module defines `__all__` exposing only its canonical public API function.
5. **Decoupled AI Engine vs Domain Feature**:
   - `backend/ai_engine/providers/*` handles raw model lifecycles, hardware acceleration, and process execution.
   - `backend/features/audio/` handles comic storyboard business logic, multi-panel aggregation, duration matching, and user presets.
6. **Foundational Independence**: `utils/` contains pure helper functions and never imports high-level domain services or routers.
7. **Facade Class & Singleton**: `service.py` provides the canonical `AudioService` class and `audio_service` singleton which delegates cleanly to the new modular service functions.
