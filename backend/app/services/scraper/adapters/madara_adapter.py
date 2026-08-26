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
from ..scraper_constants import MADARA_DOMAINS

logger = logging.getLogger("sonikoma.services.scraper.adapters.madara")

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
    supported_domains: list = list(MADARA_DOMAINS)

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
        if "/chapter" in clean_url or "-chapter-" in clean_url or "/ch-" in clean_url or "/ch/" in clean_url:
            m = re.match(r"^(https?://[^/]+/(?:manga|serie|series|comic|comics|webtoon|webtoons|read|book)/[^/]+)", clean_url, re.I)
            if m:
                clean_url = m.group(1).rstrip("/") + "/"
            else:
                m2 = re.match(r"^(https?://.+?)/(?:chapter[-_/\d]|ch[-_/\d]).*", clean_url, re.I)
                if m2:
                    clean_url = m2.group(1).rstrip("/") + "/"

        html, status, _ = await HttpFetcher.fetch_html(clean_url)
        if not html or status in (403, 503, 429) or (html and "<html" not in html.lower()):
            logger.info(f"[MadaraCmsAdapter] HttpFetcher returned status {status}. Escalating to BrowserFetcher for series discovery...")
            b_html, _, _ = await BrowserFetcher.render_page(
                clean_url, 
                auto_scroll=True, 
                wait_selector=".listing-chapters_wrap, #manga-chapters-holder, .wp-manga-chapter, .sub-chap-list, .version-chap", 
                timeout_seconds=25.0
            )
            if b_html:
                html = b_html

        soup = DomExtractor.get_soup(html) if html else None

        # Extract Series Metadata & Cover Image
        series_meta, _ = DomExtractor.extract_metadata(html or "", clean_url)
        title_el = soup.select_one(".post-title h1, .post-title h3, h1.entry-title, .series-title, meta[property='og:title']") if soup else None
        if title_el and title_el.name == "meta":
            series_title = title_el.get("content", "").strip()
        else:
            series_title = title_el.get_text(strip=True) if title_el else (series_meta.title or "Madara Series")

        author_el = soup.select_one(".author-content a, .artist-content a, .manga-authors a, .author-item a") if soup else None
        author = author_el.get_text(strip=True) if author_el else (series_meta.author or "")

        desc_el = soup.select_one(".description-summary, .summary__content, .manga-excerpt, meta[property='og:description']") if soup else None
        if desc_el and desc_el.name == "meta":
            description = desc_el.get("content", "").strip()
        else:
            description = desc_el.get_text(strip=True) if desc_el else (series_meta.description or "")

        cover_el = soup.select_one(
            ".summary_image img, .tab-summary img, .summary_image a img, .item-thumb img, "
            "meta[property='og:image'], meta[name='twitter:image'], img.wp-post-image, .c-image-hover img"
        ) if soup else None
        cover_image = ""
        if cover_el:
            cover_image = self.extract_image_src(cover_el, clean_url)
        if not cover_image and series_meta and series_meta.cover_image:
            cover_image = self.extract_image_src(series_meta.cover_image, clean_url)

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

                            date_str = self.extract_date_from_node(li)

                            is_locked = bool(li.find(class_=re.compile(r"lock|coin|paid|vip|fastpass", re.I)))

                            ep_img = a.find("img") or li.find("img") or li.find(class_=re.compile(r"thumb|cover|img", re.I))
                            ep_cover = self.extract_image_src(ep_img, clean_url) if ep_img else cover_image

                            episodes.append({
                                "title": title_raw or f"Chapter {num_val or len(episodes)+1}",
                                "url": full_url,
                                "chapter_number": num_val,
                                "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or len(episodes)+1)),
                                "date": date_str,
                                "is_locked": is_locked,
                                "language": self.extract_language_tag(title_raw),
                                "cover_image": ep_cover or cover_image,
                            })
                        if episodes:
                            break
                except Exception as e:
                    logger.debug(f"[MadaraCmsAdapter] AJAX endpoint failed: {e}")

        # Fallback to Browser-Authenticated AJAX / DOM if static httpx yielded 0
        if not episodes:
            logger.info("[MadaraCmsAdapter] Fetching chapter catalog via Browser-Authenticated session...")
            async def _fetch_ajax_in_browser(page, context):
                await page.goto(clean_url, wait_until="domcontentloaded", timeout=25000)
                ajax_script = """
                async () => {
                    const endpoints = [
                        window.location.href.replace(/\\/?$/, '/') + 'ajax/chapters/',
                        '/wp-admin/admin-ajax.php'
                    ];
                    for (const ep of endpoints) {
                        try {
                            const res = await fetch(ep, {
                                method: 'POST',
                                headers: { 'X-Requested-With': 'XMLHttpRequest' }
                            });
                            if (res.ok) {
                                const txt = await res.text();
                                if (txt && txt.includes('<li')) return txt;
                            }
                        } catch(e) {}
                    }
                    const holder = document.querySelector('.listing-chapters_wrap, #manga-chapters-holder, .version-chap, ul.main');
                    return holder ? holder.innerHTML : '';
                }
                """
                return await page.evaluate(ajax_script)

            try:
                ajax_html = await browser_pool.execute_task(_fetch_ajax_in_browser, domain=parsed.netloc, timeout_seconds=25.0)
                if ajax_html:
                    sub = BeautifulSoup(ajax_html, "html.parser")
                    for li in sub.find_all("li", class_=re.compile(r"wp-manga-chapter|chapter-li|chapter_list|version-chap", re.I)):
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

                        date_str = self.extract_date_from_node(li)

                        is_locked = bool(li.find(class_=re.compile(r"lock|coin|paid|vip|fastpass", re.I)))

                        ep_img = a.find("img") or li.find("img")
                        ep_cover = self.extract_image_src(ep_img, clean_url) if ep_img else cover_image

                        episodes.append({
                            "title": title_raw or f"Chapter {num_val or len(episodes)+1}",
                            "url": full_url,
                            "chapter_number": num_val,
                            "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or len(episodes)+1)),
                            "date": date_str,
                            "is_locked": is_locked,
                            "language": self.extract_language_tag(title_raw),
                            "cover_image": ep_cover or cover_image,
                        })
            except Exception as ex:
                logger.debug(f"[MadaraCmsAdapter] Browser AJAX evaluation failed: {ex}")

        # Fallback to Static DOM Chapters if AJAX yielded 0
        if not episodes and soup:
            series_slug = parsed.path.strip("/").split("/")[-1]
            for a in soup.select("li.wp-manga-chapter a, li.chapter-li a, .listing-chapters_wrap a, .sub-chap-list a, .version-chap a, a[href*='chapter'], a[href*='/ch-']"):
                href = a.get("href", "").strip()
                if not href or href == "#" or href.startswith("javascript:"):
                    continue
                # Ensure link belongs to this specific series
                if series_slug and series_slug not in href:
                    continue
                if not any(k in href.lower() for k in ("chapter", "ch-", "ep-", "episode")):
                    continue

                full_url = urljoin(clean_url, href)
                if full_url in seen:
                    continue
                seen.add(full_url)

                title_raw = a.get_text(strip=True)
                if not title_raw or "chapter" not in title_raw.lower():
                    m_slug = re.search(r'chapter[-_]?([0-9.]+)', href, re.I)
                    if m_slug:
                        title_raw = f"Chapter {m_slug.group(1)}"
                    else:
                        title_raw = title_raw or "Chapter"

                num_val, _ = self.extract_number_and_type(title_raw)
                parent_li = a.find_parent("li")
                date_el = parent_li.select_one(".chapter-release-date, .post-on, .chapter-date, i") if parent_li else None
                date_str = self.normalize_date(date_el.get_text(strip=True) if date_el else "")

                ep_img = a.find("img") or (parent_li.find("img") if parent_li else None)
                ep_cover = self.extract_image_src(ep_img, clean_url) if ep_img else cover_image

                episodes.append({
                    "title": title_raw or f"Chapter {num_val or len(episodes)+1}",
                    "url": full_url,
                    "chapter_number": num_val,
                    "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or len(episodes)+1)),
                    "date": date_str,
                    "cover_image": ep_cover or cover_image,
                    "language": self.extract_language_tag(title_raw),
                })




        sorted_eps = self.deduplicate_and_sort_episodes(episodes, sort_by=sort_by, preferred_language=preferred_language)

        return {
            "success": True,
            "title": series_title,
            "series_title": series_title,
            "author": author,
            "description": description,
            "cover_image": cover_image,
            "url": clean_url,
            "series": {
                "title": series_title,
                "author": author,
                "description": description,
                "cover_image": cover_image,
                "url": clean_url
            },
            "chapters": sorted_eps,
            "total_chapters": len(sorted_eps)
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
                context.escalation_status = EscalationStatus.SUCCESS
                context.completeness = ScrapeCompleteness.COMPLETE
                return self._finalize(context, start_time)

        # Fallback to Generic Adaptive Escalation (Playwright) if static HTML was challenged/failed
        logger.info("[MadaraCmsAdapter] Level 1 (HTTP) challenged by Cloudflare/WAF -> Escalating to Level 2 (Playwright Stealth Engine)")
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
                                    source_type=ImageSourceType.DOM,
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
