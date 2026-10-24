"""
backend/features/audio/sync/backup_pacing_service.py
─────────────────────────────────────────────────────────────────────────────
Rule-based algorithmic speech timing fallback: calculates natural reading
and word timings when audio recordings or Whisper engines are unavailable.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _spread_words_across_time(
    sentence: str,
    start_time: float,
    seconds_per_word: float = 0.35
) -> List[Dict[str, Any]]:
    """Splits a sentence into word chunks and assigns sequential millisecond timestamps."""
    words = sentence.split()
    timed_words = []
    for idx, w in enumerate(words):
        w_start = round(start_time + (idx * seconds_per_word), 2)
        w_end = round(start_time + ((idx + 1) * seconds_per_word), 2)
        timed_words.append({
            "word": w,
            "start": w_start,
            "end": w_end,
        })
    return timed_words


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

def estimate_speech_timing(
    ocr_texts: List[str],
    panel_id: str,
    why_needed: Optional[str] = None
) -> Dict[str, Any]:
    """
    Guesses natural speech timing from word counts when audio recordings are not available.
    """
    dialogue_map = []
    cur_t = 0.5  # initial lead-in silence

    for idx, raw_text in enumerate(ocr_texts or []):
        text = str(raw_text).strip()
        if not text:
            continue
        words = text.split()
        dur = max(1.0, len(words) * 0.35)

        dialogue_map.append({
            "ocr_index": idx,
            "text": text,
            "start_time": round(cur_t, 2),
            "end_time": round(cur_t + dur, 2),
            "words": _spread_words_across_time(text, cur_t, 0.35)
        })
        cur_t += dur + 0.3  # pause between speech bubbles

    return {
        "success": True,
        "panel_id": panel_id,
        "dialogue_map": dialogue_map,
        "audio_peaks": [],
        "peaks_fps": 30.0,
        "warning": why_needed or "Timing generated using algorithmic pacing fallback.",
    }


__all__ = ["estimate_speech_timing"]
