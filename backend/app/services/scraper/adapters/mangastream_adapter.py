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

from .base_site_adapter import BaseSiteAdapter
from .generic_site_adapter import GenericAdaptiveAdapter
from ..scrape_context import ScrapeContext
from ..scraper_models import (
    ChapterResult,
    SourceInfo,
    EscalationStatus,
    ScrapeCompleteness,
    CandidateImage,
    ImageSourceType,
)
from ..acquisition import HttpFetcher, BrowserFetcher
from ..extraction import DomExtractor
from ..content_validator import ImageValidator
from ..image_order_resolver import OrderResolver
from ..content_evaluator import ScraperDiagnosticsLogger
from ..scraper_constants import MANGASTREAM_DOMAINS

logger = logging.getLogger("sonikoma.services.scraper.adapters.mangastream")


class MangaStreamAdapter(BaseSiteAdapter):
    """Specialized adapter for ThemeSphere / MangaStream scanlation websites."""

    name: str = "ThemeSphere (MangaStream)"
    icon: str = "⚡"
    description: str = "ThemeSphere reader (#readerarea img). Covers Asura, Flame, Reaper, Void Scans."
    supported_domains: list = list(MANGASTREAM_DOMAINS)

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
        if not html or status in (403, 503) or (soup and not soup.select(".eplister, #chapterlist, .entry-title, a[href*='/chapter']")):
            logger.info(f"[MangaStreamAdapter] Fetching series page via BrowserFetcher: {clean_url}")
            b_html, _, _ = await BrowserFetcher.render_page(
                clean_url,
                auto_scroll=True,
                wait_selector="a[href*='/chapter'], h1, .entry-title, .eplister",
                timeout_seconds=25.0
            )
            if b_html:
                html = b_html
                soup = DomExtractor.get_soup(b_html)

        if not soup:
            return None

        # 0. Check Embedded Next.js / Nuxt state trees (e.g. Asura / FlameComics SPA state)
        from ..extraction.embedded_state_extractor import EmbeddedStateExtractor
        state_data = EmbeddedStateExtractor.extract_series_and_episodes_from_state(html or "", clean_url)
        if state_data and state_data.get("episodes"):
            return {
                "success": True,
                "series_title": state_data.get("title") or "Comic Series",
                "url": clean_url,
                "series": {
                    "title": state_data.get("title") or "Comic Series",
                    "author": state_data.get("author") or "",
                    "cover_image": state_data.get("cover") or "",
                    "url": clean_url
                },
                "episodes": state_data["episodes"],
                "total_episodes": len(state_data["episodes"])
            }

        # 1. Extract Series Metadata & Cover Poster
        series_meta, _ = DomExtractor.extract_metadata(html or "", clean_url)
        title_el = soup.select_one(".entry-title, h1.entry-title, .infox h1")
        series_title = title_el.get_text(strip=True) if title_el else (series_meta.title or "Comic Series")

        author_el = soup.select_one(".infox .author, .author, .spe span, .fmed b")
        author = author_el.get_text(strip=True) if author_el else (series_meta.author or "")

        cover_el = soup.select_one(".thumb img, .bigcover img, meta[property='og:image'], .series-thumb img, .poster img")
        cover_image = ""
        if cover_el:
            cover_image = cover_el.get("content") or cover_el.get("data-src") or cover_el.get("src") or ""

        # 2. Extract Chapters from .eplister / #chapterlist / select#chapter / links
        episodes: List[Dict[str, Any]] = []
        seen = set()

        # Strategy A: .eplister li or #chapterlist li
        for li in soup.select(".eplister li, #chapterlist li, ul.clstyle li, .chapter-list li, .bxcl li"):
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

        # Strategy C: Modern React / Tailwind Grid Chapter links (Asura / Flame / Void)
        if not episodes:
            for a in soup.select("a[href*='/chapter/'], a[href*='/chapter-'], a[href*='-chapter-'], a[href*='/ch-']"):
                href = a.get("href", "").strip()
                if not href or href == "#" or href.startswith("javascript:"):
                    continue
                full_url = urljoin(clean_url, href)
                if full_url in seen:
                    continue
                seen.add(full_url)

                txt = a.get_text(strip=True)
                if not txt or not any(k in txt.lower() for k in ("chapter", "ch.", "ep.", "episode")):
                    m_ch = re.search(r'chapter[-_]?([0-9.]+)', href, re.I)
                    txt = f"Chapter {m_ch.group(1)}" if m_ch else (txt or "Chapter")

                ep_cover = self.build_proxy_thumbnail_url(None, full_url, cover_image)
                episodes.append({
                    "title": txt or f"Chapter {num_val or len(episodes)+1}",
                    "url": full_url,
                    "chapter_number": num_val,
                    "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or len(episodes)+1)),
                    "date": "",
                    "cover_image": ep_cover or cover_image,
                    "thumbnail": ep_cover or cover_image,
                    "cover": ep_cover or cover_image,
                    "language": self.extract_language_tag(txt),
                })

        sorted_eps = self.deduplicate_and_sort_episodes(episodes, sort_by=sort_by, preferred_language=preferred_language)

        return {
            "success": True,
            "title": series_title,
            "series_title": series_title,
            "url": clean_url,
            "author": author if 'author' in locals() else "",
            "description": description if 'description' in locals() else "",
            "cover_image": cover_image,
            "cover": cover_image,
            "series": {
                "title": series_title,
                "author": author if 'author' in locals() else "",
                "description": description if 'description' in locals() else "",
                "cover_image": cover_image,
                "url": clean_url
            },
            "chapters": sorted_eps,
            "total_chapters": len(sorted_eps),
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
                        source_type=ImageSourceType.DOM,
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
