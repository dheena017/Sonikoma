"""
backend/app/services/scraper/evidence/correlator.py
─────────────────────────────────────────────────────────────────────────────
Evidence Correlator for verifying cross-source asset associations.
Ensures network-intercepted requests and API responses are truly correlated
with the current reader container and chapter before acceptance.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Set, Dict, Any
from urllib.parse import urlparse
import re

from .models import EvidenceItem
from .sources import EvidenceSource


class EvidenceCorrelator:
    """Correlates evidence from different sources to validate reader/chapter association."""

    @staticmethod
    def correlate_network_image(
        image_url: str,
        dom_discovered_urls: Set[str],
        api_discovered_urls: Set[str],
        reader_context_hints: Optional[List[str]] = None,
        chapter_id: Optional[str] = None
    ) -> float:
        """
        Computes a correlation score (0.0 to 1.0) indicating whether a network-intercepted
        image belongs to the current chapter reader rather than being an ad, avatar, or icon.
        """
        if not image_url or not image_url.startswith(("http://", "https://", "data:image/")):
            return 0.0

        # Exact match with DOM or API discovery gives 1.0 confidence
        if image_url in dom_discovered_urls or image_url in api_discovered_urls:
            return 1.0

        score = 0.5  # Base candidate score

        parsed = urlparse(image_url)
        path_lower = parsed.path.lower()
        query_lower = parsed.query.lower()

        # Check chapter ID in path or query
        if chapter_id and (chapter_id.lower() in path_lower or chapter_id.lower() in query_lower):
            score += 0.3

        # Check reader context hints (e.g. CDN path fragments, series slug)
        if reader_context_hints:
            for hint in reader_context_hints:
                if hint and (hint.lower() in path_lower or hint.lower() in query_lower):
                    score += 0.2
                    break

        # Check for chapter-like naming (e.g., /001.jpg, /p001.webp, /page_1.png)
        if re.search(r'(?:page|panel|p|ep|ch)?_?0*\d{1,4}\.(?:jpg|jpeg|png|webp|avif)', path_lower):
            score += 0.2

        # Negative penalties for obvious non-reader paths
        if any(ign in path_lower for ign in ["avatar", "logo", "icon", "thumb", "cover", "ad", "banner"]):
            score -= 0.6

        return max(0.0, min(1.0, score))
