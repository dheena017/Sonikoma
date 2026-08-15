"""
backend/app/services/scraper/evidence/models.py
─────────────────────────────────────────────────────────────────────────────
Evidence model definitions for provenance, auditing, and correlation.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations
import time
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from .sources import EvidenceSource


class EvidenceItem(BaseModel):
    """An individual piece of discovery evidence recorded during scraping."""
    source_type: EvidenceSource
    source_url: str
    chapter_id: Optional[str] = None
    reader_context: Optional[str] = None
    payload_summary: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    confidence: float = 1.0
    discovered_images_count: int = 0
    timestamp: float = Field(default_factory=time.time)
