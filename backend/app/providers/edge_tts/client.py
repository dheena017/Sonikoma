"""
backend/app/providers/edge_tts/client.py
─────────────────────────────────────────────────────────────────────────────
Microsoft Edge Neural TTS Provider Client:
- Multi-voice anime/manhwa character dialogue synthesis
- Zero-cost, high-speed neural speech engine
- Rate, pitch, and volume adjustments with auto-cleaning
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import List, Dict, Any, Optional

from app.providers.edge_tts.types import DEFAULT_VOICES, VOICE_LIST
from app.providers.edge_tts.helpers import sanitize_speech_text

logger = logging.getLogger("sonikoma.providers.edge_tts.client")

try:
    import edge_tts
    from edge_tts import Communicate
    from edge_tts.exceptions import NoAudioReceived
    EDGE_TTS_AVAILABLE = True
except ImportError:
    edge_tts = None
    Communicate = None  # type: ignore[assignment]
    NoAudioReceived = Exception  # type: ignore[assignment,misc]
    EDGE_TTS_AVAILABLE = False


class EdgeTTSProvider:
    """Wrapper provider for Microsoft Edge Neural TTS speech synthesis."""

    @staticmethod
    def is_available() -> bool:
        return EDGE_TTS_AVAILABLE and edge_tts is not None

    @staticmethod
    def get_voice_list() -> List[Dict[str, str]]:
        return VOICE_LIST

    @staticmethod
    def sanitize_text(text: str) -> str:
        return sanitize_speech_text(text)

    @classmethod
    async def synthesize(
        cls,
        text: str,
        voice: str = "en-US-ChristopherNeural",
        output_path: Optional[str] = None,
        rate: str = "+0%",
        pitch: str = "+0Hz",
    ) -> Optional[bytes]:
        """
        Synthesize text using Edge-TTS.
        Optionally saves to output_path if provided.
        Returns MP3 bytes on success.
        """
        if not cls.is_available():
            raise RuntimeError("edge_tts package is not installed.")

        clean = cls.sanitize_text(text)
        if not clean:
            return None

        if not callable(Communicate):
            raise RuntimeError(
                "edge_tts.Communicate is not available. "
                "Upgrade with: pip install -U edge-tts"
            )

        communicate = Communicate(clean, voice=voice, rate=rate, pitch=pitch)

        if output_path:
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            await communicate.save(output_path)
            with open(output_path, "rb") as f:
                return f.read()
        else:
            chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    chunks.append(chunk["data"])
            return b"".join(chunks)


# Clean alias
EdgeTTSClient = EdgeTTSProvider
