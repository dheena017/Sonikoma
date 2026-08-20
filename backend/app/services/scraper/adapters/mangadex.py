"""
backend/app/services/scraper/adapters/mangadex.py
─────────────────────────────────────────────────────────────────────────────
Dedicated High-Speed REST API Adapter for MangaDex (mangadex.org).
Bypasses browser rendering completely by using the official MangaDex at-home API.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import time
import httpx
import logging
from typing import Optional, List
from urllib.parse import urlparse

from .base import BaseSiteAdapter
from ..context import ScrapeContext
from ..models import (
    ChapterResult,
    SourceInfo,
    EscalationStatus,
    ScrapeCompleteness,
    ScrapeError,
    ScrapeErrorCode,
    CandidateImage,
    ImageSourceType,
)
from ..validator import ImageValidator
from ..order_resolver import OrderResolver
from ..diagnostics import ScraperDiagnosticsLogger

logger = logging.getLogger("sonikoma.services.scraper.adapters.mangadex")

_MANGADEX_CHAPTER_RE = re.compile(
    r"/chapter/(?P<chapter_id>[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})",
    re.IGNORECASE,
)


class MangaDexAdapter(BaseSiteAdapter):
    """Specialized high-speed REST API adapter for MangaDex."""

    name: str = "MangaDex"
    icon: str = "🟠"
    description: str = "Official MangaDex at-home REST API adapter. 0ms browser overhead with lossless panels."
    supported_domains: list = ["mangadex.org", "mangadex.cc"]

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        domain = source_info.domain.lower()
        return any(d in domain for d in cls.supported_domains)

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        parsed = urlparse(url)
        match = _MANGADEX_CHAPTER_RE.search(parsed.path)
        if not match:
            context.completeness = ScrapeCompleteness.FAILED
            context.error = ScrapeError(
                code=ScrapeErrorCode.INVALID_URL,
                message="MangaDex URL must be a direct chapter link: https://mangadex.org/chapter/{uuid}",
            )
            return self._finalize(context, start_time)

        chapter_id = match.group("chapter_id")
        logger.info(f"[MangaDexAdapter] Fetching chapter metadata and image list for UUID: {chapter_id}")

        async with httpx.AsyncClient(timeout=15.0) as client:
            # 1. Fetch chapter metadata & relationships
            try:
                ch_resp = await client.get(
                    f"https://api.mangadex.org/chapter/{chapter_id}",
                    params={"includes[]": ["manga", "scanlation_group"]}
                )
                if ch_resp.status_code == 200:
                    ch_data = ch_resp.json().get("data", {})
                    attrs = ch_data.get("attributes", {})
                    
                    # Chapter number and title
                    ch_num = attrs.get("chapter")
                    if ch_num:
                        try:
                            context.chapter_info.number = float(ch_num)
                            context.chapter_info.episode = f"Chapter {ch_num}"
                        except ValueError:
                            pass
                    context.chapter_info.title = attrs.get("title") or f"Chapter {ch_num or ''}".strip()
                    context.chapter_info.published_at = attrs.get("publishAt")

                    # Series title from relationship
                    for rel in ch_data.get("relationships", []):
                        if rel.get("type") == "manga":
                            manga_attrs = rel.get("attributes", {})
                            titles = manga_attrs.get("title", {})
                            series_title = titles.get("en") or next(iter(titles.values()), None) if titles else None
                            if series_title:
                                context.series_info.title = series_title
                            manga_id = rel.get("id")
                            if manga_id:
                                context.series_info.url = f"https://mangadex.org/title/{manga_id}"
                            context.series_info.publisher = "MangaDex"
                            break
            except Exception as e:
                logger.warning(f"[MangaDexAdapter] Failed to fetch chapter metadata: {e}")

            # 2. Fetch image URLs via at-home server
            try:
                srv_resp = await client.get(f"https://api.mangadex.org/at-home/server/{chapter_id}")
                if srv_resp.status_code == 200:
                    srv_data = srv_resp.json()
                    base_url = srv_data.get("baseUrl")
                    chapter_node = srv_data.get("chapter", {})
                    hash_key = chapter_node.get("hash")
                    page_files: List[str] = chapter_node.get("data", []) or chapter_node.get("dataSaver", [])

                    if base_url and hash_key and page_files:
                        for idx, filename in enumerate(page_files):
                            img_url = f"{base_url}/data/{hash_key}/{filename}"
                            context.candidate_images.append(
                                CandidateImage(
                                    url=img_url,
                                    source_type=ImageSourceType.API,
                                    dom_index=idx,
                                    is_inside_reader=True,
                                    confidence=1.0,
                                    raw_attributes={"filename": filename}
                                )
                            )

                        context.checklist.reader_found = True
                        context.checklist.reader_end_reached = True
                        context.checklist.lazy_loading_finished = True
                        context.completeness = ScrapeCompleteness.COMPLETE
                        dur_ms = (time.time() - start_time) * 1000
                        context.record_level("Level 0: MangaDex REST API", EscalationStatus.SUCCESS, 100.0, len(page_files), dur_ms)
                        return self._finalize(context, start_time)
            except Exception as e:
                logger.error(f"[MangaDexAdapter] Failed to fetch at-home server images: {e}")

        dur_ms = (time.time() - start_time) * 1000
        context.record_level("Level 0: MangaDex REST API", EscalationStatus.FAILED, 0.0, 0, dur_ms)
        context.completeness = ScrapeCompleteness.FAILED
        context.error = ScrapeError(
            code=ScrapeErrorCode.READER_NOT_FOUND,
            message="Failed to retrieve images from MangaDex official API.",
        )
        return self._finalize(context, start_time)

    def _finalize(self, context: ScrapeContext, start_time: float) -> ChapterResult:
        total_ms = (time.time() - start_time) * 1000
        validated, rejections = ImageValidator.validate_candidates(
            context.candidate_images,
            filter_banners=context.config.filter_banners
        )
        context.rejections.extend(rejections)
        context.validated_images = OrderResolver.resolve_order(validated)

        ScraperDiagnosticsLogger.log_result(
            chapter_number=context.chapter_info.number,
            images_count=len(context.validated_images),
            new_images_count=0,
            completeness=context.completeness.value,
            execution_time_ms=total_ms,
        )
        return context.to_chapter_result()
