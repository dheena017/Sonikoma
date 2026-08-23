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
from urllib.parse import urlparse

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

from ..content_evaluator import ScraperDiagnosticsLogger
from ..domain_rate_limiter import rate_limiter
from ..scraper_constants import USER_AGENTS

logger = logging.getLogger("sonikoma.services.scraper.http")


class HttpFetcher:
    """Performs resilient asynchronous HTTP requests with rate pacing."""

    DEFAULT_COOKIES = {
        "needZoneZone": "true",
        "locale": "en",
        "cc": "US",
        "ageGatePass": "true",
        "adult": "true"
    }

    @classmethod
    def _build_headers(
        cls,
        url: str,
        custom_headers: Optional[Dict[str, str]] = None,
        referer: Optional[str] = None
    ) -> Dict[str, str]:
        """Constructs headers with automatic referer and random user agent."""
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.netloc else "https://www.webtoons.com"
        ref = referer or f"{origin}/"

        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Referer": ref,
            "Origin": origin,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,ko;q=0.8,ja;q=0.7",
            "Connection": "keep-alive",
            "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1"
        }
        if custom_headers:
            headers.update(custom_headers)
        return headers

    @classmethod
    def _build_cookies(cls, user_cookies: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        cookies = dict(cls.DEFAULT_COOKIES)
        if user_cookies:
            cookies.update(user_cookies)
        return cookies

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
        final_headers = cls._build_headers(url, headers)
        final_cookies = cls._build_cookies(cookies)

        if final_cookies:
            final_headers["Cookie"] = "; ".join([f"{k}={v}" for k, v in final_cookies.items()])

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
                            logger.info(f"[HttpFetcher] Cloudflare/Anti-Bot Challenge (HTTP {resp.status_code}) -> Auto-escalating to Level 2 (Stealth Browser)")
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
                                logger.info(f"[HttpFetcher] Cloudflare/Anti-Bot Challenge (HTTP {resp.status}) -> Auto-escalating to Level 2 (Stealth Browser)")
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
                        logger.info(f"[HttpFetcher] Cloudflare/Anti-Bot Challenge (HTTP {resp.status_code}) -> Auto-escalating to Level 2 (Stealth Browser)")
                        return None, resp.status_code, duration_ms


            except Exception as e:
                logger.debug(f"[HttpFetcher] Attempt {attempt} via {client_type} failed: {e}")

            if attempt < retries:
                await asyncio.sleep(0.4 + random.random() * 0.3)

        duration_ms = (time.time() - start_time) * 1000.0
        return None, None, duration_ms
