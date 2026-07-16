"""
backend/app/schemas/audio.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for audio.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional, Literal, Union
from datetime import datetime
from services.audio.whisper_engine import WhisperModel

class AlignDialogueRequest(BaseModel):
    audio_url: str = Field(..., description="URL of the audio file to analyze")
    ocr_texts: List[str] = Field(..., description="Array of OCR text strings detected in the panel")


class AudioGenerateRequest(BaseModel):
    dialogue_list: List[str] = Field(
        default_factory=list,
        description="Ordered list of dialogue strings to synthesize"
    )
    target_duration: float = Field(
        default=4.5, ge=0.1, le=600.0,
        description="Target duration of output audio in seconds"
    )
    voice: Optional[str] = Field(
        default="en-US-GuyNeural",
        description="Edge-TTS voice code (e.g. 'en-US-GuyNeural', 'en-GB-SoniaNeural')"
    )
    return_base64: bool = Field(
        default=True,
        description="If true, returns audio as base64 string; if false, saves to a temp file and returns its path"
    )
    speech_rate: Optional[float] = Field(
        default=1.0,
        description="Speed of generated TTS audio"
    )
    speech_pitch: Optional[float] = Field(
        default=1.0,
        description="Pitch of generated TTS audio"
    )



class AudioPathRequest(BaseModel):
    audio_path: str



class TranscribeRequest(BaseModel):
    audio_path: str
    language: Optional[str] = None
    task: Optional[str] = Field("transcribe", description="Either 'transcribe' or 'translate'")
    verbose: Optional[bool] = False
    model_name: Optional[WhisperModel] = WhisperModel.BASE


class SubtitleRequest(BaseModel):
    audio_path: str
    output_path: Optional[str] = None
    language: Optional[str] = None
    model_name: Optional[WhisperModel] = WhisperModel.BASE


class ExtractWordsRequest(BaseModel):
    audio_path: str
    language: Optional[str] = None
    model_name: Optional[WhisperModel] = WhisperModel.BASE


class BatchTranscribeRequest(BaseModel):
    audio_paths: List[str]
    language: Optional[str] = None
    model_name: Optional[WhisperModel] = WhisperModel.BASE

