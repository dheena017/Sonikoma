"""
backend/app/services/image/image_resolver.py
─────────────────────────────────────────────────────────────────────────────
URL resolution and image/data fetching. Handles referrer bypass and spoofing.
─────────────────────────────────────────────────────────────────────────────
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
from config.ports import BACKEND_PORT

logger = logging.getLogger("sonikoma.services.image.image_resolver")


def spoof_referer(url: str) -> str:
    """Derive a plausible Referer for CDN bypass based on the image URL."""
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        if "webtoons" in host:
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

        clean_host = host
        for prefix in ["cdn.", "img.", "images.", "pic.", "pics.", "static.", "assets.", "media.", "uploads.", "files.", "storage."]:
            if clean_host.startswith(prefix):
                clean_host = clean_host[len(prefix):]
                break
        return f"{parsed.scheme}://{clean_host}/"
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

    # 1. Check cache
    if '/api/image/cached/' in working_url or '/api/merge-images/cached/' in working_url or '/api/stitch-images/cached/' in working_url:
        match = re.search(r'/(?:image|merge|stitch)-images?/cached/([^/?&]+)', working_url)
        if match:
            cache_id = match.group(1)
            cached = stitched_cache.get(cache_id)
            if cached:
                mime = cached.get("content_type", "application/octet-stream")
                return {"data": cached["data"], "content_type": mime, "contentType": mime}

    # 2. Unwrap proxy
    if '/api/proxy' in working_url:
        parsed = urlparse(working_url)
        query = parse_qs(parsed.query)
        if "url" in query:
            working_url = query["url"][0]

    # 3. Base64
    if working_url.startswith('data:'):
        header, rest = working_url.split(',', 1)
        buf = base64.b64decode(rest)
        mime_match = re.match(r'^data:([^;]+);base64', header)
        mime = mime_match.group(1) if mime_match else "application/octet-stream"
        return {"data": buf, "content_type": mime, "contentType": mime}

    # 4. file://
    if working_url.startswith('file://'):
        from urllib.parse import unquote
        file_path = working_url[7:]
        if file_path.startswith('/') and len(file_path) > 2 and file_path[2] == ':':
            file_path = file_path[1:]
        file_path = unquote(file_path)
        with open(file_path, 'rb') as f:
            buf = f.read()
        import mimetypes
        mime = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
        return {"data": buf, "content_type": mime, "contentType": mime}

    # 5. Normalize internal hostnames
    if re.match(r'^https?://', working_url, re.IGNORECASE):
        try:
            parsed = urlparse(working_url)
            host = parsed.hostname or ""
            if "run.app" in host or "localhost" in host or host == "127.0.0.1":
                working_url = parsed.path
                if parsed.query:
                    working_url += "?" + parsed.query
        except Exception:
            pass

    # 6. Relative paths
    if working_url.startswith('/'):
        port = BACKEND_PORT
        working_url = f"http://127.0.0.1:{port}{working_url}"

    # 7. Fetch remote
    logger.info(f"[Image Resolver] Fetching data from remote URL: {working_url[:60]}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer':    spoof_referer(working_url),
        'Accept':     '*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    max_retries = 3
    base_delay = 0.5
    response = None
    last_error = None

    for attempt in range(max_retries):
        try:
            if client:
                response = await client.get(working_url, headers=headers)
            else:
                async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as new_client:
                    response = await new_client.get(working_url, headers=headers)

            response.raise_for_status()
            content_type = response.headers.get('content-type', 'application/octet-stream')
            return {"data": response.content, "content_type": content_type, "contentType": content_type}

        except Exception as e:
            last_error = str(e)
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                logger.warning(f"[Image Resolver] Fetch attempt {attempt+1} failed for {working_url[:30]}... retrying in {delay}s. Error: {last_error}")
                await asyncio.sleep(delay)

    logger.error(f"[Image Resolver] Failed to resolve URL after {max_retries} attempts: {working_url[:60]}... Error: {last_error}")
    raise ValueError(f"Failed to fetch data from URL: {last_error}")


async def resolve_image_to_buffer(url_str: str, client: Optional[httpx.AsyncClient] = None) -> Dict[str, Any]:
    """
    Resolve ANY image URL (absolute, relative, /api/merge-images/cached, proxied)
    into a raw bytes + contentType.
    """
    if not url_str:
        raise ValueError('Empty image URL provided')

    working_url = url_str.strip()

    if '/api/image/cached/' in working_url or '/api/merge-images/cached/' in working_url or '/api/stitch-images/cached/' in working_url:
        match = re.search(r'/(?:image|merge|stitch)-images?/cached/([^/?&]+)', working_url)
        if match:
            cache_id = match.group(1)
            cached = stitched_cache.get(cache_id)
            if cached:
                mime = cached.get("content_type", "image/png")
                return {"data": cached["data"], "content_type": mime, "contentType": mime}

    if '/api/proxy-image' in working_url:
        parsed = urlparse(working_url)
        query = parse_qs(parsed.query)
        if "url" in query:
            working_url = query["url"][0]

    if working_url.startswith('data:image/'):
        header, rest = working_url.split(',', 1)
        buf = base64.b64decode(rest)
        mime_match = re.match(r'^data:(image/[a-z+]+);base64', header)
        mime = mime_match.group(1) if mime_match else "image/jpeg"
        return {"data": buf, "content_type": mime, "contentType": mime}

    if working_url.startswith('file://'):
        from urllib.parse import unquote
        file_path = working_url[7:]
        if file_path.startswith('/') and len(file_path) > 2 and file_path[2] == ':':
            file_path = file_path[1:]
        file_path = unquote(file_path)
        with open(file_path, 'rb') as f:
            buf = f.read()
        ext = os.path.splitext(file_path)[1].lower()
        mime_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        }
        mime = mime_types.get(ext, 'image/jpeg')
        return {"data": buf, "content_type": mime, "contentType": mime}

    if re.match(r'^https?://', working_url, re.IGNORECASE):
        try:
            parsed = urlparse(working_url)
            host = parsed.hostname or ""
            if "run.app" in host or "localhost" in host or host == "127.0.0.1":
                working_url = parsed.path
                if parsed.query:
                    working_url += "?" + parsed.query
        except Exception:
            pass

    if working_url.startswith('/'):
        port = BACKEND_PORT
        working_url = f"http://127.0.0.1:{port}{working_url}"

    logger.info(f"[Image Resolver] Fetching image from remote URL: {working_url[:60]}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer':    spoof_referer(working_url),
        'Accept':     'image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    max_retries = 3
    base_delay = 0.5
    response = None
    last_error = None

    for attempt in range(max_retries):
        try:
            if client:
                response = await client.get(working_url, headers=headers)
            else:
                async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as new_client:
                    response = await new_client.get(working_url, headers=headers)

            if response.status_code >= 500 and attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                logger.warning(f"[Image Resolver] Fetch status {response.status_code} (attempt {attempt + 1}/{max_retries}) | waiting {delay:.2f}s for {working_url[:50]}")
                await asyncio.sleep(delay)
                continue
            break
        except (httpx.HTTPError, httpx.RequestError) as req_err:
            last_error = req_err
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                logger.warning(f"[Image Resolver] Fetch network error: {req_err} (attempt {attempt + 1}/{max_retries}) | waiting {delay:.2f}s for {working_url[:50]}")
                await asyncio.sleep(delay)
            else:
                raise RuntimeError(f"Network error fetching image: {req_err} — {working_url}")

    if not response:
        raise RuntimeError(f"Failed to fetch image due to network errors: {last_error} — {working_url}")

    if response.status_code != 200:
        raise RuntimeError(f"Failed to fetch image: {response.status_code} — {working_url}")

    content_type = response.headers.get('Content-Type', 'image/jpeg')
    return {"data": response.content, "content_type": content_type, "contentType": content_type}
