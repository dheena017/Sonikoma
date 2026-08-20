"""
backend/app/services/scraper/adapters/webcomics.py
─────────────────────────────────────────────────────────────────────────────
Specialized Adapter for WebComics (webcomicsapp.com).

Architecture: Nuxt.js (Vue SSR) + client-side lazy loading via IntersectionObserver.
─────────────────────────────────────────────────────────────────────────────
Key Observations:
  • URL pattern: /en/{genre}/{series-slug}/{chapter-no}/{comic-id}
  • Series page:  /en/comic/{series-slug}/{comic-id}
  • Next chapter: /en/{genre}/{series-slug}/{chapter-no + 1}/{comic-id}
  • Reader DOM:   div.reader-image-list > div.reader-image-list__item > picture > img.reader-image-list__img
  • SSR delivers only pages 1–2 with real src URLs; remaining pages use a 1×1 SVG
    placeholder and are populated lazily by Vue hydration on scroll.
  • Image CDN hosts: imgg.mangaina.com, imgg-h.mangaina.com
  • Mandatory Referer: https://www.webcomicsapp.com/
─────────────────────────────────────────────────────────────────────────────
Strategy:
  1. HTTP fetch (SSR gives us metadata + page-count + first 2 images).
  2. Parse URL to fill series/chapter metadata without relying solely on AI.
  3. If ≥ 3 real image URLs found in SSR HTML → return immediately (rare but possible).
  4. Otherwise → Playwright with auto_scroll=True to trigger lazy loading of all panels.
  5. Post-browser: use known reader container selector for targeted DOM extraction;
     also correlate intercepted CDN network URLs as supplementary evidence.
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
    ScrapeError,
    ScrapeErrorCode,
    CandidateImage,
    ImageSourceType,
)
from ..acquisition import HttpFetcher, BrowserFetcher
from ..extraction import DomExtractor
from ..validator import ImageValidator
from ..order_resolver import OrderResolver
from ..diagnostics import ScraperDiagnosticsLogger

logger = logging.getLogger("sonikoma.services.scraper.adapters.webcomics")

# ─── Constants ───────────────────────────────────────────────────────────────

_DOMAIN = "webcomicsapp.com"
_CDN_HOSTS = ("imgg.mangaina.com", "imgg-h.mangaina.com", "mangaina.com", "webcomicsapp.com")
_READER_CONTAINER_SELECTOR = "div.reader-image-list"
_IMAGE_SELECTOR = "img.reader-image-list__img"
_PLACEHOLDER_SRC = "data:image/svg+xml"

# WebComics path: /en/{genre}/{series-slug}/{chapter-no}/{comic-id}
# or:            /en/comic/{series-slug}/{comic-id}          (series page — not a reader URL)
_READER_PATH_RE = re.compile(
    r"^/(?P<lang>[a-z]{2})/(?P<genre>[^/]+)/(?P<slug>[^/]+)/(?P<chapter>\d+)/(?P<comic_id>[a-f0-9]+)$",
    re.IGNORECASE,
)


class WebComicsAdapter(BaseSiteAdapter):
    """Specialized adapter for WebComics (webcomicsapp.com)."""

    name: str = "WebComics"
    icon: str = "📖"
    description: str = "WebComics Nuxt.js Vue SSR reader with auto-scroll and imgg.mangaina.com CDN interception."
    supported_domains: list = ["webcomicsapp.com"]

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        domain = source_info.domain.lower()
        return any(d in domain for d in cls.supported_domains)

    # ── Main entry ────────────────────────────────────────────────────────────

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        # ------------------------------------------------------------------
        # Step 0: URL decomposition — derive series/chapter metadata cheaply
        # ------------------------------------------------------------------
        self._parse_url_metadata(url, context)

        # ------------------------------------------------------------------
        # Step 1: Static HTTP — SSR delivers first ~2 images + page structure
        # ------------------------------------------------------------------
        headers = self._build_headers(context, url)

        html, status_code, fetch_dur = await HttpFetcher.fetch_html(
            url,
            headers=headers,
            cookies=context.config.cookies,
            timeout=context.config.timeout_seconds,
        )
        context.raw_html = html

        if html:
            # Supplement metadata from Open Graph / JSON-LD embedded by Nuxt SSR
            series, chapter = DomExtractor.extract_metadata(html, url)
            self._merge_metadata(context, series, chapter)

            # Try a targeted DOM extract from the SSR HTML
            ssr_images = self._extract_real_images_from_html(html, url)
            context.record_level(
                "Level 1: WebComics Static HTTP",
                EscalationStatus.SUCCESS,
                0.9,
                len(ssr_images),
                fetch_dur * 1000,
            )

            if len(ssr_images) >= 15:
                # SSR shipped a complete chapter render (>= 15 panels)
                context.candidate_images.extend(ssr_images)
                context.checklist.reader_found = True
                context.checklist.reader_end_reached = True
                context.checklist.lazy_loading_finished = True
                context.completeness = ScrapeCompleteness.COMPLETE
                return self._finalize(context, start_time)
            elif ssr_images:
                logger.info(
                    f"[WebComicsAdapter] Found {len(ssr_images)} initial SSR preview images. "
                    "Escalating to browser auto-scroll to load complete chapter panels."
                )
        else:
            context.record_level(
                "Level 1: WebComics Static HTTP",
                EscalationStatus.FAILED,
                0.0,
                0,
                fetch_dur * 1000,
                reason=f"HTTP {status_code}",
            )

        # ------------------------------------------------------------------
        # Step 2: Playwright with auto-scroll — forces Vue lazy loading
        # ------------------------------------------------------------------
        if not context.config.enable_browser_fallback:
            logger.warning("[WebComicsAdapter] Browser fallback disabled; cannot load lazy images.")
            context.completeness = ScrapeCompleteness.PARTIAL
            context.error = ScrapeError(
                code=ScrapeErrorCode.READER_NOT_FOUND,
                message="WebComics requires browser rendering to load all chapter panels. Enable browser fallback.",
            )
            return self._finalize(context, start_time)

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
            pw_images = self._extract_real_images_from_html(pw_html, url)

            # Supplement with network-intercepted CDN URLs (most reliable source)
            cdn_urls = self._filter_cdn_images(net_images)
            pw_image_urls = {img.url for img in pw_images}
            for i, cdn_url in enumerate(cdn_urls):
                if cdn_url not in pw_image_urls:
                    pw_images.append(
                        CandidateImage(
                            url=cdn_url,
                            source_type=ImageSourceType.NETWORK,
                            dom_index=len(pw_images) + i,
                            is_inside_reader=True,
                            confidence=0.95,
                        )
                    )

            context.candidate_images.extend(pw_images)

            if len(context.candidate_images) >= 3:
                context.checklist.reader_found = True
                context.checklist.reader_end_reached = True
                context.checklist.lazy_loading_finished = True
                context.checklist.network_set_complete = True
                context.completeness = ScrapeCompleteness.COMPLETE
                context.record_level(
                    "Level 4: WebComics Playwright",
                    EscalationStatus.SUCCESS,
                    95.0,
                    len(context.candidate_images),
                    browser_dur,
                )
                return self._finalize(context, start_time)
            else:
                context.record_level(
                    "Level 4: WebComics Playwright",
                    EscalationStatus.PARTIAL,
                    0.0,
                    len(context.candidate_images),
                    browser_dur,
                    reason=f"Only {len(context.candidate_images)} panels found after scroll",
                )
        else:
            context.record_level(
                "Level 4: WebComics Playwright",
                EscalationStatus.FAILED,
                0.0,
                0,
                browser_dur,
                reason="Browser failed to render page",
            )

        # ------------------------------------------------------------------
        # Fallback: hand off to generic adapter if we still have < 3 panels
        # ------------------------------------------------------------------
        if len(context.candidate_images) < 3:
            logger.warning(
                "[WebComicsAdapter] Insufficient panels after Playwright; delegating to GenericAdaptiveAdapter."
            )
            generic = GenericAdaptiveAdapter()
            return await generic.scrape(context)

        return self._finalize(context, start_time)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _parse_url_metadata(self, url: str, context: ScrapeContext) -> None:
        """Extracts series/chapter fields from the WebComics URL structure."""
        parsed = urlparse(url)
        m = _READER_PATH_RE.match(parsed.path)
        if not m:
            return

        genre = m.group("genre")
        slug = m.group("slug")
        chapter_str = m.group("chapter")
        comic_id = m.group("comic_id")

        if slug and not context.series_info.slug:
            context.series_info.slug = slug

        if genre and genre.lower() not in ("en", "comic", "read", "manga", "manhwa", "manhua"):
            if not context.series_info.genres:
                context.series_info.genres = [genre.capitalize()]

        if not context.series_info.publisher:
            context.series_info.publisher = "WebComics"

        # Series page URL pattern: /en/comic/{slug}/{comic_id}
        if not context.series_info.url:
            lang = m.group("lang") or "en"
            context.series_info.url = (
                f"https://www.{_DOMAIN}/{lang}/comic/{slug}/{comic_id}"
            )

        # Chapter number
        if chapter_str and context.chapter_info.number is None:
            try:
                ch_num = float(chapter_str)
                context.chapter_info.number = ch_num
                context.chapter_info.episode = f"Ch. {chapter_str}"
            except ValueError:
                pass

        # Derive next chapter URL (WebComics uses sequential chapter numbers in the path)
        if chapter_str and not context.chapter_info.next:
            try:
                next_ch = int(chapter_str) + 1
                lang = m.group("lang") or "en"
                context.chapter_info.next = (
                    f"https://www.{_DOMAIN}/{lang}/{genre}/{slug}/{next_ch}/{comic_id}"
                )
            except ValueError:
                pass

        if chapter_str and not context.chapter_info.previous:
            try:
                prev_ch = int(chapter_str) - 1
                if prev_ch >= 1:
                    lang = m.group("lang") or "en"
                    context.chapter_info.previous = (
                        f"https://www.{_DOMAIN}/{lang}/{genre}/{slug}/{prev_ch}/{comic_id}"
                    )
            except ValueError:
                pass

        logger.debug(
            f"[WebComicsAdapter] Parsed URL — slug={slug!r}, genre={genre!r}, "
            f"chapter={chapter_str!r}, comic_id={comic_id!r}"
        )

    def _build_headers(self, context: ScrapeContext, url: str) -> dict:
        """Builds request headers with the required Referer for WebComics CDN images."""
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        headers = dict(context.config.headers or {})
        headers.setdefault("Referer", origin + "/")
        headers.setdefault("Origin", origin)
        headers.setdefault("Accept-Language", "en-US,en;q=0.9")
        # Update context so downstream levels inherit the headers
        context.config.headers = headers
        return headers

    def _extract_real_images_from_html(self, html: str, base_url: str) -> List[CandidateImage]:
        """
        Extracts only genuine (non-placeholder) image URLs from the reader container.
        Pages with lazy placeholders (data:image/svg+xml) are skipped.
        """
        soup = DomExtractor.get_soup(html)
        if not soup:
            return []

        container = soup.select_one(_READER_CONTAINER_SELECTOR)
        if not container:
            # Fallback: try density clustering
            return DomExtractor.extract_manga_images_fallback(soup, base_url)

        candidates: List[CandidateImage] = []
        seen: set = set()

        for idx, img in enumerate(container.select(_IMAGE_SELECTOR)):
            src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
            if not src or src.startswith(_PLACEHOLDER_SRC):
                continue  # Skip unloaded lazy placeholders

            abs_url = urljoin(base_url, str(src).strip())
            if abs_url in seen:
                continue
            seen.add(abs_url)

            candidates.append(
                CandidateImage(
                    url=abs_url,
                    source_type=ImageSourceType.DOM,
                    dom_index=idx,
                    container_selector=_READER_CONTAINER_SELECTOR,
                    is_inside_reader=True,
                    confidence=0.97,
                    raw_attributes=dict(img.attrs) if hasattr(img, "attrs") else {},
                )
            )

        return candidates

    def _filter_cdn_images(self, net_urls: List[str]) -> List[str]:
        """Retains only WebComics CDN image URLs from the network intercept list."""
        result = []
        for url in net_urls:
            url_lower = url.lower()
            if any(host in url_lower for host in _CDN_HOSTS):
                # Reject obvious non-panel assets: icons, ads, avatars
                if not any(
                    skip in url_lower
                    for skip in ("logo", "icon", "avatar", "banner", "cover", "ad/", "ads/", "spinner", "1x1")
                ):
                    result.append(url)
        return result

    def _merge_metadata(self, context: ScrapeContext, series, chapter) -> None:
        """Merges DomExtractor-parsed metadata into context without overwriting existing values."""
        if series.title and not context.series_info.title:
            context.series_info.title = series.title
        if series.description and not context.series_info.description:
            context.series_info.description = series.description
        if series.cover and not context.series_info.cover:
            context.series_info.cover = series.cover
        if series.author and not context.series_info.author:
            context.series_info.author = series.author
        if series.publisher and not context.series_info.publisher:
            context.series_info.publisher = series.publisher
        if series.genres and not context.series_info.genres:
            context.series_info.genres = series.genres
        if chapter.title and not context.chapter_info.title:
            context.chapter_info.title = chapter.title
        if chapter.number is not None and context.chapter_info.number is None:
            context.chapter_info.number = chapter.number
        if chapter.previous and not context.chapter_info.previous:
            context.chapter_info.previous = chapter.previous
        if chapter.next and not context.chapter_info.next:
            context.chapter_info.next = chapter.next
        context.checklist.chapter_found = bool(
            context.chapter_info.title or context.chapter_info.number is not None
        )

    def _finalize(self, context: ScrapeContext, start_time: float) -> ChapterResult:
        """Validates and orders the final candidate list, then returns ChapterResult."""
        total_ms = (time.time() - start_time) * 1000

        # Deduplicate
        seen: set = set()
        unique: list = []
        for c in context.candidate_images:
            if c.url not in seen:
                seen.add(c.url)
                unique.append(c)

        validated, rejections = ImageValidator.validate_candidates(
            unique,
            filter_banners=context.config.filter_banners,
        )
        context.rejections.extend(rejections)
        context.validated_images = OrderResolver.resolve_order(validated)

        if len(context.validated_images) < 3 and not context.error:
            context.completeness = ScrapeCompleteness.FAILED
            context.error = ScrapeError(
                code=ScrapeErrorCode.READER_NOT_FOUND,
                message=(
                    f"Panel validation left only {len(context.validated_images)} valid images "
                    f"({len(rejections)} rejected). The chapter may be paywalled or geo-blocked."
                ),
                details={"rejected_count": len(rejections)},
            )

        ScraperDiagnosticsLogger.log_result(
            chapter_number=context.chapter_info.number,
            images_count=len(context.validated_images),
            new_images_count=0,
            completeness=context.completeness.value,
            execution_time_ms=total_ms,
        )
        return context.to_chapter_result()
