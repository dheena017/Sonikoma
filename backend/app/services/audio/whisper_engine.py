"""
backend/python/services/whisper_engine.py
─────────────────────────────────────────────────────────────────────────────
OpenAI Whisper-based speech-to-text transcription engine:
- Transcribe audio to text with timestamps
- Support multiple languages
- Extract word-level confidence scores
- Generate SRT subtitle files
- Batch transcription
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import asyncio
import json
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    whisper = None
    WHISPER_AVAILABLE = False

logger = logging.getLogger("sonikoma.services.whisper_engine")


class WhisperModel(str, Enum):
    """Available Whisper model sizes."""
    TINY = "tiny"
    BASE = "base"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


@dataclass
class TranscriptionSegment:
    """Single transcription segment with timing."""
    id: int
    start_time: float
    end_time: float
    text: str
    confidence: Optional[float] = None


@dataclass
class TranscriptionResult:
    """Complete transcription result."""
    text: str
    language: str
    segments: List[TranscriptionSegment]
    duration: float
    confidence: float  # Average confidence


class WhisperEngine:
    """High-level Whisper wrapper for speech-to-text transcription."""

    def __init__(
        self,
        model_name: WhisperModel = WhisperModel.BASE,
        device: str = "cpu",
        language: Optional[str] = None
    ):
        if not WHISPER_AVAILABLE:
            raise RuntimeError(
                "openai-whisper is not available. Install with: pip install openai-whisper"
            )
        """
        Initialize Whisper engine.

        Args:
            model_name: Model size (tiny, base, small, medium, large)
            device: Device to use (cpu, cuda)
            language: ISO language code (e.g., 'en', 'fr'). None = auto-detect
        """
        self.model_name = model_name
        self.device = device
        self.language = language
        self.model = None
        self._load_model()

    def _load_model(self) -> None:
        """Load Whisper model."""
        logger.info(f"Loading Whisper model: {self.model_name}...")
        try:
            self.model = whisper.load_model(
                self.model_name.value,
                device=self.device
            )
            logger.info(f"✓ Whisper model loaded on device: {self.device}")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise

    async def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        task: str = "transcribe",  # or "translate"
        verbose: bool = False
    ) -> TranscriptionResult:
        """
        Transcribe audio file to text.

        Args:
            audio_path: Path to audio file
            language: ISO language code (None = auto-detect)
            task: "transcribe" or "translate" (to English)
            verbose: Log verbose output

        Returns:
            TranscriptionResult object
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        use_language = language or self.language

        logger.info(f"Transcribing: {audio_path} (language={use_language}, task={task})")

        try:
            result = await asyncio.to_thread(
                self.model.transcribe,
                audio_path,
                language=use_language,
                task=task,
                verbose=verbose,
                fp16=self.device == "cuda"  # Use FP16 on GPU for faster inference
            )

            # Parse result
            full_text = result.get("text", "").strip()
            detected_language = result.get("language", use_language or "en")
            segments_raw = result.get("segments", [])

            # Convert segments
            segments = [
                TranscriptionSegment(
                    id=i,
                    start_time=seg["start"],
                    end_time=seg["end"],
                    text=seg["text"].strip(),
                    confidence=seg.get("confidence", None)
                )
                for i, seg in enumerate(segments_raw)
            ]

            # Calculate average confidence
            confidences = [s.confidence for s in segments if s.confidence is not None]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            # Duration from last segment
            duration = max((s.end_time for s in segments), default=0.0)

            transcription = TranscriptionResult(
                text=full_text,
                language=detected_language,
                segments=segments,
                duration=duration,
                confidence=avg_confidence
            )

            logger.info(f"✓ Transcribed {duration:.1f}s, {len(segments)} segments, confidence: {avg_confidence:.2%}")
            return transcription

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise








    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded model."""
        return {
            "model_name": self.model_name.value,
            "device": self.device,
            "supported_languages": len(self.model.tokenizer.supported_languages),
        }


# Singleton instance
_whisper_instance: Optional[WhisperEngine] = None


def get_whisper_engine(
    model_name: WhisperModel = WhisperModel.BASE,
    device: str = "cpu",
    language: Optional[str] = None
) -> WhisperEngine:
    """Get or create Whisper engine singleton."""
    if not WHISPER_AVAILABLE:
        raise ImportError(
            "openai-whisper is not available. Install with: pip install openai-whisper"
        )

    global _whisper_instance
    if _whisper_instance is None:
        _whisper_instance = WhisperEngine(model_name=model_name, device=device, language=language)
    return _whisper_instance
