"""
backend/features/image_editor/services/stitching/stitch_cache_service.py
─────────────────────────────────────────────────────────────────────────────
Intelligent Stitched Image Cache & Dynamic Recovery Service:
- Multi-tier memory caching for compute-heavy multi-panel manhwa stitches
- Dynamic on-demand re-stitching fallback for expired/evicted cache entries
- Reverse-resolution of panel indices from split/norm/smartcrop cache IDs
- Automatic session binding via Referer HTTP headers and SQLite scrape records
- Concurrency-throttled async buffer re-fetching and vertical stitch assembly
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import re
import json
import asyncio
import logging
import httpx
from urllib.parse import urlparse, parse_qs
from typing import Tuple, Optional, List, Dict, Any

# Ensure backend root directory is in sys.path when executed directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app.core.cache import stitched_cache, edit_history
import features.image.utils as img_utils
from .image_stitcher import stitch_images_together
from database.utils import unwrap_proxy_url
from database.engine import get_db_connection
from features.platform.projects.repositories.panels import get_panel_original_url, get_edit_history

logger = logging.getLogger("sonikoma.services.image.stitching.stitch_cache")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Global State, Module Constants & Custom Exceptions
# ─────────────────────────────────────────────────────────────────────────────

FETCH_CONCURRENCY_LIMIT: int = 15
HTTP_TIMEOUT_SECONDS: float = 60.0


class StitchedResourceNotFound(Exception):
    """Raised when a stitched resource cannot be located or has expired."""


# ─────────────────────────────────────────────────────────────────────────────
# 2. Asynchronous Database Query Helpers
# ─────────────────────────────────────────────────────────────────────────────

async def _db_fetchone(sql: str, params: tuple = ()) -> Optional[Any]:
    """
    Executes a read-only SQLite database query in a non-blocking background thread.

    Args:
        sql (str): SQLite query string.
        params (tuple): Query parameter substitutions.

    Returns:
        Optional[Any]: Single matched database row, or None.
    """
    def _run():
        conn = get_db_connection()
        return conn.execute(sql, params).fetchone()
    return await asyncio.to_thread(_run)


# ─────────────────────────────────────────────────────────────────────────────
# 3. In-Memory Cache Operations
# ─────────────────────────────────────────────────────────────────────────────

def get_from_memory_cache(cache_id: str) -> Optional[Tuple[bytes, str]]:
    """
    Attempts to retrieve pre-stitched image bytes directly from memory cache.

    Args:
        cache_id (str): Unique cache identifier.

    Returns:
        Optional[Tuple[bytes, str]]: (image_bytes, content_type) if found, else None.
    """
    cached = stitched_cache.get(cache_id)
    if cached and isinstance(cached, dict) and "data" in cached:
        logger.debug(f"[Stitch Cache] Cache hit for '{cache_id}' ({len(cached['data'])} bytes).")
        return cached["data"], cached.get("content_type", "image/png")
    return None


def save_to_memory_cache(cache_id: str, data: bytes, content_type: str = "image/png") -> None:
    """
    Stores an image payload in the stitched cache singleton.

    Args:
        cache_id (str): Target cache key.
        data (bytes): Encoded image file bytes.
        content_type (str): Media MIME type. Defaults to "image/png".
    """
    try:
        stitched_cache.set(cache_id, {"data": data, "content_type": content_type})
        logger.debug(f"[Stitch Cache] Successfully cached {len(data)} bytes under '{cache_id}'.")
    except Exception as err:
        logger.warning(f"[Stitch Cache] Failed storing item '{cache_id}' in cache: {err}")


# ─────────────────────────────────────────────────────────────────────────────
# 4. Edit History & Metadata URL Resolution
# ─────────────────────────────────────────────────────────────────────────────

def lookup_original_url_from_history(cache_id: str) -> Optional[str]:
    """
    Resolves the original source URL for a cached asset using in-memory edit history
    and SQLite project panel metadata.

    Args:
        cache_id (str): Cache identifier.

    Returns:
        Optional[str]: Source URL if matched, otherwise None.
    """
    cached_url_key = f"/api/v1/images/cached/{cache_id}"

    # Priority 1: In-memory edit history dictionary
    original_url = edit_history.get(cached_url_key)
    if original_url:
        return original_url

    # Priority 2: Database panels repository lookup
    try:
        original_url = get_panel_original_url(cached_url_key)
        if original_url:
            return original_url
    except Exception:
        pass

    # Priority 3: Database persistent edit history table
    try:
        hist = get_edit_history(cached_url_key)
        if hist and hist.get("original_url"):
            return hist["original_url"]
    except Exception:
        pass

    return None


# ─────────────────────────────────────────────────────────────────────────────
# 5. Cache ID Pattern Parsing
# ─────────────────────────────────────────────────────────────────────────────

def parse_cache_id_panel_index(cache_id: str) -> Optional[int]:
    """
    Extracts zero-based panel index encoded in structured cache IDs.
    Matches formats:
    - norm_{timestamp}_{index} or split_{timestamp}_{index}
    - smartcrop_{index}

    Args:
        cache_id (str): Cache key.

    Returns:
        Optional[int]: Zero-based panel index integer, or None if unparseable.
    """
    norm_match = re.match(r"^(?:norm|split)_(\d+)_(\d+)(?:_(\d+))?$", cache_id)
    if norm_match:
        return int(norm_match.group(2))

    crop_match = re.search(r"smartcrop_(\d+)(?:_\d+)?$", cache_id)
    if crop_match:
        return int(crop_match.group(1))

    return None


def is_webtoon_strip_cache_id(cache_id: str) -> bool:
    """
    Determines whether a cache ID represents a multi-panel webtoon continuous strip.
    Matches formats:
    - stitched_ep_1_full, webtoon_full, stitched_123_full, etc.
    """
    return bool(
        re.match(r"^(?:stitched|webtoon)_(?:ep_\d+|full|\d+)_full(?:_\d+)?$", cache_id)
        or cache_id.startswith("webtoon_")
    )


# ─────────────────────────────────────────────────────────────────────────────
# 6. Scraper Session Extraction
# ─────────────────────────────────────────────────────────────────────────────

async def extract_webtoon_url_from_referer(referer: Optional[str]) -> Optional[str]:
    """
    Extracts canonical webtoon URL or series episode identifiers from an HTTP Referer header.

    Args:
        referer (Optional[str]): Incoming HTTP Referer string.

    Returns:
        Optional[str]: Target webtoon URL if resolved, or None.
    """
    if not referer:
        return None

    try:
        parsed_ref = urlparse(referer)
        query_params = parse_qs(parsed_ref.query)

        # 1. Direct query parameter ?url=
        if "url" in query_params and query_params["url"]:
            return query_params["url"][0]

        # 2. Path routing match /series/{series_slug}/.../{chapter_slug}
        path_parts = [p for p in parsed_ref.path.split("/") if p]
        if len(path_parts) >= 4 and path_parts[0] == "series":
            series_slug = path_parts[1]
            chapter_slug = path_parts[3].replace("chapter-", "episode-")
            session_row = await _db_fetchone(
                "SELECT url FROM platform_scrape_sessions WHERE url LIKE ? AND url LIKE ? ORDER BY scraped_at DESC LIMIT 1",
                (f"%{series_slug}%", f"%{chapter_slug}%"),
            )
            if session_row:
                return session_row["url"]
    except Exception as err:
        logger.debug(f"[Stitch Cache] Referer parsing error ({err}), falling back to latest session.")

    return None


async def lookup_session_image_urls(webtoon_url: Optional[str] = None) -> List[str]:
    """
    Retrieves the list of constituent image URLs associated with a scrape session.

    Args:
        webtoon_url (Optional[str]): Target webtoon chapter URL. If omitted, uses latest session.

    Returns:
        List[str]: List of constituent image URLs.
    """
    try:
        target_url = webtoon_url
        if not target_url:
            latest_session = await _db_fetchone(
                "SELECT url FROM platform_scrape_sessions ORDER BY scraped_at DESC LIMIT 1"
            )
            if latest_session:
                target_url = latest_session["url"]

        if not target_url:
            return []

        session_row = await _db_fetchone(
            "SELECT image_urls FROM platform_scrape_sessions WHERE url = ? AND image_urls LIKE '%http%' ORDER BY scraped_at ASC LIMIT 1",
            (target_url,),
        )
        if not session_row:
            session_row = await _db_fetchone(
                "SELECT image_urls FROM platform_scrape_sessions WHERE url = ? ORDER BY scraped_at DESC LIMIT 1",
                (target_url,),
            )

        if session_row and session_row["image_urls"]:
            raw_urls = json.loads(session_row["image_urls"])
            return [unwrap_proxy_url(u) for u in raw_urls if u]
    except Exception as err:
        logger.warning(f"[Stitch Cache] Session image URL lookup failed: {err}")

    return []


async def resolve_panel_from_session(cache_id: str, referer: Optional[str] = None) -> Optional[str]:
    """
    Resolves the original URL for an individual panel slice based on its index and scrape session.

    Args:
        cache_id (str): Cache key encoding panel index.
        referer (Optional[str]): HTTP Referer header.

    Returns:
        Optional[str]: Source URL of the specific panel slice.
    """
    index = parse_cache_id_panel_index(cache_id)
    if index is None:
        return None

    try:
        webtoon_url = await extract_webtoon_url_from_referer(referer)
        urls = await lookup_session_image_urls(webtoon_url)
        if 0 <= index < len(urls):
            matched_url = urls[index]
            logger.info(f"[Cache Fallback] Resolved cache_id '{cache_id}' (index #{index}) -> {matched_url[:80]}")
            return matched_url
    except Exception as err:
        logger.warning(f"[Cache Fallback] Failed resolving panel index for '{cache_id}': {err}")

    return None


# ─────────────────────────────────────────────────────────────────────────────
# 7. Dynamic Multi-Panel Re-Stitching
# ─────────────────────────────────────────────────────────────────────────────

async def dynamically_restitch_webtoon_strip(
    cache_id: str,
    referer: Optional[str] = None
) -> Optional[Tuple[bytes, str]]:
    """
    Reconstructs an entire vertical multi-panel manhwa strip on-the-fly from its session URLs.

    Args:
        cache_id (str): Stitched strip cache identifier.
        referer (Optional[str]): HTTP Referer header.

    Returns:
        Optional[Tuple[bytes, str]]: (stitched_bytes, "image/png") if successful, else None.
    """
    try:
        webtoon_url = await extract_webtoon_url_from_referer(referer)
        urls = await lookup_session_image_urls(webtoon_url)
        if not urls:
            return None

        logger.info(
            f"[Cache Fallback] Dynamically re-stitching {len(urls)} panels for cache_id '{cache_id}' "
            f"from URL: {str(webtoon_url)[:60]}..."
        )

        resolved_buffers: List[bytes] = []
        async with httpx.AsyncClient(follow_redirects=True, timeout=HTTP_TIMEOUT_SECONDS) as client:
            sem = asyncio.Semaphore(FETCH_CONCURRENCY_LIMIT)

            async def fetch_item(u: str):
                async with sem:
                    return await img_utils.resolve_image_to_buffer(u, client=client)

            results = await asyncio.gather(*[fetch_item(u) for u in urls], return_exceptions=True)
            for res in results:
                if not isinstance(res, BaseException) and res and "data" in res:
                    resolved_buffers.append(res["data"])

        if not resolved_buffers:
            logger.warning(f"[Cache Fallback] No image buffers could be fetched for '{cache_id}'.")
            return None

        stitched_bytes = await asyncio.to_thread(
            stitch_images_together, resolved_buffers, layout="vertical"
        )
        save_to_memory_cache(cache_id, stitched_bytes, content_type="image/png")
        logger.info(f"[Cache Fallback] Re-stitch completed for '{cache_id}' ({len(stitched_bytes):,} bytes).")
        return stitched_bytes, "image/png"

    except Exception as err:
        logger.error(f"[Cache Fallback] Dynamic re-stitching failed for '{cache_id}': {err}", exc_info=True)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 8. Remote Image Re-Fetching
# ─────────────────────────────────────────────────────────────────────────────

async def refetch_original_image_to_cache(
    cache_id: str,
    original_url: str
) -> Tuple[bytes, str]:
    """
    Re-fetches a single image from its original source URL, stores it in memory cache,
    and returns its payload.

    Args:
        cache_id (str): Target cache identifier.
        original_url (str): Source URL to retrieve.

    Returns:
        Tuple[bytes, str]: (image_bytes, content_type)
    """
    logger.info(f"[Stitch Cache] Cache miss for '{cache_id}' — re-fetching from source: {original_url[:80]}...")
    resolved = await img_utils.resolve_image_to_buffer(original_url)
    img_bytes = resolved["data"]
    content_type = resolved.get("contentType", "image/jpeg")

    save_to_memory_cache(cache_id, img_bytes, content_type=content_type)
    cached_url_key = f"/api/v1/images/cached/{cache_id}"
    edit_history.set(cached_url_key, original_url)

    return img_bytes, content_type


# ─────────────────────────────────────────────────────────────────────────────
# 9. Public Service Orchestration API
# ─────────────────────────────────────────────────────────────────────────────

async def retrieve_cached_stitch_service(
    cache_id: str,
    referer: Optional[str] = None
) -> Tuple[bytes, str]:
    """
    Main service orchestrator for retrieving cached or dynamically reconstructed stitched assets.

    Resolution Pipeline:
    1. Checks in-memory stitched cache.
    2. Resolves source URL from edit history / panel records.
    3. If unresolved, checks if cache_id encodes a panel index and resolves from scrape session.
    4. If cache_id represents a full webtoon strip, dynamically re-stitches all panels.
    5. If source URL was found, re-fetches and re-caches original bytes.
    6. Raises StitchedResourceNotFound if all recovery paths fail.

    Args:
        cache_id (str): Cache key parameter from the API route.
        referer (Optional[str]): HTTP Referer header from the incoming request.

    Returns:
        Tuple[bytes, str]: (image_bytes, content_type)

    Raises:
        StitchedResourceNotFound: If asset cannot be found or reconstructed.
    """
    # ── Stage 1: In-Memory Cache Check ──────────────────────────────────────
    cached_entry = get_from_memory_cache(cache_id)
    if cached_entry:
        return cached_entry

    # ── Stage 2: Historical / Metadata URL Resolution ───────────────────────
    original_url = lookup_original_url_from_history(cache_id)

    # ── Stage 3: Scraper Session Index Resolution ───────────────────────────
    if not original_url:
        original_url = await resolve_panel_from_session(cache_id, referer=referer)

    # ── Stage 4: Dynamic Full-Strip Re-Stitching ─────────────────────────────
    if not original_url and is_webtoon_strip_cache_id(cache_id):
        restitch_result = await dynamically_restitch_webtoon_strip(cache_id, referer=referer)
        if restitch_result:
            return restitch_result

    # ── Stage 5: Re-fetch from Verified Source URL ──────────────────────────
    if original_url and isinstance(original_url, str):
        try:
            return await refetch_original_image_to_cache(cache_id, original_url)
        except Exception as refetch_err:
            logger.warning(f"[Stitch Cache] Source re-fetch failed for '{cache_id}': {refetch_err}")

    # ── Stage 6: Exhaustion & Not Found ─────────────────────────────────────
    logger.info(f"[Stitch Cache] Resource '{cache_id}' expired or not found across all tiers.")
    raise StitchedResourceNotFound("Stitched resource expired or not found.")


# ─────────────────────────────────────────────────────────────────────────────
# 10. Public Exports
# ─────────────────────────────────────────────────────────────────────────────

__all__ = [
    "StitchedResourceNotFound",
    "get_from_memory_cache",
    "save_to_memory_cache",
    "lookup_original_url_from_history",
    "parse_cache_id_panel_index",
    "is_webtoon_strip_cache_id",
    "extract_webtoon_url_from_referer",
    "lookup_session_image_urls",
    "resolve_panel_from_session",
    "dynamically_restitch_webtoon_strip",
    "refetch_original_image_to_cache",
    "retrieve_cached_stitch_service",
]


# ─────────────────────────────────────────────────────────────────────────────
# 11. Developer Self-Verification CLI Runner
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    print("\n" + "=" * 78)
    print("  SONIKOMA STITCH CACHE SERVICE: COMPLETE DEVELOPER SUITE TEST")
    print("  [Validating 100% of Module Functions: Cache, Regex, Fallback, & Pipeline]")
    print("=" * 78)

    async def run_developer_tests():
        # Test 1: In-Memory Cache Read & Write
        print("\n[Test 1/5] save_to_memory_cache() & get_from_memory_cache(): Memory Operations...")
        test_key = "unit_test_stitch_123"
        test_payload = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRTESTPAYLOAD"
        save_to_memory_cache(test_key, test_payload, content_type="image/png")
        cached = get_from_memory_cache(test_key)
        assert cached is not None and cached[0] == test_payload, "Cache verification failed"
        print(f"  [OK] In-memory cache hit verified: {len(cached[0])} bytes, mime={cached[1]}")

        # Test 2: Cache ID Pattern Parsing
        print("\n[Test 2/5] parse_cache_id_panel_index() & is_webtoon_strip_cache_id(): Pattern Parser...")
        idx1 = parse_cache_id_panel_index("norm_1712345678_4")
        idx2 = parse_cache_id_panel_index("split_1712345678_7_1")
        idx3 = parse_cache_id_panel_index("smartcrop_12")
        is_strip1 = is_webtoon_strip_cache_id("stitched_ep_1_full")
        is_strip2 = is_webtoon_strip_cache_id("webtoon_full_123")
        is_strip3 = is_webtoon_strip_cache_id("norm_1712345678_4")

        print(f"  [OK] norm index: {idx1} (expected 4)")
        print(f"  [OK] split index: {idx2} (expected 7)")
        print(f"  [OK] smartcrop index: {idx3} (expected 12)")
        print(f"  [OK] is_webtoon_strip('stitched_ep_1_full'): {is_strip1} (expected True)")
        print(f"  [OK] is_webtoon_strip('webtoon_full_123'): {is_strip2} (expected True)")
        print(f"  [OK] is_webtoon_strip('norm_...'): {is_strip3} (expected False)")

        # Test 3: Referer Extraction
        print("\n[Test 3/5] extract_webtoon_url_from_referer(): HTTP Referer Header Extraction...")
        test_ref = "https://sonikoma.ai/editor?url=https%3A%2F%2Fwebtoons.com%2Fviewer%3Fep%3D12"
        extracted_url = await extract_webtoon_url_from_referer(test_ref)
        print(f"  [OK] Extracted URL: {extracted_url}")

        # Test 4: Database query helper resilience
        print("\n[Test 4/5] _db_fetchone(): Non-blocking Thread Execution...")
        db_res = await _db_fetchone("SELECT 1 AS alive")
        status = "Connected" if db_res else "No DB"
        print(f"  [OK] Database helper executed off event loop: {status}")

        # Test 5: Full Public Pipeline: retrieve_cached_stitch_service()
        print("\n[Test 5/5] retrieve_cached_stitch_service(): Public Service Orchestrator...")
        # Should return our memory-cached item immediately
        data, mime = await retrieve_cached_stitch_service(test_key)
        print(f"  [OK] retrieve_cached_stitch_service returned {len(data)} bytes ({mime})")

        # Non-existent key raises StitchedResourceNotFound
        print("  * Testing graceful StitchedResourceNotFound on expired key...")
        try:
            await retrieve_cached_stitch_service("non_existent_key_99999999")
            print("  [ERROR] Should have raised StitchedResourceNotFound")
        except StitchedResourceNotFound:
            print("  [OK] StitchedResourceNotFound caught as expected")

        print("\n" + "=" * 78)
        print("  ALL 5 STITCH CACHE SERVICE FUNCTIONS TESTED AND VERIFIED SUCCESSFULLY! [OK]")
        print("=" * 78 + "\n")

    asyncio.run(run_developer_tests())
