"""
Moved image_resolver into services.image.utils
"""

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

logger = logging.getLogger("sonikoma.services.image.image_resolver")


def spoof_referer(url: str) -> str:
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        if "webtoons" in host:
            return "https://www.webtoons.com/"
        return f"{parsed.scheme}://{host}/"
    except Exception:
        return "https://www.webtoons.com/"


async def resolve_url_to_buffer(url_str: str, client: Optional[httpx.AsyncClient] = None) -> Dict[str, Any]:
    """
    Resolve ANY URL (absolute, relative, /api/merge-images/cached, proxied)
    into a raw bytes + contentType. Can be used for images or audio files.
    """
    if not url_str:
        raise ValueError('Empty URL provided')

    working_url = url_str.strip()

    # 1. Check in-memory merged/stitch cache first (zero-cost retrieval)
    if '/api/image/cached/' in working_url or '/api/merge-images/cached/' in working_url or '/api/stitch-images/cached/' in working_url:
        match = re.search(r'/(?:image|merge|stitch)-images?/cached/([^/?&]+)', working_url)
        if match:
            cache_id = match.group(1)
            cached = stitched_cache.get(cache_id)
            if cached:
                mime = cached.get("content_type", "application/octet-stream")
                return {"data": cached["data"], "content_type": mime, "contentType": mime}

    # 2. Unwrap any double-proxied URLs
    if '/api/proxy' in working_url:
        parsed = urlparse(working_url)
        query = parse_qs(parsed.query)
        if "url" in query:
            working_url = query["url"][0]

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
        ext = os.path.splitext(file_path)[1].lower()
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

    # 6. Fetch from local backend via internal network route
    if working_url.startswith('/api/'):
        port = BACKEND_PORT
        local_url = f"http://127.0.0.1:{port}{working_url}"

        async def _fetch_local(http_client):
            r = await http_client.get(local_url)
            r.raise_for_status()
            mime = r.headers.get("Content-Type", "application/octet-stream")
            return {"data": r.content, "content_type": mime, "contentType": mime}

        if client:
            return await _fetch_local(client)
        else:
            async with httpx.AsyncClient(timeout=30.0) as local_client:
                return await _fetch_local(local_client)

    # 7. Fallback to external remote fetch (e.g. raw Webtoon URLs or unproxied remote assets)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': spoof_referer(working_url),
        'Accept': 'image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8,audio/*,video/*',
    }

    async def _fetch_remote(http_client):
        # 3 retries for transient failures
        last_err = None
        for attempt in range(3):
            try:
                r = await http_client.get(working_url, headers=headers)
                r.raise_for_status()
                mime = r.headers.get("Content-Type", "application/octet-stream")
                return {"data": r.content, "content_type": mime, "contentType": mime}
            except Exception as e:
                last_err = e
                await asyncio.sleep(0.5 * (attempt + 1))
        raise Exception(f"Failed to fetch {working_url[:50]}... Error: {last_err}")

    if client:
        return await _fetch_remote(client)
    else:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as remote_client:
            return await _fetch_remote(remote_client)


async def resolve_image_to_buffer(url_str: str, client: Optional[httpx.AsyncClient] = None) -> Dict[str, Any]:
    return await resolve_url_to_buffer(url_str, client)
