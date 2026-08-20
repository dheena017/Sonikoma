
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

from PIL import GimpGradientFile
import logging
import os
import json
import hashlib
import time
import re
import httpx
import asyncio
from typing import Optional
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
    """Derive a plausible Referer for CDN bypass dynamically based on the image URL."""
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        if not host:
            return "https://google.com/"
        # Remove CDN prefixes (cdn4., img2., etc.)
        clean_host = re.sub(r'^(?:cdn\d*|img\d*|images\d*|pic\d*|pics\d*|static\d*|assets\d*|media\d*|uploads\d*|files\d*|storage\d*)\.', '', host, flags=re.IGNORECASE)
        return f"{parsed.scheme or 'https'}://{clean_host}/"
    except Exception:
        return "https://google.com/"


def get_alternate_referer(url: str) -> Optional[str]:
    """Alternative referer variant stripping numbers (e.g. zinmanga1.com -> zinmanga.com) for 403 fallback."""
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        clean_host = re.sub(r'^(?:cdn\d*|img\d*|images\d*|pic\d*|pics\d*|static\d*|assets\d*|media\d*|uploads\d*|files\d*|storage\d*)\.', '', host, flags=re.IGNORECASE)
        # Strip numbers before domain extension
        clean_no_num = re.sub(r'(\w+)\d+\.(\w+)$', r'\1.\2', clean_host)
        if clean_no_num != clean_host:
            return f"{parsed.scheme}://{clean_no_num}/"
        return f"{parsed.scheme}://{host}/"
    except Exception:
        return None


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

@router.get("/image", summary="Spoofed referrer image bypass proxy")
@router.get("/proxy-image", include_in_schema=False)
async def proxy_image_stream_endpoint(
    request: Request,
    url: str = Query(..., description="Target image URL to fetch"),
    referer: Optional[str] = Query(None, description="Optional custom Referer header")
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

    if fetch_url.startswith("data:") or fetch_url.startswith("blob:") or "data:image/svg" in fetch_url:
        raise HTTPException(status_code=400, detail="Data and Blob URLs are browser-local and not supported by the server image proxy")

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
            logger.debug(f"[Proxy] 304 CACHE HIT | {fetch_url[:55]} ({elapsed}ms)")
            return Response(status_code=304)

        elapsed = int((time.time() - start_time) * 1000)
        logger.debug(f"[Proxy] 200 CACHE HIT | {fetch_url[:55]} ({cached['size'] / 1024:.1f}KB) ({elapsed}ms)")

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
        referer_candidates = []

        def _add_ref(ref_str: Optional[str]):
            if not ref_str:
                return
            clean_ref = ref_str.strip()
            if not clean_ref:
                return
            if clean_ref not in referer_candidates:
                referer_candidates.append(clean_ref)

        # 1. User-supplied referer parameter (origin root with trailing slash & full URL)
        if referer:
            try:
                pref = urlparse(referer)
                if pref.scheme and pref.netloc:
                    _add_ref(f"{pref.scheme}://{pref.netloc}/")
                    if not pref.netloc.startswith("www."):
                        _add_ref(f"{pref.scheme}://www.{pref.netloc}/")
            except Exception:
                pass
            _add_ref(referer)

        # 2. Host-derived referers
        primary_spoof = spoof_referer(fetch_url)
        _add_ref(primary_spoof)

        try:
            pf = urlparse(fetch_url)
            if pf.scheme and pf.netloc:
                host = (pf.hostname or "").lower()
                clean_host = re.sub(r'^(?:cdn\d*|img\d*|images\d*|pic\d*|pics\d*|static\d*|assets\d*|media\d*|uploads\d*|files\d*|storage\d*)\.', '', host, flags=re.IGNORECASE)
                if not clean_host.startswith("www."):
                    _add_ref(f"{pf.scheme}://www.{clean_host}/")
                _add_ref(f"{pf.scheme}://{clean_host}/")
        except Exception:
            pass

        # 3. Alternate referer (e.g. without numbers in hostname like zinmanga1.com -> zinmanga.com)
        alt_ref = get_alternate_referer(fetch_url)
        if alt_ref:
            _add_ref(alt_ref)
            try:
                palt = urlparse(alt_ref)
                if palt.scheme and palt.netloc and not palt.netloc.startswith("www."):
                    _add_ref(f"{palt.scheme}://www.{palt.netloc}/")
            except Exception:
                pass

        logger.debug(f"[Proxy] Fetching remote image: {fetch_url[:70]} | referer_candidates={referer_candidates}")

        # 4. Common manhua/manga reader origins
        for popular in ["https://www.topmanhua.fan/", "https://topmanhua.fan/", "https://manhwatop.com/", "https://manhuato.com/"]:
            _add_ref(popular)

        headers_base = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept':     'image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
        }

        response = None
        first_ref = referer_candidates[0] if referer_candidates else "https://www.webtoons.com/"
        response = await fetch_with_retry(fetch_url, {**headers_base, 'Referer': first_ref})

        if response.status_code in (403, 401):
            logger.info(f"[Proxy] Upstream {response.status_code} on initial Referer ({first_ref}). Testing {len(referer_candidates)-1} fallback candidates...")
            for cand in referer_candidates[1:]:
                try:
                    alt_resp = await fetch_with_retry(fetch_url, {**headers_base, 'Referer': cand}, retries=1)
                    if alt_resp.status_code == 200:
                        logger.info(f"[Proxy] Successfully bypassed {response.status_code} using Referer: {cand}")
                        response = alt_resp
                        break
                except Exception:
                    pass

        if response.status_code in (403, 401):
            try:
                no_ref_resp = await fetch_with_retry(fetch_url, headers_base, retries=1)
                if no_ref_resp.status_code == 200:
                    logger.info(f"[Proxy] Successfully bypassed 403 with empty Referer header")
                    response = no_ref_resp
            except Exception:
                pass

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
            from services.image.utils.image_utils import crop_auto_borders
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
        logger.debug(f"[Proxy] 200 FETCH | {fetch_url[:55]} ({len(buffer) / 1024:.1f}KB) ({elapsed}ms)")

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


@router.get("/stats", summary="Get proxy cache metrics")
async def get_proxy_cache_stats_endpoint():
    return {"success": True, **proxy_cache.stats()}


@router.delete("/cache", summary="Clear proxy cache in-memory entries")
async def clear_proxy_cache_endpoint():
    size = proxy_cache.size
    proxy_cache.clear()
    logger.info(f"[Proxy] Cache cleared — removed {size} entries")
    return {"success": True, "cleared": size}

