
# ─────────────────────────────────────────────────────────────────────────────
# FROM proxy.py
# ─────────────────────────────────────────────────────────────────────────────
"""
backend/python/routes/proxy.py
─────────────────────────────────────────────────────────────────────────────
Image Proxy Route — Fetches external images on behalf of the frontend,
bypassing referrer restrictions from Webtoon / Manhwa CDNs.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import os
import json
import hashlib
import time
import httpx
import asyncio
from urllib.parse import urlparse, parse_qs
from fastapi import APIRouter, Request, Response, Query, HTTPException

from core.cache import proxy_cache

logger = logging.getLogger("sonikoma.routes.proxy")
proxy_router = APIRouter()
router = proxy_router

# ─── Config ──────────────────────────────────────────────────────────────────
MAX_PROXY_SIZE_MB = int(os.getenv("MAX_PROXY_MB", "20"))
MAX_PROXY_SIZE = MAX_PROXY_SIZE_MB * 1024 * 1024
PROXY_CACHE_TTL_SEC = 30 * 60  # 30 minutes
PROXY_MAX_RETRIES = 3
PROXY_RETRY_BASE_SEC = 0.4

# ─── Helpers ─────────────────────────────────────────────────────────────────

def make_etag(buf: bytes) -> str:
    """Generate MD5 fingerprint for a bytes buffer (used as ETag)."""
    return f'"{hashlib.md5(buf, usedforsecurity=False).hexdigest()}"'


def spoof_referer(url: str) -> str:
    """Derive a plausible Referer for CDN bypass based on the image URL."""
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        if "webtoon" in host or "pstatic" in host:
            # Webtoon CDN assets (e.g. webtoon-phinf.pstatic.net) typically expect this referer.
            return "https://www.webtoons.com/"
        if "naver" in host:
            return "https://comic.naver.com/"
        if "kakao" in host:
            return "https://page.kakao.com/"
        if "lezhin" in host:
            return "https://www.lezhin.com/"
        if "tapas" in host:
            return "https://tapas.io/"
        if "manhwatop" in host or "manhwa" in host:
            return "https://manhwatop.com/"
        if "manhuato" in host or "manhua" in host:
            return "https://manhuato.com/"

        # Remove common CDN subdomains to construct a clean fallback base domain referer
        clean_host = host
        for prefix in ["cdn.", "img.", "images.", "pic.", "pics.", "static.", "assets.", "media.", "uploads.", "files.", "storage."]:
            if clean_host.startswith(prefix):
                clean_host = clean_host[len(prefix):]
                break
        return f"{parsed.scheme}://{clean_host}/"
    except Exception:
        return "https://www.webtoons.com/"


async def fetch_with_retry(
    url: str,
    headers: dict,
    retries: int = PROXY_MAX_RETRIES,
    base_delay: float = PROXY_RETRY_BASE_SEC
) -> httpx.Response:
    """Fetch with exponential back-off retry on 5xx or network errors."""
    last_err = None
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                resp = await client.get(url, headers=headers)

                # Retry on 5xx
                if resp.status_code >= 500 and attempt < retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(
                        f"[Proxy] Retry {attempt + 1}/{retries} | "
                        f"status {resp.status_code} — waiting {delay:.2f}s"
                    )
                    await asyncio.sleep(delay)
                    continue
                return resp
        except Exception as e:
            last_err = e
            if attempt < retries - 1:
                delay = base_delay * (2 ** attempt)
                logger.warning(
                    f"[Proxy] Network error (retry {attempt + 1}/{retries}): {e} — waiting {delay:.2f}s"
                )
                await asyncio.sleep(delay)

    raise last_err or RuntimeError("Max retries reached")


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/proxy-image", summary="Spoofed referrer image bypass proxy")
@router.get("/proxy/image", include_in_schema=False)
async def proxy_image(
    request: Request,
    url: str = Query(..., description="Target image URL to fetch")
):

    start_time = time.time()

    fetch_url = url
    visited = set()
    while "/api/proxy-image" in fetch_url:
        if fetch_url in visited:
            raise HTTPException(status_code=400, detail="Infinite proxy redirect loop detected")
        visited.add(fetch_url)
        parsed = urlparse(fetch_url)
        query = parse_qs(parsed.query)
        if "url" in query:
            fetch_url = query["url"][0]
        else:
            break

    if fetch_url.startswith("data:") or "data:image/svg" in fetch_url:
        raise HTTPException(status_code=400, detail="Data URLs are not supported by the image proxy")

    tighter = request.query_params.get("tighter") == "true"
    crop_padding_str = request.query_params.get("crop_padding")
    crop_padding = int(crop_padding_str) if crop_padding_str is not None and crop_padding_str.isdigit() else None

    # Validate URL format and handle local/internal URLs by redirecting directly
    try:
        parsed_url = urlparse(fetch_url)
        is_local = False
        if not parsed_url.scheme:
            is_local = fetch_url.startswith("/")
        else:
            host = (parsed_url.hostname or "").lower()
            if host in ("localhost", "127.0.0.1") or parsed_url.path.startswith("/api/"):
                is_local = True

        if is_local:
            if "/api/proxy-image" in parsed_url.path:
                raise HTTPException(status_code=400, detail="Local proxy redirect loop is not allowed")
            redirect_url = parsed_url.path
            if parsed_url.query:
                redirect_url += f"?{parsed_url.query}"
            from fastapi.responses import RedirectResponse
            logger.info(f"[Proxy] Redirecting local/internal URL directly to: {redirect_url}")
            return RedirectResponse(url=redirect_url)

        if parsed_url.scheme not in ('http', 'https'):
            raise HTTPException(status_code=400, detail="Only HTTP/HTTPS URLs are supported.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid URL format: {e}")

    # Cache lookup
    cache_key_str = f"{fetch_url}_{tighter}_{crop_padding}"
    cache_key = hashlib.md5(cache_key_str.encode('utf-8'), usedforsecurity=False).hexdigest()
    cached = proxy_cache.get(cache_key)

    if cached:
        # Check Client Conditional ETag (304 Not Modified)
        client_etag = request.headers.get("if-none-match")
        if client_etag == cached["etag"]:
            elapsed = int((time.time() - start_time) * 1000)
            logger.info(f"[Proxy] 304 CACHE HIT | {fetch_url[:55]} ({elapsed}ms)")
            return Response(status_code=304)

        elapsed = int((time.time() - start_time) * 1000)
        logger.info(f"[Proxy] 200 CACHE HIT | {fetch_url[:55]} ({cached['size'] / 1024:.1f}KB) ({elapsed}ms)")

        return Response(
            content=cached["data"],
            media_type=cached["contentType"],
            headers={
                "ETag": cached["etag"],
                "X-Cache": "HIT",
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Proxy-Size-KB": f"{cached['size'] / 1024:.1f}"
            }
        )

    # Remote fetch
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer':    spoof_referer(fetch_url),
            'Accept':     'image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
        }

        response = await fetch_with_retry(fetch_url, headers)

        if response.status_code != 200:
            logger.warning(f"[Proxy] Upstream error {response.status_code} | {fetch_url[:60]}")
            return Response(
                status_code=response.status_code,
                content=json.dumps({"success": False, "error": f"Upstream returned {response.status_code}", "url": fetch_url}),
                media_type="application/json"
            )

        # Validate content type
        content_type = response.headers.get("Content-Type", "image/jpeg")
        if not content_type.startswith("image/") and "octet-stream" not in content_type:
            logger.warning(f"[Proxy] Blocked non-image response: {content_type} | {fetch_url[:50]}")
            raise HTTPException(
                status_code=415,
                detail=f"Upstream returned non-image content type: {content_type}"
            )

        # Read binary data
        buffer = response.content

        # Size guard
        if len(buffer) > MAX_PROXY_SIZE:
            logger.warning(f"[Proxy] Blocked oversized response: {len(buffer) / 1024 / 1024:.1f}MB > {MAX_PROXY_SIZE_MB}MB limit")
            raise HTTPException(
                status_code=413,
                detail=f"Image exceeds maximum proxy size of {MAX_PROXY_SIZE_MB}MB"
            )

        if tighter or crop_padding is not None:
            from services.image.image_utils import crop_auto_borders
            crop_res = crop_auto_borders(buffer, tighter=tighter, crop_padding=crop_padding)
            buffer = crop_res["data"]
            content_type = crop_res["content_type"]

        etag = make_etag(buffer)
        clean_content_type = content_type.split(";")[0].strip()

        # Cache saving
        proxy_cache.set(cache_key, {
            "data": buffer,
            "contentType": clean_content_type,
            "etag": etag,
            "size": len(buffer),
            "fetchedAt": time.time()
        })

        elapsed = int((time.time() - start_time) * 1000)
        logger.info(f"[Proxy] 200 FETCH | {fetch_url[:55]} ({len(buffer) / 1024:.1f}KB) ({elapsed}ms)")

        return Response(
            content=buffer,
            media_type=clean_content_type,
            headers={
                "ETag": etag,
                "X-Cache": "MISS",
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Proxy-Source": parsed_url.hostname or "",
                "X-Proxy-Size-KB": f"{len(buffer) / 1024:.1f}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        elapsed = int((time.time() - start_time) * 1000)
        logger.error(f"[Proxy] ERROR | {fetch_url[:60]} — {e} ({elapsed}ms)")
        raise HTTPException(
            status_code=500,
            detail=f"Proxy fetch failed: {e}"
        )


@router.get("/proxy-cache/stats", summary="Get proxy cache metrics")
async def get_proxy_cache_stats():
    return {"success": True, **proxy_cache.stats()}


@router.delete("/proxy-cache", summary="Clear proxy cache in-memory entries")
async def clear_proxy_cache():
    size = proxy_cache.size
    proxy_cache.clear()
    logger.info(f"[Proxy] Cache cleared — removed {size} entries")
    return {"success": True, "cleared": size}

