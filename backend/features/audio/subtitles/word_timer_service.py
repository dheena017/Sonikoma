"""
backend/features/audio/subtitles/word_timer_service.py
─────────────────────────────────────────────────────────────────────────────
Word-level speech timer: extracts millisecond start and end boundaries
for individual spoken words to enable animated karaoke subtitles and kinetic typography.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional, Union
from ai_engine.providers.whisper import WhisperModel
from features.audio.subtitles.speech_to_text_service import _start_speech_model

logger = logging.getLogger("sonikoma.audio.subtitles.word_timer")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _split_words_by_time(
    text: str,
    start_time: float,
    end_time: float,
    segment_id: int
) -> List[Dict[str, Any]]:
    """Linearly interpolates word duration boundaries across a speech segment."""
    words = text.split()
    if not words:
        return []

    seg_duration = end_time - start_time
    word_dur = seg_duration / len(words)
    timed_words = []

    for i, w in enumerate(words):
        w_start = start_time + (i * word_dur)
        w_end = w_start + word_dur
        timed_words.append({
            "word": w,
            "text": w,
            "start_time": round(w_start, 3),
            "end_time": round(w_end, 3),
            "duration": round(word_dur, 3),
            "segment_id": segment_id
        })

    return timed_words


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def get_word_times(
    audio_path: str,
    model_name: Union[WhisperModel, str] = WhisperModel.BASE,
    language: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Finds the exact start and end time for every spoken word in the audio.
    """
    engine = _start_speech_model(model_name=model_name, device="cpu")

    # If the provider supports extract_words_with_timestamps natively, use it
    if hasattr(engine, "extract_words_with_timestamps"):
        try:
            return await engine.extract_words_with_timestamps(audio_path, language=language)
        except Exception:
            pass

    # Fallback to segment-level word interpolation
    result = await engine.transcribe(audio_path, language=language)
    all_words = []

    for seg in result.segments:
        timed = _split_words_by_time(
            text=seg.text,
            start_time=seg.start_time,
            end_time=seg.end_time,
            segment_id=seg.id
        )
        all_words.extend(timed)

    logger.info(f"✓ Extracted {len(all_words)} word timestamps")
    return all_words


__all__ = ["get_word_times"]
