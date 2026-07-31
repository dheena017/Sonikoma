import logging
from typing import List, Dict, Any, Optional
import numpy as np
import difflib

from engines.whisper.engine import get_whisper_engine
from engines.librosa.engine import get_librosa_engine
try:
    import librosa
except ImportError:
    librosa = None

logger = logging.getLogger("sonikoma.services.dialogue_aligner")

async def align_dialogue_and_extract_peaks(
    audio_path: str,
    ocr_texts: List[str],
    language: Optional[str] = None
) -> Dict[str, Any]:
    """
    Aligns Whisper transcript words with OCR texts using fuzzy matching and extracts audio peaks.

    Args:
        audio_path: Path to the audio file.
        ocr_texts: List of strings representing text detected in speech bubbles.
        language: Optional language code for Whisper.

    Returns:
        A dictionary containing the aligned dialogue map and normalized audio peaks.
    """
    logger.info(f"Aligning dialogue for {audio_path} against {len(ocr_texts)} OCR bubbles.")

    result = {
        "dialogue_map": [],
        "audio_peaks": []
    }

    # =========================================================================
    # Step 1: Whisper Transcription & Word Extraction
    # =========================================================================
    whisper_engine = get_whisper_engine(language=language)

    try:
        # Extract individual words with timestamps from Whisper
        transcript_words = await whisper_engine.extract_words_with_timestamps(audio_path, language=language)
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        raise

    if not transcript_words:
        logger.warning("Whisper returned no words. Skipping text alignment step.")
    else:
        # Flatten Whisper words into a list of strings for matching
        whisper_texts = [w["text"].lower() for w in transcript_words]

        # =========================================================================
        # Step 2: Fuzzy Matching OCR to Whisper Words
        # =========================================================================

        current_search_idx = 0

        for ocr_idx, raw_ocr_text in enumerate(ocr_texts):
            # Clean OCR text for better matching
            ocr_text = raw_ocr_text.strip().lower()
            if not ocr_text:
                continue

            ocr_words = ocr_text.split()
            if not ocr_words:
                continue

            best_match = None
            best_ratio = 0.0

            # We search a sliding window in the remaining whisper words to find the best match for this OCR bubble
            # Window sizes to try (around the length of the OCR words)
            window_sizes = [max(1, len(ocr_words) - 2), len(ocr_words), len(ocr_words) + 2]

            for w_size in window_sizes:
                # Prevent searching past the end
                if w_size > len(whisper_texts) - current_search_idx:
                    w_size = len(whisper_texts) - current_search_idx
                    if w_size <= 0:
                        break

                for i in range(current_search_idx, len(whisper_texts) - w_size + 1):
                    candidate_slice = whisper_texts[i : i + w_size]
                    candidate_text = " ".join(candidate_slice)

                    # Compare the string similarity
                    ratio = difflib.SequenceMatcher(None, ocr_text, candidate_text).ratio()

                    if ratio > best_ratio:
                        best_ratio = ratio
                        best_match = {
                            "start_idx": i,
                            "end_idx": i + w_size - 1,
                            "ratio": ratio,
                            "matched_text": candidate_text
                        }

            # If we found a reasonable match (threshold can be adjusted, e.g., 0.4 for very noisy data)
            if best_match and best_match["ratio"] > 0.4:
                start_word = transcript_words[best_match["start_idx"]]
                end_word = transcript_words[best_match["end_idx"]]

                result["dialogue_map"].append({
                    "ocr_index": ocr_idx,
                    "ocr_text": raw_ocr_text,
                    "whisper_text": best_match["matched_text"],
                    "start_time": start_word["start_time"],
                    "end_time": end_word["end_time"],
                    "confidence": best_match["ratio"]
                })

                # Advance the search index so next bubble matches *after* this one
                current_search_idx = best_match["end_idx"] + 1
            else:
                logger.debug(f"Could not find a strong match for OCR text: '{raw_ocr_text}'")

    # =========================================================================
    # Step 3: Audio Peaks (Time-Series) Extraction via Librosa
    # =========================================================================
    try:
        librosa_engine = get_librosa_engine()
        # Load audio (mono)
        y, sr = librosa.load(audio_path, sr=librosa_engine.sr, mono=True)

        # Calculate RMS energy (root mean square) which gives a good proxy for volume/loudness
        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]

        # Ensure array consists of valid, finite values to prevent NaN propagation
        rms = np.nan_to_num(rms, nan=0.0, posinf=1.0, neginf=0.0)

        # Normalize the RMS values between 0.0 and 1.0
        if len(rms) > 0:
            rms_max = np.max(rms)
            if rms_max > 0 and np.isfinite(rms_max):
                rms_normalized = rms / rms_max
            else:
                rms_normalized = rms

            # To avoid sending a massive array to the frontend, we can optionally downsample or
            # just convert to float list. Depending on audio length, hop_length=512 at 22050Hz
            # is roughly 43 frames per second. For a 10s audio, that's ~430 points, which is fine.
            result["audio_peaks"] = [round(float(val), 3) for val in rms_normalized]

            # Add metadata about timing so frontend can map index to seconds
            result["peaks_fps"] = sr / 512.0

    except Exception as e:
        logger.error(f"Librosa feature extraction failed: {e}")
        # If it fails, just return empty peaks so dialogue sync still works
        result["audio_peaks"] = []

    logger.info(f"Aligned {len(result['dialogue_map'])} bubbles. Extracted {len(result['audio_peaks'])} audio peaks.")
    return result
