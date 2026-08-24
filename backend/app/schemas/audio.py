"""
backend/app/schemas/audio.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for audio synthesis, analysis, and transcription.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from app.providers.whisper import WhisperModel


# =============================================================================
# 1. Speech Synthesis & Dialogue Alignment
# =============================================================================

class AlignDialogueRequest(BaseModel):
    """Aligns audio files with detected OCR text."""
    audio_url: str = Field(..., description="URL of the audio file to analyze")
    ocr_texts: List[str] = Field(..., description="Array of OCR text strings detected in the panel")


class AudioGenerateRequest(BaseModel):
    """Text-To-Speech (TTS) audio synthesis settings using Edge-TTS."""
    dialogue_list: List[str] = Field(
        default_factory=list,
        description="Ordered list of dialogue strings to synthesize"
    )
    target_duration: float = Field(
        default=4.5, ge=0.1, le=600.0,
        description="Target duration of output audio in seconds"
    )
    voice: Optional[str] = Field(
        default="en-US-GuyNeural",
        description="Edge-TTS voice code (e.g. 'en-US-GuyNeural', 'en-GB-SoniaNeural')"
    )
    return_base64: bool = Field(
        default=True,
        description="If true, returns audio as base64 string; if false, saves to a temp file and returns its path"
    )
    speech_rate: Optional[float] = Field(
        default=1.0,
        description="Speed of generated TTS audio"
    )
    speech_pitch: Optional[float] = Field(
        default=1.0,
        description="Pitch of generated TTS audio"
    )


# =============================================================================
# 2. Audio Analysis & Segmentation
# =============================================================================

class AudioPathRequest(BaseModel):
    """Simple file path wrapper for audio processing."""
    audio_path: str


class SilenceDetectRequest(BaseModel):
    """Detects silence based on decibel threshold and duration."""
    audio_path: str
    threshold_db: Optional[float] = Field(default=-40.0, description="Silence threshold in dB")
    min_duration: Optional[float] = Field(default=0.5, description="Minimum silence duration in seconds")


class EnergySegmentRequest(BaseModel):
    """Divides audio into segments based on energy levels."""
    audio_path: str
    num_segments: Optional[int] = Field(default=10, description="Number of segments to divide audio into")
    energy_threshold: Optional[float] = Field(default=0.01, description="Energy threshold for segmentation")


# =============================================================================
# 3. Transcription & Subtitles (Whisper)
# =============================================================================

class TranscribeRequest(BaseModel):
    """Transcribes speech using OpenAI Whisper."""
    model_config = ConfigDict(protected_namespaces=())
    audio_path: str
    language: Optional[str] = None
    task: Optional[str] = Field("transcribe", description="Either 'transcribe' or 'translate'")
    verbose: Optional[bool] = False
    model_name: Optional[WhisperModel] = WhisperModel.BASE


class SubtitleRequest(BaseModel):
    """Generates subtitle files from audio."""
    model_config = ConfigDict(protected_namespaces=())
    audio_path: str
    output_path: Optional[str] = None
    language: Optional[str] = None
    model_name: Optional[WhisperModel] = WhisperModel.BASE


class ExtractWordsRequest(BaseModel):
    """Extracts word-level timestamps from audio."""
    model_config = ConfigDict(protected_namespaces=())
    audio_path: str
    language: Optional[str] = None
    model_name: Optional[WhisperModel] = WhisperModel.BASE


class BatchTranscribeRequest(BaseModel):
    """Transcribes multiple audio files in batch."""
    model_config = ConfigDict(protected_namespaces=())
    audio_paths: List[str]
    language: Optional[str] = None
    model_name: Optional[WhisperModel] = WhisperModel.BASE


# =============================================================================
# 4. Audio Settings, Presets, and Mixing DTOs
# =============================================================================

class AudioSettingsModel(BaseModel):
    """Global and user-level audio synthesis configuration settings."""
    model_config = ConfigDict(protected_namespaces=())
    default_voice: str = Field(default="en-US-GuyNeural", description="Default Edge-TTS voice identifier")
    speech_rate: float = Field(default=1.0, ge=0.25, le=3.0, description="Speech rate speed multiplier (1.0 = normal)")
    speech_pitch: float = Field(default=1.0, ge=0.25, le=3.0, description="Speech pitch modifier (1.0 = normal)")
    master_volume: float = Field(default=1.0, ge=0.0, le=2.0, description="Master audio volume multiplier")
    bgm_volume: float = Field(default=0.35, ge=0.0, le=1.0, description="Default background music track volume (0.0 to 1.0)")
    sfx_volume: float = Field(default=0.75, ge=0.0, le=1.0, description="Default sound effects track volume (0.0 to 1.0)")
    auto_ducking: bool = Field(default=True, description="Automatically lower background music volume when dialogue speaks")
    ducking_factor: float = Field(default=0.25, ge=0.0, le=1.0, description="Volume level for BGM during dialogue ducking")
    audio_format: str = Field(default="mp3", description="Audio container format: 'mp3', 'wav', 'aac', 'ogg'")
    sample_rate: int = Field(default=44100, description="Target audio sample rate in Hz (44100 or 48000)")
    enable_normalization: bool = Field(default=True, description="Apply dynamic range normalization (LUFS compliance)")
    whisper_model: Optional[str] = Field(default="base", description="Default OpenAI Whisper model for speech recognition")
    elevenlabs_voice_id: Optional[str] = Field(default=None, description="Optional ElevenLabs voice ID for premium narration")
    elevenlabs_stability: float = Field(default=0.5, ge=0.0, le=1.0, description="ElevenLabs voice stability setting")
    elevenlabs_similarity_boost: float = Field(default=0.75, ge=0.0, le=1.0, description="ElevenLabs similarity boost setting")


class AudioPreviewRequest(BaseModel):
    """Request payload to test or preview voice settings with sample text."""
    model_config = ConfigDict(protected_namespaces=())
    text: str = Field(default="Welcome to Sonikoma. Turning comic panels into cinematic stories.", description="Sample dialogue text to speak")
    voice: Optional[str] = Field(default="en-US-GuyNeural", description="Voice identifier")
    speech_rate: Optional[float] = Field(default=1.0, ge=0.25, le=3.0, description="Speech rate multiplier")
    speech_pitch: Optional[float] = Field(default=1.0, ge=0.25, le=3.0, description="Speech pitch multiplier")
    provider: Optional[str] = Field(default="edge-tts", description="TTS Provider: 'edge-tts' or 'elevenlabs'")
    return_base64: bool = Field(default=True, description="Return base64 audio data")


class AudioMixRequest(BaseModel):
    """Request payload to mix voiceover, background music (BGM), and sound effects (SFX) tracks."""
    model_config = ConfigDict(protected_namespaces=())
    voice_audio_base64: Optional[str] = Field(default=None, description="Base64 encoded voiceover audio track")
    voice_audio_path: Optional[str] = Field(default=None, description="Server file path to voiceover audio")
    bgm_audio_url: Optional[str] = Field(default=None, description="URL or server path to background music")
    bgm_volume: float = Field(default=0.35, ge=0.0, le=1.0, description="BGM volume multiplier")
    voice_volume: float = Field(default=1.0, ge=0.0, le=2.0, description="Voice track volume multiplier")
    auto_ducking: bool = Field(default=True, description="Enable automatic background music ducking")
    ducking_factor: float = Field(default=0.25, ge=0.0, le=1.0, description="Ducking volume multiplier")
    target_duration: Optional[float] = Field(default=None, description="Target total duration in seconds")
    output_format: str = Field(default="mp3", description="Desired mixed audio format: 'mp3' or 'wav'")
    return_base64: bool = Field(default=True, description="Return mixed audio as base64 string")


class AudioPresetItem(BaseModel):
    """Preset configuration for character voices and audio atmospheres."""
    model_config = ConfigDict(protected_namespaces=())
    id: str
    name: str
    category: str
    voice: str
    speech_rate: float
    speech_pitch: float
    description: str
    sample_text: str
