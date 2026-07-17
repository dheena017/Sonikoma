import re
import asyncio
import logging
import httpx
import json
from urllib.parse import urlparse, parse_qs
from fastapi import Request

from utils.cache import stitched_cache
# I am mocking the imports that were inside the function
from database import db
from database.db import unwrap_proxy_url
from utils import img_utils

logger = logging.getLogger("sonikoma.services.image.stitch_cache")

# (A global edit_history might be missing if it was in transform.py, but we'll import if needed)
# In transform.py it just did edit_history.get, maybe edit_history is from utils.cache? Let's assume it's from utils.cache
from utils.cache import edit_history

async def retrieve_cached_stitch_service(cache_id: str, request: Request = None):
    cached = stitched_cache.get(cache_id)
    if cached:
        return cached["data"], cached["content_type"]

    cached_url_key = f"/api/image/cached/{cache_id}"
    original_url = edit_history.get(cached_url_key)

    if not original_url:
        try:
            original_url = db.get_panel_original_url(cached_url_key)
        except Exception:
            pass

    if not original_url:
        try:
            hist = db.get_edit_history(cached_url_key)
            if hist and hist.get("original_url"):
                original_url = hist["original_url"]
        except Exception:
            pass

    if not original_url:
        index = None
        norm_match = re.match(r'^(?:norm|split)_(\d+)_(\d+)(?:_(\d+))?$', cache_id)
        if norm_match:
            index = int(norm_match.group(2))
        else:
            crop_match = re.search(r'smartcrop_(\d+)(?:_\d+)?$', cache_id)
            if crop_match:
                index = int(crop_match.group(1))

        if index is not None:
            try:
                webtoon_url = None
                referer = request.headers.get("referer") if request else None
                if referer:
                    parsed_ref = urlparse(referer)
                    query_params = parse_qs(parsed_ref.query)
                    if "url" in query_params:
                        webtoon_url = query_params["url"][0]
                    else:
                        path_parts = [p for p in parsed_ref.path.split('/') if p]
                        if len(path_parts) >= 4 and path_parts[0] == "series":
                            series_slug = path_parts[1]
                            chapter_slug = path_parts[3]
                            conn = db.get_db_connection()
                            session_row = conn.execute(
                                "SELECT url FROM scrape_sessions WHERE url LIKE ? AND url LIKE ? ORDER BY scraped_at DESC LIMIT 1",
                                (f"%{series_slug}%", f"%{chapter_slug.replace('chapter-', 'episode-')}%")
                            ).fetchone()
                            if session_row:
                                webtoon_url = session_row["url"]

                if not webtoon_url:
                    conn = db.get_db_connection()
                    latest_session = conn.execute(
                        "SELECT url FROM scrape_sessions ORDER BY scraped_at DESC LIMIT 1"
                    ).fetchone()
                    if latest_session:
                        webtoon_url = latest_session["url"]

                if webtoon_url:
                    conn = db.get_db_connection()
                    session_row = conn.execute(
                        "SELECT image_urls FROM scrape_sessions WHERE url = ? AND image_urls LIKE '%http%' ORDER BY scraped_at ASC LIMIT 1",
                        (webtoon_url,)
                    ).fetchone()
                    if not session_row:
                        session_row = conn.execute(
                            "SELECT image_urls FROM scrape_sessions WHERE url = ? ORDER BY scraped_at DESC LIMIT 1",
                            (webtoon_url,)
                        ).fetchone()
                    if session_row:
                        urls = json.loads(session_row["image_urls"])
                        if 0 <= index < len(urls):
                            original_url = unwrap_proxy_url(urls[index])
                            logger.info(f"[Cache Fallback] Resolved cache_id '{cache_id}' index {index} to original_url: {original_url}")
            except Exception as fe:
                logger.warning(f"[Cache Fallback] Scraper session lookup failed: {fe}")

    if not original_url and re.match(r'^stitched_\d+_full(?:_\d+)?$', cache_id):
        try:
            webtoon_url = None
            referer = request.headers.get("referer") if request else None
            if referer:
                parsed_ref = urlparse(referer)
                query_params = parse_qs(parsed_ref.query)
                if "url" in query_params:
                    webtoon_url = query_params["url"][0]
                else:
                    path_parts = [p for p in parsed_ref.path.split('/') if p]
                    if len(path_parts) >= 4 and path_parts[0] == "series":
                        series_slug = path_parts[1]
                        chapter_slug = path_parts[3]
                        conn = db.get_db_connection()
                        session_row = conn.execute(
                            "SELECT url FROM scrape_sessions WHERE url LIKE ? AND url LIKE ? ORDER BY scraped_at DESC LIMIT 1",
                            (f"%{series_slug}%", f"%{chapter_slug.replace('chapter-', 'episode-')}%")
                        ).fetchone()
                        if session_row:
                            webtoon_url = session_row["url"]

            if not webtoon_url:
                conn = db.get_db_connection()
                latest_session = conn.execute(
                    "SELECT url FROM scrape_sessions ORDER BY scraped_at DESC LIMIT 1"
                ).fetchone()
                if latest_session:
                    webtoon_url = latest_session["url"]

            if webtoon_url:
                conn = db.get_db_connection()
                session_row = conn.execute(
                    "SELECT image_urls FROM scrape_sessions WHERE url = ? AND image_urls LIKE '%http%' ORDER BY scraped_at ASC LIMIT 1",
                    (webtoon_url,)
                ).fetchone()
                if not session_row:
                    session_row = conn.execute(
                        "SELECT image_urls FROM scrape_sessions WHERE url = ? ORDER BY scraped_at DESC LIMIT 1",
                        (webtoon_url,)
                    ).fetchone()
                if session_row:
                    urls = json.loads(session_row["image_urls"])
                    unwrapped_urls = [unwrap_proxy_url(u) for u in urls if u]

                    if unwrapped_urls:
                        logger.info(f"[Cache Fallback] Dynamically re-stitching {len(unwrapped_urls)} panels for cache_id '{cache_id}' from Webtoon URL: {webtoon_url[:60]}...")
                        resolved_buffers_data = []
                        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                            sem = asyncio.Semaphore(15)
                            async def fetch_item(u):
                                async with sem:
                                    return await img_utils.resolve_image_to_buffer(u, client=client)
                            resolved_results = await asyncio.gather(*[fetch_item(u) for u in unwrapped_urls], return_exceptions=True)
                            for idx, res in enumerate(resolved_results):
                                if not isinstance(res, Exception):
                                    resolved_buffers_data.append(res["data"])

                        if resolved_buffers_data:
                            stitched_bytes = await asyncio.to_thread(
                                img_utils.stitch_images_together, resolved_buffers_data, layout="vertical"
                            )
                            stitched_cache.set(cache_id, {"data": stitched_bytes, "content_type": "image/png"})
                            logger.info(f"[Cache Fallback] Successfully re-stitched and cached '{cache_id}' ({len(stitched_bytes)} bytes)")
                            return stitched_bytes, "image/png"
        except Exception as se:
            logger.error(f"[Cache Fallback] Dynamic re-stitching failed for '{cache_id}': {se}", exc_info=True)

    if original_url and isinstance(original_url, str):
        try:
            logger.info(f"[Cache] Miss for {cache_id} — re-fetching from original: {original_url[:80]}")
            resolved = await img_utils.resolve_image_to_buffer(original_url)
            img_bytes = resolved["data"]
            content_type = resolved.get("contentType", "image/jpeg")
            stitched_cache.set(cache_id, {"data": img_bytes, "content_type": content_type})
            edit_history.set(cached_url_key, original_url)
            return img_bytes, content_type
        except Exception as refetch_err:
            logger.warning(f"[Cache] Re-fetch failed for {cache_id}: {refetch_err}")

    raise Exception("Stitched resource expired or not found.")
