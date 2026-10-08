"""
backend/features/creative/translation/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for the Comic & Webtoon Translation & Localization Service.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TranslationRequest(BaseModel):
    text: str = Field(..., description="Dialogue, speech bubble, or narration text to translate")
    target_lang: str = Field("Spanish", description="Target language e.g. Japanese, Korean, Spanish, French, German, Tamil, Chinese, English")
    tone: Optional[str] = Field("natural", description="Tone preset: natural, shonen, sakuga, slang")
    context: Optional[str] = Field(None, description="Optional scene or character context")
    model: Optional[str] = Field(None, description="Optional LLM model override")


class TranslationResult(BaseModel):
    translated_text: str = Field(..., description="Localized and translated text content")
    accuracy_rating: float = Field(0.95, description="Confidence rating from 0.0 to 1.0")
    detected_tone: Optional[str] = Field(None, description="Tone applied during translation")
    target_lang: Optional[str] = Field(None, description="Target language")


class TranslationResponse(BaseModel):
    success: bool = True
    result: TranslationResult


class BatchTranslationItem(BaseModel):
    id: Optional[str] = None
    text: str
    target_lang: Optional[str] = None
    tone: Optional[str] = None


class BatchTranslationRequest(BaseModel):
    items: List[BatchTranslationItem] = Field(..., description="Batch list of panels or dialogue lines to translate")
    default_target_lang: str = Field("Spanish", description="Default target language for all items")
    default_tone: str = Field("natural", description="Default tone preset")
    model: Optional[str] = Field(None, description="Optional LLM model override")


class BatchTranslationResponse(BaseModel):
    success: bool = True
    results: List[Dict[str, Any]]
