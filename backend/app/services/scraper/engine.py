"""
backend/app/services/scraper/engine.py
─────────────────────────────────────────────────────────────────────────────
Adaptive Scraper Engine.
Thin orchestrator and entry point for URL processing, context initialization,
adapter resolution, and execution.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from typing import Optional, Dict, Any, List

from .models import ChapterResult, ScrapeError, ScrapeErrorCode, ScrapeCompleteness
from .context import ScrapeContext, ScrapeConfiguration
from .normalizer import UrlNormalizer, SiteAnalyzer
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

        # Check domain approval status
        from .ai.domain_memory import DomainMemory
        domain_status = DomainMemory.get_domain_status(normalized_url)
        if domain_status == "blocked":
            return ChapterResult(
                success=False,
                project_id=project_id,
                job_id=job_id,
                source=SiteAnalyzer.analyze(url or ""),
                error=ScrapeError(
                    code=ScrapeErrorCode.CONTENT_NOT_ACCESSIBLE,
                    message="This website domain has been blocked by administrator policy.",
                    details={"domain": DomainMemory.get_domain_from_url(normalized_url)}
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
            result = await adapter.scrape(context)
            if result.success:
                DomainMemory.record_success(normalized_url)
            elif adapter.__class__.__name__ == "GenericAdaptiveAdapter":
                # Unknown / unmapped website that could not be parsed
                domain = DomainMemory.get_domain_from_url(normalized_url)
                if not result.error:
                    result.error = ScrapeError(
                        code=ScrapeErrorCode.READER_NOT_FOUND,
                        message=f"Could not automatically extract chapter panels from unknown website '{domain}'.",
                    )
                if not result.error.details:
                    result.error.details = {}
                result.error.details.update({
                    "domain": domain,
                    "is_unmapped_website": True,
                    "can_request_domain": True,
                    "request_url": "/api/v1/scraper/admin/domains/request",
                    "suggestion": f"Website '{domain}' is not yet officially mapped. A support request has been logged for review."
                })
                # Auto-enqueue to pending domain requests for admin review
                try:
                    DomainMemory.request_domain(
                        url=normalized_url,
                        requested_by="auto-user-request",
                        notes=f"Auto-requested: Scrape attempt failed on unmapped website {domain}"
                    )
                except Exception:
                    pass
            return result
        except Exception as e:
            logger.error(f"[AdaptiveScraperEngine] Unexpected scraper execution failure: {e}", exc_info=True)
            domain = DomainMemory.get_domain_from_url(normalized_url)
            context.error = ScrapeError(
                code=ScrapeErrorCode.INTERNAL_ERROR,
                message=f"Internal scraper engine error: {str(e)}",
                details={
                    "domain": domain,
                    "can_request_domain": True,
                    "request_url": "/api/v1/scraper/admin/domains/request"
                }
            )
            context.completeness = ScrapeCompleteness.FAILED
            return context.to_chapter_result()
