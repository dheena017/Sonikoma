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
    # Using simplified implementation for shim
    if not url_str:
        raise ValueError('Empty URL provided')
    working_url = url_str.strip()
    if working_url.startswith('data:'):
        header, rest = working_url.split(',', 1)
        buf = base64.b64decode(rest)
        mime_match = re.match(r'^data:([^;]+);base64', header)
        mime = mime_match.group(1) if mime_match else "application/octet-stream"
        return {"data": buf, "content_type": mime, "contentType": mime}
    # Fallback to original resolver if needed elsewhere
    raise NotImplementedError("Call original resolver directly if shimming is insufficient")


async def resolve_image_to_buffer(url_str: str, client: Optional[httpx.AsyncClient] = None) -> Dict[str, Any]:
    return await resolve_url_to_buffer(url_str, client)
