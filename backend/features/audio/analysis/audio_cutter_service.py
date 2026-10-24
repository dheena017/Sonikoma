"""
backend/features/audio/analysis/audio_cutter_service.py
─────────────────────────────────────────────────────────────────────────────
Audio precision cutter: extracts sample-accurate clips between start and
end timestamps and writes them to local disk or cache.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import asyncio
import logging
from typing import Optional, Tuple

try:
    import soundfile as sf
except ImportError:
    sf = None

from ai_engine.providers.librosa.engine import get_librosa_engine

logger = logging.getLogger("sonikoma.audio.analysis.cutter")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _keep_time_inside_track(
    start_s: int,
    end_s: int,
    total_samples: int
) -> Tuple[int, int]:
    """Ensures sample slicing indices remain within the audio buffer boundaries."""
    safe_start = max(0, min(start_s, total_samples))
    safe_end = max(safe_start, min(end_s, total_samples))
    return safe_start, safe_end


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def cut_audio_clip(
    audio_path: str,
    start_time: float,
    end_time: float,
    output_path: Optional[str] = None
) -> str:
    """
    Cuts out a piece of audio between two timestamps and saves it to disk.
    """
    if sf is None:
        raise RuntimeError("soundfile is required to slice and save audio segments.")

    engine = get_librosa_engine()
    y, sr = await engine.load_audio(audio_path)

    start_sample = int(start_time * sr)
    end_sample = int(end_time * sr)
    s_idx, e_idx = _keep_time_inside_track(start_sample, end_sample, len(y))

    segment = y[s_idx:e_idx]

    dest_file = output_path or os.path.join(tempfile.gettempdir(), f"slice_{os.urandom(4).hex()}.wav")
    os.makedirs(os.path.dirname(os.path.abspath(dest_file)), exist_ok=True)

    await asyncio.to_thread(sf.write, dest_file, segment, sr)
    logger.info(f"✓ Saved audio slice: {dest_file} ({end_time - start_time:.2f}s)")
    return dest_file


__all__ = ["cut_audio_clip"]
