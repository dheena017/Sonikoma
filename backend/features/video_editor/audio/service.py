"""
backend/features/video_editor/audio/service.py
─────────────────────────────────────────────────────────────────────────────
Audio sub-domain unified service class and singleton instance.
Combines TTS generation, speech transcription, dialogue alignment, signal processing,
multi-track audio mixing, and settings management into a single cohesive interface.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional

from features.video_editor.audio.schemas import AudioSettingsModel, AudioPresetItem
from features.video_editor.audio.services import (
    # TTS
    generate_panel_audio,
    generate_tts_audio,
    generate_segment_with_retry,
    synthesize_panel_narration_audio,
    synthesize_dialogue_to_speech,
    # Voice Catalog
    VOICE_MAP,
    DEFAULT_VOICE,
    get_available_voices,
    get_supported_voice_list,
    normalize_voice_name,
    # Normalizer
    normalize_comic_text_for_human_speech,
    to_natural_sentence_case,
    sanitize_text_for_tts,
    # Mixer
    mix_audio_tracks_service,
    # Settings
    _global_audio_settings,
    DEFAULT_AUDIO_PRESETS,
    get_audio_settings_service,
    update_audio_settings_service,
    get_audio_presets_service,
    # Transcription
    generate_srt,
    generate_vtt,
    extract_words_with_timestamps,
    generate_json_transcript,
    batch_transcribe,
    transcribe_audio_service,
    generate_srt_service,
    generate_vtt_service,
    extract_words_service,
    batch_transcribe_service,
    transcribe_audio_to_text,
    export_srt_subtitles,
    export_vtt_subtitles,
    extract_timestamped_words,
    # Alignment
    align_dialogue_and_extract_peaks,
    align_dialogue_service,
    align_dialogue_with_audio_timestamps,
    # Processing
    detect_silence,
    segment_by_energy,
    extract_summary_stats,
    save_audio_segment,
    analyze_audio_service,
    detect_silence_service,
    segment_by_energy_service,
    load_audio_service,
    detect_audio_silence_segments,
    segment_audio_by_energy_peaks,
    analyze_audio_spectral_stats,
)

logger = logging.getLogger("sonikoma.video_editor.audio.service")


class AudioService:
    """Unified service providing TTS, mixing, transcription, alignment, settings, and audio processing."""

    def __init__(self):
        self.logger = logger
        self.voice_map = VOICE_MAP

    # ── TTS Methods ─────────────────────────────────────────────────────────
    async def generate_panel_audio(
        self,
        panel_id: str,
        dialogue_text: Optional[str] = None,
        narration_text: Optional[str] = None,
        voice: str = "en-US-GuyNeural",
        speed: float = 1.0,
        pitch: float = 1.0,
    ) -> Dict[str, Any]:
        """Synthesizes dialogue and narration audio for a panel."""
        return await generate_panel_audio(
            panel_id=panel_id,
            dialogue_text=dialogue_text,
            narration_text=narration_text,
            voice=voice,
            speed=speed,
            pitch=pitch,
        )

    async def generate_tts(
        self,
        text: str,
        voice: str = "en-US-GuyNeural",
        speech_rate: float = 1.0,
        speech_pitch: float = 1.0,
        return_base64: bool = True,
    ) -> Dict[str, Any]:
        """Generates TTS audio from raw text."""
        return await generate_tts_audio(
            text=text,
            voice=voice,
            speech_rate=speech_rate,
            speech_pitch=speech_pitch,
            return_base64=return_base64,
        )

    def get_voices(self) -> List[Dict[str, Any]]:
        """Returns the list of supported TTS voices."""
        return get_available_voices()

    def normalize_text(self, text: str) -> str:
        """Normalizes comic speech bubble text for natural speech synthesis."""
        return normalize_comic_text_for_human_speech(text)

    # ── Mixing Methods ──────────────────────────────────────────────────────
    async def mix_tracks(
        self,
        voice_audio_path: Optional[str] = None,
        voice_audio_base64: Optional[str] = None,
        bgm_audio_url: Optional[str] = None,
        voice_volume: float = 1.0,
        bgm_volume: float = 0.3,
        auto_ducking: bool = True,
        ducking_factor: float = 0.25,
        target_duration: Optional[float] = None,
        output_format: str = "mp3",
        return_base64: bool = False,
    ) -> Dict[str, Any]:
        """Blends voiceover and background music tracks with auto-ducking."""
        return await mix_audio_tracks_service(
            voice_audio_path=voice_audio_path,
            voice_audio_base64=voice_audio_base64,
            bgm_audio_url=bgm_audio_url,
            voice_volume=voice_volume,
            bgm_volume=bgm_volume,
            auto_ducking=auto_ducking,
            ducking_factor=ducking_factor,
            target_duration=target_duration,
            output_format=output_format,
            return_base64=return_base64,
        )

    # ── Settings & Preset Methods ───────────────────────────────────────────
    def get_settings(self, current_user: Optional[Dict[str, Any]] = None) -> AudioSettingsModel:
        """Returns current active audio settings."""
        return get_audio_settings_service(current_user=current_user)

    def update_settings(
        self,
        settings_data: AudioSettingsModel,
        current_user: Optional[Dict[str, Any]] = None
    ) -> AudioSettingsModel:
        """Updates and persists audio settings."""
        return update_audio_settings_service(settings_data=settings_data, current_user=current_user)

    def get_presets(self, category: Optional[str] = None) -> List[AudioPresetItem]:
        """Returns curated audio presets."""
        return get_audio_presets_service(category=category)

    # ── Transcription Methods ───────────────────────────────────────────────
    async def transcribe(self, audio_path: str, model_size: str = "base") -> Dict[str, Any]:
        """Transcribes speech from audio into text and segments."""
        return await transcribe_audio_service(audio_path=audio_path, model_name=model_size)

    async def generate_subtitles_srt(self, audio_path: str) -> str:
        """Generates SRT subtitle text from audio."""
        return await generate_srt_service(audio_path=audio_path)

    async def generate_subtitles_vtt(self, audio_path: str) -> str:
        """Generates VTT subtitle text from audio."""
        return await generate_vtt_service(audio_path=audio_path)

    # ── Alignment Methods ───────────────────────────────────────────────────
    async def align_dialogue(self, panel_id: str, audio_url: str, ocr_texts: List[str]) -> Dict[str, Any]:
        """Aligns dialogue OCR text lines with audio timestamps."""
        return await align_dialogue_service(panel_id=panel_id, audio_url=audio_url, ocr_texts=ocr_texts)

    # ── Signal Processing Methods ───────────────────────────────────────────
    async def analyze_audio(self, audio_path: str) -> Dict[str, Any]:
        """Calculates spectral features, duration, and energy stats."""
        return await analyze_audio_service(audio_path=audio_path)

    async def detect_silence(self, audio_path: str, threshold_db: float = 30.0, min_duration: float = 0.3) -> List[Dict[str, Any]]:
        """Detects silent intervals in an audio file."""
        return await detect_silence_service(audio_path=audio_path, threshold_db=threshold_db, min_duration=min_duration)


# Singleton instance
audio_service = AudioService()

__all__ = [
    "AudioService",
    "audio_service",
    # TTS
    "generate_panel_audio",
    "generate_tts_audio",
    "generate_segment_with_retry",
    "synthesize_panel_narration_audio",
    "synthesize_dialogue_to_speech",
    # Voice Catalog
    "VOICE_MAP",
    "DEFAULT_VOICE",
    "get_available_voices",
    "get_supported_voice_list",
    "normalize_voice_name",
    # Text Normalizer
    "normalize_comic_text_for_human_speech",
    "to_natural_sentence_case",
    "sanitize_text_for_tts",
    # Mixer
    "mix_audio_tracks_service",
    # Settings
    "_global_audio_settings",
    "DEFAULT_AUDIO_PRESETS",
    "get_audio_settings_service",
    "update_audio_settings_service",
    "get_audio_presets_service",
    # Transcription
    "generate_srt",
    "generate_vtt",
    "extract_words_with_timestamps",
    "generate_json_transcript",
    "batch_transcribe",
    "transcribe_audio_service",
    "generate_srt_service",
    "generate_vtt_service",
    "extract_words_service",
    "batch_transcribe_service",
    "transcribe_audio_to_text",
    "export_srt_subtitles",
    "export_vtt_subtitles",
    "extract_timestamped_words",
    # Alignment
    "align_dialogue_and_extract_peaks",
    "align_dialogue_service",
    "align_dialogue_with_audio_timestamps",
    # Processing
    "detect_silence",
    "segment_by_energy",
    "extract_summary_stats",
    "save_audio_segment",
    "analyze_audio_service",
    "detect_silence_service",
    "segment_by_energy_service",
    "load_audio_service",
    "detect_audio_silence_segments",
    "segment_audio_by_energy_peaks",
    "analyze_audio_spectral_stats",
]
