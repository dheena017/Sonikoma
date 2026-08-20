"""
backend/app/services/scraper/adapters/bato.py
─────────────────────────────────────────────────────────────────────────────
Specialized Adapter for Bato.to (bato.to, mangatoto.com, battwo.com, etc.).
─────────────────────────────────────────────────────────────────────────────
"""

import re
import json
import time
import logging
from typing import Optional, List
from urllib.parse import urlparse, urljoin

from .base import BaseSiteAdapter
from .generic import GenericAdaptiveAdapter
from ..context import ScrapeContext
from ..models import (
    ChapterResult,
    SourceInfo,
    EscalationStatus,
    ScrapeCompleteness,
    CandidateImage,
    ImageSourceType,
)
from ..acquisition import HttpFetcher, BrowserFetcher
from ..extraction import DomExtractor
from ..validator import ImageValidator
from ..order_resolver import OrderResolver
from ..diagnostics import ScraperDiagnosticsLogger

logger = logging.getLogger("sonikoma.services.scraper.adapters.bato")

_BATO_DOMAINS = ("bato.to", "mangatoto.com", "battwo.com", "batocomic.com", "batotoo.com", "readtoto.com")


class BatoAdapter(BaseSiteAdapter):
    """Specialized adapter for Bato.to and mirror domains."""

    name: str = "Bato.to"
    icon: str = "🔵"
    description: str = "Bato.to & MangaToto server-rendered script image arrays."
    supported_domains: list = ["bato.to", "mangatoto.com", "battwo.com", "batocomic.com", "batotoo.com", "readtoto.com"]

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        domain = source_info.domain.lower()
        return any(d in domain for d in cls.supported_domains)

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        headers = dict(context.config.headers or {})
        parsed = urlparse(url)
        headers.setdefault("Referer", f"{parsed.scheme}://{parsed.netloc}/")
        context.config.headers = headers

        # ------------------------------------------------------------------
        # Step 1: Static Fetch & JS Array Extraction
        # ------------------------------------------------------------------
        html, status_code, fetch_dur = await HttpFetcher.fetch_html(
            url,
            headers=headers,
            cookies=context.config.cookies,
            timeout=context.config.timeout_seconds,
        )
        context.raw_html = html

        if html:
            series, chapter = DomExtractor.extract_metadata(html, url)
            self._merge_metadata(context, series, chapter)

            # Try extracting server-rendered image array (e.g. const images = [...])
            script_images = self._extract_script_images(html, url)
            if len(script_images) >= 3:
                context.candidate_images.extend(script_images)
                context.checklist.reader_found = True
                context.checklist.reader_end_reached = True
                context.checklist.lazy_loading_finished = True
                context.completeness = ScrapeCompleteness.COMPLETE
                context.record_level(
                    "Level 1: Bato Server State",
                    EscalationStatus.SUCCESS,
                    98.0,
                    len(script_images),
                    fetch_dur * 1000,
                )
                return self._finalize(context, start_time)

            soup = DomExtractor.get_soup(html)
            if soup:
                dom_images = self._extract_dom_images(soup, url)
                if len(dom_images) >= 3:
                    context.candidate_images.extend(dom_images)
                    context.checklist.reader_found = True
                    context.checklist.reader_end_reached = True
                    context.checklist.lazy_loading_finished = True
                    context.completeness = ScrapeCompleteness.COMPLETE
                    context.record_level(
                        "Level 1: Bato Static DOM",
                        EscalationStatus.SUCCESS,
                        95.0,
                        len(dom_images),
                        fetch_dur * 1000,
                    )
                    return self._finalize(context, start_time)

        # ------------------------------------------------------------------
        # Step 2: Playwright with auto-scroll
        # ------------------------------------------------------------------
        if context.config.enable_browser_fallback:
            t_browser = time.time()
            pw_html, net_images, storage = await BrowserFetcher.render_page(
                url,
                cookies=context.config.cookies,
                headers=headers,
                interactive=True,
                auto_scroll=True,
                timeout_seconds=context.config.timeout_seconds,
            )
            browser_dur = (time.time() - t_browser) * 1000

            if pw_html:
                soup_pw = DomExtractor.get_soup(pw_html)
                if soup_pw:
                    pw_images = self._extract_dom_images(soup_pw, url)
                    if len(pw_images) >= 3:
                        context.candidate_images.extend(pw_images)
                        context.checklist.reader_found = True
                        context.checklist.reader_end_reached = True
                        context.checklist.lazy_loading_finished = True
                        context.completeness = ScrapeCompleteness.COMPLETE
                        context.record_level(
                            "Level 4: Bato Playwright",
                            EscalationStatus.SUCCESS,
                            95.0,
                            len(pw_images),
                            browser_dur,
                        )
                        return self._finalize(context, start_time)

        logger.info("[BatoAdapter] Delegating to GenericAdaptiveAdapter fallback.")
        generic = GenericAdaptiveAdapter()
        return await generic.scrape(context)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _extract_script_images(self, html: str, base_url: str) -> List[CandidateImage]:
        candidates: List[CandidateImage] = []
        seen = set()

        # Bato often stores chapter images in a JS variable: const imgHttpLis = [...] or const images = [...]
        m = re.search(r'(?:imgHttpLis|images|imgList)\s*=\s*(\[[^\]]+\])', html)
        if m:
            try:
                raw_urls = json.loads(m.group(1))
                for idx, src in enumerate(raw_urls):
                    if isinstance(src, str) and src.startswith(("http://", "https://", "//")):
                        abs_url = urljoin(base_url, src)
                        if abs_url not in seen:
                            seen.add(abs_url)
                            candidates.append(
                                CandidateImage(
                                    url=abs_url,
                                    source_type=ImageSourceType.DOM,
                                    dom_index=idx,
                                    container_selector="script:images",
                                    is_inside_reader=True,
                                    confidence=0.99
                                )
                            )
            except Exception:
                pass

        return candidates

    def _extract_dom_images(self, soup, base_url: str) -> List[CandidateImage]:
        candidates: List[CandidateImage] = []
        seen = set()

        images = soup.select(".main .item img, .page-img, div#viewer img, .comic-detail img")
        for idx, img in enumerate(images):
            src = (img.get("src") or img.get("data-src") or img.get("data-lazy-src") or "").strip()
            if not src or any(ign in src.lower() for ign in ["1x1", "pixel", "blank.gif", "placeholder", "logo"]):
                continue

            abs_url = urljoin(base_url, src)
            if abs_url not in seen:
                seen.add(abs_url)
                candidates.append(
                    CandidateImage(
                        url=abs_url,
                        source_type=ImageSourceType.DOM,
                        dom_index=idx,
                        container_selector=".main .item",
                        is_inside_reader=True,
                        confidence=0.95
                    )
                )

        return candidates

    def _merge_metadata(self, context: ScrapeContext, series, chapter):
        if series.title and not context.series_info.title:
            context.series_info.title = series.title
        if series.description and not context.series_info.description:
            context.series_info.description = series.description
        if series.cover and not context.series_info.cover:
            context.series_info.cover = series.cover
        if series.author and not context.series_info.author:
            context.series_info.author = series.author
        if chapter.title and not context.chapter_info.title:
            context.chapter_info.title = chapter.title
        if chapter.number is not None and context.chapter_info.number is None:
            context.chapter_info.number = chapter.number
        if chapter.previous and not context.chapter_info.previous:
            context.chapter_info.previous = chapter.previous
        if chapter.next and not context.chapter_info.next:
            context.chapter_info.next = chapter.next

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
