from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class SourceInfo(BaseModel):
    original_url: str
    canonical_url: str
    domain: str


class SeriesMetadata(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    author: Optional[str] = None
    artist: Optional[str] = None
    publisher: Optional[str] = None
    status: Optional[str] = None
    genres: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    cover_image: Optional[str] = None
    language: Optional[str] = None


class ChapterMetadata(BaseModel):
    number: Optional[str] = None
    episode: Optional[str] = None
    title: Optional[str] = None
    url: Optional[str] = None
    published_at: Optional[str] = None
    previous: Optional[str] = None
    next: Optional[str] = None


class ImageAsset(BaseModel):
    index: int
    url: str
    width: Optional[int] = None
    height: Optional[int] = None
    source: str  # e.g., "dom", "network", "canvas", "json"
    is_new: bool = False
    fingerprint: Optional[str] = None


class ScrapeDiagnostics(BaseModel):
    method: str
    confidence: int
    image_count: int
    new_image_count: int
    scraper_version: str
    diagnostics: Dict[str, Any] = Field(default_factory=dict)


class ChapterResult(BaseModel):
    source: SourceInfo
    series: SeriesMetadata
    chapter: ChapterMetadata
    images: List[ImageAsset] = Field(default_factory=list)
    scrape: ScrapeDiagnostics


class ExtractionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class ReaderCandidate(BaseModel):
    selector: Optional[str] = None
    element_id: Optional[str] = None
    classes: List[str] = Field(default_factory=list)
    score: int = 0
    reasons: List[str] = Field(default_factory=list)
    evidence: Dict[str, Any] = Field(default_factory=dict)


class NetworkEvidence(BaseModel):
    url: str
    mime_type: Optional[str] = None
    request_type: Optional[str] = None
    initiator: Optional[str] = None
    response_body: Optional[Any] = None
    timing: Optional[float] = None
    reader_association: Optional[float] = None


class ExtractionAttempt(BaseModel):
    status: ExtractionStatus
    confidence: int = 0
    evidence: Dict[str, Any] = Field(default_factory=dict)
    chapter_data: Optional[ChapterMetadata] = None
    series_data: Optional[SeriesMetadata] = None
    image_candidates: List[ImageAsset] = Field(default_factory=list)
    diagnostics: Dict[str, Any] = Field(default_factory=dict)
