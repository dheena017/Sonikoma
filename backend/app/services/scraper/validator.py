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
        filter_banners: bool = True,
        dynamic_unwanted_patterns: Optional[List[str]] = None,
        url_pattern: Optional[str] = None
    ) -> Tuple[List[ImageItem], List[Dict[str, str]]]:
        """
        Validates all candidate images against reader boundaries, quality constraints,
        and AI-discovered dynamic exclusion filters.
        Returns:
            (validated_image_items, rejections_list)
        """
        accepted: List[ImageItem] = []
        rejections: List[Dict[str, str]] = []
        seen_fingerprints = set()

        combined_unwanted = list(UNWANTED_PATTERNS)
        if dynamic_unwanted_patterns:
            combined_unwanted.extend([p.lower().strip() for p in dynamic_unwanted_patterns if p])

        for idx, cand in enumerate(candidates):
            raw_url = cand.url
            if not raw_url:
                continue

            # Clean trailing srcset descriptors (e.g., 'https://.../img.png 1x')
            url = str(raw_url).strip()
            if url.startswith("http") and " " in url:
                url = url.split()[0]

            if not url.startswith(("http://", "https://", "data:image/", "/api/proxy-image")):
                rejections.append({"url": url, "reason": "invalid_url_scheme"})
                ScraperDiagnosticsLogger.log_rejection(url, "invalid_url_scheme")
                continue

            lower_u = url.lower()
            if any(term in lower_u for term in ("schema.org", "#website", "#breadcrumb", "#webpage", "#/schema")):
                rejections.append({"url": url, "reason": "schema_metadata_uri"})
                ScraperDiagnosticsLogger.log_rejection(url, "schema_metadata_uri")
                continue

            if lower_u.startswith("data:image/svg") or "svg+xml" in lower_u:
                rejections.append({"url": url, "reason": "svg_placeholder"})
                ScraperDiagnosticsLogger.log_rejection(url, "svg_placeholder")
                continue

            # 1. Primary rule: Reader boundary association check.
            if not cand.is_inside_reader:
                confidence = getattr(cand, "confidence", 1.0) or 0.0
                lower_url_check = url.lower()
                _bad_url_terms = (
                    "logo", "favicon", "sprite", "icon_", "/icon/", "avatar",
                    "badge", "banner", "cover", "/ad/", "ads/", "tracking",
                    "pixel", "1x1", "spacer", "placeholder", "/_next/static/",
                    "ogimage", "account-prompt"
                )
                has_bad_keyword = any(t in lower_url_check for t in _bad_url_terms)
                if confidence < 0.75 or has_bad_keyword:
                    rejections.append({
                        "url": url,
                        "reason": "outside_reader",
                        "confidence": str(round(confidence, 2))
                    })
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

            # 3. Defensive thumbnail & AI-driven dynamic keyword filter
            if filter_banners:
                lower_url = url.lower()
                # Check for WordPress/manga/INKR thumbnail resized files or small dimensions
                is_thumbnail_url = (
                    re.search(r'-\d{2,3}x\d{2,3}\.(?:jpe?g|png|webp|avif)', lower_url) or
                    any(t in lower_url for t in ("/thumb/", "/thumbs/", "/thumbnail/", "/thumbnails/", "_thumb.", "-thumb.", "_small.", "-small.", "preview_image", "cover_thumb", "/_next/static/media/")) or
                    lower_url.endswith(("/t.jpg", "/t.webp", "/t.png", "/t.jpeg"))
                )
                if is_thumbnail_url:
                    rejections.append({"url": url, "reason": "thumbnail_resized_image"})
                    ScraperDiagnosticsLogger.log_rejection(url, "thumbnail_resized_image")
                    continue

                # Check for explicit unwanted keywords unless marked as direct API/DOM reader item
                is_blacklisted = False
                for pat in combined_unwanted:
                    if pat and pat in lower_url:
                        # Allow if it's explicitly named page/panel/chapter
                        if not any(good in lower_url for good in ["page", "panel", "chapter", "episode", "ch-", "ep-", "read"]):
                            is_blacklisted = True
                            rejections.append({"url": url, "reason": f"blacklisted_keyword_{pat}"})
                            ScraperDiagnosticsLogger.log_rejection(url, f"blacklisted_keyword_{pat}")
                            break
                if is_blacklisted:
                    continue

            # 4. Multi-CDN Cross-Mirror Asset Deduplication
            if "/dims/crop/" in url or "/crop/" in url:
                clean_fp = url
            elif url.startswith(("http://", "https://")):
                parsed_u = urlparse(url)
                raw_filename = parsed_u.path.rstrip("/").split("/")[-1]
                # If filename is a unique hash or asset ID (>=8 chars with image extension)
                if len(raw_filename) >= 8 and any(raw_filename.lower().endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif")):
                    clean_fp = raw_filename.lower()
                else:
                    clean_fp = f"{parsed_u.netloc}{parsed_u.path}".lower()
            else:
                clean_fp = url[:64].lower()

            if clean_fp in seen_fingerprints:
                rejections.append({"url": url, "reason": "duplicate_image_cross_cdn"})
                ScraperDiagnosticsLogger.log_rejection(url, "duplicate_image")
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
