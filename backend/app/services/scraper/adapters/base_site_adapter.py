"""
backend/app/services/scraper/adapters/base.py
─────────────────────────────────────────────────────────────────────────────
Abstract base class for Site Adapters.
Every site adapter is a self-contained module that provides:
  1. Series Metadata & High-Res Cover Extraction
  2. Episode Scraper / Series Discovery (all chapters, dates, thumbnails)
  3. Chapter Images Scraper (all panel image URLs, headers, DRM descrambling)
─────────────────────────────────────────────────────────────────────────────
"""

import re
import time
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Tuple
from urllib.parse import quote, urlparse, urljoin
from datetime import datetime, timedelta

from ..scrape_context import ScrapeContext
from ..scraper_models import ChapterResult, SourceInfo, SeriesInfo

logger = logging.getLogger("sonikoma.services.scraper.adapters.base")


class BaseSiteAdapter(ABC):
    """Base interface for specialized site adapters."""

    name: str = "Base Adapter"
    icon: str = "🌐"
    description: str = ""
    supported_domains: list = []

    @classmethod
    @abstractmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        """Determines if this adapter handles the given source website."""
        pass

    @abstractmethod
    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes the chapter panel image extraction workflow and populates context."""
        pass

    async def discover_series(
        self,
        series_url: str,
        sort_by: str = "latest",
        max_episodes: Optional[int] = None,
        preferred_language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        """
        Executes series discovery: extracts series metadata, cover image, and full chapter list.
        Subclasses should override this for site-specific discovery logic (e.g. MangaDex API,
        Webtoons multi-page crawling, Madara AJAX endpoints). Returns None if not implemented.
        """
        return None

    async def extract_series_metadata(
        self,
        series_url: str,
        html: Optional[str] = None
    ) -> Optional[SeriesInfo]:
        """Extracts standalone series metadata (title, author, cover image, synopsis, genres)."""
        return None

    def _finalize(self, context: ScrapeContext, start_time: float) -> ChapterResult:
        """
        Shared finalization step: validates candidate images, resolves order,
        logs diagnostics, and builds the final ChapterResult.
        """
        from ..content_validator import ImageValidator
        from ..image_order_resolver import OrderResolver
        from ..content_evaluator import ScraperDiagnosticsLogger

        total_ms = (time.time() - start_time) * 1000
        validated, rejections = ImageValidator.validate_candidates(
            context.candidate_images,
            filter_banners=context.config.filter_banners
        )
        context.rejections.extend(rejections)
        context.validated_images = OrderResolver.resolve_order(validated)

        ScraperDiagnosticsLogger.log_result(
            chapter_number=context.chapter_info.number,
            images_count=len(context.validated_images),
            new_images_count=0,
            completeness=context.completeness.value,
            execution_time_ms=total_ms,
        )
        return context.to_chapter_result()

    # ─────────────────────────────────────────────────────────────────────────
    # Shared Helper Utilities for Episode Discovery & Series Scraping
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def extract_image_src(img_node: Any, base_url: str = "") -> str:
        """Extracts and resolves absolute image URL from an img element or dict."""
        if not img_node:
            return ""
        if isinstance(img_node, str):
            src = img_node.strip()
        elif isinstance(img_node, dict):
            src = (
                img_node.get("data-src")
                or img_node.get("data-lazy-src")
                or img_node.get("data-original")
                or img_node.get("data-url")
                or img_node.get("data-cfsrc")
                or img_node.get("content")
                or img_node.get("src")
                or ""
            ).strip()
        else:
            # BeautifulSoup Tag
            src = (
                img_node.get("data-src")
                or img_node.get("data-lazy-src")
                or img_node.get("data-original")
                or img_node.get("data-url")
                or img_node.get("data-cfsrc")
                or img_node.get("content")
                or img_node.get("src")
                or ""
            ).strip()
        if not src or src.startswith("data:image/svg") or "1x1.gif" in src or "blank" in src:
            return ""
        # Filter out HTML manga/chapter page links mistakenly passed as image nodes
        # These are webpage URLs, not image URLs (e.g. toonily.com/serie/.../chapter-52/)
        _HTML_PATH_PATTERN = re.compile(
            r'/(?:serie|series|manga|comic|comics|webtoon|webtoons|read|book|chapter|ep|episode|ch)[-_/\w]*(?:/(?:chapter|ep|episode|ch)[-_/\d]*)?/?(?:[?#].*)?$',
            re.I
        )
        _IMG_EXT_PATTERN = re.compile(r'\.(?:jpe?g|png|webp|avif|gif|svg)(\?.*)?$', re.I)
        if re.search(r'^https?://', src) and _HTML_PATH_PATTERN.search(src) and not _IMG_EXT_PATTERN.search(src):
            return ""
        if base_url and not src.startswith("http"):
            src = urljoin(base_url if base_url.endswith("/") else (base_url + "/"), src)
        return src

    @staticmethod
    def build_proxy_thumbnail_url(
        thumbnail_url: Optional[str],
        referer_url: str,
        series_cover: Optional[str] = None
    ) -> str:
        """Builds a direct or clean image URL for thumbnails."""
        raw = thumbnail_url or series_cover or ""
        if not raw or raw.startswith("data:image/svg") or "1x1.gif" in raw or "blank" in raw:
            raw = series_cover or ""
        if not raw:
            return ""
        if referer_url and not raw.startswith("http") and not raw.startswith("/"):
            raw = urljoin(referer_url if referer_url.endswith("/") else (referer_url + "/"), raw)
        return raw

    @staticmethod
    def extract_number_and_type(text: str) -> Tuple[Optional[float], str]:
        """
        Extracts numeric float value and identifies chapter type without hardcoding.
        Handles standard chapters (105.5), prologues (0.0), side stories (1001.0), and extras (901.0).
        """
        if not text:
            return None, "Chapter"

        t_lower = text.strip().lower()

        if any(k in t_lower for k in ("prologue", "ch. 0", "chapter 0", "intro", "ch 0")):
            return 0.0, "Prologue"

        # 1. Check explicit Chapter/Episode/Ch prefix first
        m_ch = re.search(r'(?:chapter|episode|ep|ch|c|chap|no|#)\s*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
        if m_ch:
            try:
                num = float(m_ch.group(1))
                return num, f"Chapter {num if not num.is_integer() else int(num)}"
            except ValueError:
                pass

        # 2. Check standalone Side Story & Extra
        if "side story" in t_lower or "sidestory" in t_lower:
            sm = re.search(r'(\d+(?:\.\d+)?)', text)
            sub_num = float(sm.group(1)) if sm else 1.0
            return 1000.0 + sub_num, f"Side Story {int(sub_num) if sub_num.is_integer() else sub_num}"

        if "extra" in t_lower or "special" in t_lower or "spin-off" in t_lower:
            em = re.search(r'(\d+(?:\.\d+)?)', text)
            sub_num = float(em.group(1)) if em else 1.0
            return 900.0 + sub_num, f"Extra {int(sub_num) if sub_num.is_integer() else sub_num}"

        # 3. Generic trailing number
        m_gen = re.search(r'(\d+(?:\.\d+)?)', text)
        if m_gen:
            try:
                num = float(m_gen.group(1))
                return num, f"Chapter {num if not num.is_integer() else int(num)}"
            except ValueError:
                pass

        return None, text[:30]

    @staticmethod
    def normalize_date(date_raw: str) -> str:
        """Parses human relative dates or varied date formats into ISO 8601 YYYY-MM-DD."""
        if not date_raw:
            return ""

        text = date_raw.strip().lower()
        now = datetime.now()

        try:
            # Relative days / hours / minutes ago
            m_rel = re.search(r'(\d+)\s*(sec|second|min|minute|hour|hr|day|week|month|year)s?\s*ago', text)
            if m_rel:
                val = int(m_rel.group(1))
                unit = m_rel.group(2)
                if "sec" in unit or "min" in unit:
                    return now.strftime("%Y-%m-%d")
                if "hour" in unit or "hr" in unit:
                    return now.strftime("%Y-%m-%d")
                if "day" in unit:
                    return (now - timedelta(days=val)).strftime("%Y-%m-%d")
                if "week" in unit:
                    return (now - timedelta(weeks=val)).strftime("%Y-%m-%d")
                if "month" in unit:
                    return (now - timedelta(days=val * 30)).strftime("%Y-%m-%d")
                if "year" in unit:
                    return (now - timedelta(days=val * 365)).strftime("%Y-%m-%d")

            if "today" in text or "just now" in text:
                return now.strftime("%Y-%m-%d")
            if "yesterday" in text:
                return (now - timedelta(days=1)).strftime("%Y-%m-%d")

            # Word months like 'Jan 12, 2024' or '12 January 2024'
            months = {
                "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
                "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
            }
            for m_str, m_num in months.items():
                if m_str in text:
                    parts = re.findall(r'\d+', text)
                    if len(parts) >= 2:
                        y = int(parts[-1]) if len(parts[-1]) == 4 else (2000 + int(parts[-1]))
                        d = int(parts[0]) if len(parts[0]) <= 2 else int(parts[1])
                        return f"{y:04d}-{m_num:02d}-{d:02d}"

            # Standard YYYY-MM-DD
            iso_match = re.search(r'(\d{4})[./-](\d{1,2})[./-](\d{1,2})', text)
            if iso_match:
                y, m, d = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
                return f"{y:04d}-{m:02d}-{d:02d}"

            slash_match = re.search(r'(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})', text)
            if slash_match:
                p1, p2, p3 = int(slash_match.group(1)), int(slash_match.group(2)), int(slash_match.group(3))
                y = p3 if p3 > 99 else (2000 + p3)
                return f"{y:04d}-{p1:02d}-{p2:02d}"
        except Exception:
            pass

        return date_raw.strip()[:20]

    @classmethod
    def extract_date_from_node(cls, node) -> str:
        """Extracts and normalizes release date from HTML element or its children/attributes."""
        if not node:
            return ""
        # 1. Attribute inspection
        for attr in ("datetime", "data-date", "data-time", "data-release", "title", "data-timestamp"):
            val = node.get(attr)
            if val:
                norm = cls.normalize_date(str(val))
                if norm and len(norm) >= 4:
                    return norm

        # 2. Specific date selector lookup
        for sub in node.select(".chapter-release-date, .post-on, .chapter-date, .c-new-tag, time, .date, [class*='date'], [class*='release'], i, font, em"):
            for attr in ("datetime", "data-date", "title"):
                val = sub.get(attr)
                if val:
                    norm = cls.normalize_date(str(val))
                    if norm and len(norm) >= 4:
                        return norm
            txt = sub.get_text(strip=True)
            if txt:
                norm = cls.normalize_date(txt)
                if norm and len(norm) >= 4:
                    return norm

        # 3. Direct node text
        return cls.normalize_date(node.get_text(strip=True))

    @staticmethod
    def extract_language_tag(text: str) -> Optional[str]:
        """Detects bracketed language indicators like [EN], [RAW], [ID], [ES], [FR], [KR]."""
        if not text:
            return None
        m = re.search(r'\[(EN|ENG|ENGLISH|RAW|ID|IND|INDO|ES|ESP|FR|KOR|KR|JP|JAP|TH|VI|PT|BR)\]', text, re.IGNORECASE)
        if m:
            code = m.group(1).upper()
            if code in ("EN", "ENG", "ENGLISH"): return "en"
            if code in ("RAW", "KOR", "KR"): return "ko"
            if code in ("JP", "JAP"): return "ja"
            if code in ("ES", "ESP"): return "es"
            if code in ("ID", "IND", "INDO"): return "id"
            if code in ("FR",): return "fr"
            if code in ("PT", "BR"): return "pt"
            if code in ("TH",): return "th"
            if code in ("VI",): return "vi"
        return None

    @staticmethod
    def deduplicate_and_sort_episodes(
        episodes: List[Dict[str, Any]],
        sort_by: str = "latest",
        preferred_language: str = "en"
    ) -> List[Dict[str, Any]]:
        """Deduplicates multiple scanlation releases of the same chapter and naturally sorts by float."""
        if not episodes:
            return []

        has_preferred = any(ep.get("language") == preferred_language for ep in episodes if ep.get("language"))
        filtered = [ep for ep in episodes if not ep.get("language") or ep.get("language") == preferred_language] if has_preferred else episodes

        dedup_map: Dict[Any, Dict[str, Any]] = {}
        for ep in filtered:
            key = ep.get("chapter_number") if ep.get("chapter_number") is not None else ep.get("url")
            if key not in dedup_map:
                dedup_map[key] = ep
            else:
                existing = dedup_map[key]
                if not existing.get("cover_image") and ep.get("cover_image"):
                    existing["cover_image"] = ep["cover_image"]
                if not existing.get("date") and ep.get("date"):
                    existing["date"] = ep["date"]

        result = list(dedup_map.values())

        if sort_by == "oldest":
            result.sort(key=lambda x: (x.get("chapter_number") is None, x.get("chapter_number", 0.0)))
        elif sort_by == "latest":
            result.sort(key=lambda x: (x.get("chapter_number") is None, x.get("chapter_number", 0.0)), reverse=True)
        elif sort_by == "rating":
            result.sort(key=lambda x: float(x.get("likes_count", 0)), reverse=True)

        for idx, ep in enumerate(result):
            ep["episode_no"] = idx + 1

        return result

    @classmethod
    def get_meta(cls) -> dict:
        """Returns metadata dictionary for this adapter."""
        return {
            "adapter_id": cls.__name__,
            "name": cls.name,
            "icon": cls.icon,
            "badge": getattr(cls, "badge", "Adapter"),
            "speed": getattr(cls, "speed", "Fast" if "API" in cls.name or "REST" in cls.name else "Normal"),
            "description": cls.description,
            "supported_domains": list(cls.supported_domains),
            "supports_series_discovery": True,
            "supports_chapter_scraping": True
        }
