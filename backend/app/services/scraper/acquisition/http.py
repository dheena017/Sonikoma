"""
backend/app/services/scraper/acquisition/http.py
─────────────────────────────────────────────────────────────────────────────
Resilient HTTP fetcher with multi-client fallbacks (httpx, aiohttp, requests).
─────────────────────────────────────────────────────────────────────────────
"""

import time
import random
import logging
import asyncio
from typing import Dict, Optional, Tuple

try:
    import httpx
except ImportError:
    httpx = None

try:
    import aiohttp
except ImportError:
    aiohttp = None

try:
    import requests
except ImportError:
    requests = None

from .session import SessionManager
from ..diagnostics import ScraperDiagnosticsLogger
from ..rate_limiter import rate_limiter

logger = logging.getLogger("sonikoma.services.scraper.http")


class HttpFetcher:
    """Performs resilient asynchronous HTTP requests with rate pacing."""

    @classmethod
    async def fetch_html(
        cls,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        cookies: Optional[Dict[str, str]] = None,
        retries: int = 2,
        timeout: float = 25.0
    ) -> Tuple[Optional[str], Optional[int], float]:
        """
        Fetches HTML from a URL with retry backoff, client failovers, and domain rate limiting.
        Returns (html_content, status_code, duration_ms).
        """
        await rate_limiter.acquire_slot(url)
        try:
            return await cls._fetch_html_internal(url, headers, cookies, retries, timeout)
        finally:
            rate_limiter.release_slot(url)

    @classmethod
    async def _fetch_html_internal(
        cls,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        cookies: Optional[Dict[str, str]] = None,
        retries: int = 2,
        timeout: float = 25.0
    ) -> Tuple[Optional[str], Optional[int], float]:
        start_time = time.time()
        final_headers = SessionManager.build_headers(url, headers)
        final_cookies = SessionManager.build_cookies(cookies)

        cookie_str = SessionManager.format_cookie_header(final_cookies)
        if cookie_str:
            final_headers["Cookie"] = cookie_str

        clients = []
        if httpx:
            clients.append("httpx")
        if aiohttp:
            clients.append("aiohttp")
        if requests:
            clients.append("requests")

        if not clients:
            logger.error("[HttpFetcher] No HTTP client library (httpx, aiohttp, requests) is available.")
            return None, None, 0.0

        for attempt in range(1, retries + 1):
            client_type = clients[(attempt - 1) % len(clients)]
            try:
                if client_type == "httpx" and httpx is not None:
                    async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
                        resp = await client.get(url, headers=final_headers)
                        duration_ms = (time.time() - start_time) * 1000.0
                        ScraperDiagnosticsLogger.log_fetch("http_get", resp.status_code, duration_ms, "httpx")
                        if resp.status_code == 200:
                            return resp.text, resp.status_code, duration_ms
                        elif resp.status_code in (403, 429):
                            logger.warning(f"[HttpFetcher] Blocked status {resp.status_code} in httpx")
                            return None, resp.status_code, duration_ms

                elif client_type == "aiohttp" and aiohttp is not None:
                    async with aiohttp.ClientSession(headers=final_headers) as session:
                        async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout), allow_redirects=True) as resp:
                            duration_ms = (time.time() - start_time) * 1000.0
                            ScraperDiagnosticsLogger.log_fetch("http_get", resp.status, duration_ms, "aiohttp")
                            if resp.status == 200:
                                text = await resp.text()
                                return text, resp.status, duration_ms
                            elif resp.status in (403, 429):
                                logger.warning(f"[HttpFetcher] Blocked status {resp.status} in aiohttp")
                                return None, resp.status, duration_ms

                elif client_type == "requests" and requests is not None:
                    req_mod = requests
                    def _sync():
                        return req_mod.get(url, headers=final_headers, timeout=timeout, allow_redirects=True)
                    loop = asyncio.get_running_loop()
                    resp = await loop.run_in_executor(None, _sync)
                    duration_ms = (time.time() - start_time) * 1000.0
                    ScraperDiagnosticsLogger.log_fetch("http_get", resp.status_code, duration_ms, "requests")
                    if resp.status_code == 200:
                        return resp.text, resp.status_code, duration_ms
                    elif resp.status_code in (403, 429):
                        logger.warning(f"[HttpFetcher] Blocked status {resp.status_code} in requests")
                        return None, resp.status_code, duration_ms

            except Exception as e:
                logger.debug(f"[HttpFetcher] Attempt {attempt} via {client_type} failed: {e}")

            if attempt < retries:
                await asyncio.sleep(0.4 + random.random() * 0.3)

        duration_ms = (time.time() - start_time) * 1000.0
        return None, None, duration_ms
