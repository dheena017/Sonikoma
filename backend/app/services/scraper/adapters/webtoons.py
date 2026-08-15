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
    """Specialized adapter for Webtoons.com and Naver Webtoon."""

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        domain = source_info.domain.lower()
        return "webtoons.com" in domain or "webtoon.com" in domain or "naver.com" in domain

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes Webtoon-specific extraction with proper headers and episode parsing."""
        # Ensure referer is set to webtoons.com
        if not context.config.headers:
            context.config.headers = {}
        context.config.headers["Referer"] = "https://www.webtoons.com/"

        # Extract title_no and episode_no from query params
        parsed = urlparse(context.normalized_url or context.url)
        q = parse_qs(parsed.query)

        if "episode_no" in q:
            try:
                context.chapter_info.number = float(q["episode_no"][0])
                context.chapter_info.episode = f"Episode {q['episode_no'][0]}"
            except ValueError:
                pass

        # Run adaptive escalation with Webtoon context
        generic_engine = GenericAdaptiveAdapter()
        return await generic_engine.scrape(context)
