"""Series Audio Service for Sonikoma AI Series Studio.

Performs high-quality vocal dubbing using Microsoft Edge-TTS with multi-character
voice profiles, natural sentence cadence optimization, pitch/rate controls,
and local disk persistence under data/media/series_audio/.
"""

import os
import re
import logging
from typing import Dict, Any, List, Optional
from common.audio import clean_speech_script
from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.schemas import ChapterSession, CharacterDNA, InteractiveSpeechBubble
from ai_engine.providers.edge_tts import EdgeTTSProvider, DEFAULT_VOICES, VOICE_LIST, VOICE_MAP

logger = logging.getLogger("sonikoma.services.series.audio")


class SeriesAudioService:
    def __init__(self):
        # Base audio storage directory mounted at /media
        from database.config import MEDIA_SERIES_AUDIO_DIR
        os.makedirs(MEDIA_SERIES_AUDIO_DIR, exist_ok=True)
        self.audio_dir = MEDIA_SERIES_AUDIO_DIR

    def _get_series_audio_dir(self, series_id: str) -> str:
        s_dir = os.path.join(self.audio_dir, series_id)
        os.makedirs(s_dir, exist_ok=True)
        return s_dir

    def _pick_voice_for_speaker(
        self, speaker_name: str, cast: List[CharacterDNA], format_type: str = "manhwa", character_id: Optional[str] = None
    ) -> str:
        """Resolve voice model based on character identity, gender, role, and format medium."""
        # 1. Match by character_id if provided
        if character_id:
            for char in cast:
                if (char.character_id == character_id or char.id == character_id) and char.voice_id and char.voice_id in VOICE_MAP:
                    return char.voice_id

        # 2. Match by speaker name
        speaker_clean = speaker_name.strip().lower() if speaker_name else ""
        for char in cast:
            if speaker_clean and char.name.strip().lower() == speaker_clean:
                if char.voice_id and char.voice_id in VOICE_MAP:
                    return char.voice_id
                gender = (char.gender or "male").lower()
                role = (char.role or "supporting").lower()
                role_voice_map = {
                    ("female", "protagonist"): DEFAULT_VOICES.get("protagonist_female", "en-US-JennyNeural"),
                    ("female", "antagonist"): DEFAULT_VOICES.get("side_female", "en-US-AriaNeural"),
                    ("female", "supporting"): DEFAULT_VOICES.get("side_female", "en-US-AriaNeural"),
                    ("male", "protagonist"): DEFAULT_VOICES.get("protagonist_male", "en-US-ChristopherNeural"),
                    ("male", "antagonist"): DEFAULT_VOICES.get("antagonist", "en-US-GuyNeural"),
                    ("male", "supporting"): DEFAULT_VOICES.get("protagonist_male", "en-US-ChristopherNeural"),
                }
                return role_voice_map.get((gender, role), DEFAULT_VOICES.get("protagonist_male", "en-US-ChristopherNeural"))

        # 3. Format-aware fallback
        if "anime" in format_type.lower():
            return "ja-JP-NanamiNeural" if any(w in speaker_clean for w in ["girl", "chan", "san", "she"]) else "ja-JP-KeitaNeural"
        return DEFAULT_VOICES.get("protagonist_male", "en-US-ChristopherNeural")

    async def generate_bubble_audio(
        self,
        series_id: str,
        bubble: InteractiveSpeechBubble,
        cast: List[CharacterDNA],
        format_type: str = "manhwa",
        voice_override: Optional[str] = None,
    ) -> Optional[str]:
        """Synthesize Edge-TTS mp3 for a single dialogue bubble with cadence tuning."""
        raw_text = getattr(bubble, "text", "") or ""
        clean_text = clean_speech_script(re.sub(r'[*_~`]', '', raw_text))
        if not clean_text:
            return None

        speaker = bubble.speaker_name or getattr(bubble, "speaker", "") or "Narrator"
        char_id = getattr(bubble, "character_id", None)
        voice_id = voice_override if (voice_override and voice_override in VOICE_MAP) else self._pick_voice_for_speaker(speaker, cast, format_type, character_id=char_id)
        provider = EdgeTTSProvider(voice=voice_id)

        s_dir = self._get_series_audio_dir(series_id)
        bubble_id = bubble.bubble_id or bubble.id or "bubble"
        filename = f"{bubble_id}.mp3"
        filepath = os.path.join(s_dir, filename)

        # Re-use cached audio if already synthesized
        if os.path.exists(filepath) and os.path.getsize(filepath) > 100 and not voice_override:
            bubble.duration_seconds = max(1.5, round(len(clean_text) / 14.0, 1))
            return f"/media/series_audio/{series_id}/{filename}"

        try:
            await provider.generate_to_file(
                text=clean_text,
                output_path=filepath,
                rate="+0%",
                pitch="+0Hz"
            )
            bubble.duration_seconds = max(1.5, round(len(clean_text) / 14.0, 1))
            return f"/media/series_audio/{series_id}/{filename}"
        except Exception as e:
            logger.error(f"[SeriesAudioService] Failed TTS synthesis for bubble {bubble_id}: {e}")
            return None


    async def synthesize_speech(
        self,
        series_id: str,
        text: str,
        speaker_name: str,
        voice_name: Optional[str] = None,
        pitch: str = "+0Hz",
        rate: str = "+0%",
    ) -> Dict[str, Any]:
        """Synthesize vocal performance for a single line of dialogue."""
        from uuid import uuid4
        project = ai_series_repo.get_project(series_id)
        cast = project.cast if project else []
        clean_text = clean_speech_script(re.sub(r'[*_~`]', '', text))

        voice_id = (
            voice_name
            if (voice_name and voice_name in VOICE_MAP)
            else self._pick_voice_for_speaker(speaker_name, cast)
        )
        provider = EdgeTTSProvider(voice=voice_id)

        track_id = f"trk_{uuid4().hex[:8]}"
        s_dir = self._get_series_audio_dir(series_id)
        filename = f"{track_id}.mp3"
        filepath = os.path.join(s_dir, filename)

        await provider.generate_to_file(
            text=clean_text, output_path=filepath, rate=rate, pitch=pitch
        )

        logger.info(f"[SeriesAudioService] Synthesized voice track for '{speaker_name}' in series {series_id}.")
        return {
            "track_id": track_id,
            "speaker_name": speaker_name,
            "text": clean_text,
            "audio_url": f"/media/series_audio/{series_id}/{filename}",
            "voice_name": VOICE_MAP.get(voice_id, voice_id),
            "duration_seconds": max(1.5, round(len(clean_text) / 15.0, 1)),
        }

    async def synthesize_chapter_audio(
        self,
        series_id: str,
        session_number: int,
        chapter_number: int,
        voice_override: Optional[str] = None,
    ) -> ChapterSession:
        """Synthesize vocal audio for all dialogue bubbles across an entire chapter."""
        project = ai_series_repo.get_project(series_id)
        if not project:
            raise ValueError(f"AI Series '{series_id}' not found.")

        chapter = ai_series_repo.get_chapter(series_id, session_number, chapter_number)
        if not chapter:
            raise ValueError(f"Chapter S{session_number}:C{chapter_number} not found in series '{series_id}'.")

        cast = project.cast or []
        format_type = getattr(project, "format_type", "manhwa")
        total_bubbles = 0
        dubbed_bubbles = 0

        for panel in chapter.panels:
            if not panel.speech_bubbles and panel.speech_text:
                panel.speech_bubbles = [
                    InteractiveSpeechBubble(
                        bubble_id=f"bub_{panel.panel_id or panel.id}_1",
                        text=panel.speech_text,
                        speaker_name=panel.speaker_id or (cast[0].name if cast else "Narrator"),
                    )
                ]

            bubbles = panel.speech_bubbles or []
            panel_primary_audio = None
            for bubble in bubbles:
                total_bubbles += 1
                if bubble.audio_url and not voice_override:
                    if not panel_primary_audio:
                        panel_primary_audio = bubble.audio_url
                    continue
                audio_url = await self.generate_bubble_audio(
                    series_id=series_id,
                    bubble=bubble,
                    cast=cast,
                    format_type=format_type,
                    voice_override=voice_override,
                )
                if audio_url:
                    bubble.audio_url = audio_url
                    dubbed_bubbles += 1
                    if not panel_primary_audio:
                        panel_primary_audio = audio_url

            if panel_primary_audio and not panel.audio_url:
                panel.audio_url = panel_primary_audio

        ai_series_repo.save_chapter(series_id, chapter)
        logger.info(
            f"[SeriesAudioService] Completed chapter audio synthesis S{session_number}:C{chapter_number} "
            f"({dubbed_bubbles}/{total_bubbles} bubbles processed)."
        )
        return chapter

    async def dub_chapter_dialogue(
        self,
        series_id: str,
        chapter_id: str,
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """Execute full batch Edge-TTS vocal dubbing for all dialogue bubbles in a chapter by ID."""
        project = ai_series_repo.get_project(series_id)
        if not project:
            raise ValueError(f"Series '{series_id}' not found.")

        chapter = ai_series_repo.get_chapter_by_id(series_id, chapter_id)
        if not chapter:
            raise ValueError(f"Chapter '{chapter_id}' not found in series '{series_id}'.")

        cast = project.cast or []
        format_type = getattr(project, "format_type", "manhwa")
        total_bubbles = 0
        dubbed_bubbles = 0
        skipped_bubbles = 0

        for panel in chapter.panels:
            if not panel.speech_bubbles and panel.speech_text:
                panel.speech_bubbles = [
                    InteractiveSpeechBubble(
                        bubble_id=f"bub_{panel.panel_id or panel.id}_1",
                        text=panel.speech_text,
                        speaker_name=panel.speaker_id or (cast[0].name if cast else "Narrator"),
                    )
                ]

            bubbles = panel.speech_bubbles or []
            panel_primary_audio = None
            for bubble in bubbles:
                total_bubbles += 1
                if bubble.audio_url and not force_regenerate:
                    skipped_bubbles += 1
                    if not panel_primary_audio:
                        panel_primary_audio = bubble.audio_url
                    continue

                audio_url = await self.generate_bubble_audio(series_id, bubble, cast, format_type)
                if audio_url:
                    bubble.audio_url = audio_url
                    dubbed_bubbles += 1
                    if not panel_primary_audio:
                        panel_primary_audio = audio_url

            if panel_primary_audio and not panel.audio_url:
                panel.audio_url = panel_primary_audio

        # Persist updated chapter back to SQLite
        ai_series_repo.save_chapter(series_id, chapter)
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
                "voice_name": VOICE_MAP.get(voice_id, voice_id),
                "audio_url": f"/media/series_audio/auditions/{filename}",
                "sample_text": sample
            }
        except Exception as e:
            logger.error(f"[SeriesAudioService] Voice audition failed for {character_name}: {e}")
            raise RuntimeError(f"Vocal preview generation failed: {e}")


series_audio_service = SeriesAudioService()
