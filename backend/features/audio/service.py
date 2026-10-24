"""
backend/features/audio/service.py
─────────────────────────────────────────────────────────────────────────────
Audio domain unified service facade class and singleton instance.
Aggregates speech synthesis, multi-track mixing, subtitle generation,
dialogue synchronization, signal analysis, and settings.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional

from features.audio.schemas import AudioSettingsModel, AudioPresetItem
from features.audio.speech import (
    make_panel_speech,
    make_all_panel_speech,
    preview_voice,
    list_all_voices,
    VOICE_MAP,
)
from features.audio.mixer import (
    mix_sound_tracks,
    lower_music_when_speaking,
    loop_music,
    balance_volume,
)
from features.audio.subtitles import (
    turn_speech_into_text,
    make_srt_subtitles,
    make_vtt_subtitles,
    get_word_times,
    turn_many_files_into_text,
)
from features.audio.sync import (
    sync_text_to_speech,
    get_sound_waves,
    estimate_speech_timing,
)
from features.audio.analysis import (
    find_silent_parts,
    split_audio_by_energy,
    check_sound_details,
    cut_audio_clip,
)
from features.audio.settings import (
    load_audio_settings,
    save_audio_settings,
    get_preset_voices,
)

logger = logging.getLogger("sonikoma.audio.service")


class AudioService:
    """Unified service providing speech synthesis, mixing, transcription, alignment, and analysis."""

    def __init__(self):
        self.logger = logger
        self.voice_map = VOICE_MAP

    # ── Speech Methods ───────────────────────────────────────────────────────
    async def make_panel_speech(
        self,
        dialogue_list: List[str],
        target_duration: float = 4.0,
        voice: str = "en-US-GuyNeural",
        speech_rate: float = 1.0,
        speech_pitch: float = 1.0,
        return_base64: bool = True
    ) -> Dict[str, Any]:
        """Synthesizes speech audio for a panel."""
        return await make_panel_speech(
            dialogue_list=dialogue_list,
            target_duration=target_duration,
            voice=voice,
            speech_rate=speech_rate,
            speech_pitch=speech_pitch,
            return_base64=return_base64
        )

    # Backward-compatible alias
    generate_panel_audio = make_panel_speech
    generate_tts_audio = make_panel_speech

    async def preview_voice(
        self,
        text: str = "Welcome to Sonikoma.",
        voice: str = "en-US-GuyNeural",
        speech_rate: float = 1.0,
        speech_pitch: float = 1.0,
        return_base64: bool = True
    ) -> Dict[str, Any]:
        """Generates an audition sample for voice selection."""
        return await preview_voice(
            text=text,
            voice=voice,
            speech_rate=speech_rate,
            speech_pitch=speech_pitch,
            return_base64=return_base64
        )

    def list_voices(
        self,
        language: Optional[str] = None,
        gender: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lists supported neural voices."""
        return list_all_voices(language=language, gender=gender)

    # ── Mixer Methods ────────────────────────────────────────────────────────
    async def mix_tracks(
        self,
        voice_audio_path: Optional[str] = None,
        voice_audio_base64: Optional[str] = None,
        bgm_audio_url: Optional[str] = None,
        voice_volume: float = 1.0,
        bgm_volume: float = 0.35,
        auto_ducking: bool = True,
        ducking_factor: float = 0.25,
        target_duration: Optional[float] = None,
        output_format: str = "mp3",
        return_base64: bool = False
    ) -> Dict[str, Any]:
        """Mixes voiceover and background music tracks with auto-ducking."""
        return await mix_sound_tracks(
            voice_audio_path=voice_audio_path,
            voice_audio_base64=voice_audio_base64,
            bgm_audio_url=bgm_audio_url,
            voice_volume=voice_volume,
            bgm_volume=bgm_volume,
            auto_ducking=auto_ducking,
            ducking_factor=ducking_factor,
            target_duration=target_duration,
            output_format=output_format,
            return_base64=return_base64
        )

    # Backward-compatible alias
    mix_audio_tracks = mix_tracks

    # ── Subtitle & Transcription Methods ─────────────────────────────────────
    async def transcribe(
        self,
        audio_path: str,
        model_name: str = "base",
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """Transcribes speech from audio into written text."""
        return await turn_speech_into_text(
            audio_path=audio_path,
            model_name=model_name,
            language=language
        )

    async def generate_subtitles(
        self,
        audio_path: str,
        output_format: str = "srt",
        output_path: Optional[str] = None,
        language: Optional[str] = None
    ) -> str:
        """Exports .srt or .vtt subtitle files."""
        if output_format.lower() == "vtt":
            return await make_vtt_subtitles(audio_path, output_path=output_path, language=language)
        return await make_srt_subtitles(audio_path, output_path=output_path, language=language)

    async def get_word_timestamps(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Extracts word-level timestamps from audio."""
        return await get_word_times(audio_path=audio_path, language=language)

    # ── Synchronization Methods ──────────────────────────────────────────────
    async def sync_dialogue(
        self,
        panel_id: str,
        audio_url: str,
        ocr_texts: List[str],
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """Synchronizes comic OCR text with spoken audio."""
        return await sync_text_to_speech(
            panel_id=panel_id,
            audio_url=audio_url,
            ocr_texts=ocr_texts,
            language=language
        )

    # ── Signal Analysis Methods ──────────────────────────────────────────────
    async def analyze_audio(self, audio_path: str) -> Dict[str, Any]:
        """Extracts acoustic summary properties (duration, tempo BPM, energy)."""
        return await check_sound_details(audio_path)

    async def detect_silence(
        self,
        audio_path: str,
        threshold_db: float = -40.0,
        min_duration: float = 0.5
    ) -> List[Dict[str, Any]]:
        """Finds quiet moments and silent intervals in an audio file."""
        return await find_silent_parts(audio_path, threshold_db=threshold_db, min_duration=min_duration)

    async def segment_by_energy(
        self,
        audio_path: str,
        num_segments: int = 10,
        energy_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Divides audio into energy segments for video camera pacing."""
        return await split_audio_by_energy(audio_path, num_segments=num_segments, energy_threshold=energy_threshold)

    # ── Settings Methods ─────────────────────────────────────────────────────
    def get_settings(self, current_user: Optional[Dict[str, Any]] = None) -> AudioSettingsModel:
        """Retrieves active audio settings."""
        return load_audio_settings(current_user=current_user)

    def update_settings(
        self,
        settings_data: AudioSettingsModel,
        current_user: Optional[Dict[str, Any]] = None
    ) -> AudioSettingsModel:
        """Updates and persists audio settings."""
        return save_audio_settings(settings_data=settings_data, current_user=current_user)

    def get_presets(self, category: Optional[str] = None) -> List[AudioPresetItem]:
        """Lists curated character voice presets."""
        return get_preset_voices(category=category)


# Global singleton instance
audio_service = AudioService()

__all__ = [
    "AudioService",
    "audio_service",
]
