from typing import List, Optional, Protocol, Any
import httpx
from bs4 import BeautifulSoup

from backend.app.services.scraper.models.core import ExtractionAttempt, ExtractionStatus, ImageAsset
from backend.app.services.scraper.engine.scoring import ReaderScorer
from backend.app.services.scraper.utils.validation import ImageValidator


class ExtractionHandler(Protocol):
    """Protocol for extraction handlers in the Chain of Responsibility."""
    def handle(self, url: str, current_attempt: Optional[ExtractionAttempt] = None) -> ExtractionAttempt:
        ...


class BaseExtractionHandler:
    def __init__(self, next_handler: Optional[ExtractionHandler] = None):
        self._next_handler = next_handler

    def set_next(self, handler: ExtractionHandler) -> ExtractionHandler:
        self._next_handler = handler
        return handler

    def handle(self, url: str, current_attempt: Optional[ExtractionAttempt] = None) -> ExtractionAttempt:
        if current_attempt and current_attempt.status == ExtractionStatus.SUCCESS and current_attempt.confidence >= 80:
            return current_attempt

        result = self.process(url, current_attempt)

        if result.status == ExtractionStatus.SUCCESS and result.confidence >= 80:
            return result

        if self._next_handler:
            return self._next_handler.handle(url, result)

        return result

    def process(self, url: str, current_attempt: Optional[ExtractionAttempt] = None) -> ExtractionAttempt:
        raise NotImplementedError()


class Level1StaticHTTPHandler(BaseExtractionHandler):
    """Level 1: Static HTTP (HTML, headers, embedded JSON)."""

    def process(self, url: str, current_attempt: Optional[ExtractionAttempt] = None) -> ExtractionAttempt:
        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                response = client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})

            if response.status_code != 200:
                return ExtractionAttempt(
                    status=ExtractionStatus.FAILED,
                    confidence=0,
                    diagnostics={"level": "1_static_http", "message": f"HTTP {response.status_code}"}
                )

            soup = BeautifulSoup(response.text, "html.parser")
            scorer = ReaderScorer()
            best_candidate = scorer.find_best_candidate(soup)

            if best_candidate.score <= 0:
                 return ExtractionAttempt(
                    status=ExtractionStatus.FAILED,
                    confidence=10, # Low confidence, proceed to Level 2
                    diagnostics={"level": "1_static_http", "message": "No reader found"}
                )

            # If we found a good reader, let's try to extract images
            validator = ImageValidator()
            raw_images = []

            if best_candidate.selector:
                container = soup.select_one(best_candidate.selector)
                if container:
                    for idx, img_tag in enumerate(container.find_all('img')):
                        src = img_tag.get('src') or img_tag.get('data-src')
                        if src:
                            from urllib.parse import urljoin
                            src = urljoin(url, src)

                            img_asset = ImageAsset(index=idx, url=src, source="dom")
                            raw_images.append(img_asset)

            valid_images = validator.filter_and_order(raw_images)

            if len(valid_images) > 0:
                return ExtractionAttempt(
                    status=ExtractionStatus.SUCCESS,
                    confidence=best_candidate.score, # e.g. 85
                    image_candidates=valid_images,
                    diagnostics={"level": "1_static_http", "message": f"Extracted {len(valid_images)} images via DOM"}
                )

            return ExtractionAttempt(
                status=ExtractionStatus.FAILED,
                confidence=20,
                diagnostics={"level": "1_static_http", "message": "Reader found but no valid images"}
            )

        except Exception as e:
            return ExtractionAttempt(
                status=ExtractionStatus.FAILED,
                confidence=0,
                diagnostics={"level": "1_static_http", "message": f"Error: {str(e)}"}
            )


from backend.app.services.scraper.engine.browser import Level2BrowserHandler, Level3NetworkAPIHandler


class Pipeline:
    """Configures and runs the progressive extraction pipeline."""
    def __init__(self):
        self.head = Level1StaticHTTPHandler()
        l2 = Level2BrowserHandler()
        l3 = Level3NetworkAPIHandler()

        self.head.set_next(l2).set_next(l3)

    def execute(self, url: str) -> ExtractionAttempt:
        return self.head.handle(url)
