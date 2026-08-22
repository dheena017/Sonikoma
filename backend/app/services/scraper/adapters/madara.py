"""
backend/app/services/scraper/adapters/madara.py
─────────────────────────────────────────────────────────────────────────────
Universal Adapter for WordPress WP-Manga (Madara) scanlation platforms.
Handles 100+ scanlation websites using the Madara theme architecture.
Provides:
  1. Full Series Discovery & AJAX Chapter Crawling (/ajax/chapters/, admin-ajax.php)
  2. Series Metadata & High-Res Cover Extraction
  3. Chapter Images Scraping from .reading-content and .page-break
─────────────────────────────────────────────────────────────────────────────
"""

import re
import time
import httpx
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

logger = logging.getLogger("sonikoma.services.scraper.adapters.madara")

_KNOWN_MADARA_DOMAINS = (
    "mangaclash.com", "manhuaus.com", "topmanhua.com", "manhuatop.org", "manhuaplus.org", "manhuaplus.com",
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
        url_lower = (source_info.original_url or "").lower()
        return "/manga/" in url_lower and ("chapter" in url_lower or "ch-" in url_lower or "ep-" in url_lower)

    async def discover_series(
        self,
        series_url: str,
        sort_by: str = "latest",
        max_episodes: Optional[int] = None,
        preferred_language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        """
        Crawls all chapters for a Madara series via DOM and dedicated AJAX endpoints.
        """
        raw_url = (series_url or "").strip()
        parsed = urlparse(raw_url)
        base_origin = f"{parsed.scheme}://{parsed.netloc}"
        clean_url = raw_url.rstrip("/")

        # If user passed a chapter link, resolve parent manga url
        if "/chapter" in clean_url or "-chapter-" in clean_url:
            m = re.match(r"^(https?://[^/]+/manga/[^/]+)", clean_url)
            if m:
                clean_url = m.group(1)

        html, status, _ = await HttpFetcher.fetch_html(clean_url)
        soup = DomExtractor.get_soup(html) if html else None

        # Extract Series Metadata & Cover Image
        series_meta, _ = DomExtractor.extract_metadata(html or "", clean_url)
        title_el = soup.select_one(".post-title h1, .post-title h3, h1.entry-title") if soup else None
        series_title = title_el.get_text(strip=True) if title_el else (series_meta.title or "Madara Series")

        author_el = soup.select_one(".author-content a, .artist-content a, .manga-authors a") if soup else None
        author = author_el.get_text(strip=True) if author_el else (series_meta.author or "")

        cover_el = soup.select_one(".summary_image img, .tab-summary img, meta[property='og:image']") if soup else None
        cover_image = ""
        if cover_el:
            cover_image = cover_el.get("content") or cover_el.get("data-src") or cover_el.get("src") or ""

        # AJAX Discovery
        manga_id = None
        if soup:
            holder = soup.select_one("[data-id], #manga-chapters-holder, .manga-chapters-holder, [data-manga]")
            if holder:
                manga_id = holder.get("data-id") or holder.get("data-manga")
            if not manga_id:
                for script in soup.find_all("script"):
                    txt = script.string or ""
                    m = re.search(r'(?:manga_chapter_id|manga_id|mangaID)\s*[=:]\s*["\']?(\d+)["\']?', txt)
                    if m:
                        manga_id = m.group(1)
                        break

        headers = {
            "X-Requested-With": "XMLHttpRequest",
            "Referer": clean_url + "/",
            "Origin": base_origin,
            "Content-Type": "application/x-www-form-urlencoded",
        }

        candidate_endpoints = [(f"{clean_url}/ajax/chapters/", {})]
        if manga_id:
            candidate_endpoints.append(
                (f"{base_origin}/wp-admin/admin-ajax.php", {"action": "manga_get_chapters", "manga": manga_id})
            )

        episodes: List[Dict[str, Any]] = []
        seen = set()

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for endpoint, post_data in candidate_endpoints:
                try:
                    resp = await client.post(endpoint, data=post_data, headers=headers)
                    if resp.status_code == 200 and resp.text and "<li" in resp.text:
                        sub = BeautifulSoup(resp.text, "html.parser")
                        for li in sub.find_all("li", class_=re.compile(r"wp-manga-chapter|chapter-li|chapter_list", re.I)):
                            a = li.find("a", href=True)
                            if not a:
                                continue
                            href = a.get("href", "").strip()
                            if not href or href == "#":
                                continue
                            full_url = urljoin(clean_url, href)
                            if full_url in seen:
                                continue
                            seen.add(full_url)

                            title_raw = a.get_text(strip=True)
                            num_val, _ = self.extract_number_and_type(title_raw)

                            date_el = li.select_one(".chapter-release-date, .post-on, .chapter-date, i")
                            date_str = self.normalize_date(date_el.get_text(strip=True) if date_el else "")

                            is_locked = bool(li.find(class_=re.compile(r"lock|coin|paid|vip|fastpass", re.I)))

                            episodes.append({
                                "title": title_raw or f"Chapter {num_val or len(episodes)+1}",
                                "url": full_url,
                                "chapter_number": num_val,
                                "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or len(episodes)+1)),
                                "date": date_str,
                                "is_locked": is_locked,
                                "language": self.extract_language_tag(title_raw),
                                "thumbnail": self.build_proxy_thumbnail_url(None, full_url, cover_image),
                                "cover": cover_image,
                            })
                        if episodes:
                            break
                except Exception as e:
                    logger.debug(f"[MadaraCmsAdapter] AJAX endpoint failed: {e}")

        # Fallback to Static DOM Chapters if AJAX yielded 0
        if not episodes and soup:
            for li in soup.select("li.wp-manga-chapter, li.chapter-li"):
                a = li.find("a", href=True)
                if not a:
                    continue
                full_url = urljoin(clean_url, a["href"])
                if full_url in seen:
                    continue
                seen.add(full_url)

                title_raw = a.get_text(strip=True)
                num_val, _ = self.extract_number_and_type(title_raw)
                date_el = li.select_one(".chapter-release-date, .post-on, .chapter-date, i")
                date_str = self.normalize_date(date_el.get_text(strip=True) if date_el else "")

                episodes.append({
                    "title": title_raw or f"Chapter {num_val or len(episodes)+1}",
                    "url": full_url,
                    "chapter_number": num_val,
                    "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or len(episodes)+1)),
                    "date": date_str,
                    "thumbnail": self.build_proxy_thumbnail_url(None, full_url, cover_image),
                    "cover": cover_image,
                    "language": self.extract_language_tag(title_raw),
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
        """Executes chapter image extraction for Madara reader sites."""
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

            candidates = self._extract_madara_images(html, url)
            if candidates:
                context.candidate_images = candidates
                context.escalation_status = EscalationStatus.STATIC_HTTP
                context.completeness = ScrapeCompleteness.COMPLETE
                return self._finalize(context, start_time)

        # Fallback to Generic Adaptive Escalation (Playwright) if static HTML failed
        generic = GenericAdaptiveAdapter()
        return await generic.scrape(context)

    def _extract_madara_images(self, html: str, base_url: str) -> List[CandidateImage]:
        soup = DomExtractor.get_soup(html)
        if not soup:
            return []

        candidates: List[CandidateImage] = []
        seen = set()

        for sel in _MADARA_CONTAINER_SELECTORS:
            containers = soup.select(sel)
            for container in containers:
                for img in container.find_all("img"):
                    src = (
                        img.get("data-src")
                        or img.get("data-lazy-src")
                        or img.get("data-original")
                        or img.get("src")
                    )
                    if src and not src.startswith("data:image"):
                        full_url = urljoin(base_url, src.strip())
                        if full_url not in seen:
                            seen.add(full_url)
                            candidates.append(
                                CandidateImage(
                                    url=full_url,
                                    source_type=ImageSourceType.DOM_IMG,
                                    container_selector=sel,
                                    confidence=0.95,
                                )
                            )
            if candidates:
                break

        return candidates

    def _merge_metadata(self, context: ScrapeContext, series, chapter):
        if series:
            if series.title: context.series_info.title = series.title
            if series.cover_image: context.series_info.cover_image = series.cover_image
            if series.author: context.series_info.author = series.author
        if chapter:
            if chapter.number is not None: context.chapter_info.number = chapter.number
            if chapter.title: context.chapter_info.title = chapter.title
