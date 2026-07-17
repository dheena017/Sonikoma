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








    async def generate_srt(
        self,
        audio_path: str,
        output_path: str,
        language: Optional[str] = None
    ) -> str:
        result = await self.transcribe(audio_path, language=language)
        srt_lines = []
        for segment in result.segments:
            start_time = self._format_srt_time(segment.start_time)
            end_time = self._format_srt_time(segment.end_time)
            srt_lines.append(f"{segment.id + 1}")
            srt_lines.append(f"{start_time} --> {end_time}")
            srt_lines.append(segment.text)
            srt_lines.append("")
        srt_content = "\n".join(srt_lines)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(srt_content)
        logger.info(f"✓ SRT file generated: {output_path}")
        return output_path

    async def generate_vtt(
        self,
        audio_path: str,
        output_path: str,
        language: Optional[str] = None
    ) -> str:
        result = await self.transcribe(audio_path, language=language)
        vtt_lines = ["WEBVTT", ""]
        for segment in result.segments:
            start_time = self._format_vtt_time(segment.start_time)
            end_time = self._format_vtt_time(segment.end_time)
            vtt_lines.append(f"{start_time} --> {end_time}")
            vtt_lines.append(segment.text)
            vtt_lines.append("")
        vtt_content = "\n".join(vtt_lines)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(vtt_content)
        logger.info(f"✓ VTT file generated: {output_path}")
        return output_path

    async def extract_words_with_timestamps(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        result = await self.transcribe(audio_path, language=language)
        words = []
        word_id = 0
        for segment in result.segments:
            segment_words = segment.text.split()
            segment_duration = segment.end_time - segment.start_time
            word_duration = segment_duration / len(segment_words) if segment_words else 0
            for i, word in enumerate(segment_words):
                word_start = segment.start_time + (i * word_duration)
                word_end = word_start + word_duration
                words.append({
                    "id": word_id,
                    "text": word,
                    "start_time": word_start,
                    "end_time": word_end,
                    "confidence": segment.confidence,
                    "segment_id": segment.id
                })
                word_id += 1
        logger.info(f"✓ Extracted {len(words)} words with timestamps")
        return words

    async def generate_json_transcript(
        self,
        audio_path: str,
        output_path: str,
        language: Optional[str] = None,
        include_words: bool = False
    ) -> str:
        result = await self.transcribe(audio_path, language=language)
        transcript_dict = {
            "text": result.text,
            "language": result.language,
            "duration_s": result.duration,
            "confidence": result.confidence,
            "segments": [
                {
                    "id": s.id,
                    "start_s": s.start_time,
                    "end_s": s.end_time,
                    "text": s.text,
                    "confidence": s.confidence
                }
                for s in result.segments
            ]
        }
        if include_words:
            words = await self.extract_words_with_timestamps(audio_path, language=language)
            transcript_dict["words"] = words
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(transcript_dict, f, indent=2, ensure_ascii=False)
        logger.info(f"✓ JSON transcript generated: {output_path}")
        return output_path

    async def batch_transcribe(
        self,
        audio_paths: List[str],
        language: Optional[str] = None
    ) -> List[TranscriptionResult]:
        logger.info(f"Batch transcribing {len(audio_paths)} files...")
        results = []
        for i, audio_path in enumerate(audio_paths):
            logger.info(f"  [{i+1}/{len(audio_paths)}] {os.path.basename(audio_path)}")
            try:
                result = await self.transcribe(audio_path, language=language)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to transcribe {audio_path}: {e}")
                results.append(None)
        successful = sum(1 for r in results if r is not None)
        logger.info(f"✓ Batch transcription complete: {successful}/{len(audio_paths)} successful")
        return results

    @staticmethod
    def _format_srt_time(seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    @staticmethod
    def _format_vtt_time(seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"

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
