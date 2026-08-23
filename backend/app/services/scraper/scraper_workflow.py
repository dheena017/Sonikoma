"""
backend/app/services/scraper/workflow.py
─────────────────────────────────────────────────────────────────────────────
Universal Multi-Platform Episode & Series Discovery Workflow Engine.
Modular Orchestrator:
  1. Checks SQLite Delta Cache for series discovery hits.
  2. Dispatches incoming Series URL to the dedicated Site Adapter (Webtoons, MangaDex,
     Madara CMS, MangaStream, Bato, WebComics, etc.) via AdapterRegistry.
  3. Seamlessly falls back to GenericAdaptiveAdapter for unknown / unmapped websites.
  4. Manages batch scraping with persistent SQLite checkpointing.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import json
import time
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple, Set
from urllib.parse import urljoin, urlparse, parse_qs, quote

from .url_utils import UrlNormalizer, SiteAnalyzer, UniversalUrlSeparator
from .adapters.site_adapter_registry import AdapterRegistry
from .adapters.generic_site_adapter import GenericAdaptiveAdapter
from .domain_rate_limiter import domain_block_manager

try:
    from database.engine import get_db_connection
except ImportError:
    get_db_connection = None

logger = logging.getLogger("sonikoma.services.scraper.workflow")


# ═════════════════════════════════════════════════════════════════════════════
# 1. SQLite Series Episode Discovery Cache
# ═════════════════════════════════════════════════════════════════════════════

def _ensure_episodes_table():
    """Initializes the series_episodes_cache SQLite table if not already present."""
    if not get_db_connection:
        return
    try:
        with get_db_connection() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS series_episodes_cache (
                series_url      TEXT PRIMARY KEY,
                title           TEXT,
                data_json       TEXT NOT NULL,
                total_episodes  INTEGER DEFAULT 0,
                updated_at      REAL NOT NULL,
                created_at      TEXT DEFAULT (datetime('now'))
            )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_series_ep_url ON series_episodes_cache(series_url)")
            conn.commit()
    except Exception as e:
        logger.debug(f"[SeriesEpisodeCache] DB Init notice: {e}")


def _get_cached_episodes(series_url: str, ttl_seconds: float = 600.0) -> Optional[Dict[str, Any]]:
    """Retrieves cached series discovery results within the TTL window."""
    if not get_db_connection:
        return None
    _ensure_episodes_table()
    try:
        clean_url = series_url.strip().lower()
        now = time.time()
        with get_db_connection() as conn:
            row = conn.execute(
                "SELECT data_json, updated_at FROM series_episodes_cache WHERE LOWER(series_url) = ?",
                (clean_url,)
            ).fetchone()
            if row and row["data_json"] and (now - row["updated_at"] < ttl_seconds):
                logger.info(f"[SeriesEpisodeCache] HIT for {series_url} (age: {now - row['updated_at']:.1f}s)")
                return json.loads(row["data_json"])
    except Exception as e:
        logger.debug(f"[SeriesEpisodeCache] Read notice: {e}")
    return None


def _save_cached_episodes(series_url: str, title: str, result_dict: Dict[str, Any]):
    """Persists newly crawled series episodes to SQLite cache."""
    if not get_db_connection or not result_dict or not result_dict.get("episodes"):
        return
    _ensure_episodes_table()
    try:
        clean_url = series_url.strip()
        data_json = json.dumps(result_dict)
        total = len(result_dict.get("episodes", []))
        now = time.time()
        with get_db_connection() as conn:
            conn.execute("""
            INSERT INTO series_episodes_cache (series_url, title, data_json, total_episodes, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(series_url) DO UPDATE SET
                title           = excluded.title,
                data_json       = excluded.data_json,
                total_episodes  = excluded.total_episodes,
                updated_at      = excluded.updated_at
            """, (clean_url, title, data_json, total, now))
            conn.commit()
    except Exception as e:
        logger.debug(f"[SeriesEpisodeCache] Write notice: {e}")


# ═════════════════════════════════════════════════════════════════════════════
# 2. Main Public API Workflow Functions (Dispatched to Modular Adapters)
# ═════════════════════════════════════════════════════════════════════════════

async def scrape_series_episodes(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    sort_by: str = "latest",
    bypass_cache: bool = False
) -> Dict[str, Any]:
    """
    Universal Multi-Platform Series & Episode Discovery Coordinator.
    Dispatches to dedicated site adapters (Webtoons, MangaDex, Madara, ThemeSphere, Bato, etc.)
    with automatic SQLite caching and generic fallback.
    """
    raw_input = (series_url or "").strip()
    if title_no and not raw_input.startswith("http"):
        raw_input = f"https://www.webtoons.com/en/episode/list?title_no={title_no}"

    if not raw_input:
        return {
            "success": False,
            "error": "No series URL or title_no provided",
            "series_title": "Unknown",
            "episodes": [],
            "total_episodes": 0
        }

    # 0. Check Domain Blocklist Immediately
    if domain_block_manager.is_blocked(raw_input):
        domain = urlparse(raw_input).netloc or raw_input
        logger.warning(f"[SeriesWorkflow] Rejecting blocked domain: {domain}")
        return {
            "success": False,
            "error": f"This domain ({domain}) is currently in the blocked exclusion list.",
            "series_title": "Blocked Domain",
            "url": raw_input,
            "episodes": [],
            "total_episodes": 0
        }

    try:
        # 0. Check SQLite Cache
        if not bypass_cache:
            cached = _get_cached_episodes(raw_input)
            if cached and cached.get("success") and len(cached.get("episodes", [])) > 0:
                return cached

        # 1. Analyze site domain & resolve matching adapter
        source_info = SiteAnalyzer.analyze(raw_input)
        adapter = AdapterRegistry.get_adapter(source_info)
        logger.info(f"[Workflow] Dispatching series discovery for {raw_input} to: {adapter.__class__.__name__}")

        # 2. Execute adapter-specific series discovery
        result = await adapter.discover_series(
            raw_input,
            sort_by=sort_by,
            max_episodes=max_episodes
        )

        # 3. If specialized adapter returned None or 0 episodes, escalate to GenericAdaptiveAdapter
        if not result or not result.get("success") or not result.get("episodes"):
            logger.info(f"[Workflow] Adapter {adapter.__class__.__name__} yielded 0 episodes. Falling back to GenericAdaptiveAdapter.")
            generic_adapter = GenericAdaptiveAdapter()
            result = await generic_adapter.discover_series(
                raw_input,
                sort_by=sort_by,
                max_episodes=max_episodes
            )

        if result and result.get("success"):
            series_dict = result.get("series", {}) or {}
            cover_img = series_dict.get("cover_image") or result.get("cover_image") or result.get("cover") or result.get("thumbnail") or ""
            series_dict["cover_image"] = cover_img
            result["series"] = series_dict
            result["title"] = result.get("series_title") or series_dict.get("title") or "Comic Series"
            result["series_title"] = result["title"]
            result["cover_image"] = cover_img
            result["cover"] = cover_img
            result["thumbnail"] = cover_img
            result["author"] = series_dict.get("author") or ""
            result["genre"] = series_dict.get("genre") or ""
            result["description"] = series_dict.get("description") or ""

            chapter_list = result.get("chapters") or result.get("episodes") or []
            for ep in chapter_list:
                ep_img = ep.get("cover_image") or ep.get("thumbnail") or ep.get("cover") or cover_img
                ep["cover_image"] = ep_img
                ep["thumbnail"] = ep_img
                ep["cover"] = ep_img
                ch_num = ep.get("chapter_number") or ep.get("episode_no") or ep.get("number")
                ep["chapter_number"] = ch_num
                ep["episode_no"] = ch_num

            result["chapters"] = chapter_list
            result["total_chapters"] = len(chapter_list)
            result["episodes"] = chapter_list
            result["total_episodes"] = len(chapter_list)

            _save_cached_episodes(raw_input, result.get("series_title", "Comic Series"), result)
            return result

        return result or {
            "success": False,
            "error": "Could not discover chapters for this series URL.",
            "series_title": "Unknown Series",
            "url": raw_input,
            "chapters": [],
            "total_chapters": 0,
            "episodes": [],
            "total_episodes": 0
        }

    except Exception as e:
        logger.error(f"[scrape_series_episodes] Error discovering chapters for {raw_input}: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "series_title": "Unknown Series",
            "title_no": title_no,
            "url": raw_input,
            "series": {
                "title": "Unknown Series",
                "author": "Unknown",
                "genre": "Comic",
                "cover_image": "",
                "description": "",
                "url": raw_input
            },
            "chapters": [],
            "total_chapters": 0,
            "episodes": [],
            "total_episodes": 0
        }


async def scrape_series_episodes_advanced(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    page: int = 1,
    per_page: int = 100,
    include_ratings: bool = True,
    sort_by: str = "latest",
    bypass_cache: bool = False
) -> Dict[str, Any]:
    """Universal advanced series & chapter scraper with pagination, natural sorting, and caching."""
    result = await scrape_series_episodes(
        series_url=series_url,
        title_no=title_no,
        max_episodes=None,
        sort_by=sort_by,
        bypass_cache=bypass_cache
    )

    if not result.get("success"):
        return result

    chapters = result.get("chapters") or result.get("episodes", [])
    if max_episodes:
        chapters = chapters[:max_episodes]

    total_chapters = len(chapters)
    if not per_page or per_page <= 0:
        per_page = total_chapters if total_chapters > 0 else 1

    total_pages = max(1, (total_chapters + per_page - 1) // per_page)
    page = max(1, min(page, total_pages))

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_chapters = chapters[start_idx:end_idx]

    result["chapters"] = paginated_chapters
    result["total_chapters"] = total_chapters
    result["episodes"] = paginated_chapters
    result["total_episodes"] = total_chapters
    result["pagination"] = {
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "total_chapters": total_chapters,
        "total_episodes": total_chapters,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }
    result["sort_by"] = sort_by
    return result


async def scrape_series_episodes_paginated(
    title_no: str,
    max_episodes: Optional[int] = None
) -> Dict[str, Any]:
    """Convenience pagination helper."""
    return await scrape_series_episodes_advanced(
        series_url="",
        title_no=title_no,
        page=1,
        per_page=max_episodes or 100
    )


# ═════════════════════════════════════════════════════════════════════════════
# 3. Batch Scraping & Checkpoint Resumption
# ═════════════════════════════════════════════════════════════════════════════

async def batch_scrape_series(
    series_list: List[Dict[str, Optional[str]]],
    max_episodes_per_series: int = 50
) -> Dict[str, Any]:
    """Batch crawler for discovering episodes across multiple series URLs."""
    results = []
    for s in series_list:
        url = s.get("url") or ""
        title_no = s.get("title_no")
        res = await scrape_series_episodes(series_url=url, title_no=title_no, max_episodes=max_episodes_per_series)
        results.append(res)
    return {"success": True, "series_results": results, "total_series": len(results)}


async def batch_scrape_chapters_with_checkpoint(
    job_id: str,
    chapter_urls: List[str],
    project_id: Optional[str] = None
) -> Dict[str, Any]:
    """Scrapes a batch of chapter URLs with persistent SQLite checkpointing."""
    from .scraper_engine import AdaptiveScraperEngine
    from .scraper_cache_manager import ScraperCacheManager

    completed = []
    failed = []

    for idx, chap_url in enumerate(chapter_urls):
        cached_result = ScraperCacheManager.get_cached_chapter_result(chap_url)
        if cached_result and cached_result.success:
            completed.append({
                "url": chap_url,
                "status": "cached",
                "images_count": len(cached_result.images),
                "chapter": cached_result.chapter.model_dump()
            })
            continue

        try:
            res = await AdaptiveScraperEngine.scrape_url(
                url=chap_url,
                project_id=project_id,
                job_id=job_id
            )
            if res.success:
                completed.append({
                    "url": chap_url,
                    "status": "success",
                    "images_count": len(res.images),
                    "chapter": res.chapter.model_dump()
                })
            else:
                failed.append({
                    "url": chap_url,
                    "error": res.error_message or "Unknown scrape failure"
                })
        except Exception as e:
            failed.append({"url": chap_url, "error": str(e)})

    return {
        "success": len(failed) == 0,
        "job_id": job_id,
        "total_requested": len(chapter_urls),
        "completed_count": len(completed),
        "failed_count": len(failed),
        "completed": completed,
        "failed": failed
    }
