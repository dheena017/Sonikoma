"""Series Audio Service for Sonikoma AI Series Studio.

Performs high-quality vocal dubbing using Microsoft Edge-TTS with multi-character
voice profiles, natural sentence cadence optimization, pitch/rate controls,
and local disk persistence under data/local_media/series_audio/.
"""

import os
import re
import logging
from typing import Dict, Any, List, Optional
from common.audio import clean_speech_script
from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.schemas import ChapterSession, CharacterDNA, InteractiveSpeechBubble
from ai_engine.providers.edge_tts import EdgeTTSProvider, DEFAULT_VOICES, VOICE_LIST

logger = logging.getLogger("sonikoma.services.series.audio")


class SeriesAudioService:
    def __init__(self):
        # Base audio storage directory mounted at /media
        base_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "local_media", "series_audio")
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
                if char.voice_id and char.voice_id in VOICE_LIST:
                    return char.voice_id
                if char.gender == "female":
                    return DEFAULT_VOICES["protagonist_female"] if char.role == "protagonist" else DEFAULT_VOICES["side_female"]
                if char.gender == "male":
                    return DEFAULT_VOICES["antagonist"] if char.role == "antagonist" else DEFAULT_VOICES["protagonist_male"]

        # Fallback heuristic on name
        s_lower = speaker_name.lower()
        if any(female_name in s_lower for female_name in ["luna", "aria", "elena", "girl", "woman", "queen", "lady"]):
            return DEFAULT_VOICES["protagonist_female"]
        return DEFAULT_VOICES["protagonist_male"]

    async def generate_bubble_audio(
        self,
        series_id: str,
        bubble: InteractiveSpeechBubble,
        cast: List[CharacterDNA],
        format_type: str = "manhwa"
    ) -> Optional[str]:
        """Synthesize Edge-TTS mp3 for a single dialogue bubble with cadence tuning."""
        clean_text = clean_speech_script(re.sub(r'[*_~`]', '', bubble.text))
        if not clean_text:
            return None

        voice_id = self._pick_voice_for_speaker(bubble.speaker, cast, format_type)
        provider = EdgeTTSProvider(voice=voice_id)

        s_dir = self._get_series_audio_dir(series_id)
        filename = f"{bubble.id}.mp3"
        filepath = os.path.join(s_dir, filename)

        try:
            # Generate Edge-TTS audio stream with natural dialogue cadence
            await provider.generate_to_file(
                text=clean_text,
                output_path=filepath,
                rate="+0%",
                pitch="+0Hz"
            )
            # Web accessible URL path routed via /media/series_audio/
            return f"/media/series_audio/{series_id}/{filename}"
        except Exception as e:
            logger.error(f"[SeriesAudioService] Failed TTS synthesis for bubble {bubble.id}: {e}")
            return None

    async def dub_chapter_dialogue(
        self,
        series_id: str,
        chapter_id: str,
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """Execute full batch Edge-TTS vocal dubbing for all dialogue bubbles in a chapter."""
        series = ai_series_repo.get_series(series_id)
        if not series:
            raise ValueError(f"Series '{series_id}' not found.")

        chapter = ai_series_repo.get_chapter(chapter_id)
        if not chapter:
            raise ValueError(f"Chapter '{chapter_id}' not found.")

        cast = series.characters or []
        format_type = getattr(series, "format_type", "manhwa")
        total_bubbles = 0
        dubbed_bubbles = 0
        skipped_bubbles = 0

        for panel in chapter.panels:
            for bubble in panel.interactive_bubbles:
                total_bubbles += 1
                if bubble.audio_url and not force_regenerate:
                    skipped_bubbles += 1
                    continue

                audio_url = await self.generate_bubble_audio(series_id, bubble, cast, format_type)
                if audio_url:
                    bubble.audio_url = audio_url
                    dubbed_bubbles += 1

        # Persist updated chapter back to SQLite
        ai_series_repo.save_chapter(chapter)
        logger.info(
            f"[SeriesAudioService] Dubbed Chapter {chapter.chapter_number} ({series_id}): "
            f"{dubbed_bubbles} generated, {skipped_bubbles} cached."
        )

        return {
            "status": "completed",
            "series_id": series_id,
            "chapter_id": chapter_id,
            "chapter_number": chapter.chapter_number,
            "dubbed_bubbles": dubbed_bubbles,
            "cached_bubbles": skipped_bubbles,
            "total_dialogue_count": total_bubbles
        }

    async def audition_character_voice(
        self,
        character_name: str,
        gender: str,
        role: str,
        sample_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate on-the-fly vocal audition sample for Series Bible character creation UI."""
        dummy_char = CharacterDNA(name=character_name, gender=gender, role=role)
        voice_id = self._pick_voice_for_speaker(character_name, [dummy_char])
        provider = EdgeTTSProvider(voice=voice_id)

        sample = sample_text or f"Greetings! I am {character_name}. Prepare yourself for our journey."
        s_dir = os.path.join(self.audio_dir, "auditions")
        os.makedirs(s_dir, exist_ok=True)

        filename = f"audition_{character_name.lower().replace(' ', '_')}_{voice_id.replace('-', '_')}.mp3"
        filepath = os.path.join(s_dir, filename)

        try:
            await provider.generate_to_file(text=sample, output_path=filepath)
            return {
                "character": character_name,
                "voice_id": voice_id,
                "voice_name": VOICE_LIST.get(voice_id, voice_id),
                "audio_url": f"/media/series_audio/auditions/{filename}",
                "sample_text": sample
            }
        except Exception as e:
            logger.error(f"[SeriesAudioService] Voice audition failed for {character_name}: {e}")
            raise RuntimeError(f"Vocal preview generation failed: {e}")


series_audio_service = SeriesAudioService()
