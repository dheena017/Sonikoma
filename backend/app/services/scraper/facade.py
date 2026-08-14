from typing import Dict, Any, Optional
from backend.app.services.scraper.engine.pipeline import Pipeline
from backend.app.services.scraper.adapters.webtoon import WebtoonAdapter

class ScraperService:
    """Facade for the new scraper engine."""

    def __init__(self):
        self.pipeline = Pipeline()
        self.adapters = [WebtoonAdapter()]

    def scrape(self, url: str) -> Dict[str, Any]:
        """Entry point for the new scraping logic."""

        # 1. Try to find a specific adapter first
        for adapter in self.adapters:
            if adapter.can_handle(url):
                try:
                    result = adapter.scrape(url)
                    return self._format_result(result)
                except Exception as e:
                    # If adapter fails, we could potentially fallback to generic
                    pass

        # 2. Fallback to generic pipeline
        attempt = self.pipeline.execute(url)
        return self._format_result_from_attempt(url, attempt)

    def _format_result(self, result: Any) -> Dict[str, Any]:
        """Convert ChapterResult to a dictionary compatible with the old API (temporarily)."""
        images = [img.url for img in result.images]
        return {
            "success": len(images) > 0,
            "images": images,
            "total_images": len(images),
            "metadata": {
                "title": result.series.title,
                "episode": result.chapter.episode,
            },
            "new_scraper": True # Flag indicating this is from the new architecture
        }

    def _format_result_from_attempt(self, url: str, attempt: Any) -> Dict[str, Any]:
        images = [img.url for img in attempt.image_candidates]
        return {
            "success": len(images) > 0,
            "images": images,
            "total_images": len(images),
            "metadata": {},
            "new_scraper": True
        }

scraper_service = ScraperService()
