"""
backend/app/services/audio/alignment/dialogue_aligner.py
─────────────────────────────────────────────────────────────────────────────
Dialogue timestamp aligner: matches OCR text bubbles with Whisper audio speech
timestamps using fuzzy string alignment and Librosa volume peak extraction.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import logging
import difflib
from typing import List, Dict, Any, Optional
import numpy as np

from app.providers.whisper.engine import get_whisper_engine
from app.providers.librosa.engine import get_librosa_engine
import app.services.image.utils.image_utils as img_utils

try:
    import librosa
except ImportError:
    librosa = None

logger = logging.getLogger("sonikoma.services.audio.alignment.dialogue_aligner")


async def align_dialogue_and_extract_peaks(
    audio_path: str,
    ocr_texts: List[str],
    language: Optional[str] = None
) -> Dict[str, Any]:
    """
    Aligns Whisper transcript words with OCR texts using fuzzy matching and extracts audio peaks.
    """
    logger.info(f"Aligning dialogue for {audio_path} against {len(ocr_texts)} OCR bubbles.")

    result = {
        "dialogue_map": [],
        "audio_peaks": []
    }

    whisper_engine = get_whisper_engine(language=language)

    try:
        transcript_words = await whisper_engine.extract_words_with_timestamps(audio_path, language=language)
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        raise

    if not transcript_words:
        logger.warning("Whisper returned no words. Skipping text alignment step.")
    else:
        whisper_texts = [w["text"].lower() for w in transcript_words]
        current_search_idx = 0

        for ocr_idx, raw_ocr_text in enumerate(ocr_texts):
            ocr_text = raw_ocr_text.strip().lower()
            if not ocr_text:
                continue

            ocr_words = ocr_text.split()
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
                    candidate_text = " ".join(candidate_slice)

                    ratio = difflib.SequenceMatcher(None, ocr_text, candidate_text).ratio()

                    if ratio > best_ratio:
                        best_ratio = ratio
                        best_match = {
                            "start_idx": i,
                            "end_idx": i + w_size - 1,
                            "ratio": ratio,
                            "matched_text": candidate_text
                        }

            if best_match and best_match["ratio"] > 0.4:
                start_word = transcript_words[int(best_match["start_idx"])]
                end_word = transcript_words[int(best_match["end_idx"])]

                result["dialogue_map"].append({
                    "ocr_index": ocr_idx,
                    "ocr_text": raw_ocr_text,
                    "whisper_text": best_match["matched_text"],
                    "start_time": start_word["start_time"],
                    "end_time": end_word["end_time"],
                    "confidence": best_match["ratio"]
                })

                current_search_idx = int(best_match["end_idx"]) + 1
            else:
                logger.debug(f"Could not find a strong match for OCR text: '{raw_ocr_text}'")

    try:
        librosa_engine = get_librosa_engine()
        y, sr = librosa.load(audio_path, sr=librosa_engine.sr, mono=True)
        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
        rms = np.nan_to_num(rms, nan=0.0, posinf=1.0, neginf=0.0)

        if len(rms) > 0:
            rms_max = np.max(rms)
            if rms_max > 0 and np.isfinite(rms_max):
                rms_normalized = rms / rms_max
            else:
                rms_normalized = rms

            result["audio_peaks"] = [round(float(val), 3) for val in rms_normalized]
            result["peaks_fps"] = sr / 512.0

    except Exception as e:
        logger.error(f"Librosa feature extraction failed: {e}")
        result["audio_peaks"] = []

    logger.info(f"Aligned {len(result['dialogue_map'])} bubbles. Extracted {len(result['audio_peaks'])} audio peaks.")
    return result


async def align_dialogue_service(panel_id: str, audio_url: str, ocr_texts: List[str]) -> Dict[str, Any]:
    resolved = await img_utils.resolve_url_to_buffer(audio_url)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_in:
        tmp_in.write(resolved["data"])
        tmp_audio_path = tmp_in.name

    try:
        result = await align_dialogue_and_extract_peaks(
            audio_path=tmp_audio_path,
            ocr_texts=ocr_texts
        )
        return {
            "success": True,
            "panel_id": panel_id,
            **result
        }
    finally:
        try:
            if os.path.exists(tmp_audio_path):
                os.remove(tmp_audio_path)
        except OSError:
            pass


# Human-readable alias
align_dialogue_with_audio_timestamps = align_dialogue_and_extract_peaks
