"""
backend/app/providers/whisper/types.py
─────────────────────────────────────────────────────────────────────────────
Type contracts, data classes, and enums for Whisper speech-to-text transcription.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Optional


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

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "text": self.text,
            "confidence": self.confidence,
        }


@dataclass
class TranscriptionResult:
    """Complete transcription result with segments and metadata."""
    text: str
    language: str
    segments: List[TranscriptionSegment]
    duration: float
    confidence: float
