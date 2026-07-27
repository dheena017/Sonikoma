"""
Moved image_resolver into services.image.utils
"""

import io
import os
import re
import base64
import logging
import httpx
import asyncio
from typing import Dict, Any, Optional
from urllib.parse import urlparse, parse_qs

from core.cache import stitched_cache
from core.settings import BACKEND_PORT

try:
    from curl_cffi.requests import AsyncSession as CurlAsyncSession
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False

logger = logging.getLogger("sonikoma.services.image.image_resolver")


def create_fallback_image_buffer(url: str, error_msg: str) -> Dict[str, Any]:
    """Generates an 800x300 placeholder PNG when remote image fetching fails."""
    try:
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (800, 300), color=(40, 44, 52))
        draw = ImageDraw.Draw(img)

        domain = urlparse(url).netloc or "Remote Host"
        short_url = url[:50] + ("..." if len(url) > 50 else "")
        text = f"Image Unavailable\n[{domain}]\n{short_url}\n{error_msg}"

        draw.text((400, 150), text, fill=(220, 220, 220), anchor="mm")

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        data = buf.getvalue()
        return {"data": data, "content_type": "image/png", "contentType": "image/png"}
    except Exception:
        # Fallback 1x1 transparent PNG if PIL is unavailable
        transparent_png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
        return {"data": transparent_png, "content_type": "image/png", "contentType": "image/png"}


def spoof_referer(url: str) -> str:
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        if "webtoon" in host or "pstatic" in host:
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

        # Remove CDN prefixes (cdn4., img2., etc.)
        clean_host = re.sub(r'^(?:cdn\d*|img\d*|images\d*|pic\d*|pics\d*|static\d*|assets\d*|media\d*|uploads\d*|files\d*|storage\d*)\.', '', host, flags=re.IGNORECASE)
        return f"{parsed.scheme}://{clean_host}/"
    except Exception:
        return "https://www.webtoons.com/"


def get_alternate_referer(url: str) -> Optional[str]:
    """Alternative referer variant stripping numbers (e.g. zinmanga1.com -> zinmanga.com) for 403 fallback."""
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        clean_host = re.sub(r'^(?:cdn\d*|img\d*|images\d*|pic\d*|pics\d*|static\d*|assets\d*|media\d*|uploads\d*|files\d*|storage\d*)\.', '', host, flags=re.IGNORECASE)
        clean_no_num = re.sub(r'(\w+)\d+\.(\w+)$', r'\1.\2', clean_host)
        if clean_no_num != clean_host:
            return f"{parsed.scheme}://{clean_no_num}/"
        return f"{parsed.scheme}://{host}/"
    except Exception:
        return None


async def resolve_url_to_buffer(url_str: str, client: Optional[httpx.AsyncClient] = None) -> Dict[str, Any]:
    """
    Resolve ANY URL (absolute, relative, /api/merge-images/cached, proxied)
    into a raw bytes + contentType. Can be used for images or audio files.
    """
    if not url_str:
        raise ValueError('Empty URL provided')

    working_url = url_str.strip()

    # 1. Fully unwrap any nested proxy-image URLs
    while '/api/proxy' in working_url:
        parsed = urlparse(working_url)
        query = parse_qs(parsed.query)
        if "url" in query and query["url"][0]:
            working_url = query["url"][0]
        else:
            break

    # 2. Check in-memory merged/stitch cache first (zero-cost retrieval)
    if '/api/image/cached/' in working_url or '/api/merge-images/cached/' in working_url or '/api/stitch-images/cached/' in working_url:
        match = re.search(r'/(?:image|(?:merge|stitch)-images?)/cached/([^/?&]+)', working_url)
        if match:
            cache_id = match.group(1)
            cached = stitched_cache.get(cache_id)
            if cached:
                mime = cached.get("content_type", "application/octet-stream")
                return {"data": cached["data"], "content_type": mime, "contentType": mime}

            # Try base cache_id (stripping _full suffix if present)
            clean_id = re.sub(r'_full$', '', cache_id)
            cached_base = stitched_cache.get(clean_id)
            if cached_base:
                mime = cached_base.get("content_type", "application/octet-stream")
                return {"data": cached_base["data"], "content_type": mime, "contentType": mime}

            # Fallback to direct cache service retrieval (handles disk/db cache resolution)
            try:
                from services.image.stitch_cache_service import retrieve_cached_stitch_service
                data, content_type = await retrieve_cached_stitch_service(cache_id)
                if data:
                    return {"data": data, "content_type": content_type, "contentType": content_type}
            except Exception as e:
                logger.warning(f"[resolve_url_to_buffer] Direct cache service resolution failed for '{cache_id}': {e}")

    # 3. Base64 data-URL shortcut — decode inline without any HTTP
    if working_url.startswith('data:'):
        header, rest = working_url.split(',', 1)
        buf = base64.b64decode(rest)
        mime_match = re.match(r'^data:([^;]+);base64', header)
        mime = mime_match.group(1) if mime_match else "application/octet-stream"
        return {"data": buf, "content_type": mime, "contentType": mime}

    # 4. Support local file:// URLs
    if working_url.startswith('file://'):
        from urllib.parse import unquote
        file_path = working_url[7:]
        # On Windows, a URL like file:///C:/... might have a leading slash
        if file_path.startswith('/') and len(file_path) > 2 and file_path[2] == ':':
            file_path = file_path[1:]
        file_path = unquote(file_path)
        with open(file_path, 'rb') as f:
            buf = f.read()

        import mimetypes
        mime = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
        return {"data": buf, "content_type": mime, "contentType": mime}

    # 5. Normalize internal hostnames → relative paths to call localhost directly
    if re.match(r'^https?://', working_url, re.IGNORECASE):
        try:
            parsed = urlparse(working_url)
            host = parsed.hostname or ""
            if "run.app" in host or "localhost" in host or host == "127.0.0.1":
                # Convert absolute backend URL back to relative local call
                working_url = parsed.path
                if parsed.query:
                    working_url += "?" + parsed.query
        except Exception:
            pass

    # 6. Fetch from local backend via internal network route (follow_redirects=True to handle 307 proxy redirects)
    if working_url.startswith('/api/'):
        port = BACKEND_PORT
        local_url = f"http://127.0.0.1:{port}{working_url}"

        async def _fetch_local(http_client):
            r = await http_client.get(local_url, follow_redirects=True)
            r.raise_for_status()
            mime = r.headers.get("Content-Type", "application/octet-stream")
            return {"data": r.content, "content_type": mime, "contentType": mime}

        if client:
            return await _fetch_local(client)
        else:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as local_client:
                return await _fetch_local(local_client)

    # 7. Fallback to external remote fetch (e.g. raw Webtoon URLs or unproxied remote assets)
    base_headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8,audio/*,video/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
    }

    parsed_working = urlparse(working_url)

    # Build referer list: alternate (number-stripped) first so zinmanga1.com → zinmanga.com
    # is tried before the cdn-prefixed form which is more likely to fail
    alternate = get_alternate_referer(working_url)
    primary = spoof_referer(working_url)
    origin = f"{parsed_working.scheme}://{parsed_working.hostname}/" if parsed_working.hostname else None
    referer_candidates = [
        alternate,
        primary,
        origin,
        "https://www.google.com/",
        None,
    ]
    seen_refs: set = set()
    referers = []
    for ref in referer_candidates:
        if ref not in seen_refs:
            seen_refs.add(ref)
            if ref is not None:
                referers.append(ref)
    referers.append(None)  # always end with a no-referer attempt

    async def _fetch_remote(http_client):
        last_err = None
        # 1. Try standard httpx with various Referer candidates
        for attempt, ref in enumerate(referers):
            headers = dict(base_headers)
            if ref:
                headers['Referer'] = ref
            try:
                r = await http_client.get(working_url, headers=headers)
                r.raise_for_status()
                mime = r.headers.get("Content-Type", "application/octet-stream")
                return {"data": r.content, "content_type": mime, "contentType": mime}
            except Exception as e:
                last_err = e
                await asyncio.sleep(0.1 * (attempt + 1))

        # 2. Try curl_cffi with browser TLS impersonation if available
        # Cycles multiple profiles because some CDNs fingerprint the TLS handshake
        if HAS_CURL_CFFI:
            from typing import Literal, cast
            _ImpersonateProfile = Literal["chrome124", "chrome110", "safari17_0", "firefox133"]
            _impersonate_profiles: list[_ImpersonateProfile] = ["chrome124", "chrome110", "safari17_0", "firefox133"]
            for profile in _impersonate_profiles:
                try:
                    async with CurlAsyncSession(impersonate=profile, verify=False) as session:
                        for ref in referers:
                            headers = dict(base_headers)
                            if ref:
                                headers['Referer'] = ref
                            try:
                                res = await session.get(working_url, headers=headers, timeout=10)
                                if res.status_code == 200 and len(res.content) > 500:
                                    mime = res.headers.get("Content-Type", "image/webp")
                                    return {"data": res.content, "content_type": mime, "contentType": mime}
                                elif res.status_code == 403:
                                    logger.debug(f"[ImageResolver] curl_cffi({profile}) 403 with referer={ref!r} for {working_url[:60]}")
                            except Exception as ce:
                                last_err = ce
                except Exception as e:
                    last_err = e

        # 3. Fallback: Log warning and return clean placeholder panel image instead of crashing API
        logger.warning(f"[ImageResolver] Failed to fetch remote image '{working_url[:60]}...': {last_err}. Returning fallback placeholder.")
        return create_fallback_image_buffer(working_url, str(last_err))

    if client:
        return await _fetch_remote(client)
    else:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as remote_client:
            return await _fetch_remote(remote_client)


async def resolve_image_to_buffer(url_str: str, client: Optional[httpx.AsyncClient] = None) -> Dict[str, Any]:
    return await resolve_url_to_buffer(url_str, client)
