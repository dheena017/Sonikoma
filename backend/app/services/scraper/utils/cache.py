from typing import List, Dict, Optional
import hashlib
from backend.app.services.scraper.models.core import ImageAsset

class CacheManager:
    """Manages caching of scraper results and detection of new images."""

    def __init__(self):
        # In a real app, this would be Redis or a database
        self._cache: Dict[str, Dict] = {}

    def _generate_cache_key(self, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()

    def get_cached_result(self, url: str) -> Optional[Dict]:
        key = self._generate_cache_key(url)
        return self._cache.get(key)

    def save_result(self, url: str, result: Dict) -> None:
        key = self._generate_cache_key(url)
        self._cache[key] = result

    def detect_new_images(self, current_images: List[ImageAsset], cached_images: List[ImageAsset]) -> List[ImageAsset]:
        """
        Compares current images with cached images and flags new ones.
        Returns the current_images list with the `is_new` flag updated.
        """
        cached_urls = {img.url for img in cached_images}

        for img in current_images:
            if img.url not in cached_urls:
                img.is_new = True
            else:
                img.is_new = False

        return current_images
