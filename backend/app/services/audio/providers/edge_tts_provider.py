"""
backend/app/services/audio/providers/edge_tts_provider.py
─────────────────────────────────────────────────────────────────────────────
Wrapper interface for Microsoft Edge-TTS library.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import asyncio
from typing import Optional
import edge_tts
from edge_tts.exceptions import NoAudioReceived

logger = logging.getLogger("sonikoma.services.audio.providers.edge_tts")


class EdgeTTSProvider:
    """Provider interface for Edge-TTS text-to-speech generation."""

    @staticmethod
    async def generate_tts(
        text: str,
        voice: str,
        output_path: str,
        rate: Optional[str] = None,
        pitch: Optional[str] = None,
        max_retries: int = 3,
        base_delay: float = 1.0
    ) -> bool:
        """
        Communicates with Edge-TTS to synthesize speech and save as audio file.
        Uses retries with exponential backoff for resilience.
        """
        for attempt in range(1, max_retries + 1):
            try:
                communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
                await communicate.save(output_path)
                
                # Check for successful write
                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    return True
                
                logger.warning(
                    f"[EdgeTTSProvider] Attempt {attempt}: Saved file is empty for text snippet."
                )
            except NoAudioReceived as e:
                logger.warning(
                    f"[EdgeTTSProvider] Attempt {attempt}/{max_retries}: NoAudioReceived error: {e}"
                )
            except Exception as e:
                logger.warning(
                    f"[EdgeTTSProvider] Attempt {attempt}/{max_retries}: Unexpected error: {e}"
                )

            if attempt < max_retries:
                delay = base_delay * (2 ** (attempt - 1))
                await asyncio.sleep(delay)

        return False
