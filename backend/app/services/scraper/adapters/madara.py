"""
backend/app/services/scraper/adapters/madara.py
─────────────────────────────────────────────────────────────────────────────
Universal Adapter for WordPress WP-Manga (Madara) scanlation platforms.
Handles 100+ scanlation websites using the Madara theme architecture.
─────────────────────────────────────────────────────────────────────────────
Key Selectors & Structure:
  • Container: .reading-content, div.page-break, .entry-content
  • Image tags: .reading-content img, .page-break img
  • Lazy Attributes: data-src, data-lazy-src, data-original, src
  • Navigation: .nav-previous a, .nav-next a, select.single-chapter-select
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

logger = logging.getLogger("sonikoma.services.scraper.adapters.madara")

# ─── Known Madara Domains & Patterns ─────────────────────────────────────────

_KNOWN_MADARA_DOMAINS = (
    "mangaclash.com", "manhuaus.com", "topmanhua.com", "manhuaplus.org", "manhuaplus.com",
    "manhwa18.cc", "1stkissmanga.io", "1stkissmanga.com", "1stkissmanga.me", "mangatx.com",
    "mangaeffect.com", "mangaonlineteam.com", "kunmanga.com", "harimanga.com",
    "zinmanga.com", "manhwaclan.com", "manhwaden.com", "manga68.com", "manhuato.com",
    "manganato.com", "readmanganato.com", "chapmanganato.to", "chapmanganato.com",
    "mangakakalot.com", "mangakakalot.tv", "readmangakakalot.com"
)

_MADARA_CONTAINER_SELECTORS = [
    ".reading-content",
    ".page-break",
    ".text-left",
    ".wp-manga-chapter-img"
]


class MadaraCmsAdapter(BaseSiteAdapter):
    """Universal adapter for WordPress WP-Manga / Madara theme websites."""

    name: str = "WP-Manga (Madara)"
    icon: str = "📑"
    description: str = "WordPress WP-Manga reader (.reading-content img). Covers 100+ scanlation sites."
    supported_domains: list = list(_KNOWN_MADARA_DOMAINS)

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        domain = source_info.domain.lower()
        if any(d in domain for d in cls.supported_domains):
            return True
        # Path heuristic: standard Madara path is /manga/{slug}/{chapter-slug}/
        url_lower = (source_info.original_url or "").lower()
        return "/manga/" in url_lower and ("chapter" in url_lower or "ch-" in url_lower or "ep-" in url_lower)

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        # ------------------------------------------------------------------
        # Step 1: Fast Static HTTP Fetch
        # ------------------------------------------------------------------
        headers = dict(context.config.headers or {})
        parsed = urlparse(url)
        headers.setdefault("Referer", f"{parsed.scheme}://{parsed.netloc}/")
        context.config.headers = headers

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

                dom_images = self._extract_madara_images(soup, url)
                if len(dom_images) >= 3:
                    context.candidate_images.extend(dom_images)
                    context.checklist.reader_found = True
                    context.checklist.reader_end_reached = True
                    context.checklist.lazy_loading_finished = True
                    context.completeness = ScrapeCompleteness.COMPLETE
                    context.record_level(
                        "Level 1: Madara Static HTTP",
                        EscalationStatus.SUCCESS,
                        95.0,
                        len(dom_images),
                        fetch_dur * 1000,
                    )
                    return self._finalize(context, start_time)

        # ------------------------------------------------------------------
        # Step 2: Playwright with auto-scroll for lazy/Cloudflare protection
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
                    pw_images = self._extract_madara_images(soup_pw, url)
                    if len(pw_images) >= 3:
                        context.candidate_images.extend(pw_images)
                        context.checklist.reader_found = True
                        context.checklist.reader_end_reached = True
                        context.checklist.lazy_loading_finished = True
                        context.completeness = ScrapeCompleteness.COMPLETE
                        context.record_level(
                            "Level 4: Madara Playwright",
                            EscalationStatus.SUCCESS,
                            95.0,
                            len(pw_images),
                            browser_dur,
                        )
                        return self._finalize(context, start_time)

        # ------------------------------------------------------------------
        # Fallback to Generic Adaptive Adapter
        # ------------------------------------------------------------------
        logger.info("[MadaraCmsAdapter] Delegating to GenericAdaptiveAdapter fallback.")
        generic = GenericAdaptiveAdapter()
        return await generic.scrape(context)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _extract_madara_images(self, soup, base_url: str) -> List[CandidateImage]:
        candidates: List[CandidateImage] = []
        seen = set()

        # Check standard Madara reader containers
        container = None
        for sel in _MADARA_CONTAINER_SELECTORS:
            node = soup.select_one(sel)
            if node:
                container = node
                break

        target_nodes = container.find_all("img") if container else soup.select(".reading-content img, .page-break img, .wp-manga-chapter-img")

        for idx, img in enumerate(target_nodes):
            src = (
                img.get("data-src") or
                img.get("data-lazy-src") or
                img.get("data-original") or
                img.get("src") or ""
            ).strip()

            if not src or any(ign in src.lower() for ign in ["1x1", "pixel", "blank.gif", "placeholder", "spinner", "logo"]):
                continue

            abs_url = urljoin(base_url, src)
            if abs_url not in seen:
                seen.add(abs_url)
                candidates.append(
                    CandidateImage(
                        url=abs_url,
                        source_type=ImageSourceType.DOM,
                        dom_index=idx,
                        container_selector=".reading-content",
                        is_inside_reader=True,
                        confidence=0.98,
                        raw_attributes=dict(img.attrs) if hasattr(img, "attrs") else {}
                    )
                )

        return candidates

    def _extract_navigation_and_series(self, soup, base_url: str, context: ScrapeContext):
        # Next / Prev chapters
        prev_a = soup.select_one(".nav-previous a, a.prev_page")
        if prev_a and prev_a.get("href") and not context.chapter_info.previous:
            context.chapter_info.previous = urljoin(base_url, prev_a["href"])

        next_a = soup.select_one(".nav-next a, a.next_page")
        if next_a and next_a.get("href") and not context.chapter_info.next:
            context.chapter_info.next = urljoin(base_url, next_a["href"])

        # Breadcrumb / Series link
        breadcrumb = soup.select_one(".breadcrumb a[href*='/manga/'], .entry-header a[href*='/manga/']")
        if breadcrumb and breadcrumb.get("href"):
            if not context.series_info.url:
                context.series_info.url = urljoin(base_url, breadcrumb["href"])
            if not context.series_info.title:
                context.series_info.title = breadcrumb.get_text(strip=True)

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
