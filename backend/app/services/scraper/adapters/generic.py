"""
backend/app/services/scraper/adapters/generic.py
─────────────────────────────────────────────────────────────────────────────
Autonomous AI-Centric Universal Scraper Adapter (Zero Hardcoded Logic)
Coordinates Self-Healing Domain Memory, Gemini 2.5 Flash Autonomous Analysis,
Dynamic State AST Parsers, and Targeted Browser Workers.
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
from ..validator import ImageValidator
from ..order_resolver import OrderResolver
from ..cache_manager import ScraperCacheManager
from ..diagnostics import ScraperDiagnosticsLogger
from ..ai import ScraperAIOrchestrator, UniversalComicBlueprint, DomainMemory

logger = logging.getLogger("sonikoma.services.scraper.adapters.generic")


class GenericAdaptiveAdapter(BaseSiteAdapter):
    """Universal AI-driven adaptive extraction engine for any webtoon, manga, or comic reader."""

    name: str = "Universal Adaptive Fallback"
    icon: str = "🧭"
    description: str = "Universal 2-step HTTP + Playwright fallback for any novel or unmapped comic reader."
    supported_domains: list = []

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        """Fallback adapter for all standard sites."""
        return True

    def _apply_blueprint_metadata(self, context: ScrapeContext, bp: UniversalComicBlueprint, url: str):
        """Applies comprehensive AI blueprint metadata onto ScrapeContext."""
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
        """Executes AI-directed universal extraction on the context."""
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        # ---------------------------------------------------------------------
        # Step 0: Check Self-Healing Domain Memory
        # ---------------------------------------------------------------------
        cached_bp = DomainMemory.get_blueprint(url)
        if cached_bp:
            logger.info(f"[GenericAdaptiveAdapter] Domain memory cache hit for {url}: strategy={cached_bp.worker_strategy}")
            self._apply_blueprint_metadata(context, cached_bp, url)

        # ---------------------------------------------------------------------
        # Step 1: Static HTTP Acquisition (~300ms)
        # ---------------------------------------------------------------------
        t0 = time.time()
        html, status_code, fetch_dur = await HttpFetcher.fetch_html(
            url,
            headers=context.config.headers,
            cookies=context.config.cookies,
            timeout=context.config.timeout_seconds
        )
        context.raw_html = html
        l1_dur = (time.time() - t0) * 1000.0

        if html:
            context.evidence.record(
                source_type=EvidenceSource.STATIC_HTML,
                source_url=url,
                payload_summary=f"HTTP status {status_code}, length {len(html)} bytes",
                confidence=0.9
            )
            # Local microdata extraction fallback
            series, chapter = DomExtractor.extract_metadata(html, url)
            if not context.series_info.title and series.title: context.series_info.title = series.title
            if not context.series_info.description and series.description: context.series_info.description = series.description
            if not context.series_info.cover and series.cover: context.series_info.cover = series.cover
            if not context.series_info.author and series.author: context.series_info.author = series.author
            if not context.chapter_info.title and chapter.title: context.chapter_info.title = chapter.title
            if context.chapter_info.number is None and chapter.number is not None: context.chapter_info.number = chapter.number
            if not context.chapter_info.previous and chapter.previous: context.chapter_info.previous = chapter.previous
            if not context.chapter_info.next and chapter.next: context.chapter_info.next = chapter.next
            context.checklist.chapter_found = bool(context.chapter_info.title or context.chapter_info.number is not None)

            context.record_level("Level 1: Static HTTP", EscalationStatus.SUCCESS, 0.9, 0, l1_dur)
        else:
            context.record_level("Level 1: Static HTTP", EscalationStatus.FAILED, 0.0, 0, l1_dur, reason=f"Status {status_code}")

        # ---------------------------------------------------------------------
        # Step 2: AI Central Brain Analysis (Gemini 2.5 Flash ~350ms)
        # ---------------------------------------------------------------------
        active_bp = cached_bp
        if not active_bp and context.raw_html:
            ai_bp = await ScraperAIOrchestrator.analyze_page(context.raw_html, url)
            if ai_bp:
                active_bp = ai_bp
                self._apply_blueprint_metadata(context, ai_bp, url)
                DomainMemory.save_blueprint(url, ai_bp)

        # ---------------------------------------------------------------------
        # Step 3: Dynamic Extraction (DOM + Universal JSON State)
        # ---------------------------------------------------------------------
        if context.raw_html:
            t0 = time.time()
            dom_images: List[CandidateImage] = []
            soup = DomExtractor.get_soup(context.raw_html)

            # A. If AI Blueprint identified a targeted container selector
            if active_bp and active_bp.container_selector and soup:
                ai_node = soup.select_one(active_bp.container_selector)
                if ai_node:
                    dom_images = DomExtractor.extract_images_from_container(
                        ai_node, url, active_bp.container_selector
                    )

            # B. Standard heuristic container detection (runs if AI container missing or returned < 3 images)
            if len(dom_images) < 3:
                candidates_all, best_reader = ReaderDetector.detect_reader(context.raw_html)
                context.reader_candidates = candidates_all
                context.selected_reader = best_reader

                if best_reader and soup:
                    context.checklist.reader_found = True
                    selected_node = soup.select_one(best_reader.selector)
                    if selected_node:
                        detector_images = DomExtractor.extract_images_from_container(selected_node, url, best_reader.selector)
                        if len(detector_images) > len(dom_images):
                            dom_images = detector_images

                # If still under threshold, use full DOM density clustering fallback
                if len(dom_images) < 3 and soup:
                    fallback_images = DomExtractor.extract_manga_images_fallback(soup, url)
                    if len(fallback_images) > len(dom_images):
                        dom_images = fallback_images

            # C. Universal Dynamic State AST Extraction (Next.js / Nuxt / JSON)
            embedded_images: List[CandidateImage] = EmbeddedStateExtractor.extract_from_html(context.raw_html, url)

            l2_images: List[CandidateImage] = dom_images if len(dom_images) >= len(embedded_images) else embedded_images
            l2_dur = (time.time() - t0) * 1000.0

            if (active_bp and len(dom_images) >= 3) or len(l2_images) >= 15:
                context.candidate_images.extend(l2_images)
                context.checklist.reader_found = True
                context.checklist.reader_end_reached = True
                context.checklist.lazy_loading_finished = True
                context.completeness = ScrapeCompleteness.COMPLETE
                context.record_level("Level 2: AI & DOM Extraction", EscalationStatus.SUCCESS, 95.0, len(l2_images), l2_dur)
                return self._finalize_result(context, active_bp)
            elif embedded_images and len(embedded_images) >= 15:
                context.candidate_images.extend(embedded_images)
                context.completeness = ScrapeCompleteness.COMPLETE
                context.record_level("Level 2: Dynamic JSON State", EscalationStatus.SUCCESS, 95.0, len(embedded_images), l2_dur)
                return self._finalize_result(context, active_bp)
            elif not context.config.enable_browser_fallback and (len(l2_images) >= 3 or len(embedded_images) >= 3):
                # If browser is disabled, return whatever static panels we found
                context.candidate_images.extend(l2_images or embedded_images)
                context.completeness = ScrapeCompleteness.PARTIAL
                context.record_level("Level 2: DOM & State (Static Fallback)", EscalationStatus.PARTIAL, 70.0, len(context.candidate_images), l2_dur)
                return self._finalize_result(context, active_bp)
            else:
                context.record_level("Level 2: DOM & State", EscalationStatus.PARTIAL, 0.0, len(l2_images), l2_dur)

        # ---------------------------------------------------------------------
        # Step 4: Targeted Fast Playwright Browser (Dynamic SPAs & Cloudflare)
        # ---------------------------------------------------------------------
        if context.config.enable_browser_fallback:
            t0 = time.time()
            # Clear any partial single-image artifacts from earlier levels
            context.candidate_images.clear()

            pw_html, net_images, storage = await BrowserFetcher.render_page(
                url,
                cookies=context.config.cookies,
                headers=context.config.headers,
                timeout_seconds=context.config.timeout_seconds
            )
            context.browser_html = pw_html
            context.intercepted_network_urls = net_images
            context.local_storage_data = storage.get("local_storage", {})
            context.session_storage_data = storage.get("session_storage", {})
            l4_dur = (time.time() - t0) * 1000.0

            if pw_html:
                context.evidence.record(
                    source_type=EvidenceSource.BROWSER_RENDER,
                    source_url=url,
                    payload_summary=f"Playwright rendered {len(pw_html)} bytes, {len(net_images)} network assets",
                    confidence=0.95
                )

                soup_pw = DomExtractor.get_soup(pw_html)
                pw_dom_images: List[CandidateImage] = []

                # Use AI blueprint selector if available
                if active_bp and active_bp.container_selector and soup_pw:
                    ai_node = soup_pw.select_one(active_bp.container_selector)
                    if ai_node:
                        pw_dom_images = DomExtractor.extract_images_from_container(ai_node, url, active_bp.container_selector)

                if not pw_dom_images or len(pw_dom_images) < 3:
                    candidates_pw, best_reader_pw = ReaderDetector.detect_reader(pw_html)
                    if best_reader_pw and soup_pw:
                        context.selected_reader = best_reader_pw
                        context.checklist.reader_found = True
                        sel_node = soup_pw.select_one(best_reader_pw.selector)
                        if sel_node:
                            pw_dom_images = DomExtractor.extract_images_from_container(sel_node, url, best_reader_pw.selector)
                    if (not pw_dom_images or len(pw_dom_images) < 3) and soup_pw:
                        pw_dom_images = DomExtractor.extract_manga_images_fallback(soup_pw, url)

                context.candidate_images.extend(pw_dom_images)

                # Correlate network intercepted images (clean CDN filtering)
                dom_urls = {c.url for c in context.candidate_images}
                for net_url in net_images:
                    if net_url not in dom_urls and not any(ign in net_url.lower() for ign in ["logo", "avatar", "banner", "ad/", "ads/", "pixel", "icon"]):
                        context.candidate_images.append(CandidateImage(
                            url=net_url,
                            source_type=ImageSourceType.NETWORK,
                            dom_index=len(context.candidate_images),
                            is_inside_reader=True,
                            confidence=0.85
                        ))

                if len(context.candidate_images) >= 3:
                    context.checklist.reader_end_reached = True
                    context.checklist.lazy_loading_finished = True
                    context.checklist.network_set_complete = True
                    context.completeness = ScrapeCompleteness.COMPLETE
                    context.record_level("Level 4-7: Browser & Network", EscalationStatus.SUCCESS, 95.0, len(context.candidate_images), l4_dur)
                    return self._finalize_result(context)
                else:
                    DomainMemory.record_failure(url)
                    context.record_level("Level 4-7: Browser & Network", EscalationStatus.FAILED, 0.0, len(context.candidate_images), l4_dur, reason=f"Only {len(context.candidate_images)} panels discovered (minimum 3 required)")
            else:
                DomainMemory.record_failure(url)
                context.record_level("Level 4-7: Browser & Network", EscalationStatus.FAILED, 0.0, 0, l4_dur, reason="Browser failed to render")

        # ---------------------------------------------------------------------
        # Finalization & Fallback Guard
        # ---------------------------------------------------------------------
        if len(context.candidate_images) < 3:
            DomainMemory.record_failure(url)
            context.completeness = ScrapeCompleteness.FAILED
            context.error = ScrapeError(
                code=ScrapeErrorCode.READER_NOT_FOUND,
                message=f"Insufficient comic panels found ({len(context.candidate_images)} discovered, minimum 3 required). The comic page may be paywalled or require regional login.",
                details={"levels_attempted": [l.level_name for l in context.levels]}
            )
            return self._finalize_result(context, active_bp)

        return self._finalize_result(context, active_bp)

    def _finalize_result(self, context: ScrapeContext, active_bp: Optional[UniversalComicBlueprint] = None) -> ChapterResult:
        """Validates, deduplicates, and produces the finalized ChapterResult."""
        total_time = (time.time() - context.start_time) * 1000.0

        # 1. Deduplicate while preserving order
        unique_candidates: list = []
        seen_urls: set = set()
        for cand in context.candidate_images:
            if cand.url not in seen_urls:
                seen_urls.add(cand.url)
                unique_candidates.append(cand)

        # 2. Filter banners & validate using Autonomous AI directives
        dynamic_unwanted = active_bp.unwanted_patterns if (active_bp and hasattr(active_bp, "unwanted_patterns")) else None
        url_pat = active_bp.image_url_pattern if (active_bp and hasattr(active_bp, "image_url_pattern")) else None

        validated, rejections = ImageValidator.validate_candidates(
            unique_candidates,
            filter_banners=context.config.filter_banners,
            dynamic_unwanted_patterns=dynamic_unwanted,
            url_pattern=url_pat
        )
        context.rejections.extend(rejections)
        context.validated_images = OrderResolver.resolve_order(validated)

        # Check if validation left fewer than 3 valid panels
        if len(context.validated_images) < 3 and not context.error:
            context.completeness = ScrapeCompleteness.FAILED
            context.error = ScrapeError(
                code=ScrapeErrorCode.READER_NOT_FOUND,
                message=f"Panel validation discarded non-chapter assets, leaving only {len(context.validated_images)} images.",
                details={"rejected_count": len(context.rejections)}
            )

        ScraperDiagnosticsLogger.log_result(
            chapter_number=context.chapter_info.number,
            images_count=len(context.validated_images),
            new_images_count=0,
            completeness=context.completeness.value,
            execution_time_ms=total_time
        )
        return context.to_chapter_result()
