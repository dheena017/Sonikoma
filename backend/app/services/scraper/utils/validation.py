from typing import List, Optional
import re
from backend.app.services.scraper.models.core import ImageAsset

class ImageValidator:
    """Validates candidate images and filters out noise (logos, avatars, etc.)."""

    def __init__(self):
        self.negative_patterns = [
            r'logo', r'avatar', r'icon', r'banner', r'ads', r'promo', r'sponsor',
            r'favicon', r'profile', r'thumb', r'nav', r'bg', r'background'
        ]
        self.min_width = 300
        self.min_height = 100

    def validate(self, image: ImageAsset, is_in_reader: bool = False) -> bool:
        """
        The primary rejection mechanism is whether it is associated with the reader.
        """
        if not is_in_reader:
            return False

        url_lower = image.url.lower()

        # If it's explicitly marked as an ad or icon via URL path
        for pattern in self.negative_patterns:
            if re.search(pattern, url_lower):
                # We might want to still accept it if we are 100% sure it's in the reader,
                # but for now we filter it out if it looks like noise
                return False

        # Validate dimensions if available
        if image.width and image.width < self.min_width:
            return False
        if image.height and image.height < self.min_height:
            return False

        return True

    def filter_and_order(self, candidates: List[ImageAsset]) -> List[ImageAsset]:
        """
        Filters candidates and ensures strict order preservation based on index.
        """
        # Sort by index (DOM position or API index)
        sorted_candidates = sorted(candidates, key=lambda x: x.index)

        valid_images = []
        seen_urls = set()

        new_index = 0
        for img in sorted_candidates:
            if img.url in seen_urls:
                continue
            if self.validate(img, is_in_reader=True):  # Assuming these passed reader detection
                img.index = new_index
                valid_images.append(img)
                seen_urls.add(img.url)
                new_index += 1

        return valid_images

class TileReconstructor:
    """Handles stitching image tiles together into a single page."""

    def reconstruct(self, tiles: List[bytes], layout: str = "vertical") -> bytes:
        """
        Stitches image tiles together.
        In a real implementation, this would use PIL/OpenCV or rely on existing stitch_images_together.
        """
        # Placeholder for actual stitching logic
        return b""
