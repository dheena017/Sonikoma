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
        Preserves the strictly established presentation and reading order of images
        extracted from the DOM, API manifest, or reader container.
        """
        if not images:
            return []

        # Deduplicate while strictly preserving original presentation order
        seen_urls = set()
        ordered_images = []

        for original_pos, item in enumerate(images):
            url = item.get("url") if isinstance(item, dict) else getattr(item, "url", str(item))
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            ordered_images.append((original_pos, item))

        # Respect explicit extraction index if present, otherwise preserve original sequence
        def _sort_key(entry):
            orig_pos, it = entry
            if isinstance(it, dict):
                idx_val = it.get("index")
            elif hasattr(it, "index"):
                idx_val = it.index
            else:
                idx_val = None
            return idx_val if (isinstance(idx_val, int) and idx_val >= 0) else orig_pos

        ordered_images.sort(key=_sort_key)
        final_list = [item for _, item in ordered_images]

        # Re-assign clean 0-indexed sequential index
        for idx, img in enumerate(final_list):
            if isinstance(img, dict):
                img["index"] = idx
            elif hasattr(img, "index"):
                img.index = idx

        return final_list

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
