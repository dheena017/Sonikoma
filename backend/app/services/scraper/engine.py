"""
backend/app/services/scraper/engine.py
─────────────────────────────────────────────────────────────────────────────
Adaptive Scraper Engine.
Pure deterministic orchestrator and entry point for URL processing,
context initialization, adapter resolution, and execution without AI overhead.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from typing import Optional, Dict, Any, List

from .models import ChapterResult, ScrapeError, ScrapeErrorCode, ScrapeCompleteness
from .context import ScrapeContext, ScrapeConfiguration
from .url_separator import UrlNormalizer, SiteAnalyzer
from .adapters.registry import AdapterRegistry

logger = logging.getLogger("sonikoma.services.scraper.engine")


class AdaptiveScraperEngine:
    """Main coordinator facade for adaptive webtoon and chapter scraping."""

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
                    message="Provided URL is empty or invalid."
                )
            )

        # Build execution configuration
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

        # Analyze site and create initial execution context
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

        # Resolve matching adapter
        adapter = AdapterRegistry.get_adapter(source_info)
        logger.info(f"[AdaptiveScraperEngine] Dispatching {normalized_url} to adapter: {adapter.__class__.__name__}")

        # Execute scrape workflow
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

    # Alias for convenience
    scrape = scrape_url
