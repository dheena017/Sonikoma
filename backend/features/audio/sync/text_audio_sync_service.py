"""
backend/features/audio/sync/text_audio_sync_service.py
─────────────────────────────────────────────────────────────────────────────
Speech bubble synchronizer: matches comic OCR bubble text with spoken speech
audio timestamps using fuzzy string matching and volume peak extraction.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import difflib
import tempfile
import logging
from typing import List, Dict, Any, Optional

from features.audio.utils.audio_files import download_audio
from features.audio.subtitles.word_timer_service import get_word_times
from features.audio.sync.sound_wave_service import get_sound_waves
from features.audio.sync.backup_pacing_service import estimate_speech_timing

logger = logging.getLogger("sonikoma.audio.sync.dialogue")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _match_bubble_to_spoken_word(
    bubble_lines: List[str],
    spoken_words: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Fuzzy matches sequential OCR bubble text lines against Whisper word timestamps."""
    if not spoken_words:
        return []

    whisper_texts = [w.get("word", w.get("text", "")).lower() for w in spoken_words]
    dialogue_map = []
    current_search_idx = 0

    for ocr_idx, raw_ocr in enumerate(bubble_lines):
        ocr_clean = raw_ocr.strip().lower()
        if not ocr_clean:
            continue

        ocr_words = ocr_clean.split()
        if not ocr_words:
            continue

        best_match = None
        best_ratio = 0.0
        window_sizes = [max(1, len(ocr_words) - 2), len(ocr_words), len(ocr_words) + 2]

        for w_size in window_sizes:
            if w_size > len(whisper_texts) - current_search_idx:
                w_size = len(whisper_texts) - current_search_idx
                if w_size <= 0:
                    break

            for i in range(current_search_idx, len(whisper_texts) - w_size + 1):
                candidate_slice = whisper_texts[i : i + w_size]
                candidate_str = " ".join(candidate_slice)
                ratio = difflib.SequenceMatcher(None, ocr_clean, candidate_str).ratio()

                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = {
                        "start_idx": i,
                        "end_idx": i + w_size - 1,
                        "ratio": ratio,
                        "matched_text": candidate_str,
                    }

        if best_match and float(best_match["ratio"]) > 0.4:
            start_word = spoken_words[int(best_match["start_idx"])]
            end_word = spoken_words[int(best_match["end_idx"])]

            dialogue_map.append({
                "ocr_index": ocr_idx,
                "ocr_text": raw_ocr,
                "whisper_text": best_match["matched_text"],
                "start_time": start_word.get("start_time", 0.0),
                "end_time": end_word.get("end_time", 0.0),
                "confidence": round(float(best_match["ratio"]), 2),
                "words": spoken_words[int(best_match["start_idx"]) : int(best_match["end_idx"]) + 1]
            })
            current_search_idx = int(best_match["end_idx"]) + 1

    return dialogue_map


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def sync_text_to_speech(
    panel_id: str,
    audio_url: str,
    ocr_texts: List[str],
    language: Optional[str] = None
) -> Dict[str, Any]:
    """
    Matches comic text bubbles with character speech timing so bubbles highlight as characters talk.
    """
    temp_path = None
    try:
        resolved = await download_audio(audio_url)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_f:
            tmp_f.write(resolved["data"])
            temp_path = tmp_f.name

        # 1. Get word timestamps via Whisper
        spoken_words = await get_word_times(temp_path, language=language)

        # 2. Extract sound wave loudness peaks for UI animation
        peaks, peaks_fps = get_sound_waves(temp_path)

        # 3. Match bubbles to spoken words
        dialogue_map = _match_bubble_to_spoken_word(ocr_texts, spoken_words)

        # If speech recognition returned zero matches, fall back gracefully
        if not dialogue_map and ocr_texts:
            logger.info("Fuzzy match yielded no bubbles; using algorithmic pacing fallback.")
            fallback = estimate_speech_timing(ocr_texts, panel_id, "Fuzzy match low confidence")
            fallback["audio_peaks"] = peaks
            fallback["peaks_fps"] = peaks_fps
            return fallback

        return {
            "success": True,
            "panel_id": panel_id,
            "dialogue_map": dialogue_map,
            "audio_peaks": peaks,
            "peaks_fps": peaks_fps,
        }

    except Exception as exc:
        logger.warning(f"Could not sync dialogue with audio for panel '{panel_id}': {exc}. Using backup pacing.")
        return estimate_speech_timing(ocr_texts, panel_id, str(exc))

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


__all__ = ["sync_text_to_speech"]
