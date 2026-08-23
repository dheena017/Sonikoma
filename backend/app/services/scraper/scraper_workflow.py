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

def _ensure_chapters_table():
    """Initializes the series_chapters_cache SQLite table if not already present."""
    if not get_db_connection:
        return
    try:
        with get_db_connection() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS series_chapters_cache (
                series_url      TEXT PRIMARY KEY,
                title           TEXT,
                data_json       TEXT NOT NULL,
                total_chapters  INTEGER DEFAULT 0,
                updated_at      REAL NOT NULL,
                created_at      TEXT DEFAULT (datetime('now'))
            )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_series_ch_url ON series_chapters_cache(series_url)")
            conn.commit()
    except Exception as e:
        logger.debug(f"[SeriesChapterCache] DB Init notice: {e}")


def _ensure_episodes_table():
    _ensure_chapters_table()


def _get_cached_chapters(series_url: str, ttl_seconds: float = 3600.0) -> Optional[Dict[str, Any]]:
    """Retrieves cached series chapter discovery results within the TTL window."""
    if not get_db_connection:
        return None
    _ensure_chapters_table()
    try:
        clean_url = series_url.strip().lower()
        now = time.time()
        with get_db_connection() as conn:
            # 1. Exact URL match
            row = conn.execute(
                "SELECT data_json, updated_at FROM series_chapters_cache WHERE LOWER(series_url) = ?",
                (clean_url,)
            ).fetchone()
            if row and row["data_json"] and (now - row["updated_at"] < ttl_seconds):
                data = json.loads(row["data_json"])
                data["from_cache"] = True
                return data

            # 2. Fuzzy slug / title match for URL routing
            if not clean_url.startswith("http"):
                clean_slug_pattern = f"%{clean_url}%"
                clean_title_pattern = f"%{clean_url.replace('-', ' ')}%"
                fuzzy_row = conn.execute(
                    """
                    SELECT data_json, updated_at FROM series_chapters_cache 
                    WHERE LOWER(series_url) LIKE ? OR LOWER(title) LIKE ?
                    ORDER BY updated_at DESC LIMIT 1
                    """,
                    (clean_slug_pattern, clean_title_pattern)
                ).fetchone()
                if fuzzy_row and fuzzy_row["data_json"]:
                    data = json.loads(fuzzy_row["data_json"])
                    data["from_cache"] = True
                    return data

            # Fallback to legacy episodes cache if present
            try:
                legacy_row = conn.execute(
                    "SELECT data_json, updated_at FROM series_episodes_cache WHERE LOWER(series_url) = ?",
                    (clean_url,)
                ).fetchone()
                if legacy_row and legacy_row["data_json"] and (now - legacy_row["updated_at"] < ttl_seconds):
                    data = json.loads(legacy_row["data_json"])
                    data["from_cache"] = True
                    return data
            except Exception:
                pass
    except Exception as e:
        logger.debug(f"[SeriesChapterCache] Read notice: {e}")
    return None


def _get_cached_episodes(series_url: str, ttl_seconds: float = 600.0) -> Optional[Dict[str, Any]]:
    return _get_cached_chapters(series_url, ttl_seconds)


def _save_cached_chapters(series_url: str, title: str, result_dict: Dict[str, Any]):
    """Persists newly crawled series chapters to SQLite cache."""
    chapters = result_dict.get("chapters") or result_dict.get("episodes")
    if not get_db_connection or not result_dict or not chapters:
        return
    _ensure_chapters_table()
    try:
        clean_url = series_url.strip()
        data_json = json.dumps(result_dict)
        total = len(chapters)
        now = time.time()
        with get_db_connection() as conn:
            conn.execute("""
            INSERT INTO series_chapters_cache (series_url, title, data_json, total_chapters, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(series_url) DO UPDATE SET
                title           = excluded.title,
                data_json       = excluded.data_json,
                total_chapters  = excluded.total_chapters,
                updated_at      = excluded.updated_at
            """, (clean_url, title, data_json, total, now))
            conn.commit()
    except Exception as e:
        logger.debug(f"[SeriesChapterCache] Write notice: {e}")


def _save_cached_episodes(series_url: str, title: str, result_dict: Dict[str, Any]):
    _save_cached_chapters(series_url, title, result_dict)


# ═════════════════════════════════════════════════════════════════════════════
# 2. Main Public API Workflow Functions (Dispatched to Modular Adapters)
# ═════════════════════════════════════════════════════════════════════════════

async def scrape_series_chapters(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    max_chapters: Optional[int] = None,
    sort_by: str = "latest",
    bypass_cache: bool = False
) -> Dict[str, Any]:
    """
    Universal Multi-Platform Series & Chapter Discovery Coordinator.
    Dispatches to dedicated site adapters (Webtoons, MangaDex, Madara, ThemeSphere, Bato, etc.)
    with automatic SQLite caching and generic fallback.
    """
    limit = max_chapters or max_episodes
    raw_input = (series_url or "").strip()
    if title_no and not raw_input.startswith("http"):
        raw_input = f"https://www.webtoons.com/en/episode/list?title_no={title_no}"

    if not raw_input:
        return {
            "success": False,
            "error": "No series URL or title_no provided",
            "series_title": "Unknown",
            "chapters": [],
            "total_chapters": 0
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
            "chapters": [],
            "total_chapters": 0
        }

    try:
        # 0. Check SQLite Cache
        if not bypass_cache:
            cached = _get_cached_episodes(raw_input)
            cached_chapters = cached.get("chapters") or cached.get("episodes", []) if cached else []
            if cached and cached.get("success") and len(cached_chapters) > 0:
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

        # 3. If specialized adapter returned None or 0 chapters, escalate to GenericAdaptiveAdapter
        curr_chapters = (result.get("chapters") or result.get("episodes")) if result else None
        if not result or not result.get("success") or not curr_chapters:
            logger.info(f"[Workflow] Adapter {adapter.__class__.__name__} yielded 0 chapters. Falling back to GenericAdaptiveAdapter.")
            generic_adapter = GenericAdaptiveAdapter()
            result = await generic_adapter.discover_series(
                raw_input,
                sort_by=sort_by,
                max_episodes=max_episodes
            )

        if result and result.get("success"):
            series_dict = result.get("series", {}) or {}
            cover_img = series_dict.get("cover_image") or result.get("cover_image") or ""
            series_title = series_dict.get("title") or result.get("title") or result.get("series_title") or "Comic Series"
            author_val = series_dict.get("author") or result.get("author") or ""
            genre_val = series_dict.get("genre") or (", ".join(series_dict.get("genres", [])) if series_dict.get("genres") else "") or result.get("genre") or ""
            desc_val = series_dict.get("description") or series_dict.get("synopsis") or result.get("description") or result.get("synopsis") or ""
            platform_val = series_dict.get("platform") or result.get("platform") or result.get("publisher") or (source_info.platform.value if hasattr(source_info, "platform") and hasattr(source_info.platform, "value") else "comic")

            if cover_img and not cover_img.startswith("http") and raw_input.startswith("http"):
                clean_base = raw_input if raw_input.endswith("/") else (raw_input + "/")
                cover_img = urljoin(clean_base, cover_img)

            series_dict["title"] = series_title
            series_dict["cover_image"] = cover_img
            series_dict["author"] = author_val
            series_dict["genre"] = genre_val
            series_dict["description"] = desc_val
            series_dict["platform"] = platform_val
            series_dict["url"] = raw_input

            result["title"] = series_title
            result["series_title"] = series_title
            result["cover_image"] = cover_img
            result["author"] = author_val
            result["genre"] = genre_val
            result["description"] = desc_val
            result["platform"] = platform_val
            result["url"] = raw_input
            result["series"] = series_dict

            chapter_list = result.get("chapters") or result.get("episodes") or []

            # Pre-compile patterns once for efficiency
            _IMG_EXT_RE = re.compile(r'\.(jpe?g|png|webp|avif|gif|svg)(\?.*)?$', re.I)
            _HTML_PAGE_RE = re.compile(
                r'/(?:serie|series|manga|comic|comics|webtoon|webtoons|read|book|chapter|ep|episode|ch)[\-_/\w]*/[\-_/\w]*/?(?:[?#].*)?$',
                re.I
            )

            def _is_valid_image_url(url: str) -> bool:
                """Return True if url looks like an actual image, not an HTML page."""
                if not url or not url.startswith("http"):
                    return False
                if _HTML_PAGE_RE.search(url) and not _IMG_EXT_RE.search(url):
                    return False
                return True

            for ch in chapter_list:
                ch_img = ch.get("cover_image") or ch.get("thumbnail") or ch.get("cover")
                # Reject any HTML page URL accidentally stored as a cover image
                if ch_img and not _is_valid_image_url(ch_img):
                    ch_img = None
                # Fallback to 1st panel image if panels/images exist
                if not ch_img and ch.get("images") and len(ch["images"]) > 0:
                    first_item = ch["images"][0]
                    ch_img = first_item.get("url") if isinstance(first_item, dict) else str(first_item)
                if not ch_img:
                    ch_img = cover_img if _is_valid_image_url(cover_img) else ""

                if ch_img and not ch_img.startswith("http") and raw_input.startswith("http"):
                    clean_base = raw_input if raw_input.endswith("/") else (raw_input + "/")
                    ch_img = urljoin(clean_base, ch_img)
                ch["cover_image"] = ch_img
                ch_num = ch.get("chapter_number") or ch.get("episode_no") or ch.get("number")
                ch["chapter_number"] = ch_num
                ch["number"] = str(int(ch_num) if isinstance(ch_num, float) and ch_num.is_integer() else (ch_num if ch_num is not None else ""))
                ch.pop("thumbnail", None)
                ch.pop("cover", None)

            result["chapters"] = chapter_list
            result["total_chapters"] = len(chapter_list)
            result.pop("episodes", None)
            result.pop("total_episodes", None)

            _save_cached_chapters(raw_input, series_title, result)
            return result

        return result or {
            "success": False,
            "error": "Could not discover chapters for this series URL.",
            "title": "Unknown Series",
            "series_title": "Unknown Series",
            "url": raw_input,
            "platform": (source_info.platform.value if 'source_info' in locals() and hasattr(source_info, "platform") and hasattr(source_info.platform, "value") else "comic"),
            "genre": "",
            "author": "",
            "description": "",
            "cover_image": "",
            "chapters": [],
            "total_chapters": 0
        }

    except Exception as e:
        logger.error(f"[scrape_series_episodes] Error discovering chapters for {raw_input}: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "title": "Unknown Series",
            "series_title": "Unknown Series",
            "url": raw_input,
            "platform": "comic",
            "genre": "",
            "author": "",
            "description": "",
            "cover_image": "",
            "series": {
                "title": "Unknown Series",
                "author": "",
                "genre": "",
                "description": "",
                "cover_image": "",
                "platform": "comic",
                "url": raw_input
            },
            "chapters": [],
            "total_chapters": 0
        }


async def scrape_series_chapters_advanced(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    max_chapters: Optional[int] = None,
    page: int = 1,
    per_page: int = 100,
    include_ratings: bool = True,
    sort_by: str = "latest",
    bypass_cache: bool = False
) -> Dict[str, Any]:
    """Universal advanced series & chapter scraper with pagination, natural sorting, and caching."""
    limit = max_chapters or max_episodes
    result = await scrape_series_chapters(
        series_url=series_url,
        title_no=title_no,
        max_chapters=None,
        sort_by=sort_by,
        bypass_cache=bypass_cache
    )

    if not result.get("success"):
        return result

    chapters = result.get("chapters") or result.get("episodes", [])
    if limit:
        chapters = chapters[:limit]

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
    result.pop("episodes", None)
    result.pop("total_episodes", None)
    result["pagination"] = {
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "total_chapters": total_chapters,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }
    result["sort_by"] = sort_by
    return result


async def scrape_series_chapters_paginated(
    title_no: str,
    max_episodes: Optional[int] = None,
    max_chapters: Optional[int] = None
) -> Dict[str, Any]:
    """Convenience pagination helper."""
    return await scrape_series_chapters_advanced(
        series_url="",
        title_no=title_no,
        page=1,
        per_page=max_chapters or max_episodes or 100
    )


# Backward compatibility aliases
scrape_series_episodes = scrape_series_chapters
scrape_series_episodes_advanced = scrape_series_chapters_advanced
scrape_series_episodes_paginated = scrape_series_chapters_paginated


# ═════════════════════════════════════════════════════════════════════════════
# 3. Batch Scraping & Checkpoint Resumption
# ═════════════════════════════════════════════════════════════════════════════

async def batch_scrape_series(
    series_list: List[Dict[str, Optional[str]]],
    max_chapters_per_series: int = 50,
    max_episodes_per_series: Optional[int] = None
) -> Dict[str, Any]:
    """Batch crawler for discovering chapters across multiple series URLs."""
    limit = max_episodes_per_series or max_chapters_per_series
    results = []
    for s in series_list:
        url = s.get("url") or ""
        title_no = s.get("title_no")
        res = await scrape_series_chapters(series_url=url, title_no=title_no, max_chapters=limit)
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
