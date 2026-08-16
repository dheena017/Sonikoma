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
    KNOWN_MANGA_IMAGE_SELECTORS,
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

        # 1. Test standard known reader container selectors
        for sel in READER_CONTAINER_SELECTORS:
            try:
                matched_elements = soup.select(sel)
                for el in matched_elements:
                    # If selector matched an <img> directly, evaluate its parent container
                    node = el.parent if el.name == "img" else el
                    if not node or id(node) in tested_nodes:
                        continue
                    tested_nodes.add(id(node))

                    candidate = cls._score_container_node(node, selector=sel)
                    if candidate.image_count > 0:
                        candidates.append(candidate)
            except Exception:
                continue

        # 2. Test leaf manga image selectors and evaluate their common container
        for leaf_sel in KNOWN_MANGA_IMAGE_SELECTORS:
            try:
                matched_leafs = soup.select(leaf_sel)
                if len(matched_leafs) >= 2:
                    # Find common parent/ancestor container for matched manga images
                    parent_container = matched_leafs[0].parent
                    while parent_container and parent_container.name not in ["body", "html", "[document]"]:
                        imgs_in_p = parent_container.find_all(["img", "source"])
                        if len(imgs_in_p) >= len(matched_leafs):
                            break
                        parent_container = parent_container.parent

                    if parent_container and id(parent_container) not in tested_nodes and parent_container.name != "body":
                        tested_nodes.add(id(parent_container))
                        cls_name = parent_container.get("class")
                        cls_str = ".".join(cls_name) if isinstance(cls_name, list) else str(cls_name or "")
                        elem_id = parent_container.get("id")
                        inferred_sel = f"#{elem_id}" if elem_id else (f".{cls_str.split()[0]}" if cls_str else parent_container.name)

                        candidate = cls._score_container_node(parent_container, selector=inferred_sel)
                        if candidate.image_count > 0:
                            candidates.append(candidate)
            except Exception:
                continue

        # 3. Universal density scan on structural elements (div, main, article, section)
        if soup.body:
            for elem in soup.body.find_all(["div", "main", "article", "section"]):
                if id(elem) in tested_nodes:
                    continue
                tested_nodes.add(id(elem))

                img_tags = elem.find_all(["img", "source", "picture", "canvas"])
                if len(img_tags) >= 2:
                    cls_name = elem.get("class")
                    cls_str = ".".join(cls_name) if isinstance(cls_name, list) else str(cls_name or "")
                    elem_id = elem.get("id")
                    inferred_sel = f"#{elem_id}" if elem_id else (f".{cls_str.split()[0]}" if cls_str else elem.name)

                    candidate = cls._score_container_node(elem, selector=inferred_sel)
                    if candidate.image_count > 0:
                        candidates.append(candidate)

        # Sort candidates descending by score, prioritizing higher image count density
        candidates.sort(key=lambda c: (c.score, c.image_count), reverse=True)

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

        # Factor 1: Image count density (Crucial: real readers contain multiple images)
        if img_count >= 15:
            score += 45.0
        elif img_count >= 5:
            score += 35.0
        elif img_count >= 2:
            score += 20.0
        elif img_count == 1:
            score -= 20.0  # Penalize single-image wrappers

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
        sel_lower = selector.lower()
        if any(known in sel_lower for known in ["_imagelist", "readerarea", "reading-content", "entry-content", "chapter-content", "wt_viewer", "viewer_lst"]):
            score += 35.0
        elif any(known in sel_lower for known in ["viewer", "reader", "comic", "episode"]):
            score += 20.0

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
