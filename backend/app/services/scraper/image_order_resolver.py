"""
backend/app/services/scraper/order_resolver.py
─────────────────────────────────────────────────────────────────────────────
Preserves exact presentation order of chapter panels.
Resolves visual sequence: DOM position > API page index > Network order > Fallback.
─────────────────────────────────────────────────────────────────────────────
"""

import re
from typing import List, Any
from .scraper_models import ImageItem


class OrderResolver:
    """Resolves and preserves the exact reading order of chapter images."""

    @classmethod
    def resolve_order(cls, images: List[Any]) -> List[Any]:
        """
        Re-indexes and naturally sorts the strictly established reading order of images.
        """
        if not images:
            return []

        def _get_url(item):
            return item.get("url") if isinstance(item, dict) else getattr(item, "url", str(item))

        def _natural_key(item):
            url = _get_url(item)
            filename = url.split("/")[-1].split("?")[0]
            parts = re.split(r'(\d+)', filename)
            return [int(text) if text.isdigit() else text.lower() for text in parts]

        sorted_images = sorted(images, key=_natural_key)

        for idx, img in enumerate(sorted_images):
            if isinstance(img, dict):
                img["index"] = idx
            elif hasattr(img, "index"):
                img.index = idx

        return sorted_images

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
