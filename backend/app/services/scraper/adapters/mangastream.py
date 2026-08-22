"""
backend/app/services/scraper/adapters/mangastream.py
─────────────────────────────────────────────────────────────────────────────
Dedicated Adapter for MangaStream / ThemeSphere scanlation sites.
Covers AsuraScans, FlameComics, ReaperScans, RealmScans, VoidScans, etc.
Provides:
  1. Series Discovery & Full Chapter List Crawling (.eplister, #chapterlist, select#chapter)
  2. Series Metadata & High-Res Cover Poster Extraction
  3. Chapter Panel Image Scraping (#readerarea img)
─────────────────────────────────────────────────────────────────────────────
"""

import re
import time
import logging
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup

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
        url_lower = (source_info.original_url or "").lower()
        return bool(re.search(r"/(?:series|manga|comic)/.+?-chapter-\d+", url_lower))

    async def discover_series(
        self,
        series_url: str,
        sort_by: str = "latest",
        max_episodes: Optional[int] = None,
        preferred_language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        """Crawls series metadata and complete chapter list for MangaStream / ThemeSphere sites."""
        raw_url = (series_url or "").strip()
        parsed = urlparse(raw_url)
        clean_url = raw_url

        # If user passed a single chapter url, attempt to resolve parent series link
        if "-chapter-" in clean_url or "/chapter-" in clean_url:
            m = re.match(r"^(https?://[^/]+/(?:series|manga|comic)/[^/]+)", clean_url)
            if m:
                clean_url = m.group(1)

        headers = {"Referer": f"{parsed.scheme}://{parsed.netloc}/"}
        html, status, _ = await HttpFetcher.fetch_html(clean_url, headers=headers)
        soup = DomExtractor.get_soup(html) if html else None

        # Fallback to browser rendering if blocked by Cloudflare
        if not html or status in (403, 503) or (soup and not soup.select(".eplister, #chapterlist, .entry-title")):
            logger.info(f"[MangaStreamAdapter] Fetching series page via BrowserFetcher: {clean_url}")
            b_html, _, _ = await BrowserFetcher.render_page(clean_url, auto_scroll=True)
            if b_html:
                html = b_html
                soup = DomExtractor.get_soup(b_html)

        if not soup:
            return None

        # 1. Extract Series Metadata & Cover Poster
        series_meta, _ = DomExtractor.extract_metadata(html or "", clean_url)
        title_el = soup.select_one(".entry-title, h1.entry-title, .infox h1")
        series_title = title_el.get_text(strip=True) if title_el else (series_meta.title or "Comic Series")

        author_el = soup.select_one(".infox .spe span:has(b:contains('Author')), .infox .author, .author")
        author = author_el.get_text(strip=True) if author_el else (series_meta.author or "")

        cover_el = soup.select_one(".thumb img, .bigcover img, meta[property='og:image']")
        cover_image = ""
        if cover_el:
            cover_image = cover_el.get("content") or cover_el.get("data-src") or cover_el.get("src") or ""

        # 2. Extract Chapters from .eplister / #chapterlist / select#chapter
        episodes: List[Dict[str, Any]] = []
        seen = set()

        # Strategy A: .eplister li or #chapterlist li
        for li in soup.select(".eplister li, #chapterlist li, ul.clstyle li"):
            a = li.find("a", href=True)
            if not a:
                continue
            full_url = urljoin(clean_url, a["href"])
            if full_url in seen:
                continue
            seen.add(full_url)

            # Chapter number / title
            num_el = li.select_one(".chapternum, .epl-num")
            title_text = num_el.get_text(strip=True) if num_el else a.get_text(strip=True)
            num_val, _ = self.extract_number_and_type(title_text)

            # Date
            date_el = li.select_one(".chapterdate, .epl-date")
            date_str = self.normalize_date(date_el.get_text(strip=True) if date_el else "")

            episodes.append({
                "title": title_text or f"Chapter {num_val or len(episodes)+1}",
                "url": full_url,
                "chapter_number": num_val,
                "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or len(episodes)+1)),
                "date": date_str,
                "thumbnail": self.build_proxy_thumbnail_url(None, full_url, cover_image),
                "cover": cover_image,
                "language": self.extract_language_tag(title_text),
            })

        # Strategy B: select#chapter dropdown
        if not episodes:
            for opt in soup.select("select#chapter option, select.single-chapter-select option"):
                val = opt.get("value", "").strip()
                if not val or not val.startswith("http"):
                    continue
                if val in seen:
                    continue
                seen.add(val)

                txt = opt.get_text(strip=True)
                num_val, _ = self.extract_number_and_type(txt)
                episodes.append({
                    "title": txt or f"Chapter {num_val or len(episodes)+1}",
                    "url": val,
                    "chapter_number": num_val,
                    "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or len(episodes)+1)),
                    "date": "",
                    "thumbnail": self.build_proxy_thumbnail_url(None, val, cover_image),
                    "cover": cover_image,
                    "language": self.extract_language_tag(txt),
                })

        sorted_eps = self.deduplicate_and_sort_episodes(episodes, sort_by=sort_by, preferred_language=preferred_language)

        return {
            "success": True,
            "series_title": series_title,
            "url": clean_url,
            "series": {
                "title": series_title,
                "author": author,
                "cover_image": cover_image,
                "url": clean_url
            },
            "episodes": sorted_eps,
            "total_episodes": len(sorted_eps)
        }

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes chapter image extraction for ThemeSphere / MangaStream sites."""
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

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

                dom_images = self._extract_reader_images(soup, url)
                if len(dom_images) >= 3:
                    context.candidate_images.extend(dom_images)
                    context.checklist.reader_found = True
                    context.escalation_status = EscalationStatus.STATIC_HTTP
                    context.completeness = ScrapeCompleteness.COMPLETE
                    return self._finalize(context, start_time)

        # Fallback to Generic Adaptive Escalation (Playwright)
        generic = GenericAdaptiveAdapter()
        return await generic.scrape(context)

    def _extract_reader_images(self, soup: BeautifulSoup, base_url: str) -> List[CandidateImage]:
        candidates: List[CandidateImage] = []
        seen = set()

        reader = soup.select_one("#readerarea, .ts-main-image, div#readerarea")
        if not reader:
            return []

        for img in reader.find_all("img"):
            src = (
                img.get("data-src")
                or img.get("data-lazy-src")
                or img.get("data-original")
                or img.get("src")
            )
            if not src or src.startswith("data:image") or "banner" in src.lower():
                continue

            full_url = urljoin(base_url, src.strip())
            if full_url not in seen:
                seen.add(full_url)
                candidates.append(
                    CandidateImage(
                        url=full_url,
                        source_type=ImageSourceType.DOM_IMG,
                        container_selector="#readerarea",
                        confidence=0.95,
                    )
                )

        return candidates

    def _extract_navigation_and_series(self, soup: BeautifulSoup, current_url: str, context: ScrapeContext):
        series_link = soup.select_one(".ts-breadcrumb li a[href*='/series/'], .allc a, a.series")
        if series_link and series_link.get("href"):
            context.series_info.url = urljoin(current_url, series_link["href"])
            if not context.series_info.title:
                context.series_info.title = series_link.get_text(strip=True)

        next_a = soup.select_one(".nextprev a.r, .ch-next-btn, a[rel='next']")
        if next_a and next_a.get("href"):
            context.chapter_info.next_chapter_url = urljoin(current_url, next_a["href"])

        prev_a = soup.select_one(".nextprev a.l, .ch-prev-btn, a[rel='prev']")
        if prev_a and prev_a.get("href"):
            context.chapter_info.previous_chapter_url = urljoin(current_url, prev_a["href"])

    def _merge_metadata(self, context: ScrapeContext, series, chapter):
        if series:
            if series.title: context.series_info.title = series.title
            if series.cover_image: context.series_info.cover_image = series.cover_image
            if series.author: context.series_info.author = series.author
        if chapter:
            if chapter.number is not None: context.chapter_info.number = chapter.number
            if chapter.title: context.chapter_info.title = chapter.title
