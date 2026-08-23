"""
backend/app/services/scraper/adapters/inkr.py
─────────────────────────────────────────────────────────────────────────────
Specialized Adapter for INKR Comics (comics.inkr.com / inkr.com).
Uses headless browser network interception with numeric ID page ordering.
─────────────────────────────────────────────────────────────────────────────
"""
import re
import time
import logging
from typing import List, Optional
from urllib.parse import urlparse

from .base_site_adapter import BaseSiteAdapter
from ..scrape_context import ScrapeContext
from ..scraper_models import (
    ChapterResult,
    SourceInfo,
    CandidateImage,
    ImageItem,
    ImageSourceType,
    ScrapeCompleteness,
)
from ..acquisition import BrowserFetcher
from ..content_evaluator import ScraperDiagnosticsLogger
from ..scraper_constants import INKR_DOMAINS

logger = logging.getLogger("sonikoma.services.scraper.adapters.inkr")


class InkrAdapter(BaseSiteAdapter):
    """Specialized adapter for INKR Comics."""

    name: str = "INKR Comics"
    icon: str = "✨"
    description: str = "INKR Comics client-rendered chapter pages with sequential resolution."
    supported_domains: list = list(INKR_DOMAINS)

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
    ) -> Optional[dict]:
        """Discovers chapters and metadata for INKR Comics series."""
        clean_url = (series_url or "").strip()
        m_title = re.match(r"^(https?://comics\.inkr\.com/title/[^/]+)", clean_url)
        title_url = m_title.group(1) if m_title else clean_url

        chapters_target_url = f"{title_url}/chapters" if not title_url.endswith("/chapters") else title_url
        try:
            from bs4 import BeautifulSoup
            html, _, _ = await BrowserFetcher.render_page(
                chapters_target_url,
                auto_scroll=True,
                wait_selector="a[href*='/chapter/'], h1",
                timeout_seconds=30.0
            )
            # If /chapters didn't return chapters, fallback to main title page
            if not html or "<a" not in html:
                html, _, _ = await BrowserFetcher.render_page(
                    title_url,
                    auto_scroll=True,
                    wait_selector="a[href*='/chapter/'], h1",
                    timeout_seconds=25.0
                )
            if not html:
                return None

            soup = BeautifulSoup(html, "html.parser")
            title_el = soup.select_one("h1, meta[property='og:title']")
            series_title = (title_el.get("content") if title_el and title_el.name == "meta" else title_el.get_text(strip=True)) if title_el else "INKR Comic"

            cover_el = soup.select_one("meta[property='og:image'], .cover-img, img[src*='ogimage'], img[src*='inkr.com']")
            cover_image = (cover_el.get("content") or cover_el.get("src") or "") if cover_el else ""

            desc_el = soup.select_one("meta[property='og:description'], .description, p")
            description = (desc_el.get("content") or desc_el.get_text(strip=True)) if desc_el else ""

            chapters = []
            seen = set()
            for a in soup.select("a[href*='/chapter/']"):
                href = a.get("href", "").strip()
                if not href or href == "#":
                    continue
                if not href.startswith("http"):
                    href = f"https://comics.inkr.com{href}"
                if href in seen:
                    continue
                seen.add(href)

                ch_title = a.get_text(strip=True)
                if not ch_title or "chapter" not in ch_title.lower():
                    m_ch = re.search(r'chapter/([0-9]+)', href)
                    ch_title = f"Chapter {m_ch.group(1)}" if m_ch else (ch_title or "Chapter")

                ch_img = a.find("img") or (a.find_parent("div").find("img") if a.find_parent("div") else None)
                ch_thumb = (ch_img.get("data-src") or ch_img.get("src") or "") if ch_img else ""
                
                # Derive real unique chapter-specific cover image from INKR chapter slug
                m_ch_slug = re.search(r'comics\.inkr\.com/title/([^/]+)/chapter/([^/?#]+)', href)
                if m_ch_slug:
                    t_slug, c_slug = m_ch_slug.group(1), m_ch_slug.group(2)
                    final_cover = ch_thumb or f"https://og.inkr.com/cp/title/{t_slug}/chapter/{c_slug}/ogimage"
                else:
                    final_cover = ch_thumb or cover_image

                chapters.append({
                    "title": ch_title,
                    "url": href,
                    "cover": final_cover,
                    "cover_image": final_cover,
                    "thumbnail": final_cover
                })

            return {
                "success": True,
                "title": series_title,
                "author": "",
                "description": description,
                "cover_image": cover_image,
                "cover": cover_image,
                "url": title_url,
                "chapters": chapters,
                "episodes": chapters,
                "total_chapters": len(chapters),
                "total_episodes": len(chapters)
            }
        except Exception as e:
            logger.debug(f"[InkrAdapter] discover_series failed: {e}")
            return None


    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        headers = dict(context.config.headers or {})
        parsed = urlparse(url)
        headers.setdefault("Referer", f"{parsed.scheme}://{parsed.netloc}/")
        context.config.headers = headers

        html, net_imgs, storage = await BrowserFetcher.render_page(
            url,
            headers=headers,
            auto_scroll=True,
            timeout_seconds=25.0
        )

        extracted_urls = []
        seen = set()

        for img_url in net_imgs:
            if "inkr.com/l/" in img_url and ("/p.jpg" in img_url or "/p.webp" in img_url or "/p." in img_url):
                if img_url not in seen:
                    seen.add(img_url)
                    extracted_urls.append(img_url)

        # Sort pages chronologically by numeric asset ID in URL if present
        def extract_inkr_seq(u: str) -> int:
            match = re.search(r"/(\d+)-", u)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    pass
            return 0

        extracted_urls.sort(key=extract_inkr_seq)

        if not extracted_urls:
            # Fallback: look for /t.jpg (thumbnails) and upgrade to /p.jpg
            for img_url in net_imgs:
                if "inkr.com/l/" in img_url and "/t." in img_url:
                    upgraded = img_url.replace("/t.jpg", "/p.jpg").replace("/t.webp", "/p.webp")
                    if upgraded not in seen:
                        seen.add(upgraded)
                        extracted_urls.append(upgraded)
            extracted_urls.sort(key=extract_inkr_seq)

        # Extract series & chapter metadata from HTML if available
        if html:
            try:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html, "html.parser")
                og_title = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name": "title"})
                og_image = soup.find("meta", property="og:image")
                og_desc = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "description"})

                raw_title = og_title.get("content", "").strip() if og_title else ""
                raw_image = og_image.get("content", "").strip() if og_image else ""
                raw_desc = og_desc.get("content", "").strip() if og_desc else ""

                series_title = raw_title
                chapter_title = ""
                if "•" in raw_title:
                    parts = [p.strip() for p in raw_title.split("•")]
                    if len(parts) >= 2:
                        chapter_title = parts[0]
                        series_title = parts[1]
                elif "-" in raw_title:
                    parts = [p.strip() for p in raw_title.split("-")]
                    if len(parts) >= 2:
                        chapter_title = parts[0]
                        series_title = parts[1]

                if not raw_image and extracted_urls:
                    raw_image = extracted_urls[0]

                if series_title:
                    context.series_info.title = series_title
                if raw_image:
                    context.series_info.cover = raw_image
                    context.series_info.cover_image = raw_image
                if raw_desc:
                    context.series_info.description = raw_desc
                if chapter_title:
                    context.chapter_info.title = chapter_title
            except Exception as e:
                logger.debug(f"[InkrAdapter] Metadata parsing non-critical error: {e}")

        validated = [
            ImageItem(
                url=u,
                index=idx,
                source_type=ImageSourceType.NETWORK,
                confidence_score=0.98
            )
            for idx, u in enumerate(extracted_urls)
        ]

        if validated:
            context.validated_images = validated
            context.candidate_images = [
                CandidateImage(url=u, index=idx, source_type=ImageSourceType.NETWORK)
                for idx, u in enumerate(extracted_urls)
            ]
            if not getattr(context.series_info, "cover_image", None) and validated:
                context.series_info.cover = validated[0].url
                context.series_info.cover_image = validated[0].url
            context.completeness = ScrapeCompleteness.COMPLETE
            logger.info(f"[InkrAdapter] Successfully extracted {len(validated)} panels for {url}")
        else:
            context.completeness = ScrapeCompleteness.FAILED
            logger.warning(f"[InkrAdapter] Failed to extract panel images from {url}")

        return context.to_chapter_result()
