"""
backend/app/services/scraper/adapters/mangastream.py
─────────────────────────────────────────────────────────────────────────────
Dedicated Adapter for MangaStream / ThemeSphere scanlation sites.
Covers AsuraScans, FlameComics, ReaperScans, RealmScans, VoidScans, etc.
─────────────────────────────────────────────────────────────────────────────
Key Selectors & Structure:
  • Reader container: #readerarea, .ts-main-image, div#readerarea
  • Image tags: #readerarea img, #readerarea p img
  • Navigation: .nextprev a.r, .nextprev a.l, .ch-next-btn, .ch-prev-btn
  • Chapter select: select#chapter, select.single-chapter-select
─────────────────────────────────────────────────────────────────────────────
"""

import re
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

logger = logging.getLogger("sonikoma.services.scraper.adapters.mangastream")

# ─── Known MangaStream / ThemeSphere Domains ─────────────────────────────────

_KNOWN_MANGASTREAM_DOMAINS = (
    "asuracomic.net", "asurascans.com", "asura.gg", "asuratoon.com",
    "flamecomics.xyz", "flamecomics.com", "flamecomics.me", "flamescans.org",
    "reaperscans.com", "realmscans.xyz", "void-scans.com", "voidscans.com",
    "cosmicscans.com", "luminousscans.com", "anigliscans.com",
    "freakscans.com", "suryascans.com", "nightcomic.com"
)


class MangaStreamAdapter(BaseSiteAdapter):
    """Specialized adapter for ThemeSphere / MangaStream scanlation websites."""

    name: str = "ThemeSphere (MangaStream)"
    icon: str = "⚡"
    description: str = "ThemeSphere reader (#readerarea img). Covers Asura, Flame, Reaper, Void Scans."
    supported_domains: list = list(_KNOWN_MANGASTREAM_DOMAINS)

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        domain = source_info.domain.lower()
        if any(d in domain for d in cls.supported_domains):
            return True
        # Match typical chapter slug: e.g. /series-title-chapter-12/
        url_lower = (source_info.original_url or "").lower()
        return bool(re.search(r"/(?:series|manga|comic)/.+?-chapter-\d+", url_lower))

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        headers = dict(context.config.headers or {})
        parsed = urlparse(url)
        headers.setdefault("Referer", f"{parsed.scheme}://{parsed.netloc}/")
        context.config.headers = headers

        # ------------------------------------------------------------------
        # Step 1: Fast Static HTTP Fetch
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

            soup = DomExtractor.get_soup(html)
            if soup:
                self._extract_navigation_and_series(soup, url, context)

                dom_images = self._extract_reader_images(soup, url)
                if len(dom_images) >= 3:
                    context.candidate_images.extend(dom_images)
                    context.checklist.reader_found = True
                    context.checklist.reader_end_reached = True
                    context.checklist.lazy_loading_finished = True
                    context.completeness = ScrapeCompleteness.COMPLETE
                    context.record_level(
                        "Level 1: MangaStream Static HTTP",
                        EscalationStatus.SUCCESS,
                        95.0,
                        len(dom_images),
                        fetch_dur * 1000,
                    )
                    return self._finalize(context, start_time)

        # ------------------------------------------------------------------
        # Step 2: Playwright with auto-scroll for Cloudflare/JS readers
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
                    pw_images = self._extract_reader_images(soup_pw, url)
                    if len(pw_images) >= 3:
                        context.candidate_images.extend(pw_images)
                        context.checklist.reader_found = True
                        context.checklist.reader_end_reached = True
                        context.checklist.lazy_loading_finished = True
                        context.completeness = ScrapeCompleteness.COMPLETE
                        context.record_level(
                            "Level 4: MangaStream Playwright",
                            EscalationStatus.SUCCESS,
                            95.0,
                            len(pw_images),
                            browser_dur,
                        )
                        return self._finalize(context, start_time)

        # Fallback
        logger.info("[MangaStreamAdapter] Insufficient images; delegating to GenericAdaptiveAdapter.")
        generic = GenericAdaptiveAdapter()
        return await generic.scrape(context)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _extract_reader_images(self, soup, base_url: str) -> List[CandidateImage]:
        candidates: List[CandidateImage] = []
        seen = set()

        # #readerarea is the universal ThemeSphere selector
        container = soup.select_one("#readerarea, .ts-main-image, div.composed_images")
        target_nodes = container.find_all("img") if container else soup.select("#readerarea img, .ts-main-image img")

        for idx, img in enumerate(target_nodes):
            src = (
                img.get("src") or
                img.get("data-src") or
                img.get("data-lazy-src") or
                img.get("data-original") or ""
            ).strip()

            if not src or any(ign in src.lower() for ign in ["1x1", "pixel", "blank.gif", "placeholder", "spinner", "logo", "credit"]):
                continue

            abs_url = urljoin(base_url, src)
            if abs_url not in seen:
                seen.add(abs_url)
                candidates.append(
                    CandidateImage(
                        url=abs_url,
                        source_type=ImageSourceType.DOM,
                        dom_index=idx,
                        container_selector="#readerarea",
                        is_inside_reader=True,
                        confidence=0.98,
                        raw_attributes=dict(img.attrs) if hasattr(img, "attrs") else {}
                    )
                )

        return candidates

    def _extract_navigation_and_series(self, soup, base_url: str, context: ScrapeContext):
        # Next / Prev chapters
        prev_a = soup.select_one(".nextprev a.prev, .nextprev a.l, a.ch-prev-btn, .ch-prev a")
        if prev_a and prev_a.get("href") and not context.chapter_info.previous:
            context.chapter_info.previous = urljoin(base_url, prev_a["href"])

        next_a = soup.select_one(".nextprev a.next, .nextprev a.r, a.ch-next-btn, .ch-next a")
        if next_a and next_a.get("href") and not context.chapter_info.next:
            context.chapter_info.next = urljoin(base_url, next_a["href"])

        # Series link
        all_series = soup.select_one(".allseries a, .ts-breadcrumb a:nth-of-type(2), .headpost a")
        if all_series and all_series.get("href"):
            if not context.series_info.url:
                context.series_info.url = urljoin(base_url, all_series["href"])
            if not context.series_info.title:
                context.series_info.title = all_series.get_text(strip=True)

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
