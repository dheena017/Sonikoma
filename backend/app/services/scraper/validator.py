"""
backend/app/services/scraper/validator.py
─────────────────────────────────────────────────────────────────────────────
Reader-Containment-First Image Validator.
Validates candidate images and eliminates non-chapter assets (logos, avatars,
tracking pixels, advertisements, and outside-reader elements).
─────────────────────────────────────────────────────────────────────────────
"""

import re
import logging
from typing import List, Tuple, Dict, Any, Optional
from urllib.parse import urlparse

from .models import CandidateImage, ImageItem, ImageSourceType
from .constants import (
    UNWANTED_PATTERNS,
    DEFAULT_MIN_IMAGE_WIDTH,
    DEFAULT_MIN_IMAGE_HEIGHT
)
from .diagnostics import ScraperDiagnosticsLogger

logger = logging.getLogger("sonikoma.services.scraper.validator")


class ImageValidator:
    """Validates candidate images against reader boundaries and quality constraints."""

    @classmethod
    def validate_candidates(
        cls,
        candidates: List[CandidateImage],
        filter_banners: bool = True
    ) -> Tuple[List[ImageItem], List[Dict[str, str]]]:
        """
        Validates all candidate images.
        Returns:
            (validated_image_items, rejections_list)
        """
        accepted: List[ImageItem] = []
        rejections: List[Dict[str, str]] = []
        seen_fingerprints = set()

        for idx, cand in enumerate(candidates):
            url = cand.url
            if not url or not url.startswith(("http://", "https://", "data:image/", "/api/proxy-image")):
                rejections.append({"url": url, "reason": "invalid_url_scheme"})
                ScraperDiagnosticsLogger.log_rejection(url, "invalid_url_scheme")
                continue

            # 1. Primary rule: Reader boundary association check
            if not cand.is_inside_reader:
                rejections.append({"url": url, "reason": "outside_reader"})
                ScraperDiagnosticsLogger.log_rejection(url, "outside_reader")
                continue

            # 2. Dimensions check (if known)
            if cand.width is not None and cand.width < DEFAULT_MIN_IMAGE_WIDTH:
                rejections.append({"url": url, "reason": "dimension_width_too_small"})
                ScraperDiagnosticsLogger.log_rejection(url, "dimension_width_too_small")
                continue
            if cand.height is not None and cand.height < DEFAULT_MIN_IMAGE_HEIGHT:
                rejections.append({"url": url, "reason": "dimension_height_too_small"})
                ScraperDiagnosticsLogger.log_rejection(url, "dimension_height_too_small")
                continue

            # 3. Secondary defensive keyword filter
            if filter_banners:
                lower_url = url.lower()
                # Check for WordPress/manga thumbnail resized files (e.g., image-75x106.jpg)
                if re.search(r'-\d{2,4}x\d{2,4}\.(?:jpe?g|png|webp|avif)', lower_url):
                    if not any(good in lower_url for good in ["/chapter", "/ch-", "/ep-", "/episode"]):
                        rejections.append({"url": url, "reason": "thumbnail_resized_image"})
                        ScraperDiagnosticsLogger.log_rejection(url, "thumbnail_resized_image")
                        continue

                # Check for explicit unwanted keywords unless marked as direct API/DOM reader item
                is_blacklisted = False
                for pat in UNWANTED_PATTERNS:
                    if pat in lower_url:
                        # Allow if it's explicitly named page/panel/chapter
                        if not any(good in lower_url for good in ["page", "panel", "chapter", "episode", "ch-", "ep-", "read"]):
                            is_blacklisted = True
                            rejections.append({"url": url, "reason": f"blacklisted_keyword_{pat}"})
                            ScraperDiagnosticsLogger.log_rejection(url, f"blacklisted_keyword_{pat}")
                            break
                if is_blacklisted:
                    continue

            # 4. Deduplication by canonical URL
            clean_fp = url.split("?")[0] if url.startswith(("http://", "https://")) else url[:64]
            if clean_fp in seen_fingerprints:
                rejections.append({"url": url, "reason": "duplicate_image"})
                continue
            seen_fingerprints.add(clean_fp)

            # Determine file type
            file_type = "image/jpeg"
            if "png" in url.lower():
                file_type = "image/png"
            elif "webp" in url.lower():
                file_type = "image/webp"
            elif "avif" in url.lower():
                file_type = "image/avif"

            accepted.append(ImageItem(
                index=len(accepted),
                url=url,
                source=cand.source_type.value,
                width=cand.width,
                height=cand.height,
                file_type=file_type,
                is_new=False
            ))

        ScraperDiagnosticsLogger.log_validation(len(accepted), len(rejections))
        return accepted, rejections
