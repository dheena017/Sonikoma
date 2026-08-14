from typing import Any, Dict, List
from bs4 import BeautifulSoup, Tag
from backend.app.services.scraper.models.core import ReaderCandidate


class ReaderScorer:
    """Configurable heuristic scoring engine for identifying the reader container."""

    def __init__(self, config: Dict[str, int] = None):
        self.weights = config or {
            "image_density": 25,
            "large_images": 20,
            "repeated_dimensions": 15,
            "vertical_ratio": 10,
            "reader_keywords": 15,
            "text_density": -10,
            "navigation_density": -15,
            "sidebar_signals": -20
        }

        self.reader_classes = [
            "viewer", "reader", "chapter-content", "webtoon",
            "comic-reader", "reading-content", "manga-container"
        ]

        self.negative_classes = [
            "header", "footer", "sidebar", "nav", "menu", "comment",
            "recommendation", "ads", "banner"
        ]

    def score_candidate(self, element: Tag, soup: BeautifulSoup) -> ReaderCandidate:
        score = 0
        reasons = []
        evidence = {}

        # Collect basic info
        element_id = element.get('id', '')
        classes = element.get('class', [])
        if isinstance(classes, str):
            classes = [classes]

        class_str = " ".join(classes).lower()
        id_str = element_id.lower()

        # 1. Reader keywords
        for keyword in self.reader_classes:
            if keyword in class_str or keyword in id_str:
                score += self.weights["reader_keywords"]
                reasons.append(f"Contains reader keyword: {keyword}")
                break

        # 2. Negative signals
        for keyword in self.negative_classes:
            if keyword in class_str or keyword in id_str:
                score += self.weights["sidebar_signals"]
                reasons.append(f"Contains negative keyword: {keyword}")
                break

        # 3. Image density & large images (Approximated without rendering, refine if dimensions available)
        images = element.find_all('img')
        evidence["image_count"] = len(images)
        if len(images) > 3:
            score += self.weights["image_density"]
            reasons.append(f"High image density ({len(images)} images)")

        # 4. Links and Navigation density
        links = element.find_all('a')
        if len(links) > len(images) and len(links) > 5:
            score += self.weights["navigation_density"]
            reasons.append(f"High navigation density ({len(links)} links)")

        # 5. Text density
        text_length = len(element.get_text(strip=True))
        if text_length > 2000 and len(images) < 5:
             score += self.weights["text_density"]
             reasons.append(f"High text density ({text_length} chars)")

        candidate = ReaderCandidate(
            selector=self._get_css_selector(element),
            element_id=element_id,
            classes=classes,
            score=score,
            reasons=reasons,
            evidence=evidence
        )
        return candidate

    def _get_css_selector(self, element: Tag) -> str:
        """Attempt to generate a unique CSS selector for the element."""
        if element.get('id'):
            return f"#{element['id']}"

        classes = element.get('class')
        if classes:
            if isinstance(classes, list):
                return "." + ".".join(classes)
            return f".{classes}"

        return element.name

    def find_best_candidate(self, soup: BeautifulSoup) -> ReaderCandidate:
        candidates = []
        # Potential containers
        for div in soup.find_all(['div', 'main', 'article', 'section']):
            # Filter out obviously tiny containers or empty ones
            if not div.find('img'):
                continue

            candidate = self.score_candidate(div, soup)
            if candidate.score > 0:
                candidates.append(candidate)

        if not candidates:
            return ReaderCandidate(score=-1, reasons=["No candidates found"])

        # Sort by score descending
        candidates.sort(key=lambda x: x.score, reverse=True)
        return candidates[0]
