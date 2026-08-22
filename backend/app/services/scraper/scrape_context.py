"""
backend/app/services/scraper/context.py
─────────────────────────────────────────────────────────────────────────────
Execution context for the Adaptive Webtoon/Chapter Scraper pipeline.
Passed across all levels and enriched progressively.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations
import time
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass, field

from .scraper_models import (
    SourceInfo,
    SeriesInfo,
    ChapterInfo,
    CandidateImage,
    ReaderCandidate,
    ImageItem,
    ScrapeDiagnostics,
    ScrapeCompleteness,
    CompletenessChecklist,
    ScrapeError,
    ChapterResult,
    EscalationStatus,
    EscalationLevelRecord,
    ScrapeConfiguration,
    EvidenceSource,
)
from .evidence import EvidenceCollector
from .scraper_constants import SCRAPER_VERSION


@dataclass
class ScrapeContext:
    """
    Central execution context for a scrape operation.
    Holds the complete state, evidence records, candidate pools, and diagnostics.
    """
    url: str
    normalized_url: str = ""
    canonical_url: str = ""
    config: ScrapeConfiguration = field(default_factory=ScrapeConfiguration)
    project_id: Optional[str] = None
    job_id: Optional[str] = None

    # Site classification
    source_info: Optional[SourceInfo] = None
    series_info: SeriesInfo = field(default_factory=SeriesInfo)
    chapter_info: ChapterInfo = field(default_factory=ChapterInfo)

    # Evidence accumulator
    evidence: EvidenceCollector = field(default_factory=EvidenceCollector)

    # Acquired raw data
    raw_html: Optional[str] = None
    browser_html: Optional[str] = None
    intercepted_network_urls: List[str] = field(default_factory=list)
    local_storage_data: Dict[str, Any] = field(default_factory=dict)
    session_storage_data: Dict[str, Any] = field(default_factory=dict)

    # Reader detection & Candidate images
    reader_candidates: List[ReaderCandidate] = field(default_factory=list)
    selected_reader: Optional[ReaderCandidate] = None
    candidate_images: List[CandidateImage] = field(default_factory=list)
    validated_images: List[ImageItem] = field(default_factory=list)

    # Rejection log
    rejections: List[Dict[str, str]] = field(default_factory=list)

    # Escalation tracking
    level_history: List[EscalationLevelRecord] = field(default_factory=list)
    completeness: ScrapeCompleteness = ScrapeCompleteness.UNKNOWN
    checklist: CompletenessChecklist = field(default_factory=CompletenessChecklist)

    # Error and timing
    error: Optional[ScrapeError] = None
    start_time: float = field(default_factory=time.time)
    diagnostics_logs: List[str] = field(default_factory=list)

    def log(self, message: str) -> None:
        """Appends a log line to diagnostics."""
        self.diagnostics_logs.append(message)

    def record_level(
        self,
        level_name: str,
        status: EscalationStatus,
        confidence: float,
        images_found: int,
        duration_ms: float,
        reason: Optional[str] = None
    ) -> None:
        """Records an escalation level execution in the context."""
        rec = EscalationLevelRecord(
            level_name=level_name,
            status=status,
            confidence=confidence,
            images_found=images_found,
            duration_ms=duration_ms,
            reason=reason
        )
        self.level_history.append(rec)

    @property
    def levels(self) -> List[EscalationLevelRecord]:
        """Alias for level_history."""
        return self.level_history

    def to_chapter_result(self) -> ChapterResult:
        """Builds the final authoritative ChapterResult from this context."""
        elapsed_ms = (time.time() - self.start_time) * 1000.0
        success = (self.error is None) and (len(self.validated_images) > 0)

        # Fallback SourceInfo if not already populated
        src = self.source_info or SourceInfo(
            original_url=self.url,
            canonical_url=self.canonical_url or self.normalized_url or self.url,
            domain="unknown"
        )

        confidence = 0.0
        if self.selected_reader:
            confidence = self.selected_reader.score
        elif self.validated_images:
            confidence = 80.0

        # Apply proxy URLs if requested
        if self.config.proxy_images and self.validated_images:
            from urllib.parse import quote
            canonical_ref = self.canonical_url or self.normalized_url or self.url
            for img in self.validated_images:
                if not img.proxy_url:
                    img.proxy_url = f"/api/proxy-image?url={quote(img.url)}&referer={quote(canonical_ref)}"

        new_count = sum(1 for img in self.validated_images if img.is_new)

        diagnostics = ScrapeDiagnostics(
            method=self.level_history[-1].level_name if self.level_history else "unknown",
            confidence=confidence,
            completeness=self.completeness,
            image_count=len(self.validated_images),
            new_image_count=new_count,
            scraper_version=SCRAPER_VERSION,
            execution_time_ms=elapsed_ms,
            levels_executed=[rec.level_name for rec in self.level_history],
            selected_reader=self.selected_reader.selector if self.selected_reader else None,
            reader_confidence=confidence,
            checklist=self.checklist,
            rejected_count=len(self.rejections),
            rejections=self.rejections,
            diagnostics_log=self.diagnostics_logs
        )

        return ChapterResult(
            success=success,
            project_id=self.project_id or self.config.project_id,
            job_id=self.job_id or self.config.job_id,
            total_images=len(self.validated_images),
            source=src,
            series=self.series_info,
            chapter=self.chapter_info,
            images=self.validated_images,
            scrape=diagnostics,
            error=self.error
        )
