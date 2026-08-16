"""
backend/app/services/scraper/extraction/dom.py
─────────────────────────────────────────────────────────────────────────────
DOM extraction using BeautifulSoup for candidate image nodes, metadata,
and structural elements.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urljoin

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

from ..models import CandidateImage, ImageSourceType, SeriesInfo, ChapterInfo
from ..constants import UNWANTED_CONTAINERS

logger = logging.getLogger("sonikoma.services.scraper.extraction.dom")


class DomExtractor:
    """Extracts images and metadata from raw or rendered HTML DOM structures."""

    @classmethod
    def get_soup(cls, html: str) -> Optional[Any]:
        """Safely parses HTML into a BeautifulSoup object."""
        if not BeautifulSoup or not html:
            return None
        try:
            return BeautifulSoup(html, "lxml")
        except Exception:
            try:
                return BeautifulSoup(html, "html.parser")
            except Exception:
                return None

    @classmethod
    def extract_images_from_container(
        cls,
        container_node: Any,
        base_url: str,
        container_selector: Optional[str] = None
    ) -> List[CandidateImage]:
        """Extracts candidate image objects in DOM order from a specific container node."""
        if not container_node:
            return []

        candidates: List[CandidateImage] = []
        seen_urls = set()

        def _clean_url(val: Any) -> Optional[str]:
            if val is None:
                return None
            s = (" ".join(str(v) for v in val) if isinstance(val, list) else str(val)).strip()
            if not s:
                return None
            if "," in s:
                s = s.split(",")[0].strip()
            if " " in s and not s.startswith(("http://", "https://", "//")):
                s = s.split()[0].strip()
            if s.startswith("//"):
                s = f"https:{s}"
            if any(ext in s.lower() for ext in ["1x1.gif", "spacer.gif", "blank.gif", "loading.gif", "pixel.gif"]):
                return None
            return s

        def _try_add(src_raw: Any, node_elem: Any, idx: int):
            cleaned = _clean_url(src_raw)
            if not cleaned:
                return
            abs_src = urljoin(base_url, cleaned)
            if abs_src and abs_src not in seen_urls:
                seen_urls.add(abs_src)
                candidates.append(CandidateImage(
                    url=abs_src,
                    source_type=ImageSourceType.DOM,
                    dom_index=idx,
                    container_selector=container_selector,
                    is_inside_reader=True,
                    raw_attributes=dict(node_elem.attrs) if hasattr(node_elem, "attrs") else {}
                ))

        # Check if container_node itself is an image
        if getattr(container_node, "name", "") in ["img", "source"]:
            src = (
                container_node.get("data-url") or
                container_node.get("data-src") or
                container_node.get("data-original") or
                container_node.get("data-original-src") or
                container_node.get("data-lazy-src") or
                container_node.get("data-raw-src") or
                container_node.get("data-cdn") or
                container_node.get("data-image") or
                container_node.get("data-echo") or
                container_node.get("srcset") or
                container_node.get("src")
            )
            _try_add(src, container_node, 0)
            return candidates

        # 1. Inspect <img> and <source> tags
        for idx, img in enumerate(container_node.find_all(["img", "source"])):
            src = (
                img.get("data-url") or
                img.get("data-src") or
                img.get("data-original") or
                img.get("data-original-src") or
                img.get("data-lazy-src") or
                img.get("data-raw-src") or
                img.get("data-cdn") or
                img.get("data-image") or
                img.get("data-bg") or
                img.get("data-echo") or
                img.get("origin-src") or
                img.get("lazy-src") or
                img.get("srcset") or
                img.get("src")
            )
            _try_add(src, img, idx)

        # 2. Inspect elements with data-src or background-image styles
        for idx, elem in enumerate(container_node.find_all(["div", "picture", "section", "a"])):
            data_src = (
                elem.get("data-src") or
                elem.get("data-original") or
                elem.get("data-url") or
                elem.get("data-image")
            )
            if data_src:
                _try_add(data_src, elem, len(candidates))

            style = str(elem.get("style", "") or "")
            if "url(" in style:
                bg_m = re.search(r'url\s*\(\s*["\']?([^"\'\)]+)["\']?\s*\)', style, re.IGNORECASE)
                if bg_m:
                    _try_add(bg_m.group(1), elem, len(candidates))

        return candidates

    @classmethod
    def extract_manga_images_fallback(cls, soup: Any, base_url: str) -> List[CandidateImage]:
        """Fallback extraction for manga panels across the entire DOM when container detection is ambiguous."""
        if not soup:
            return []

        candidates: List[CandidateImage] = []
        seen_urls = set()

        def _clean_url(val: Any) -> Optional[str]:
            if val is None:
                return None
            s = (" ".join(str(v) for v in val) if isinstance(val, list) else str(val)).strip()
            if not s or any(ext in s.lower() for ext in ["1x1.gif", "spacer.gif", "blank.gif", "loading.gif", "pixel.gif"]):
                return None
            if "," in s:
                s = s.split(",")[0].strip()
            if " " in s and not s.startswith(("http://", "https://", "//")):
                s = s.split()[0].strip()
            if s.startswith("//"):
                s = f"https:{s}"
            return s

        # Scan all images in DOM
        for idx, img in enumerate(soup.find_all(["img", "source"])):
            # Ignore images in unwanted parent containers (headers, footers, comments)
            if img.find_parent(["header", "footer", "nav", "aside", "#cList", ".area_comment", ".comment_area"]):
                continue

            src = (
                img.get("data-url") or
                img.get("data-src") or
                img.get("data-original") or
                img.get("data-original-src") or
                img.get("data-lazy-src") or
                img.get("data-raw-src") or
                img.get("data-cdn") or
                img.get("data-image") or
                img.get("data-echo") or
                img.get("srcset") or
                img.get("src")
            )
            cleaned = _clean_url(src)
            if not cleaned:
                continue

            # Prioritize images matching manga chapter path conventions
            clean_lower = cleaned.lower()
            if any(term in clean_lower for term in ["chapter", "wp-manga", "manga", "upload", "page", "data/"]):
                abs_src = urljoin(base_url, cleaned)
                if abs_src and abs_src not in seen_urls:
                    seen_urls.add(abs_src)
                    candidates.append(CandidateImage(
                        url=abs_src,
                        source_type=ImageSourceType.DOM,
                        dom_index=idx,
                        container_selector="body (manga fallback)",
                        is_inside_reader=True,
                        confidence=0.85
                    ))

        return candidates

    @classmethod
    def extract_metadata(cls, html: str, base_url: str) -> Tuple[SeriesInfo, ChapterInfo]:
        """Extracts OpenGraph, meta tags, and schema.org data for Series and Chapter."""
        soup = cls.get_soup(html)
        series = SeriesInfo()
        chapter = ChapterInfo(url=base_url)

        if not soup:
            return series, chapter

        def _get_meta(name_or_prop: str) -> Optional[str]:
            tag = soup.find("meta", attrs={"property": name_or_prop}) or soup.find("meta", attrs={"name": name_or_prop})
            if tag and tag.get("content"):
                return str(tag.get("content")).strip()
            return None

        # Series metadata
        title = _get_meta("og:title") or (soup.title.string.strip() if soup.title and soup.title.string else None)
        desc = _get_meta("og:description") or _get_meta("description")
        cover = _get_meta("og:image")
        author = _get_meta("author") or _get_meta("article:author")

        if title:
            # Clean generic site titles (e.g. "Comic Title | WEBTOON")
            series.title = re.sub(r'\s*\|\s*(?:WEBTOON|Tapas|Tappytoon|MangaDex|Manta).*$', '', title, flags=re.IGNORECASE).strip()
        if desc:
            series.description = desc
        if cover:
            series.cover = urljoin(base_url, cover)
        if author:
            series.author = author

        # Chapter number and title resolution
        if title:
            m_num = re.search(r'\b(?:ep(?:isode)?|ch(?:apter)?)\s*#?\s*(\d+(?:\.\d+)?)\b', title, re.IGNORECASE)
            if m_num:
                try:
                    chapter.number = float(m_num.group(1))
                    chapter.episode = f"Episode {m_num.group(1)}"
                except ValueError:
                    pass
            chapter.title = title

        # Previous and Next navigation links
        for a in soup.find_all("a", href=True):
            href = a.get("href")
            txt = a.get_text(separator=" ", strip=True).lower()
            rel = (a.get("rel") or [""])[0] if isinstance(a.get("rel"), list) else (a.get("rel") or "")

            if rel == "prev" or any(p in txt for p in ["prev", "previous", "previous episode", "이전화"]):
                chapter.previous = urljoin(base_url, href)
            elif rel == "next" or any(n in txt for n in ["next", "next episode", "다음화"]):
                chapter.next = urljoin(base_url, href)

        return series, chapter
