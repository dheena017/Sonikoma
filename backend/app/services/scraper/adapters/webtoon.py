from typing import Optional, Dict, Any
import re
from urllib.parse import urlparse, parse_qs
from backend.app.services.scraper.models.core import ExtractionAttempt, ChapterResult, SourceInfo, SeriesMetadata, ChapterMetadata, ScrapeDiagnostics
from backend.app.services.scraper.engine.pipeline import Pipeline


class WebtoonAdapter:
    """Thin site adapter for Naver Webtoons."""

    def __init__(self):
        self.engine = Pipeline()
        self.known_reader_hints = ["viewer", "viewer_img", "_imageList"]

    def can_handle(self, url: str) -> bool:
        domain = urlparse(url).netloc.lower()
        return "webtoons.com" in domain

    def parse_metadata(self, url: str, attempt: ExtractionAttempt) -> Dict[str, Any]:
        """Apply Webtoon-specific metadata extraction logic if generic engine failed."""
        series_meta = attempt.series_data or SeriesMetadata()
        chapter_meta = attempt.chapter_data or ChapterMetadata()

        parsed = urlparse(url)
        qs = parse_qs(parsed.query)

        # Webtoon specifics
        if 'title_no' in qs:
            chapter_meta.episode = qs['title_no'][0]
        if 'episode_no' in qs:
            chapter_meta.number = qs['episode_no'][0]

        return {
            "series": series_meta,
            "chapter": chapter_meta
        }

    def scrape(self, url: str) -> ChapterResult:
        """Runs the generic engine and applies Webtoon-specific fixes."""
        if not self.can_handle(url):
            raise ValueError(f"WebtoonAdapter cannot handle URL: {url}")

        # 1. Run generic pipeline
        attempt = self.engine.execute(url)

        # 2. Extract specific metadata
        meta = self.parse_metadata(url, attempt)

        # 3. Formulate final ChapterResult
        source_info = SourceInfo(
            original_url=url,
            canonical_url=url, # Might need actual canonicalization
            domain="webtoons.com"
        )

        scrape_diagnostics = ScrapeDiagnostics(
            method="WebtoonAdapter + " + attempt.diagnostics.get("level", "unknown"),
            confidence=attempt.confidence,
            image_count=len(attempt.image_candidates),
            new_image_count=len(attempt.image_candidates), # Assuming all are new for now
            scraper_version="v2.0"
        )

        return ChapterResult(
            source=source_info,
            series=meta["series"],
            chapter=meta["chapter"],
            images=attempt.image_candidates,
            scrape=scrape_diagnostics
        )
