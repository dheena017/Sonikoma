"""
backend/app/services/scraper/adapters/webtoons.py
─────────────────────────────────────────────────────────────────────────────
Specialized Adapter for Line Webtoon and Naver Webtoon.
Handles title_no, episode_no, #_imageList containers, and pagination.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import logging
from urllib.parse import urlparse, parse_qs, urlunparse, urlencode
from typing import Optional, Dict, Any, List

from .base import BaseSiteAdapter
from .generic import GenericAdaptiveAdapter
from ..context import ScrapeContext
from ..models import ChapterResult, SourceInfo, ImageSourceType
from ..acquisition import HttpFetcher
from ..extraction import DomExtractor

logger = logging.getLogger("sonikoma.services.scraper.adapters.webtoons")


class WebtoonsAdapter(BaseSiteAdapter):
    """Specialized adapter for Webtoons.com, Naver Webtoon, and top webcomic portals."""

    name: str = "Line Webtoon & Official Portals"
    icon: str = "🟢"
    description: str = "Official webtoon reader adapter covering Webtoons, Naver, Toomics, Tapas, Tappytoon, Lezhin, Copin, and Pocket Comics."
    supported_domains: list = [
        "webtoons.com", "webtoon.com", "naver.com", "toomics.com",
        "tapas.io", "tappytoon.com", "copincomics.com", "pocketcomics.com",
        "lezhin.com", "lezhinus.com", "bilibilicomics.com", "mangatoon.mobi", "webnovel.com"
    ]

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        domain = source_info.domain.lower()
        return any(d in domain for d in cls.supported_domains)

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes Webtoon-specific extraction with proper headers and episode parsing."""
        # Ensure referer is set to webtoons.com
        if not context.config.headers:
            context.config.headers = {}
        context.config.headers["Referer"] = "https://www.webtoons.com/"

        # Extract title_no, episode_no, slug, and genre from URL structure
        parsed = urlparse(context.normalized_url or context.url)
        q = parse_qs(parsed.query)

        # Path parsing: /en/{genre}/{series-slug}/{episode-slug}/viewer
        path_parts = [p for p in parsed.path.split("/") if p]
        if len(path_parts) >= 3:
            genre = path_parts[1]
            slug = path_parts[2]
            context.series_info.slug = slug
            if genre and genre.lower() not in ("en", "viewer", "list", "episode"):
                context.series_info.genres = [genre.capitalize()]

        title_no = q.get("title_no", [""])[0]
        if title_no and context.series_info.slug:
            context.series_info.url = f"https://www.webtoons.com/en/{path_parts[1] if len(path_parts) >= 2 else 'general'}/{context.series_info.slug}/list?title_no={title_no}"

        context.series_info.publisher = "WEBTOON"

        if "episode_no" in q:
            try:
                context.chapter_info.number = float(q["episode_no"][0])
                context.chapter_info.episode = f"Episode {q['episode_no'][0]}"
            except ValueError:
                pass

        # Run adaptive escalation with Webtoon context
        generic_engine = GenericAdaptiveAdapter()
        return await generic_engine.scrape(context)
