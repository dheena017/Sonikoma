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

logger = logging.getLogger("sonikoma.services.scraper.adapters.inkr")

_INKR_DOMAINS = ("comics.inkr.com", "inkr.com")


class InkrAdapter(BaseSiteAdapter):
    """Specialized adapter for INKR Comics."""

    name: str = "INKR Comics"
    icon: str = "✨"
    description: str = "INKR Comics client-rendered chapter pages with sequential resolution."
    supported_domains: list = ["comics.inkr.com", "inkr.com"]

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
