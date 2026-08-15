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

        def _to_str(val: Any) -> str:
            if val is None:
                return ""
            if isinstance(val, list):
                return " ".join(str(v) for v in val).strip()
            return str(val).strip()

        # 1. Inspect <img> and <source> tags
        for idx, img in enumerate(container_node.find_all(["img", "source"])):
            src = (
                _to_str(img.get("data-url")) or
                _to_str(img.get("data-src")) or
                _to_str(img.get("data-original")) or
                _to_str(img.get("data-original-src")) or
                _to_str(img.get("data-lazy-src")) or
                _to_str(img.get("data-raw-src")) or
                _to_str(img.get("data-cdn")) or
                _to_str(img.get("data-image")) or
                _to_str(img.get("data-bg")) or
                _to_str(img.get("data-echo")) or
                _to_str(img.get("origin-src")) or
                _to_str(img.get("lazy-src")) or
                _to_str(img.get("srcset")) or
                _to_str(img.get("src"))
            )
            if src:
                if "," in src:
                    src = src.split(",")[0].strip()
                if " " in src:
                    src = src.split()[0].strip()

                if "1x1.gif" in src or "spacer.gif" in src or "blank.gif" in src:
                    continue

                abs_src = urljoin(base_url, src)
                if abs_src and abs_src not in seen_urls:
                    seen_urls.add(abs_src)
                    candidates.append(CandidateImage(
                        url=abs_src,
                        source_type=ImageSourceType.DOM,
                        dom_index=idx,
                        container_selector=container_selector,
                        is_inside_reader=True,
                        raw_attributes=dict(img.attrs) if hasattr(img, "attrs") else {}
                    ))

        # 2. Inspect elements with data-src or background-image styles
        for idx, elem in enumerate(container_node.find_all(["div", "picture", "section", "a"])):
            data_src = (
                _to_str(elem.get("data-src")) or
                _to_str(elem.get("data-original")) or
                _to_str(elem.get("data-url")) or
                _to_str(elem.get("data-image"))
            )
            if data_src:
                abs_src = urljoin(base_url, data_src)
                if abs_src and abs_src not in seen_urls and not any(ext in abs_src for ext in ["1x1.gif", "spacer.gif"]):
                    seen_urls.add(abs_src)
                    candidates.append(CandidateImage(
                        url=abs_src,
                        source_type=ImageSourceType.DOM,
                        dom_index=len(candidates),
                        container_selector=container_selector,
                        is_inside_reader=True,
                        raw_attributes=dict(elem.attrs) if hasattr(elem, "attrs") else {}
                    ))

            style = _to_str(elem.get("style"))
            if "url(" in style:
                bg_m = re.search(r'url\s*\(\s*["\']?([^"\'\)]+)["\']?\s*\)', style, re.IGNORECASE)
                if bg_m:
                    bg_url = bg_m.group(1).strip()
                    if bg_url and not bg_url.startswith("data:"):
                        abs_bg = urljoin(base_url, bg_url)
                        if abs_bg not in seen_urls:
                            seen_urls.add(abs_bg)
                            candidates.append(CandidateImage(
                                url=abs_bg,
                                source_type=ImageSourceType.DOM,
                                dom_index=len(candidates),
                                container_selector=container_selector,
                                is_inside_reader=True
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
