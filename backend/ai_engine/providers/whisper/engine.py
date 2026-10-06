"""
backend/app/providers/whisper/engine.py
─────────────────────────────────────────────────────────────────────────────
Local Whisper Speech-to-Text inference engine with CUDA/CPU acceleration.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import asyncio
import json
from typing import Dict, Any, List, Optional, Union
import importlib

from ai_engine.providers.whisper.types import (
    WhisperModel,
    TranscriptionSegment,
    TranscriptionResult,
)

# Lazy loaded whisper to keep startup RAM under 120MB
def _get_whisper_lib():
    try:
        return importlib.import_module("whisper")
    except ImportError:
        return None

WHISPER_AVAILABLE = _get_whisper_lib() is not None

logger = logging.getLogger("sonikoma.providers.whisper.engine")


class WhisperEngine:
    """High-level Whisper wrapper for speech-to-text transcription."""

    def __init__(
        self,
        model_name: Optional[Union[WhisperModel, str]] = WhisperModel.BASE,
        device: str = "cpu",
        language: Optional[str] = None
    ):
        """
        Initialize Whisper engine.

        Args:
            model_name: Model size (tiny, base, small, medium, large)
            device: Device to use (cpu, cuda)
            language: ISO language code (e.g., 'en', 'fr'). None = auto-detect
        """
        if not WHISPER_AVAILABLE:
            raise RuntimeError(
                "openai-whisper is not available. Install with: pip install openai-whisper"
            )
        self.model_name = model_name or WhisperModel.BASE
        self.device = device
        self.language = language
        self.model = None
        self._load_model()

    def _load_model(self) -> None:
        """Load Whisper model."""
        logger.info(f"Loading Whisper model: {self.model_name}...")
        whisper_lib = _get_whisper_lib()
        if whisper_lib is None:
            raise RuntimeError("openai-whisper module is not available.")
        try:
            model_value = self.model_name.value if isinstance(self.model_name, WhisperModel) else str(self.model_name)
            self.model = whisper_lib.load_model(
                model_value,
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

        if self.model is None:
            raise RuntimeError("Whisper model is not loaded.")

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
    async def generate_srt(
        self,
        audio_path: str,
        output_path: str,
        language: Optional[str] = None
    ) -> str:
        from ai_engine.providers.whisper.helpers import segments_to_srt
        result = await self.transcribe(audio_path, language=language)
        content = segments_to_srt(result.segments)
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        return output_path

    async def generate_vtt(
        self,
        audio_path: str,
        output_path: str,
        language: Optional[str] = None
    ) -> str:
        from ai_engine.providers.whisper.helpers import segments_to_vtt
        result = await self.transcribe(audio_path, language=language)
        content = segments_to_vtt(result.segments)
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        return output_path

    async def extract_words_with_timestamps(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        from features.video_editor.audio.services.transcription import extract_words_with_timestamps as _ext_words
        return await _ext_words(self, audio_path, language=language)

    async def generate_json_transcript(
        self,
        audio_path: str,
        output_path: str,
        language: Optional[str] = None,
        include_words: bool = False
    ) -> str:
        from features.video_editor.audio.services.transcription import generate_json_transcript as _gen_json
        return await _gen_json(self, audio_path, output_path, language=language, include_words=include_words)

    async def batch_transcribe(
        self,
        audio_paths: List[str],
        language: Optional[str] = None
    ) -> List[Optional[TranscriptionResult]]:
        from features.video_editor.audio.services.transcription import batch_transcribe as _batch_transcribe
        return await _batch_transcribe(self, audio_paths, language=language)


_whisper_instance: Optional[WhisperEngine] = None


def get_whisper_engine(
    model_name: Optional[Union[WhisperModel, str]] = WhisperModel.BASE,
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
