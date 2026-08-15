"""
backend/app/services/scraper/diagnostics.py
─────────────────────────────────────────────────────────────────────────────
Structured diagnostics logging and formatting for the Adaptive Scraper.
Produces clean, sectioned debug output matching the specification.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger("sonikoma.services.scraper")


class ScraperDiagnosticsLogger:
    """Helper for producing structured diagnostic blocks."""

    @staticmethod
    def is_debug_enabled() -> bool:
        """Checks if verbose scraper diagnostics are enabled."""
        val = os.getenv("SCRAPER_DEBUG", "false").lower()
        return val in ("true", "1", "yes") or logger.isEnabledFor(logging.DEBUG)

    @classmethod
    def log_scraper_start(cls, url: str, options: Optional[Dict[str, Any]] = None) -> None:
        logger.info(f"[SCRAPER] Commencing adaptive scrape: {url}")
        if cls.is_debug_enabled() and options:
            opts_str = ", ".join(f"{k}={v}" for k, v in options.items() if v is not None)
            logger.debug(f"[SCRAPER] Options: {opts_str}")

    @classmethod
    def log_fetch(cls, method: str, status: Optional[int], duration_ms: float, client_type: str = "http") -> None:
        logger.info(f"[FETCH] method={method} status={status} duration={duration_ms:.1f}ms client={client_type}")

    @classmethod
    def log_reader_detection(cls, candidate_count: int, selected_selector: Optional[str], confidence: float) -> None:
        sel_str = selected_selector or "NONE"
        logger.info(f"[READER] candidate_count={candidate_count} selected={sel_str} confidence={confidence:.1f}")

    @classmethod
    def log_extraction(cls, dom_count: int, api_count: int, network_count: int, other_count: int = 0) -> None:
        logger.info(
            f"[EXTRACTION] dom_images={dom_count} api_images={api_count} "
            f"network_images={network_count} other_images={other_count}"
        )

    @classmethod
    def log_validation(cls, accepted_count: int, rejected_count: int) -> None:
        logger.info(f"[VALIDATION] accepted={accepted_count} rejected={rejected_count}")

    @classmethod
    def log_rejection(cls, image_url: str, reason: str) -> None:
        if cls.is_debug_enabled():
            short_url = image_url.split("?")[0].split("/")[-1] or image_url[-20:]
            logger.debug(f"[REJECT] {short_url} → {reason}")

    @classmethod
    def log_result(
        cls,
        chapter_number: Optional[float],
        images_count: int,
        new_images_count: int,
        completeness: str,
        execution_time_ms: float
    ) -> None:
        ch_str = f"{chapter_number}" if chapter_number is not None else "Unknown"
        logger.info(
            f"[RESULT] chapter={ch_str} images={images_count} new_images={new_images_count} "
            f"completeness={completeness} duration={execution_time_ms:.1f}ms"
        )
