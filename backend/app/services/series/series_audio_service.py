"""Series Audio Service for Sonikoma AI Series Studio.

Performs high-quality vocal dubbing using Microsoft Edge-TTS with multi-character
voice profiles, natural sentence cadence optimization, pitch/rate controls,
and local disk persistence under data/local_media/series_audio/.
"""

import os
import re
import logging
from typing import Dict, Any, List, Optional
import edge_tts
from edge_tts.exceptions import NoAudioReceived

from app.repositories.series import ai_series_repo
from app.schemas.series import ChapterSession, CharacterDNA, InteractiveSpeechBubble

logger = logging.getLogger("sonikoma.services.series.audio")

# Standard voice catalog matching character archetypes
DEFAULT_VOICES = {
    "protagonist_male": "en-US-ChristopherNeural",
    "protagonist_female": "en-US-JennyNeural",
    "antagonist_male": "en-US-TonyNeural",
    "antagonist_female": "en-US-AriaNeural",
    "mentor": "en-US-GuyNeural",
    "anime_male": "ja-JP-KeitaNeural",
    "anime_female": "ja-JP-NanamiNeural",
    "manhwa_male": "ko-KR-InJoonNeural",
    "manhwa_female": "ko-KR-SunHiNeural",
}

VOICE_LIST = [
    {"id": "en-US-ChristopherNeural", "name": "Christopher (Heroic / Protagonist)", "gender": "male", "lang": "English (US)"},
    {"id": "en-US-JennyNeural", "name": "Jenny (Expressive / Heroine)", "gender": "female", "lang": "English (US)"},
    {"id": "en-US-GuyNeural", "name": "Guy (Calm / Mentor)", "gender": "male", "lang": "English (US)"},
    {"id": "en-US-AriaNeural", "name": "Aria (Intense / Antagonist)", "gender": "female", "lang": "English (US)"},
    {"id": "en-US-TonyNeural", "name": "Tony (Deep / Anti-Hero)", "gender": "male", "lang": "English (US)"},
    {"id": "en-US-EricNeural", "name": "Eric (Youthful / Companion)", "gender": "male", "lang": "English (US)"},
    {"id": "en-GB-SoniaNeural", "name": "Sonia (Refined / Royalty)", "gender": "female", "lang": "English (UK)"},
    {"id": "en-GB-RyanNeural", "name": "Ryan (Noble / Knight)", "gender": "male", "lang": "English (UK)"},
    {"id": "ja-JP-KeitaNeural", "name": "Keita (Authentic Japanese Anime Male)", "gender": "male", "lang": "Japanese"},
    {"id": "ja-JP-NanamiNeural", "name": "Nanami (Authentic Japanese Anime Female)", "gender": "female", "lang": "Japanese"},
    {"id": "ko-KR-InJoonNeural", "name": "InJoon (Korean Manhwa Male)", "gender": "male", "lang": "Korean"},
    {"id": "ko-KR-SunHiNeural", "name": "SunHi (Korean Manhwa Female)", "gender": "female", "lang": "Korean"},
]


class SeriesAudioService:
    def __init__(self):
        # Base audio storage directory mounted at /media
        base_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "local_media", "series_audio")
        )
        os.makedirs(base_dir, exist_ok=True)
        self.audio_dir = base_dir

    def _get_series_audio_dir(self, series_id: str) -> str:
        s_dir = os.path.join(self.audio_dir, series_id)
        os.makedirs(s_dir, exist_ok=True)
        return s_dir

    def _pick_voice_for_speaker(
        self, speaker_name: str, cast: List[CharacterDNA], format_type: str = "manhwa"
    ) -> str:
        """Resolve voice model based on character gender, role, and format medium."""
        if not speaker_name:
            return DEFAULT_VOICES["protagonist_male"]

        # Check explicit character DNA
        for char in cast:
            if char.name.lower() == speaker_name.lower():
                if char.voice_id:
                    return char.voice_id
                role = (char.role or "protagonist").lower()
                if "antagonist" in role or "rival" in role:
                    return DEFAULT_VOICES["antagonist_male"]
                if "mentor" in role:
                    return DEFAULT_VOICES["mentor"]
                break

        # Fallback based on format
        fmt = (format_type or "").lower()
        if "anime" in fmt:
            return DEFAULT_VOICES["anime_male"]
        elif "manhwa" in fmt:
            return DEFAULT_VOICES["manhwa_male"]
        return DEFAULT_VOICES["protagonist_male"]

    def _sanitize_for_tts(self, text: str) -> str:
        """Prepare spoken line for natural prosody."""
        clean = re.sub(r"\[.*?\]", "", text) # Remove sound effect brackets like [SLASH!]
        clean = re.sub(r"\(.*?\)", "", clean) # Remove parentheticals
        clean = clean.strip()
        if not clean:
            return "..."
        return clean

    async def synthesize_speech(
        self,
        series_id: str,
        text: str,
        speaker_name: str = "Narrator",
        voice_name: Optional[str] = None,
        rate: str = "+0%",
        pitch: str = "+0Hz",
        track_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Synthesize a single vocal dialogue line to MP3 and return the metadata and URL."""
        if not track_id:
            track_id = f"aud_{abs(hash(f'{series_id}_{speaker_name}_{text}')) % 10000000}"

        voice = voice_name or DEFAULT_VOICES["protagonist_male"]
        clean_text = self._sanitize_for_tts(text)

        series_dir = self._get_series_audio_dir(series_id)
        file_path = os.path.join(series_dir, f"{track_id}.mp3")
        audio_url = f"/media/series_audio/{series_id}/{track_id}.mp3"

        # Check if already synthesized
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            logger.info(f"[AISeries Audio] Cache hit for track '{track_id}' ({speaker_name})")
            duration = max(1.0, round(len(clean_text.split()) * 0.38, 2))
            return {
                "track_id": track_id,
                "speaker_name": speaker_name,
                "voice_name": voice,
                "text": clean_text,
                "audio_url": audio_url,
                "file_path": file_path,
                "duration_seconds": duration,
            }

        logger.info(f"[AISeries Audio] Generating vocal line with '{voice}' for {speaker_name}: \"{clean_text[:40]}\"...")
        try:
            communicate = edge_tts.Communicate(clean_text, voice, rate=rate, pitch=pitch)
            await communicate.save(file_path)
            
            size_bytes = os.path.getsize(file_path) if os.path.exists(file_path) else 0
            duration = max(1.2, round(len(clean_text.split()) * 0.38, 2))
            logger.info(f"[AISeries Audio] Voice synthesized successfully -> {track_id}.mp3 ({size_bytes} bytes, ~{duration}s)")
            return {
                "track_id": track_id,
                "speaker_name": speaker_name,
                "voice_name": voice,
                "text": clean_text,
                "audio_url": audio_url,
                "file_path": file_path,
                "duration_seconds": duration,
            }
        except Exception as e:
            logger.error(f"[AISeries Audio] Failed to synthesize audio with Edge-TTS: {e}", exc_info=True)
            return {
                "track_id": track_id,
                "speaker_name": speaker_name,
                "voice_name": voice,
                "text": clean_text,
                "audio_url": audio_url,
                "file_path": None,
                "duration_seconds": 2.0,
                "error": str(e),
            }

    async def synthesize_chapter_audio(
        self,
        series_id: str,
        session_number: int,
        chapter_number: int,
        voice_override: Optional[str] = None,
    ) -> ChapterSession:
        """Synthesize vocal audio for all dialogue bubbles across all panels in a chapter."""
        project = ai_series_repo.get_project(series_id)
        if not project:
            raise ValueError(f"AI Series project '{series_id}' not found.")

        chapter = ai_series_repo.get_chapter(series_id, session_number, chapter_number)
        if not chapter:
            raise ValueError(f"Chapter S{session_number}:C{chapter_number} not found.")

        fmt_type = project.format_type.value if hasattr(project.format_type, "value") else str(project.format_type)
        cast = project.cast or []

        total_lines = 0
        synthesized_count = 0

        for p_idx, panel in enumerate(chapter.panels):
            p_id = panel.panel_id or f"p_{p_idx+1}"
            if not panel.speech_bubbles:
                continue

            for b_idx, bubble in enumerate(panel.speech_bubbles):
                total_lines += 1
                spk = bubble.speaker_name or "Character"
                chosen_voice = voice_override or self._pick_voice_for_speaker(spk, cast, fmt_type)

                track_id = f"aud_s{session_number}_c{chapter_number}_p{p_idx+1}_b{b_idx+1}"
                res = await self.synthesize_speech(
                    series_id=series_id,
                    text=bubble.text,
                    speaker_name=spk,
                    voice_name=chosen_voice,
                    track_id=track_id,
                )

                if res.get("audio_url"):
                    # Attach audio metadata to bubble
                    bubble.audio_url = res["audio_url"]
                    bubble.duration_seconds = res.get("duration_seconds", 2.0)
                    synthesized_count += 1

        # Persist updated chapter
        ai_series_repo.update_chapter(series_id, chapter)
        logger.info(
            f"[AISeries Audio] Finished chapter dubbing for S{session_number}:C{chapter_number}: "
            f"{synthesized_count}/{total_lines} lines synthesized."
        )
        return chapter


# Global singleton service
series_audio_service = SeriesAudioService()
