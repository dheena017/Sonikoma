"""
backend/app/services/scraper/adapters/generic.py
─────────────────────────────────────────────────────────────────────────────
Reason-Driven Self-Adaptive Universal Scraper Adapter.
Implements the 10-tier architecture:
  1. L5 Idempotency Cache Check (0ms hit)
  2. AccessEvaluator (Cloudflare/Bot/403/429 detection)
  3. Deterministic DOM & Embedded State Extraction
  4. ExtractionEvaluator (Quantitative Confidence Scoring)
  5. Self-Healing DomainStrategy Memory
  6. Gemini 2.5 Flash as Planner via DOMReductionEngine (1-3 KB digest)
  7. BlueprintValidator (DOM verification before persistence)
  8. BrowserPool Fallback (Bounded Playwright concurrency with auto-scroll)
  9. Content Validator, Order Resolver, and Deduplication
  10. Multi-Level Cache Persistence & Strategy Health Tracking
─────────────────────────────────────────────────────────────────────────────
"""

import re
import time
import logging
from typing import Optional, List, Any
from urllib.parse import urlparse

from .base import BaseSiteAdapter
from ..context import ScrapeContext
from ..models import (
    ChapterResult,
    SourceInfo,
    EscalationStatus,
    ScrapeCompleteness,
    ScrapeError,
    ScrapeErrorCode,
    CandidateImage,
    ImageSourceType
)
from ..evidence import EvidenceSource
from ..acquisition import HttpFetcher, BrowserFetcher
from ..extraction import DomExtractor, EmbeddedStateExtractor, ApiExtractor
from ..reader_detector import ReaderDetector
from ..cache_manager import ScraperCacheManager
from ..diagnostics import ScraperDiagnosticsLogger
from ..ai import ScraperAIOrchestrator, UniversalComicBlueprint, DomainMemory
from ..evaluator import AccessEvaluator, AccessStatus, ExtractionEvaluator, EscalationReason

logger = logging.getLogger("sonikoma.services.scraper.adapters.generic")


class GenericAdaptiveAdapter(BaseSiteAdapter):
    """Universal reason-driven, self-healing adaptive extraction engine."""

    name: str = "Universal Adaptive Fallback"
    icon: str = "🧭"
    description: str = "Universal self-adaptive scraper with confidence evaluation, AI planning, and browser pooling."
    supported_domains: list = []

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        return True

    def _apply_blueprint_metadata(self, context: ScrapeContext, bp: UniversalComicBlueprint, url: str):
        """Applies blueprint metadata onto ScrapeContext."""
        if bp.series_title: context.series_info.title = bp.series_title
        if bp.series_slug: context.series_info.slug = bp.series_slug
        if bp.author: context.series_info.author = bp.author
        if bp.artist: context.series_info.artist = bp.artist
        if bp.publisher: context.series_info.publisher = bp.publisher
        if bp.status: context.series_info.status = bp.status
        if bp.genres: context.series_info.genres = bp.genres
        if bp.tags: context.series_info.tags = bp.tags
        if bp.synopsis: context.series_info.description = bp.synopsis
        if bp.cover_image_url: context.series_info.cover = bp.cover_image_url
        if bp.original_language: context.series_info.language = bp.original_language

        if bp.chapter_number is not None: context.chapter_info.number = bp.chapter_number
        if bp.chapter_title: context.chapter_info.title = bp.chapter_title
        if bp.previous_chapter_url: context.chapter_info.previous = bp.previous_chapter_url
        if bp.next_chapter_url: context.chapter_info.next = bp.next_chapter_url
        if bp.publication_date: context.chapter_info.published_at = bp.publication_date
        context.checklist.chapter_found = bool(context.chapter_info.title or context.chapter_info.number is not None)

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes the complete self-adaptive extraction workflow."""
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        # ---------------------------------------------------------------------
        # Tier 0: L5 Result / Idempotency Cache Check (0ms)
        # ---------------------------------------------------------------------
        cached_result = ScraperCacheManager.get_cached_chapter_result(
            context.canonical_url,
            bypass_cache=context.config.bypass_cache or context.config.force_refresh
        )
        if cached_result:
            cached_result.project_id = context.project_id
            cached_result.job_id = context.job_id
            return cached_result

        # Check existing learned strategy in DomainMemory
        active_strategy = DomainMemory.get_strategy(url)
        if active_strategy and active_strategy.blueprint:
            logger.info(f"[GenericAdaptiveAdapter] DomainMemory strategy hit for {url}: {active_strategy.strategy_id} (confidence: {active_strategy.confidence})")
            self._apply_blueprint_metadata(context, active_strategy.blueprint, url)

        # ---------------------------------------------------------------------
        # Tier 1: Static HTTP Acquisition
        # ---------------------------------------------------------------------
        t0 = time.time()
        # Check L1 HTML cache
        html = ScraperCacheManager.get_l1_html(url) if not context.config.bypass_cache else None
        status_code = 200 if html else None

        if not html:
            html, status_code, fetch_dur = await HttpFetcher.fetch_html(
                url,
                headers=context.config.headers,
                cookies=context.config.cookies,
                timeout=context.config.timeout_seconds
            )
            if html and status_code == 200:
                ScraperCacheManager.set_l1_html(url, html)

        context.raw_html = html
        l1_dur = (time.time() - t0) * 1000.0

        # Access Evaluation
        access_status = AccessEvaluator.evaluate_response(status_code, html, context.config.headers)
        logger.info(f"[GenericAdaptiveAdapter] Access status for {url}: {access_status.value} (HTTP {status_code})")

        # ---------------------------------------------------------------------
        # Reason-Based Branch: Bot Challenge -> Go directly to BrowserPool
        # ---------------------------------------------------------------------
        if access_status in (AccessStatus.BOT_CHALLENGE, AccessStatus.RATE_LIMITED):
            logger.info(f"[GenericAdaptiveAdapter] {access_status.value} detected. Escalating directly to BrowserPool.")
            return await self._execute_browser_worker(context, url, start_time, reason=access_status.value)

        # Extract metadata from static HTML if available
        if html:
            series, chapter = DomExtractor.extract_metadata(html, url)
            if not context.series_info.title and series.title: context.series_info.title = series.title
            if not context.series_info.description and series.description: context.series_info.description = series.description
            if not context.series_info.cover and series.cover: context.series_info.cover = series.cover
            if not context.series_info.author and series.author: context.series_info.author = series.author
            if not context.chapter_info.title and chapter.title: context.chapter_info.title = chapter.title
            if context.chapter_info.number is None and chapter.number is not None: context.chapter_info.number = chapter.number
            if not context.chapter_info.previous and chapter.previous: context.chapter_info.previous = chapter.previous
            if not context.chapter_info.next and chapter.next: context.chapter_info.next = chapter.next

        # ---------------------------------------------------------------------
        # Tier 2: Deterministic Extraction (DOM + State)
        # ---------------------------------------------------------------------
        if html:
            soup = DomExtractor.get_soup(html)

            # Strategy A: Learned blueprint if available
            if active_strategy and active_strategy.blueprint and active_strategy.blueprint.container_selector:
                bp_candidates = DomExtractor.extract_with_selector(
                    soup,
                    active_strategy.blueprint.container_selector,
                    active_strategy.blueprint.image_src_attribute or "src",
                    url
                )
                for cand in bp_candidates:
                    context.candidate_images.append(cand)

            # Strategy B: Reader container scan
            if not context.candidate_images:
                reader_info = ReaderDetector.detect_reader(soup, url)
                if reader_info.is_valid and reader_info.container_element:
                    dom_candidates = DomExtractor.extract_from_container(reader_info.container_element, url, reader_info.primary_attribute)
                    for cand in dom_candidates:
                        context.candidate_images.append(cand)

            # Strategy C: Universal DOM Candidate sweep
            if not context.candidate_images:
                all_dom = DomExtractor.extract_candidates(soup, url)
                for cand in all_dom:
                    context.candidate_images.append(cand)

            # Strategy D: Embedded State extraction
            state_candidates = EmbeddedStateExtractor.extract_state_images(html, url)
            for cand in state_candidates:
                context.candidate_images.append(cand)

        # ---------------------------------------------------------------------
        # Tier 3: Extraction Confidence Evaluation
        # ---------------------------------------------------------------------
        eval_report = ExtractionEvaluator.evaluate(
            context.candidate_images,
            html_content=html,
            source_info=context.source_info
        )
        logger.info(f"[GenericAdaptiveAdapter] Confidence evaluation: score={eval_report.confidence:.2f}, reason={eval_report.escalation_reason.value}, acceptable={eval_report.is_acceptable}")

        # High Confidence: Complete deterministic scrape
        if eval_report.is_acceptable:
            DomainMemory.record_success(url)
            return self._finalize_and_cache(context, start_time)

        # ---------------------------------------------------------------------
        # Tier 4: Low Confidence -> AI Planning Engine (Gemini 2.5 Flash)
        # ---------------------------------------------------------------------
        # If an existing strategy failed, record failure to self-heal
        if active_strategy:
            DomainMemory.record_failure(url)

        if html and eval_report.escalation_reason not in (EscalationReason.DYNAMIC_JS_REQUIRED, EscalationReason.BOT_CHALLENGE_DETECTED):
            logger.info(f"[GenericAdaptiveAdapter] Low confidence ({eval_report.confidence:.2f}). Invoking Gemini Planner with DOM digest.")
            new_blueprint = await ScraperAIOrchestrator.analyze_page(html, url)

            if new_blueprint:
                self._apply_blueprint_metadata(context, new_blueprint, url)
                DomainMemory.save_blueprint(url, new_blueprint)

                # Re-extract using validated blueprint
                soup = DomExtractor.get_soup(html)
                if new_blueprint.container_selector and soup:
                    re_candidates = DomExtractor.extract_with_selector(
                        soup,
                        new_blueprint.container_selector,
                        new_blueprint.image_src_attribute or "src",
                        url
                    )
                    if re_candidates:
                        context.candidate_images.clear()
                        for c in re_candidates:
                            context.candidate_images.append(c)

                        # Re-evaluate
                        re_eval = ExtractionEvaluator.evaluate(context.candidate_images, html_content=html)
                        if re_eval.is_acceptable:
                            DomainMemory.record_success(url)
                            return self._finalize_and_cache(context, start_time)

        # ---------------------------------------------------------------------
        # Tier 5: BrowserPool Worker Fallback (Playwright with Auto-Scroll)
        # ---------------------------------------------------------------------
        logger.info(f"[GenericAdaptiveAdapter] Escalating to BrowserPool Playwright worker for: {url}")
        return await self._execute_browser_worker(context, url, start_time, reason=eval_report.escalation_reason.value)

    async def _execute_browser_worker(
        self,
        context: ScrapeContext,
        url: str,
        start_time: float,
        reason: str
    ) -> ChapterResult:
        """Executes pooled browser worker with progressive auto-scroll and network capture."""
        t0 = time.time()
        browser_html, intercepted_urls, storage = await BrowserFetcher.render_page(
            url=url,
            cookies=context.config.cookies,
            headers=context.config.headers,
            auto_scroll=True,
            timeout_seconds=30.0
        )
        browser_dur = (time.time() - t0) * 1000.0

        if not browser_html:
            context.record_level("Level 3: Headless Browser", EscalationStatus.FAILED, 0.0, 0, browser_dur, reason="Browser returned empty content")
            context.completeness = ScrapeCompleteness.FAILED
            context.error = ScrapeError(
                code=ScrapeErrorCode.READER_NOT_FOUND,
                message=f"Could not render or access content from {url}. Reason: {reason}"
            )
            return self._finalize(context, start_time)

        context.raw_html = browser_html
        context.record_level("Level 3: Headless Browser", EscalationStatus.SUCCESS, 0.95, len(intercepted_urls), browser_dur)

        # Extract metadata from rendered page
        series, chapter = DomExtractor.extract_metadata(browser_html, url)
        if not context.series_info.title and series.title: context.series_info.title = series.title
        if not context.series_info.cover and series.cover: context.series_info.cover = series.cover
        if not context.chapter_info.title and chapter.title: context.chapter_info.title = chapter.title

        # Collect candidate images from rendered DOM
        b_soup = DomExtractor.get_soup(browser_html)
        b_candidates = DomExtractor.extract_candidates(b_soup, url)

        # Combine with intercepted network images
        combined_cands = list(b_candidates)
        seen_urls = {c.url for c in b_candidates if c.url}
        for idx, i_url in enumerate(intercepted_urls):
            if i_url not in seen_urls:
                seen_urls.add(i_url)
                combined_cands.append(CandidateImage(
                    url=i_url,
                    source_type=ImageSourceType.NETWORK_INTERCEPTED,
                    index=len(combined_cands),
                    is_inside_reader=True,
                    confidence=0.9
                ))

        context.candidate_images.clear()
        for cand in combined_cands:
            context.candidate_images.append(cand)

        # Final evaluation of browser extraction
        b_eval = ExtractionEvaluator.evaluate(context.candidate_images, html_content=browser_html)
        if b_eval.is_acceptable:
            DomainMemory.record_success(url)
        else:
            DomainMemory.record_failure(url)

        return self._finalize_and_cache(context, start_time)

    def _finalize_and_cache(self, context: ScrapeContext, start_time: float) -> ChapterResult:
        """Runs L5 cache persistence on top of the inherited _finalize flow."""
        # Delegate validation + order resolution + ChapterResult construction
        # to the shared _finalize defined in BaseSiteAdapter.
        res = self._finalize(context, start_time)

        # Persist to L5 result cache when successful
        if res.success:
            ScraperCacheManager.set_cached_chapter_result(context.canonical_url, res)
        return res
