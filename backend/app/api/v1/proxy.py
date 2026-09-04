
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

        # Dedicated mappings for major protected CDNs (Akamai EdgeSuite, Cloudflare, etc.)
        if "pstatic.net" in host or "naver" in host or "webtoon" in host:
            return "https://www.webtoons.com/"
        if "kakaocdn.net" in host or "daumcdn.net" in host:
            return "https://page.kakao.com/"
        if "tapas.io" in host or "tapascdn" in host:
            return "https://tapas.io/"
        if "toomics.com" in host or "toomics" in host:
            return "https://global.toomics.com/"
        if "mangadex" in host or "mangadex.org" in host:
            return "https://mangadex.org/"

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


_proxy_http_client: Optional[httpx.AsyncClient] = None

def get_proxy_http_client() -> httpx.AsyncClient:
    global _proxy_http_client
    if _proxy_http_client is None or _proxy_http_client.is_closed:
        try:
            _proxy_http_client = httpx.AsyncClient(
                follow_redirects=True,
                timeout=httpx.Timeout(25.0, connect=10.0),
                limits=httpx.Limits(max_keepalive_connections=60, max_connections=120, keepalive_expiry=60.0),
                http2=True,
            )
        except Exception as err:
            logger.warning(f"[Proxy] HTTP/2 initialization failed ({err}); falling back to HTTP/1.1")
            _proxy_http_client = httpx.AsyncClient(
                follow_redirects=True,
                timeout=httpx.Timeout(25.0, connect=10.0),
                limits=httpx.Limits(max_keepalive_connections=60, max_connections=120, keepalive_expiry=60.0),
                http2=False,
            )
    return _proxy_http_client


async def fetch_with_retry(
    url: str,
    headers: dict,
    retries: int = PROXY_MAX_RETRIES,
    base_delay: float = PROXY_RETRY_BASE_SEC
) -> httpx.Response:
    """Fetch with exponential back-off retry using high-speed persistent connection pool."""
    client = get_proxy_http_client()
    last_err = None
    for attempt in range(retries):
        try:
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


import ipaddress
import socket

# ─── SSRF Security Protection ────────────────────────────────────────────────
BLOCKED_SUBNETS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # Cloud metadata IP (169.254.169.254)
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

BLOCKED_HOSTNAMES = {"localhost", "127.0.0.1", "0.0.0.0", "backend", "frontend", "internal", "local"}


def is_safe_proxy_url(target_url: str) -> tuple[bool, str]:
    """Validates that a URL is a legitimate public web URL and not an SSRF attack vector."""
    if not target_url or not target_url.strip():
        return False, "Target URL is empty"
    try:
        parsed = urlparse(target_url.strip())
        if parsed.scheme.lower() not in ("http", "https"):
            return False, f"Invalid URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

        host = (parsed.hostname or "").lower()
        if not host:
            return False, "Missing hostname in target URL"

        if host in BLOCKED_HOSTNAMES or host.endswith(".local") or host.endswith(".internal"):
            return False, f"Access to private/local hostname '{host}' is strictly forbidden."

        # Resolve hostname to IP and check against blacklisted private subnets
        try:
            ip_str = socket.gethostbyname(host)
            ip_obj = ipaddress.ip_address(ip_str)
            for subnet in BLOCKED_SUBNETS:
                if ip_obj in subnet:
                    return False, f"Access to private subnet IP address '{ip_str}' is strictly forbidden."
        except socket.gaierror:
            # If DNS resolution fails, allow httpx to handle or reject
            pass
        except Exception:
            pass

        return True, "Safe"
    except Exception as e:
        return False, f"Invalid URL format: {e}"


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

    # Local /media/ or /videos/ fallback resolution
    if fetch_url.startswith("/media/") or fetch_url.startswith("media/") or "/media/slice_" in fetch_url or "/media/single_" in fetch_url:
        media_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "local_media"))
        clean_name = fetch_url.split("/media/")[-1] if "/media/" in fetch_url else fetch_url.split("media/")[-1]
        local_path = os.path.join(media_root, clean_name)
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                content = f.read()
            ext = os.path.splitext(clean_name)[1].lower()
            m_type = "image/webp" if ext == ".webp" else ("image/png" if ext == ".png" else "image/jpeg")
            return Response(content=content, media_type=m_type)

    # SSRF Security Validation
    is_safe, sec_reason = is_safe_proxy_url(fetch_url)
    if not is_safe:
        logger.warning(f"[Proxy SSRF Blocked] {fetch_url}: {sec_reason}")
        raise HTTPException(status_code=403, detail=f"SSRF Security Restriction: {sec_reason}")

    tighter = request.query_params.get("tighter") == "true"
    crop_padding_str = request.query_params.get("crop_padding")
    crop_padding = int(crop_padding_str) if crop_padding_str is not None and crop_padding_str.isdigit() else None

    # Cache lookup
    cache_key_str = f"{fetch_url}_{tighter}_{crop_padding}"
    cache_key = hashlib.md5(cache_key_str.encode('utf-8'), usedforsecurity=False).hexdigest()
    cached = proxy_cache.get(cache_key)

    if cached:
        # Check Client Conditional ETag (304 Not Modified)
        client_etag = request.headers.get("if-none-match")
        if client_etag == cached["etag"]:
            elapsed = int((time.time() - start_time) * 1000)
            return Response(status_code=304)

        elapsed = int((time.time() - start_time) * 1000)

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

        # Dynamic derivation of origin and parent domain
        try:
            target_parsed = urlparse(fetch_url)
            if target_parsed.scheme and target_parsed.netloc:
                _add_ref(f"{target_parsed.scheme}://{target_parsed.netloc}/")
        except Exception:
            pass


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
        first_ref = referer_candidates[0] if referer_candidates else spoof_referer(fetch_url)
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

        return Response(
            content=buffer,
            media_type=clean_content_type,
            headers={
                "ETag": etag,
                "X-Cache": "MISS",
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Proxy-Source": urlparse(fetch_url).hostname or "",
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

