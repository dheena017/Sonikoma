"""
backend/app/services/scraper/evaluator.py
─────────────────────────────────────────────────────────────────────────────
Scrape Confidence & Access Evaluation Engine.
Provides:
  1. AccessEvaluator: Reason-based HTTP access classification (Bot challenges, Cloudflare, 403, 429).
  2. ExtractionEvaluator: Quantitative confidence scoring (0.0 - 1.0) on candidate images,
     evaluating image count, reader containment, dimensions, duplicate rate, sequence continuity.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import logging
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple, Set
from urllib.parse import urlparse
from pydantic import BaseModel, Field

from .scraper_models import CandidateImage, SourceInfo, ImageSourceType

logger = logging.getLogger("sonikoma.services.scraper.evaluator")


class AccessStatus(str, Enum):
    PAGE_AVAILABLE = "PAGE_AVAILABLE"
    BOT_CHALLENGE = "BOT_CHALLENGE"       # Cloudflare Turnstile, DDOS-GUARD, Captcha, 403 challenge
    RATE_LIMITED = "RATE_LIMITED"         # 429 Too Many Requests
    LOGIN_REQUIRED = "LOGIN_REQUIRED"     # 401 Unauthorized or paywall login redirect
    NOT_FOUND = "NOT_FOUND"               # 404 Chapter removed or URL invalid
    SERVER_ERROR = "SERVER_ERROR"         # 500, 502, 503, 504
    NETWORK_ERROR = "NETWORK_ERROR"       # DNS / connection timeout / refusal


class EscalationReason(str, Enum):
    SUCCESS_HIGH_CONFIDENCE = "SUCCESS_HIGH_CONFIDENCE"
    NO_IMAGES_FOUND = "NO_IMAGES_FOUND"
    FEW_IMAGES = "FEW_IMAGES"
    HIGH_DUPLICATE_RATE = "HIGH_DUPLICATE_RATE"
    OUTSIDE_READER_CONTAINER = "OUTSIDE_READER_CONTAINER"
    BOT_CHALLENGE_DETECTED = "BOT_CHALLENGE_DETECTED"
    DYNAMIC_JS_REQUIRED = "DYNAMIC_JS_REQUIRED"
    INVALID_IMAGE_SCHEMAS = "INVALID_IMAGE_SCHEMAS"
    LAYOUT_SHIFT_DETECTED = "LAYOUT_SHIFT_DETECTED"


class EvaluationReport(BaseModel):
    confidence: float = Field(..., description="Weighted scrape confidence score between 0.0 and 1.0")
    escalation_reason: EscalationReason = Field(..., description="Actionable reason for routing or escalation")
    is_acceptable: bool = Field(..., description="True if extraction meets quality threshold without escalation")
    total_candidates: int = 0
    valid_candidates_count: int = 0
    duplicate_count: int = 0
    containment_ratio: float = 0.0
    sequence_continuity_ratio: float = 0.0
    details: Dict[str, Any] = Field(default_factory=dict)


class AccessEvaluator:
    """Classifies raw HTTP response status & content to determine if bot challenge / browser is needed."""

    CLOUDFLARE_SIGNATURES = (
        "cf-chl-bypass", "cloudflare", "ray id", "just a moment...",
        "cf-browser-verification", "turnstile", "challenge-platform",
        "attention required! | cloudflare", "ddos-guard", "verify you are human"
    )

    LOGIN_SIGNATURES = (
        "login", "sign in", "member login", "please log in to continue",
        "restricted content", "subscribers only", "purchase chapter"
    )

    @classmethod
    def evaluate_response(
        cls,
        status_code: Optional[int],
        html_content: Optional[str],
        headers: Optional[Dict[str, str]] = None
    ) -> AccessStatus:
        """Determines the accessibility status of an HTTP fetch."""
        if status_code is None:
            return AccessStatus.NETWORK_ERROR

        if status_code == 429:
            return AccessStatus.RATE_LIMITED

        if status_code == 404:
            return AccessStatus.NOT_FOUND

        if status_code in (500, 502, 503, 504):
            # Check if 503 is actually Cloudflare challenge
            if html_content and any(sig in html_content.lower() for sig in cls.CLOUDFLARE_SIGNATURES):
                return AccessStatus.BOT_CHALLENGE
            return AccessStatus.SERVER_ERROR

        if status_code in (401, 403):
            # 403 is almost always Cloudflare / WAF protection on manga aggregators
            return AccessStatus.BOT_CHALLENGE

        if html_content:
            html_lower = html_content[:5000].lower()
            if any(sig in html_lower for sig in cls.CLOUDFLARE_SIGNATURES):
                return AccessStatus.BOT_CHALLENGE

            if "<title>login" in html_lower or "<title>sign in" in html_lower:
                return AccessStatus.LOGIN_REQUIRED

        if status_code == 200:
            return AccessStatus.PAGE_AVAILABLE

        return AccessStatus.SERVER_ERROR


class ExtractionEvaluator:
    """
    Quantitative Confidence Engine for Comic Extraction.
    Evaluates candidate image arrays across 6 independent quality dimensions.
    """

    CONFIDENCE_THRESHOLD = 0.82  # Scores >= 0.82 are treated as high confidence SUCCESS

    @classmethod
    def evaluate(
        cls,
        candidates: List[CandidateImage],
        html_content: Optional[str] = None,
        source_info: Optional[SourceInfo] = None,
        expected_min_images: int = 3
    ) -> EvaluationReport:
        """
        Computes a comprehensive confidence score (0.0 to 1.0) and escalation reason.
        """
        if not candidates:
            # Check if HTML indicates JS-driven SPA
            is_spa = False
            if html_content:
                h_low = html_content.lower()
                is_spa = any(k in h_low for k in ("__next_data__", "id=\"app\"", "id=\"root\"", "window.__initial_state__"))

            return EvaluationReport(
                confidence=0.0,
                escalation_reason=EscalationReason.DYNAMIC_JS_REQUIRED if is_spa else EscalationReason.NO_IMAGES_FOUND,
                is_acceptable=False,
                total_candidates=0,
                valid_candidates_count=0,
                details={"reason": "No candidate images found in DOM."}
            )

        total = len(candidates)
        seen_urls: Set[str] = set()
        duplicate_count = 0
        inside_reader_count = 0
        valid_schemes_count = 0

        # Bad noise terms for non-chapter assets
        _noise_terms = ("logo", "favicon", "avatar", "icon", "banner", "badge", "tracking", "pixel", "1x1", "spacer", "advert")

        for cand in candidates:
            u = (cand.url or "").strip()
            if not u:
                continue

            # 1. Scheme check
            if u.startswith(("http://", "https://", "data:image/")):
                valid_schemes_count += 1

            # 2. Duplicate check
            u_clean = u.split("?")[0].lower()
            if u_clean in seen_urls:
                duplicate_count += 1
            else:
                seen_urls.add(u_clean)

            # 3. Containment check
            is_noise = any(t in u.lower() for t in _noise_terms)
            if cand.is_inside_reader and not is_noise:
                inside_reader_count += 1

        unique_count = len(seen_urls)
        containment_ratio = inside_reader_count / max(1, total)
        duplicate_ratio = duplicate_count / max(1, total)
        valid_scheme_ratio = valid_schemes_count / max(1, total)

        # ── Weighted Confidence Scoring Dimensions ──────────────────────────
        # Dim 1: Volume Score (0.0 to 1.0)
        if unique_count >= expected_min_images:
            volume_score = 1.0
        elif unique_count == 2:
            volume_score = 0.60
        elif unique_count == 1:
            volume_score = 0.30
        else:
            volume_score = 0.0

        # Dim 2: Containment Score
        containment_score = containment_ratio

        # Dim 3: Purity / Duplicate Penalty
        purity_score = max(0.0, 1.0 - (duplicate_ratio * 1.5))

        # Dim 4: Scheme Validity
        scheme_score = valid_scheme_ratio

        # Dim 5: Sequence Continuity Check
        indices = [cand.dom_index for cand in candidates if hasattr(cand, "dom_index") and cand.dom_index is not None]
        sequence_score = 1.0
        if len(indices) > 2:
            sorted_indices = sorted(indices)
            continuous = sum(1 for i in range(len(sorted_indices) - 1) if sorted_indices[i+1] == sorted_indices[i] + 1)
            sequence_score = continuous / max(1, len(sorted_indices) - 1)

        # Weighted Aggregate Confidence
        confidence = (
            (volume_score * 0.35) +
            (containment_score * 0.30) +
            (purity_score * 0.15) +
            (scheme_score * 0.10) +
            (sequence_score * 0.10)
        )
        confidence = round(max(0.0, min(1.0, confidence)), 3)

        # Determine actionable escalation reason
        if confidence >= cls.CONFIDENCE_THRESHOLD:
            reason = EscalationReason.SUCCESS_HIGH_CONFIDENCE
            is_acceptable = True
        elif unique_count < expected_min_images:
            reason = EscalationReason.FEW_IMAGES
            is_acceptable = False
        elif duplicate_ratio > 0.40:
            reason = EscalationReason.HIGH_DUPLICATE_RATE
            is_acceptable = False
        elif containment_ratio < 0.40:
            reason = EscalationReason.OUTSIDE_READER_CONTAINER
            is_acceptable = False
        else:
            reason = EscalationReason.INVALID_IMAGE_SCHEMAS
            is_acceptable = False

        return EvaluationReport(
            confidence=confidence,
            escalation_reason=reason,
            is_acceptable=is_acceptable,
            total_candidates=total,
            valid_candidates_count=unique_count,
            duplicate_count=duplicate_count,
            containment_ratio=round(containment_ratio, 2),
            sequence_continuity_ratio=round(sequence_score, 2),
            details={
                "volume_score": volume_score,
                "containment_score": containment_score,
                "purity_score": purity_score,
                "unique_images": unique_count,
            }
        )


class ScraperDiagnosticsLogger:
    """Helper for producing structured diagnostic blocks."""

    @staticmethod
    def is_debug_enabled() -> bool:
        """Checks if verbose scraper diagnostics are enabled."""
        import os
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

