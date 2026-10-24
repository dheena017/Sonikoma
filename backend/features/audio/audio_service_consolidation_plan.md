# Exhaustive Specification: Unified `backend/features/audio/` Architecture

## 1. Architectural Elevation: Elevating Audio to a Standalone Top-Level Domain

### 1.1 The Rationale for Elevation
Previously, audio capabilities were nested inside `backend/features/video_editor/audio/`. However:
1. **Multi-Domain Consumers**: Audio synthesis, speech recognition, and audio processing are not only used by the video editor, but also by **AI Series Studio** (`features/intelligence/series/`), **Autonomous Storyboard Agents** (`features/creative/agent/`), **Interactive OCR Speech Extraction** (`features/intelligence/ai/`), and the **Core API Gateway**.
2. **Architectural Symmetry**: Elevating Audio creates an elegant, standardized top-level tri-media core:
   * `backend/features/image/` ── Visual panel splitting, OCR, composite vision, layer separation.
   * `backend/features/audio/` ── Neural speech synthesis, subtitles, multi-track mixing, sound analysis.
   * `backend/features/video/` ── Canvas rendering, transition composition, and video compilation.
3. **Clean Decoupling**: Decouples audio business logic from video editor timelines and provides a clean foundation for standalone audio narration, podcast generation, voice audition, and multilingual dubbing.

### 1.2 Ecosystem Discovery: Complete Audio Map in Sonikoma

| Layer / Subsystem | Location | Description & Role | Target State |
| :--- | :--- | :--- | :--- |
| **Top-Level Domain (Canonical)** | `backend/features/audio/` | Primary standalone business logic: Speech synthesis, batch narration, track mixing, subtitles, dialogue sync, sound analysis, and presets. | **Canonical Home** |
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

## 2. Directory Blueprint (Simplest Plain English)

Every folder, file, and function is named in plain, intuitive everyday English so any developer immediately understands its purpose without confusion:

```
backend/features/audio/
│
├── __init__.py                               # Unified top-level package facade (re-exports all public services)
├── schemas.py                                # All Pydantic request/response models for audio operations
├── service.py                                # AudioService facade class & audio_service singleton
├── README.md                                 # Architecture documentation & simple usage guide
│
├── speech/                                   # ── 1. VOICE & SPEECH GENERATION ──
│   ├── __init__.py
│   ├── panel_speech_service.py               # Creates voice audio for a single comic panel or text line
│   ├── batch_speech_service.py               # Creates voice audio for all story panels at the same time
│   ├── voice_preview_service.py              # Plays a quick 2-second audio sample of any chosen voice
│   └── voice_list_service.py                 # Catalog of all available languages, male/female character voices
│
├── mixer/                                    # ── 2. MUSIC & SOUND MIXING ──
│   ├── __init__.py
│   ├── track_mixer_service.py                # Combines character voices, background music, and sound effects
│   ├── auto_ducking_service.py               # Automatically lowers background music volume when characters speak
│   ├── music_loop_service.py                 # Repeats music smoothly so it never cuts off before the scene ends
│   └── volume_normalizer_service.py          # Balances sound levels so nothing is too quiet or painfully loud
│
├── subtitles/                                # ── 3. SPEECH-TO-TEXT & SUBTITLES ──
│   ├── __init__.py
│   ├── speech_to_text_service.py             # Listens to audio and writes out the spoken words
│   ├── srt_subtitles_service.py              # Creates standard movie .srt subtitle files
│   ├── vtt_subtitles_service.py              # Creates web .vtt subtitle files for browsers and mobile players
│   ├── word_timer_service.py                 # Gets the exact start and end millisecond for every single word
│   └── batch_transcribe_service.py           # Transcribes a list of multiple audio files in sequence
│
├── sync/                                     # ── 4. TIMING & SPEECH SYNCHRONIZATION ──
│   ├── __init__.py
│   ├── text_audio_sync_service.py            # Matches comic speech bubble text with spoken audio timestamps
│   ├── sound_wave_service.py                 # Extracts audio loudness waves for pulsing/bouncing bubble animations
│   └── backup_pacing_service.py              # Calculates natural speaking pace when audio files are missing
│
├── analysis/                                 # ── 5. SOUND ANALYSIS & CLIPPING ──
│   ├── __init__.py
│   ├── silence_finder_service.py             # Finds pauses, quiet moments, and dead air in audio recordings
│   ├── energy_split_service.py               # Splits audio into loud vs calm moments for video camera pacing
│   ├── sound_info_service.py                 # Checks audio duration, speed tempo (BPM), and volume stats
│   └── audio_cutter_service.py               # Cuts out any clean piece or slice from an audio file
│
├── settings/                                 # ── 6. SETTINGS & CHARACTER PRESETS ──
│   ├── __init__.py
│   ├── audio_settings_service.py             # Loads and saves user audio volume and voice preferences
│   └── preset_voices_service.py              # Ready-to-use character styles: Narrator, Hero, Villain, Romance
│
├── utils/                                    # ── 7. SHARED FOUNDATIONAL TOOLS ──
│   ├── __init__.py                           # Clean facade exporting text cleaners, audio math, and file tools
│   ├── clean_text.py                         # Cleans messy comic text, removes [SFX], and fixes OCR spelling
│   ├── audio_math.py                         # Simple calculations for volume gain, sample rates, and duration
│   └── audio_files.py                        # Loads, saves, and caches audio files on local disk
│
└── router/                                   # ── 8. WEB API ROUTES (/api/v1/audio) ──
    ├── __init__.py                           # Connects all audio web routes together into one router
    ├── speech.py                             # Web routes to create speech, list voices, and preview sounds
    ├── mixer.py                              # Web routes to mix music and voice tracks with ducking
    ├── subtitles.py                          # Web routes to get text transcripts, word timing, and subtitle files
    ├── sync.py                               # Web routes to synchronize comic bubbles with audio
    ├── analysis.py                           # Web routes to find silence, split by energy, and check sound stats
    └── settings.py                           # Web routes to get/save audio settings and load presets
```

---

## 3. Universal File Structure Rule: "Helpers at Top, Main API at Bottom"

Every single service file strictly adheres to the following structural standard:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. File Header & Docstring (Explains purpose in simplest English)      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Imports (Standard library, 3rd party, foundational utils)           │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Module Constants & Private Configuration                            │
├────────────────────────────────────────────────────────────────────────┤
│ 4. TOP: Internal Helper Utilities (Prefixed with `_`)                  │
│    - Private retries, conversions, and math calculations               │
│    - Sub-step implementations in simple English                        │
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

## 4. Standardized Function Specifications (Every Function in Simplest English)

---

### Module: `backend/features/audio/speech/`

#### 1. `panel_speech_service.py`
* **Purpose**: Makes spoken audio for one panel or text line using Microsoft Edge-TTS with automatic retries and duration fitting.
* **Local Helpers (Top)**:
  * `_try_speaking_with_retry(text: str, voice: str, temp_path: str, speed: Optional[str], pitch: Optional[str], max_tries: int) -> bool`
  * `_fit_sound_to_time(sound: AudioSegment, target_ms: int, force_time: bool) -> AudioSegment`
  * `_save_and_pack_sound(sound: AudioSegment, output_path: Optional[str], as_base64: bool) -> Tuple[Optional[str], Optional[str], float]`
* **Main Public API (Bottom)**:
  ```python
  async def make_panel_speech(
      dialogue_list: List[str],
      target_duration: float = 4.0,
      voice: str = "en-US-GuyNeural",
      speech_rate: float = 1.0,
      speech_pitch: float = 1.0,
      output_path: Optional[str] = None,
      force_duration: bool = False,
      return_base64: bool = True
  ) -> Dict[str, Any]:
      """Makes spoken voice audio for one panel with optional length fitting."""
  ```
* **Exports**: `__all__ = ["make_panel_speech"]`

#### 2. `batch_speech_service.py`
* **Purpose**: Makes voice audio for all story panels in parallel.
* **Local Helpers (Top)**:
  * `_get_panel_text(item: BatchPanelAudioItem) -> List[str]`
  * `_make_one_panel_sound(item: BatchPanelAudioItem, global_voice: str, speed: float, pitch: float, make_dialogue: bool, make_narrative: bool, force_redo: bool) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  async def make_all_panel_speech(
      panels: List[BatchPanelAudioItem],
      voice: str = "en-US-GuyNeural",
      speech_rate: float = 1.0,
      speech_pitch: float = 1.0,
      generate_dialogue: bool = True,
      generate_narrative: bool = True,
      force_regenerate: bool = False
  ) -> List[Dict[str, Any]]:
      """Makes voice audio for all panels in the story at the same time."""
  ```
* **Exports**: `__all__ = ["make_all_panel_speech"]`

#### 3. `voice_preview_service.py`
* **Purpose**: Creates an instant 2-second audio sample so users can test a voice before choosing it.
* **Local Helpers (Top)**:
  * `_set_speed_and_pitch(speed: float, pitch: float) -> Tuple[Optional[str], Optional[str]]`
* **Main Public API (Bottom)**:
  ```python
  async def preview_voice(
      text: str = "Welcome to Sonikoma. Turning comic panels into cinematic stories.",
      voice: str = "en-US-GuyNeural",
      speech_rate: float = 1.0,
      speech_pitch: float = 1.0,
      return_base64: bool = True
  ) -> Dict[str, Any]:
      """Plays a quick 2-second audio sample of any chosen voice."""
  ```
* **Exports**: `__all__ = ["preview_voice"]`

#### 4. `voice_list_service.py`
* **Purpose**: Lists all available languages and character voices.
* **Data Constants (Top)**:
  * `VOICE_MAP: Dict[str, str]`: Friendly names mapped to official voice codes.
  * `VOICE_CATALOG: List[Dict[str, Any]]`: Full voice details (language, accent, gender, style).
* **Local Helpers (Top)**:
  * `_pick_voice_for_character(gender: str, role: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  def list_all_voices(
      language: Optional[str] = None,
      gender: Optional[str] = None
  ) -> List[Dict[str, Any]]:
      """Lists all available voices filtered by language and gender."""
  ```
* **Exports**: `__all__ = ["VOICE_MAP", "list_all_voices"]`

---

### Module: `backend/features/audio/mixer/`

#### 1. `track_mixer_service.py`
* **Purpose**: Combines character voices, background music, and sound effects into one finished audio file.
* **Local Helpers (Top)**:
  * `_open_sound_track(file_path: Optional[str], base64_str: Optional[str], default_duration: float) -> AudioSegment`
  * `_place_track_at_second(master: AudioSegment, new_track: AudioSegment, time_ms: int) -> AudioSegment`
* **Main Public API (Bottom)**:
  ```python
  async def mix_sound_tracks(
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
      """Combines character voices, background music, and sound effects into one finished audio track."""
  ```
* **Exports**: `__all__ = ["mix_sound_tracks"]`

#### 2. `auto_ducking_service.py`
* **Purpose**: Automatically makes background music quieter whenever a character is talking.
* **Local Helpers (Top)**:
  * `_find_talking_times(voice_track: AudioSegment, quiet_threshold_db: float) -> List[Tuple[int, int]]`
  * `_make_music_quieter(music: AudioSegment, talking_times: List[Tuple[int, int]], volume_drop: float, fade_ms: int) -> AudioSegment`
* **Main Public API (Bottom)**:
  ```python
  def lower_music_when_speaking(
      music_track: AudioSegment,
      voice_track: AudioSegment,
      ducking_factor: float = 0.25,
      fade_duration_ms: int = 300
  ) -> AudioSegment:
      """Automatically lowers music volume while characters speak, then brings it back up smoothly."""
  ```
* **Exports**: `__all__ = ["lower_music_when_speaking"]`

#### 3. `music_loop_service.py`
* **Purpose**: Loops background music smoothly so it never ends early or stops suddenly.
* **Local Helpers (Top)**:
  * `_count_loops_needed(music_length_ms: int, desired_length_ms: int) -> int`
* **Main Public API (Bottom)**:
  ```python
  def loop_music(
      music_track: AudioSegment,
      target_duration_ms: int,
      crossfade_ms: int = 500
  ) -> AudioSegment:
      """Repeats music smoothly so it matches the full length of the scene."""
  ```
* **Exports**: `__all__ = ["loop_music"]`

#### 4. `volume_normalizer_service.py`
* **Purpose**: Balances sound volume so everything is easy to hear without hurting ears.
* **Local Helpers (Top)**:
  * `_find_loudest_part(sound: AudioSegment, safe_ceiling_db: float) -> float`
* **Main Public API (Bottom)**:
  ```python
  def balance_volume(
      audio_track: AudioSegment,
      target_loudness_dbfs: float = -16.0,
      peak_limit_db: float = -1.0
  ) -> AudioSegment:
      """Adjusts volume so it is neither too quiet nor too loud, and stops harsh distortions."""
  ```
* **Exports**: `__all__ = ["balance_volume"]`

---

### Module: `backend/features/audio/subtitles/`

#### 1. `speech_to_text_service.py`
* **Purpose**: Listens to speech in audio and writes down the spoken words.
* **Local Helpers (Top)**:
  * `_start_speech_model(model_name: Union[WhisperModel, str], device: str) -> Any`
* **Main Public API (Bottom)**:
  ```python
  async def turn_speech_into_text(
      audio_path: str,
      model_name: Union[WhisperModel, str] = WhisperModel.BASE,
      language: Optional[str] = None,
      task: Literal["transcribe", "translate"] = "transcribe",
      verbose: bool = False
  ) -> Dict[str, Any]:
      """Listens to speech audio and writes out the words with timestamps."""
  ```
* **Exports**: `__all__ = ["turn_speech_into_text"]`

#### 2. `srt_subtitles_service.py`
* **Purpose**: Creates standard movie `.srt` subtitle files with numbers and timestamps.
* **Local Helpers (Top)**:
  * `_write_srt_time(seconds: float) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def make_srt_subtitles(
      audio_path: str,
      output_path: Optional[str] = None,
      model_name: Union[WhisperModel, str] = WhisperModel.BASE,
      language: Optional[str] = None
  ) -> str:
      """Creates a standard movie .srt subtitle file from spoken audio."""
  ```
* **Exports**: `__all__ = ["make_srt_subtitles"]`

#### 3. `vtt_subtitles_service.py`
* **Purpose**: Creates web `.vtt` subtitle files for online video players and mobile browsers.
* **Local Helpers (Top)**:
  * `_write_vtt_time(seconds: float) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def make_vtt_subtitles(
      audio_path: str,
      output_path: Optional[str] = None,
      model_name: Union[WhisperModel, str] = WhisperModel.BASE,
      language: Optional[str] = None
  ) -> str:
      """Creates a web-ready .vtt subtitle file for web video players."""
  ```
* **Exports**: `__all__ = ["make_vtt_subtitles"]`

#### 4. `word_timer_service.py`
* **Purpose**: Finds the exact start and end millisecond for every single word for karaoke text animations.
* **Local Helpers (Top)**:
  * `_split_words_by_time(text: str, start_time: float, end_time: float, segment_id: int) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def get_word_times(
      audio_path: str,
      model_name: Union[WhisperModel, str] = WhisperModel.BASE,
      language: Optional[str] = None
  ) -> List[Dict[str, Any]]:
      """Finds the exact start and end time for every spoken word in the audio."""
  ```
* **Exports**: `__all__ = ["get_word_times"]`

#### 5. `batch_transcribe_service.py`
* **Purpose**: Listens to many audio files one after another and returns transcripts for each.
* **Local Helpers (Top)**:
  * `_transcribe_single_audio(speech_model: Any, path: str, language: Optional[str]) -> Optional[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def turn_many_files_into_text(
      audio_paths: List[str],
      model_name: Union[WhisperModel, str] = WhisperModel.BASE,
      language: Optional[str] = None
  ) -> List[Optional[Dict[str, Any]]]:
      """Transcribes a whole list of audio files into text one after another."""
  ```
* **Exports**: `__all__ = ["turn_many_files_into_text"]`

---

### Module: `backend/features/audio/sync/`

#### 1. `text_audio_sync_service.py`
* **Purpose**: Matches comic speech bubble text with character voices so bubbles light up in time with speech.
* **Local Helpers (Top)**:
  * `_match_bubble_to_spoken_word(bubble_lines: List[str], spoken_words: List[Dict[str, Any]]) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def sync_text_to_speech(
      panel_id: str,
      audio_url: str,
      ocr_texts: List[str],
      language: Optional[str] = None
  ) -> Dict[str, Any]:
      """Matches comic text bubbles with character speech timing so bubbles highlight as characters talk."""
  ```
* **Exports**: `__all__ = ["sync_text_to_speech"]`

#### 2. `sound_wave_service.py`
* **Purpose**: Measures the loudness wave of the voice so speech bubbles can bounce or pulse to speech.
* **Local Helpers (Top)**:
  * `_smooth_sound_waves(raw_wave: np.ndarray) -> List[float]`
* **Main Public API (Bottom)**:
  ```python
  def get_sound_waves(
      audio_path: str,
      step_size: int = 512,
      window_size: int = 2048
  ) -> Tuple[List[float], float]:
      """Gets sound loudness waves so speech bubbles can pulse and react to character voices."""
  ```
* **Exports**: `__all__ = ["get_sound_waves"]`

#### 3. `backup_pacing_service.py`
* **Purpose**: Guesses natural speaking and reading time when audio files are missing.
* **Local Helpers (Top)**:
  * `_spread_words_across_time(sentence: str, start_time: float, seconds_per_word: float) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  def estimate_speech_timing(
      ocr_texts: List[str],
      panel_id: str,
      why_needed: Optional[str] = None
  ) -> Dict[str, Any]:
      """Guesses natural speech timing from word counts when audio recordings are not available."""
  ```
* **Exports**: `__all__ = ["estimate_speech_timing"]`

---

### Module: `backend/features/audio/analysis/`

#### 1. `silence_finder_service.py`
* **Purpose**: Finds silent parts, pauses, and dead air in an audio recording.
* **Local Helpers (Top)**:
  * `_find_quiet_spots(energy_levels: np.ndarray, quiet_cutoff_db: float, min_gap_s: float, times: np.ndarray) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def find_silent_parts(
      audio_path: str,
      threshold_db: float = -40.0,
      min_duration: float = 0.5
  ) -> List[Dict[str, Any]]:
      """Finds quiet moments and silent pauses in an audio recording."""
  ```
* **Exports**: `__all__ = ["find_silent_parts"]`

#### 2. `energy_split_service.py`
* **Purpose**: Splits audio into lively and quiet moments to guide video camera movements.
* **Local Helpers (Top)**:
  * `_find_loud_and_quiet_cuts(energy: np.ndarray, cutoff: float, max_cuts: int, step_len: int, sample_rate: int) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def split_audio_by_energy(
      audio_path: str,
      num_segments: int = 10,
      energy_threshold: Optional[float] = None
  ) -> List[Dict[str, Any]]:
      """Divides an audio track into lively versus calm moments for video motion pacing."""
  ```
* **Exports**: `__all__ = ["split_audio_by_energy"]`

#### 3. `sound_info_service.py`
* **Purpose**: Inspects an audio file and reports length, music speed tempo (BPM), and loudness range.
* **Local Helpers (Top)**:
  * `_read_sound_stats(samples: np.ndarray, sample_rate: int) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  async def check_sound_details(
      audio_path: str
  ) -> Dict[str, Any]:
      """Reports audio details: total length, music speed tempo (BPM), loudness range, and musical beats."""
  ```
* **Exports**: `__all__ = ["check_sound_details"]`

#### 4. `audio_cutter_service.py`
* **Purpose**: Cuts out any piece or slice from an audio file between two timestamps.
* **Local Helpers (Top)**:
  * `_keep_time_inside_track(start_s: int, end_s: int, total_s: int) -> Tuple[int, int]`
* **Main Public API (Bottom)**:
  ```python
  async def cut_audio_clip(
      audio_path: str,
      start_time: float,
      end_time: float,
      output_path: Optional[str] = None
  ) -> str:
      """Cuts out a piece of audio between two timestamps and saves it to disk."""
  ```
* **Exports**: `__all__ = ["cut_audio_clip"]`

---

### Module: `backend/features/audio/settings/`

#### 1. `audio_settings_service.py`
* **Purpose**: Loads and saves active audio settings and user volume/voice preferences.
* **Local Helpers (Top)**:
  * `_read_user_preferences(user_data: Optional[Dict[str, Any]]) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  def load_audio_settings(
      current_user: Optional[Dict[str, Any]] = None
  ) -> AudioSettingsModel: ...

  def save_audio_settings(
      settings_data: AudioSettingsModel,
      current_user: Optional[Dict[str, Any]] = None
  ) -> AudioSettingsModel: ...
  ```
* **Exports**: `__all__ = ["load_audio_settings", "save_audio_settings"]`

#### 2. `preset_voices_service.py`
* **Purpose**: Provides ready-to-use voice styles for story characters: Narrator, Hero, Villain, Romance.
* **Presets Registry (Top)**:
  * `PRESET_VOICE_LIST: List[AudioPresetItem]` (Epic Narrator, Shonen Hero, Dark Villain, Romance Lead, Anime Heroine, Cyberpunk AI, British Lore Master, Korean Lead, Japanese Lead)
* **Main Public API (Bottom)**:
  ```python
  def get_preset_voices(
      category: Optional[str] = None
  ) -> List[AudioPresetItem]:
      """Returns curated character and atmosphere voice presets."""
  ```
* **Exports**: `__all__ = ["get_preset_voices"]`

---

### Module: `backend/features/audio/utils/` (Pure Foundational Layer)

#### 1. `clean_text.py`
* **Purpose**: Cleans comic dialogue text so text-to-speech reads it smoothly and naturally without reading symbol names or bracketed sound effects aloud.
* **Local Helpers (Top)**:
  * `_shorten_repeated_letters(match: re.Match) -> str`
  * `_fix_spelling_and_slang(text: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  def clean_comic_text(text: str) -> str:
      """Cleans comic text, removes bracketed sound effects, fixes typos, and adds breathing pauses for natural speech."""
  ```
* **Exports**: `__all__ = ["clean_comic_text"]`

#### 2. `audio_math.py`
* **Purpose**: Simple everyday calculations for volume gain, sample rates, and duration estimation.
* **Main Public API (Bottom)**:
  ```python
  def decibels_to_volume(db: float) -> float: ...
  def volume_to_decibels(volume: float) -> float: ...
  def guess_speaking_seconds(text: str, words_per_minute: int = 145, min_seconds: float = 1.5) -> float: ...
  def seconds_to_samples(seconds: float, sample_rate: int) -> int: ...
  ```
* **Exports**: `__all__ = ["decibels_to_volume", "volume_to_decibels", "guess_speaking_seconds", "seconds_to_samples"]`

#### 3. `audio_files.py`
* **Purpose**: Reads, writes, caches, and downloads audio files and base64 strings.
* **Local Helpers (Top)**:
  * `_is_valid_base64_sound(data: str) -> bool`
* **Main Public API (Bottom)**:
  ```python
  async def download_audio(source: str) -> Dict[str, Any]: ...
  def cache_audio(base64_data: str) -> Optional[str]: ...
  def save_audio(audio_bytes: bytes, filename: str, extension: str = "mp3") -> str: ...
  ```
* **Exports**: `__all__ = ["download_audio", "cache_audio", "save_audio"]`

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
