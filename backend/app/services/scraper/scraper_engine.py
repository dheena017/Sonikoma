"""
backend/app/services/scraper/engine.py
─────────────────────────────────────────────────────────────────────────────
Adaptive Scraper Engine.
Pure deterministic orchestrator and entry point for URL processing,
context initialization, adapter resolution, raw image extraction, and execution.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from typing import Optional, Dict, Any, List
from urllib.parse import urljoin, urlparse

from .scraper_models import (
    ChapterResult,
    ScrapeError,
    ScrapeErrorCode,
    ScrapeCompleteness,
    ScrapeAllImagesResponse,
    RawImageItem
)
from .scrape_context import ScrapeContext, ScrapeConfiguration
from .url_utils import UrlNormalizer, SiteAnalyzer
from .adapters.site_adapter_registry import AdapterRegistry
from .acquisition.http_page_fetcher import HttpFetcher
from .acquisition.browser_page_fetcher import BrowserFetcher
from .extraction.html_dom_extractor import DomExtractor
from .extraction.embedded_state_extractor import EmbeddedStateExtractor
from .domain_rate_limiter import domain_block_manager
from .scraper_constants import SCRAPER_MESSAGES

logger = logging.getLogger("sonikoma.services.scraper.engine")


class AdaptiveScraperEngine:
    """Main coordinator facade for adaptive webtoon, comic, and raw image scraping."""

    @classmethod
    async def scrape_url(
        cls,
        url: str,
        cookies: Optional[Dict[str, str]] = None,
        headers: Optional[Dict[str, str]] = None,
        bypass_cache: bool = False,
        force_refresh: bool = False,
        limit: Optional[int] = None,
        proxy_images: bool = True,
        filter_banners: bool = True,
        timeout_seconds: float = 30.0,
        enable_browser_fallback: bool = True,
        project_id: Optional[str] = None,
        job_id: Optional[str] = None
    ) -> ChapterResult:
        """
        Main entry point for scraping a chapter / episode URL.
        Returns the authoritative ChapterResult model.
        """
        start_time = time.time()
        normalized_url = UrlNormalizer.normalize_url(url)

        if not normalized_url:
            return ChapterResult(
                success=False,
                project_id=project_id,
                job_id=job_id,
                source=SiteAnalyzer.analyze(url or ""),
                error=ScrapeError(
                    code=ScrapeErrorCode.INVALID_URL,
                    message=SCRAPER_MESSAGES["ERROR_INVALID_URL"]
                )
            )

        # Step 1: Check in-memory domain blocklist
        if domain_block_manager.is_blocked(normalized_url):
            domain = urlparse(normalized_url).netloc
            logger.warning(f"[AdaptiveScraperEngine] Rejecting blocked domain: {domain}")
            return ChapterResult(
                success=False,
                project_id=project_id,
                job_id=job_id,
                source=SiteAnalyzer.analyze(normalized_url),
                error=ScrapeError(
                    code=ScrapeErrorCode.CONTENT_NOT_ACCESSIBLE,
                    message=SCRAPER_MESSAGES["ERROR_BLOCKED_DOMAIN"].format(domain=domain)
                )
            )

        # Step 2: Build execution configuration
        config = ScrapeConfiguration(
            bypass_cache=bypass_cache,
            force_refresh=force_refresh,
            proxy_images=proxy_images,
            filter_banners=filter_banners,
            limit=limit,
            timeout_seconds=timeout_seconds,
            enable_browser_fallback=enable_browser_fallback,
            cookies=cookies,
            headers=headers,
            project_id=project_id,
            job_id=job_id
        )

        # Step 3: Analyze site and create initial execution context
        source_info = SiteAnalyzer.analyze(normalized_url)
        context = ScrapeContext(
            url=url,
            normalized_url=normalized_url,
            canonical_url=source_info.canonical_url,
            config=config,
            source_info=source_info,
            start_time=start_time,
            project_id=project_id,
            job_id=job_id
        )

        # Step 4: Resolve matching adapter
        adapter = AdapterRegistry.get_adapter(source_info)
        logger.info(f"[AdaptiveScraperEngine] Dispatching {normalized_url} to adapter: {adapter.__class__.__name__}")

        # Step 5: Execute scrape workflow
        try:
            return await adapter.scrape(context)
        except Exception as e:
            logger.error(f"[AdaptiveScraperEngine] Unexpected scraper execution failure: {e}", exc_info=True)
            context.error = ScrapeError(
                code=ScrapeErrorCode.INTERNAL_ERROR,
                message=f"Internal scraper engine error: {str(e)}"
            )
            context.completeness = ScrapeCompleteness.FAILED
            return context.to_chapter_result()

    @classmethod
    async def extract_all_raw_images(
        cls,
        url: str,
        render_js: bool = True,
        bypass_cache: bool = False,
        include_backgrounds: bool = True,
        include_svg: bool = False,
        cookies: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> ScrapeAllImagesResponse:
        """
        Extracts ALL images from any given web URL completely unfiltered.
        Does NOT remove logos, banners, icons, backgrounds, or outside-reader assets.
        """
        start_time = time.time()
        normalized_url = UrlNormalizer.normalize_url(url)

        if not normalized_url:
            return ScrapeAllImagesResponse(
                success=False,
                url=url,
                domain="",
                total_images=0,
                error="Invalid URL provided."
            )

        domain = urlparse(normalized_url).netloc
        if domain_block_manager.is_blocked(normalized_url):
            return ScrapeAllImagesResponse(
                success=False,
                url=normalized_url,
                domain=domain,
                total_images=0,
                error=f"Domain '{domain}' is in the blocked exclusion list."
            )

        cookie_dict = {}
        if cookies:
            for item in cookies.split(";"):
                if "=" in item:
                    k, v = item.strip().split("=", 1)
                    cookie_dict[k] = v

        raw_images: List[RawImageItem] = []
        seen_urls = set()
        discovery_methods: List[str] = []

        # Strategy 1: HTTP Fetch
        html_content, status_code, fetch_ms = await HttpFetcher.fetch_html(
            normalized_url,
            headers=headers,
            cookies=cookie_dict
        )

        rendered_html = html_content or ""
        if html_content:
            discovery_methods.append("http_static")

        # Strategy 2: Browser Fallback if requested or blocked
        if render_js or not html_content or status_code in (403, 429):
            try:
                browser_res = await BrowserFetcher.render_page(
                    normalized_url,
                    cookies=cookie_dict,
                    headers=headers,
                    auto_scroll=True
                )
                if browser_res and browser_res.get("html"):
                    rendered_html = browser_res["html"]
                    discovery_methods.append("browser_rendered")
                    # Collect network intercepted images
                    for net_img in browser_res.get("network_images", []):
                        img_url = net_img.get("url") if isinstance(net_img, dict) else str(net_img)
                        if img_url and img_url not in seen_urls:
                            seen_urls.add(img_url)
                            raw_images.append(RawImageItem(
                                index=len(raw_images),
                                url=img_url,
                                source_type="network_intercepted"
                            ))
            except Exception as e:
                logger.debug(f"[extract_all_raw_images] Browser render warning: {e}")

        # Strategy 3: Sweep DOM HTML for all images
        soup = DomExtractor.get_soup(rendered_html)
        if soup:
            discovery_methods.append("dom_sweep")
            for img in soup.find_all(["img", "image"]):
                for attr in ["src", "data-src", "data-lazy-src", "data-original", "data-cdn", "srcset", "data-full-url", "data-img-src"]:
                    val = img.get(attr)
                    if val and isinstance(val, str):
                        # Handle srcset
                        urls_to_add = [val.split()[0]] if " " in val and not val.startswith("//") else [val]
                        for u in urls_to_add:
                            full_url = urljoin(normalized_url, u.strip())
                            if full_url.startswith(("http://", "https://", "data:image/")):
                                if not include_svg and ("svg" in full_url.lower() or full_url.startswith("data:image/svg")):
                                    continue
                                if full_url not in seen_urls:
                                    seen_urls.add(full_url)
                                    raw_images.append(RawImageItem(
                                        index=len(raw_images),
                                        url=full_url,
                                        alt=img.get("alt"),
                                        source_type="dom"
                                    ))

            # Strategy 4: CSS Background Images
            if include_backgrounds:
                discovery_methods.append("css_backgrounds")
                for tag in soup.find_all(style=True):
                    style = tag.get("style", "")
                    if "url(" in style:
                        for part in style.split("url(")[1:]:
                            bg_url = part.split(")")[0].strip("\"' ")
                            full_bg = urljoin(normalized_url, bg_url)
                            if full_bg.startswith(("http://", "https://")) and full_bg not in seen_urls:
                                seen_urls.add(full_bg)
                                raw_images.append(RawImageItem(
                                    index=len(raw_images),
                                    url=full_bg,
                                    source_type="css_background",
                                    is_background=True
                                ))

        # Strategy 5: Embedded State AST
        state_candidates = EmbeddedStateExtractor.extract_state_images(rendered_html, normalized_url)
        if state_candidates:
            discovery_methods.append("embedded_state")
            for cand in state_candidates:
                if cand.url and cand.url not in seen_urls:
                    seen_urls.add(cand.url)
                    raw_images.append(RawImageItem(
                        index=len(raw_images),
                        url=cand.url,
                        source_type="embedded_state"
                    ))

        latency_ms = (time.time() - start_time) * 1000.0
        return ScrapeAllImagesResponse(
            success=True,
            url=normalized_url,
            domain=domain,
            total_images=len(raw_images),
            images=raw_images,
            latency_ms=round(latency_ms, 2),
            discovery_methods=discovery_methods
        )

    # Alias for convenience
    scrape = scrape_url


# Global engine instance
adaptive_scraper_engine = AdaptiveScraperEngine()
