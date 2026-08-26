"""
backend/app/services/scraper/adapters/mangadex.py
─────────────────────────────────────────────────────────────────────────────
Dedicated High-Speed REST API Adapter for MangaDex (mangadex.org).
Provides:
  1. Full Series Discovery via MangaDex API v5 (manga feed, covers, authors)
  2. Series Metadata & High-Res Cover Art Extraction
  3. Chapter Images Extraction via official MangaDex @Home Network (0ms browser overhead)
─────────────────────────────────────────────────────────────────────────────
"""

import re
import time
import httpx
import logging
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse

from .base_site_adapter import BaseSiteAdapter
from ..scrape_context import ScrapeContext
from ..scraper_models import (
    ChapterResult,
    SourceInfo,
    EscalationStatus,
    ScrapeCompleteness,
    ScrapeError,
    ScrapeErrorCode,
    CandidateImage,
    ImageSourceType,
)
from ..content_validator import ImageValidator
from ..image_order_resolver import OrderResolver
from ..content_evaluator import ScraperDiagnosticsLogger
from ..scraper_constants import MANGADEX_DOMAINS

logger = logging.getLogger("sonikoma.services.scraper.adapters.mangadex")

_MANGADEX_UUID_RE = re.compile(
    r"/(?:title|manga|chapter)/(?P<id>[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})",
    re.IGNORECASE,
)


class MangaDexAdapter(BaseSiteAdapter):
    """Specialized high-speed REST API adapter for MangaDex."""

    name: str = "MangaDex"
    icon: str = "🟠"
    description: str = "Official MangaDex at-home REST API adapter. 0ms browser overhead with lossless panels."
    supported_domains: list = list(MANGADEX_DOMAINS)

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        domain = source_info.domain.lower()
        return any(d in domain for d in cls.supported_domains)

    async def discover_series(
        self,
        series_url: str,
        sort_by: str = "latest",
        max_episodes: Optional[int] = None,
        preferred_language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        """Crawls complete series catalog and episode feed using MangaDex REST API v5."""
        raw_url = (series_url or "").strip()
        m = _MANGADEX_UUID_RE.search(raw_url)
        if not m:
            return None

        target_id = m.group("id")

        async with httpx.AsyncClient(timeout=20.0) as client:
            manga_id = target_id
            # If user pasted a chapter URL, find parent manga UUID first
            if "/chapter/" in raw_url:
                try:
                    ch_resp = await client.get(f"https://api.mangadex.org/chapter/{target_id}")
                    if ch_resp.status_code == 200:
                        relationships = ch_resp.json().get("data", {}).get("relationships", [])
                        for rel in relationships:
                            if rel.get("type") == "manga":
                                manga_id = rel.get("id")
                                break
                except Exception as e:
                    pass

            # 1. Fetch Manga Details (Title, Cover Art, Authors, Synopsis)
            try:
                m_resp = await client.get(
                    f"https://api.mangadex.org/manga/{manga_id}",
                    params={"includes[]": ["cover_art", "author", "artist"]}
                )
                if m_resp.status_code != 200:
                    return None

                m_data = m_resp.json().get("data", {})
                m_attrs = m_data.get("attributes", {})
                titles = m_attrs.get("title", {})
                title_str = titles.get("en") or next(iter(titles.values()), "Manga")

                synopsis_dict = m_attrs.get("description", {})
                synopsis = synopsis_dict.get("en") or next(iter(synopsis_dict.values()), "")

                author = ""
                artist = ""
                cover_file = None
                for rel in m_data.get("relationships", []):
                    r_type = rel.get("type")
                    r_attrs = rel.get("attributes", {})
                    if r_type == "author" and "name" in r_attrs:
                        author = r_attrs["name"]
                    elif r_type == "artist" and "name" in r_attrs:
                        artist = r_attrs["name"]
                    elif r_type == "cover_art" and "fileName" in r_attrs:
                        cover_file = r_attrs["fileName"]

                cover_url = f"https://uploads.mangadex.org/covers/{manga_id}/{cover_file}" if cover_file else ""

                # 2. Fetch Chapter Feed
                feed_params = {
                    "translatedLanguage[]": [preferred_language],
                    "order[chapter]": "asc",
                    "limit": 500
                }
                feed_resp = await client.get(f"https://api.mangadex.org/manga/{manga_id}/feed", params=feed_params)
                episodes = []

                if feed_resp.status_code == 200:
                    for idx, ch in enumerate(feed_resp.json().get("data", [])):
                        c_attrs = ch.get("attributes", {})
                        c_num = c_attrs.get("chapter") or str(idx + 1)
                        num_val = float(c_num) if c_num.replace(".", "").isdigit() else (idx + 1)
                        ch_url = f"https://mangadex.org/chapter/{ch['id']}"

                        ep_cover = cover_url  # MangaDex API provides absolute CDN cover_url
                        episodes.append({
                            "episode_no": idx + 1,
                            "number": str(c_num),
                            "chapter_number": num_val,
                            "title": c_attrs.get("title") or f"Chapter {c_num}",
                            "url": ch_url,
                            "cover_image": ep_cover or cover_url,
                            "date": (c_attrs.get("publishAt") or "").split("T")[0],
                            "language": preferred_language
                        })

                sorted_eps = self.deduplicate_and_sort_episodes(episodes, sort_by=sort_by, preferred_language=preferred_language)

                return {
                    "success": True,
                    "title": title_str,
                    "series_title": title_str,
                    "title_no": manga_id,
                    "url": f"https://mangadex.org/title/{manga_id}",
                    "author": author or artist or "",
                    "description": synopsis or "",
                    "cover_image": cover_url,
                    "series": {
                        "title": title_str,
                        "author": author or artist or "",
                        "description": synopsis or "",
                        "synopsis": synopsis or "",
                        "cover_image": cover_url,
                        "url": f"https://mangadex.org/title/{manga_id}"
                    },
                    "chapters": sorted_eps,
                    "total_chapters": len(sorted_eps)
                }

            except Exception as e:
                logger.error(f"[MangaDexAdapter] Series discovery failure: {e}", exc_info=True)
                return None

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes high-speed chapter image extraction via MangaDex at-home API."""
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        parsed = urlparse(url)
        match = _MANGADEX_UUID_RE.search(parsed.path)
        if not match:
            context.completeness = ScrapeCompleteness.FAILED
            context.error = ScrapeError(
                code=ScrapeErrorCode.INVALID_URL,
                message="MangaDex URL must be a direct chapter link: https://mangadex.org/chapter/{uuid}",
            )
            return self._finalize(context, start_time)

        chapter_id = match.group("id")
        logger.info(f"[MangaDexAdapter] Fetching chapter metadata and image list for UUID: {chapter_id}")

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                ch_resp = await client.get(
                    f"https://api.mangadex.org/chapter/{chapter_id}",
                    params={"includes[]": ["manga", "scanlation_group"]}
                )
                if ch_resp.status_code == 200:
                    ch_data = ch_resp.json().get("data", {})
                    attrs = ch_data.get("attributes", {})
                    
                    ch_num = attrs.get("chapter")
                    if ch_num:
                        try:
                            context.chapter_info.number = float(ch_num)
                            context.chapter_info.episode = f"Chapter {ch_num}"
                        except ValueError:
                            pass
                    context.chapter_info.title = attrs.get("title") or f"Chapter {ch_num or ''}".strip()
                    context.chapter_info.published_at = attrs.get("publishAt")

                    for rel in ch_data.get("relationships", []):
                        if rel.get("type") == "manga":
                            manga_attrs = rel.get("attributes", {})
                            titles = manga_attrs.get("title", {})
                            series_title = titles.get("en") or next(iter(titles.values()), None) if titles else None
                            if series_title:
                                context.series_info.title = series_title
            except Exception as e:
                logger.warning(f"[MangaDexAdapter] Chapter metadata request non-fatal error: {e}")

            # 2. Call @home server to get CDN host and filenames
            try:
                athome_resp = await client.get(f"https://api.mangadex.org/at-home/server/{chapter_id}")
                if athome_resp.status_code != 200:
                    context.completeness = ScrapeCompleteness.FAILED
                    context.error = ScrapeError(
                        code=ScrapeErrorCode.CONTENT_NOT_ACCESSIBLE,
                        message=f"MangaDex @home server returned HTTP {athome_resp.status_code}",
                    )
                    return self._finalize(context, start_time)

                athome_data = athome_resp.json()
                base_url = athome_data.get("baseUrl")
                chapter_hash = athome_data.get("chapter", {}).get("hash")
                data_files: List[str] = athome_data.get("chapter", {}).get("data", [])

                if not base_url or not chapter_hash or not data_files:
                    context.completeness = ScrapeCompleteness.FAILED
                    context.error = ScrapeError(
                        code=ScrapeErrorCode.INTERNAL_ERROR,
                        message="MangaDex @home response was missing baseUrl, hash, or data files.",
                    )
                    return self._finalize(context, start_time)

                candidates: List[CandidateImage] = []
                for idx, filename in enumerate(data_files):
                    img_url = f"{base_url}/data/{chapter_hash}/{filename}"
                    candidates.append(
                        CandidateImage(
                            url=img_url,
                            source_type=ImageSourceType.API,
                            container_selector="api.mangadex.org/at-home",
                            index_hint=idx,
                            confidence=1.0,
                        )
                    )

                context.candidate_images = candidates
                context.escalation_status = EscalationStatus.SUCCESS
                context.completeness = (
                    ScrapeCompleteness.COMPLETE if candidates else ScrapeCompleteness.FAILED
                )

                logger.info(
                    f"[MangaDexAdapter] Successfully resolved {len(candidates)} high-res CDN panel URLs."
                )

            except Exception as e:
                logger.error(f"[MangaDexAdapter] Error querying MangaDex at-home API: {e}", exc_info=True)
                context.completeness = ScrapeCompleteness.FAILED
                context.error = ScrapeError(
                    code=ScrapeErrorCode.INTERNAL_ERROR,
                    message=f"MangaDex adapter error: {str(e)}",
                )

        return self._finalize(context, start_time)
