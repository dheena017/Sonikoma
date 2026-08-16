"""
backend/app/services/scraper/adapters/generic.py
─────────────────────────────────────────────────────────────────────────────
Generic Adaptive Scraper Adapter.
Performs universal multi-level progressive extraction with evaluated escalation.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from typing import Optional

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
from ..evidence import EvidenceSource, EvidenceCorrelator
from ..acquisition import HttpFetcher, BrowserFetcher
from ..extraction import DomExtractor, EmbeddedStateExtractor, ApiExtractor
from ..reader_detector import ReaderDetector
from ..validator import ImageValidator
from ..order_resolver import OrderResolver
from ..cache_manager import ScraperCacheManager
from ..diagnostics import ScraperDiagnosticsLogger

logger = logging.getLogger("sonikoma.services.scraper.adapters.generic")


class GenericAdaptiveAdapter(BaseSiteAdapter):
    """Universal adaptive extraction engine for any webtoon, manga, or comic reader."""

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        """Fallback adapter for all standard sites."""
        return True

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes progressive evaluated escalation on the context."""
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        # ---------------------------------------------------------------------
        # Level 1: Static HTTP Acquisition
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
            # Extract metadata early
            series, chapter = DomExtractor.extract_metadata(html, url)
            if series.title: context.series_info.title = series.title
            if series.description: context.series_info.description = series.description
            if series.cover: context.series_info.cover = series.cover
            if series.author: context.series_info.author = series.author
            if chapter.title: context.chapter_info.title = chapter.title
            if chapter.number: context.chapter_info.number = chapter.number
            if chapter.previous: context.chapter_info.previous = chapter.previous
            if chapter.next: context.chapter_info.next = chapter.next
            context.checklist.chapter_found = bool(context.chapter_info.title or context.chapter_info.number)

            context.record_level("Level 1: Static HTTP", EscalationStatus.SUCCESS, 0.9, 0, l1_dur)
        else:
            context.record_level("Level 1: Static HTTP", EscalationStatus.FAILED, 0.0, 0, l1_dur, reason=f"Status {status_code}")

        # ---------------------------------------------------------------------
        # ---------------------------------------------------------------------
        # Level 2: DOM & Embedded State (Next.js / Nuxt / JSON)
        # ---------------------------------------------------------------------
        if context.raw_html:
            t0 = time.time()
            candidates_all, best_reader = ReaderDetector.detect_reader(context.raw_html)
            context.reader_candidates = candidates_all
            context.selected_reader = best_reader

            dom_images = []
            soup = DomExtractor.get_soup(context.raw_html)
            if best_reader and soup:
                context.checklist.reader_found = True
                selected_node = soup.select_one(best_reader.selector)
                if selected_node:
                    dom_images = DomExtractor.extract_images_from_container(selected_node, url, best_reader.selector)
                if not dom_images:
                    dom_images = DomExtractor.extract_manga_images_fallback(soup, url)

                if dom_images:
                    context.evidence.record(
                        source_type=EvidenceSource.DOM_READER,
                        source_url=url,
                        reader_context=best_reader.selector,
                        confidence=best_reader.score / 100.0,
                        discovered_images_count=len(dom_images)
                    )
            elif soup:
                dom_images = DomExtractor.extract_manga_images_fallback(soup, url)

            # Embedded state extraction (__NEXT_DATA__, __NUXT__)
            embedded_images = EmbeddedStateExtractor.extract_from_html(context.raw_html, url)
            if embedded_images:
                context.evidence.record(
                    source_type=EvidenceSource.EMBEDDED_STATE,
                    source_url=url,
                    confidence=0.85,
                    discovered_images_count=len(embedded_images)
                )

            l2_images = dom_images if dom_images else embedded_images
            context.candidate_images.extend(l2_images)
            l2_dur = (time.time() - t0) * 1000.0

            # Evaluated check: Did Level 2 discover valid chapter images?
            if len(dom_images) >= 1:
                score = best_reader.score if best_reader else 80.0
                context.checklist.reader_end_reached = True
                context.checklist.lazy_loading_finished = True
                context.completeness = ScrapeCompleteness.COMPLETE
                context.record_level("Level 2: DOM & Embedded State", EscalationStatus.SUCCESS, score, len(dom_images), l2_dur)
                return self._finalize_result(context)
            elif embedded_images and len(embedded_images) >= 1:
                context.completeness = ScrapeCompleteness.COMPLETE
                context.record_level("Level 2: DOM & Embedded State", EscalationStatus.SUCCESS, 85.0, len(embedded_images), l2_dur)
                return self._finalize_result(context)
            else:
                context.record_level("Level 2: DOM & Embedded State", EscalationStatus.PARTIAL, best_reader.score if best_reader else 0.0, len(l2_images), l2_dur)

        # ---------------------------------------------------------------------
        # Level 4 to 7: Playwright Dynamic Browser Rendering & Network Interception
        # ---------------------------------------------------------------------
        if context.config.enable_browser_fallback:
            t0 = time.time()
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

                # Re-scan rendered DOM
                candidates_pw, best_reader_pw = ReaderDetector.detect_reader(pw_html)
                soup_pw = DomExtractor.get_soup(pw_html)
                if best_reader_pw:
                    context.selected_reader = best_reader_pw
                    context.checklist.reader_found = True
                    if soup_pw:
                        sel_node = soup_pw.select_one(best_reader_pw.selector)
                        if sel_node:
                            pw_dom_images = DomExtractor.extract_images_from_container(sel_node, url, best_reader_pw.selector)
                            if not pw_dom_images:
                                pw_dom_images = DomExtractor.extract_manga_images_fallback(soup_pw, url)
                            context.candidate_images.extend(pw_dom_images)
                        else:
                            pw_dom_images = DomExtractor.extract_manga_images_fallback(soup_pw, url)
                            context.candidate_images.extend(pw_dom_images)
                elif soup_pw:
                    pw_dom_images = DomExtractor.extract_manga_images_fallback(soup_pw, url)
                    context.candidate_images.extend(pw_dom_images)

                # Correlate network intercepted images
                dom_urls = {c.url for c in context.candidate_images}
                ch_id = str(context.chapter_info.number) if context.chapter_info.number is not None else None
                for net_url in net_images:
                    corr_score = EvidenceCorrelator.correlate_network_image(
                        net_url,
                        dom_discovered_urls=dom_urls,
                        api_discovered_urls=set(),
                        chapter_id=ch_id
                    )
                    if corr_score >= 0.6:
                        context.candidate_images.append(CandidateImage(
                            url=net_url,
                            source_type=ImageSourceType.NETWORK,
                            dom_index=len(context.candidate_images),
                            is_inside_reader=True,
                            confidence=corr_score
                        ))

                context.checklist.reader_end_reached = True
                context.checklist.lazy_loading_finished = True
                context.checklist.network_set_complete = True
                context.completeness = ScrapeCompleteness.COMPLETE
                context.record_level("Level 4-7: Browser & Network", EscalationStatus.SUCCESS, 95.0, len(context.candidate_images), l4_dur)
                return self._finalize_result(context)
            else:
                context.record_level("Level 4-7: Browser & Network", EscalationStatus.FAILED, 0.0, 0, l4_dur, reason="Browser failed to render")

        # If all levels exhausted without finding reader/candidates
        if not context.selected_reader and not context.candidate_images:
            context.error = ScrapeError(
                code=ScrapeErrorCode.READER_NOT_FOUND,
                message="Could not identify or validate any chapter reader container on the target website."
            )
            context.completeness = ScrapeCompleteness.FAILED
            ScraperDiagnosticsLogger.log_reader_detection(len(context.reader_candidates), None, 0.0)

        return self._finalize_result(context)

    def _finalize_result(self, context: ScrapeContext) -> ChapterResult:
        """Performs validation, order resolution, incremental caching, and diagnostics output."""
        ScraperDiagnosticsLogger.log_reader_detection(
            len(context.reader_candidates),
            context.selected_reader.selector if context.selected_reader else None,
            context.selected_reader.score if context.selected_reader else 0.0
        )

        ScraperDiagnosticsLogger.log_extraction(
            dom_count=sum(1 for c in context.candidate_images if c.source_type == ImageSourceType.DOM),
            api_count=sum(1 for c in context.candidate_images if c.source_type == ImageSourceType.API),
            network_count=sum(1 for c in context.candidate_images if c.source_type == ImageSourceType.NETWORK)
        )

        # Validate candidates
        validated, rejections = ImageValidator.validate_candidates(
            context.candidate_images,
            filter_banners=context.config.filter_banners
        )
        context.rejections = rejections

        # Apply limit if requested
        if context.config.limit and context.config.limit > 0:
            validated = validated[:context.config.limit]

        # Resolve order
        ordered = OrderResolver.resolve_order(validated)

        # Detect new images against cache
        canonical = context.canonical_url or context.normalized_url or context.url
        ch_id = str(context.chapter_info.number) if context.chapter_info.number is not None else None
        final_images = ScraperCacheManager.detect_new_images(canonical, ordered, ch_id)
        context.validated_images = final_images

        # Persist to cache
        ScraperCacheManager.save_result(canonical, final_images)

        # Check for failure condition
        if not final_images and not context.error:
            context.error = ScrapeError(
                code=ScrapeErrorCode.READER_NOT_FOUND,
                message="No valid chapter panel images were extracted."
            )
            context.completeness = ScrapeCompleteness.FAILED

        elapsed_ms = (time.time() - context.start_time) * 1000.0
        new_count = sum(1 for img in final_images if img.is_new)
        ScraperDiagnosticsLogger.log_result(
            chapter_number=context.chapter_info.number,
            images_count=len(final_images),
            new_images_count=new_count,
            completeness=context.completeness.value,
            execution_time_ms=elapsed_ms
        )

        return context.to_chapter_result()
