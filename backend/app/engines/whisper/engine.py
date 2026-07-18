"""
backend/app/engines/whisper/engine.py
Whisper engine moved into package structure.
"""

import os
import logging
import asyncio
import json
from typing import Dict, Any, List, Optional
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
                fp16=self.device == "cuda"
            )

            full_text = result.get("text", "").strip()
            detected_language = result.get("language", use_language or "en")
            segments_raw = result.get("segments", [])

            segments = [
                TranscriptionSegment(
                    id=i,
                    start_time=seg["start"] if isinstance(seg, dict) else seg[0],
                    end_time=seg["end"] if isinstance(seg, dict) else seg[1],
                    text=seg["text"].strip() if isinstance(seg, dict) else str(seg),
                    confidence=seg.get("confidence", None) if isinstance(seg, dict) else None
                )
                for i, seg in enumerate(segments_raw)
            ]

            confidences = [s.confidence for s in segments if s.confidence is not None]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

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

    # additional helper methods (generate_srt, generate_vtt, extract_words_with_timestamps, etc.)


_whisper_instance: Optional[WhisperEngine] = None


def get_whisper_engine(
    model_name: WhisperModel = WhisperModel.BASE,
    device: str = "cpu",
    language: Optional[str] = None
) -> WhisperEngine:
    if not WHISPER_AVAILABLE:
        raise ImportError(
            "openai-whisper is not available. Install with: pip install openai-whisper"
        )

    global _whisper_instance
    if _whisper_instance is None:
        _whisper_instance = WhisperEngine(model_name=model_name, device=device, language=language)
    return _whisper_instance
