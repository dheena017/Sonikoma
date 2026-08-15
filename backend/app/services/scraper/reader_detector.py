"""
backend/app/services/scraper/reader_detector.py
─────────────────────────────────────────────────────────────────────────────
Multi-factor reader candidate scoring and boundary isolation.
Identifies the highest-confidence reader container in the DOM.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import logging
from typing import List, Optional, Tuple, Any

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

from .models import ReaderCandidate
from .constants import (
    READER_CONTAINER_SELECTORS,
    UNWANTED_CONTAINERS,
    MIN_READER_CONFIDENCE_THRESHOLD
)

logger = logging.getLogger("sonikoma.services.scraper.reader_detector")


class ReaderDetector:
    """Discovers and scores candidate reader containers in HTML."""

    @classmethod
    def detect_reader(cls, html: str) -> Tuple[List[ReaderCandidate], Optional[ReaderCandidate]]:
        """
        Scans DOM for reader candidates, computes multi-factor confidence scores,
        and returns (all_candidates, best_candidate_or_none).
        """
        if not BeautifulSoup or not html:
            return [], None

        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception:
            return [], None

        candidates: List[ReaderCandidate] = []
        tested_nodes = set()

        # 1. Test standard known selectors
        for sel in READER_CONTAINER_SELECTORS:
            try:
                matched_elements = soup.select(sel)
                for el in matched_elements:
                    # If selector matched an <img> directly, evaluate its parent container
                    node = el.parent if el.name == "img" else el
                    if id(node) in tested_nodes:
                        continue
                    tested_nodes.add(id(node))

                    candidate = cls._score_container_node(node, selector=sel)
                    if candidate.image_count > 0:
                        candidates.append(candidate)
            except Exception:
                continue

        # 2. Universal density scan on structural elements (div, main, article, section)
        if soup.body:
            for elem in soup.body.find_all(["div", "main", "article", "section"]):
                if id(elem) in tested_nodes:
                    continue
                tested_nodes.add(id(elem))

                img_tags = elem.find_all(["img", "source", "picture", "canvas"])
                if len(img_tags) >= 2:
                    cls_name = elem.get("class", [])
                    cls_str = ".".join(cls_name) if isinstance(cls_name, list) else str(cls_name)
                    elem_id = elem.get("id")
                    inferred_sel = f"#{elem_id}" if elem_id else (f".{cls_str.split()[0]}" if cls_str else elem.name)

                    candidate = cls._score_container_node(elem, selector=inferred_sel)
                    if candidate.image_count > 0:
                        candidates.append(candidate)

        # Sort candidates descending by score
        candidates.sort(key=lambda c: c.score, reverse=True)

        best = None
        if candidates and candidates[0].score >= MIN_READER_CONFIDENCE_THRESHOLD:
            best = candidates[0]
            best.is_selected = True

        return candidates, best

    @classmethod
    def _score_container_node(cls, node: Any, selector: str) -> ReaderCandidate:
        """Computes a multi-factor score (0–100) for a DOM container node."""
        images = node.find_all(["img", "source", "picture", "canvas"])
        img_count = len(images)
        text_content = node.get_text(separator=" ", strip=True)
        text_len = len(text_content)

        score = 0.0

        # Factor 1: Image count density
        if img_count >= 15:
            score += 45.0
        elif img_count >= 5:
            score += 30.0
        elif img_count >= 3:
            score += 15.0
        elif img_count >= 1:
            score += 5.0

        # Factor 2: Text-to-image ratio (readers have high image density, low text)
        if img_count > 0:
            avg_text_per_img = text_len / img_count
            if avg_text_per_img < 50:
                score += 20.0
            elif avg_text_per_img < 150:
                score += 10.0
            elif avg_text_per_img > 500:
                score -= 30.0  # Article or sidebar with many thumbnails

        # Factor 3: Known reader selector match
        if any(known in selector.lower() for known in ["viewer", "reader", "_imagelist", "wp-manga", "chapter-content", "read-container"]):
            score += 35.0

        # Factor 4: Negative penalty for unwanted container names
        node_class_str = str(node.get("class", "")).lower()
        node_id_str = str(node.get("id", "")).lower()
        for unw in UNWANTED_CONTAINERS:
            clean_unw = unw.replace(".", "").replace("#", "").lower()
            if clean_unw in node_class_str or clean_unw in node_id_str or clean_unw == node.name:
                score -= 80.0

        # Check for parent unwanted tags (e.g. sidebar, footer, header, nav)
        if node.find_parent(["header", "footer", "nav", "aside"]):
            score -= 80.0

        final_score = max(0.0, min(100.0, score))

        return ReaderCandidate(
            selector=selector,
            element_tag=node.name,
            image_count=img_count,
            score=final_score,
            text_length=text_len,
            has_large_images=img_count >= 2,
            is_vertical_layout=True
        )
