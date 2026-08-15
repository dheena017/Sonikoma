"""
backend/app/services/scraper/order_resolver.py
─────────────────────────────────────────────────────────────────────────────
Preserves exact presentation order of chapter panels.
Resolves visual sequence: DOM position > API page index > Network order > Fallback.
─────────────────────────────────────────────────────────────────────────────
"""

import re
from typing import List
from .models import ImageItem


class OrderResolver:
    """Resolves and preserves the exact reading order of chapter images."""

    @classmethod
    def resolve_order(cls, images: List[ImageItem]) -> List[ImageItem]:
        """
        Re-indexes and preserves the strictly established order of images.
        """
        if not images:
            return []

        # Maintain existing discovery/DOM order and re-assign 0-based sequential indices
        ordered = []
        for idx, img in enumerate(images):
            img.index = idx
            ordered.append(img)

        return ordered

    @classmethod
    def sort_by_natural_filename(cls, urls: List[str]) -> List[str]:
        """
        Natural numerical filename sorting fallback when no DOM or API order exists.
        """
        def _natural_key(s: str):
            filename = s.split("/")[-1].split("?")[0]
            parts = re.split(r'(\d+)', filename)
            return [int(text) if text.isdigit() else text.lower() for text in parts]

        return sorted(urls, key=_natural_key)
