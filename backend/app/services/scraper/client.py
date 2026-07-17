"""
backend/app/services/scraper/client.py
─────────────────────────────────────────────────────────────────────────────
Robust HTTP request fetcher and Playwright headless browser automation client
with regional and lazy-loading support.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import random
import logging
import asyncio
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse

# Graceful optional imports
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

from services.scraper.parsers import parse_image_dimensions_from_bytes, USER_AGENTS

logger = logging.getLogger("sonikoma.services.scraper.client")


async def prefetch_image_dimensions(url: str, headers: dict) -> Optional[Tuple[int, int]]:
    """Stream-downloads the first few bytes of an image to extract dimensions without pulling the whole payload."""
    if not httpx:
        return None
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=5.0) as client:
            async with client.stream("GET", url, headers=headers) as response:
                if response.status_code != 200:
                    return None
                data = b''
                async for chunk in response.iter_bytes(chunk_size=1024):
                    data += chunk
                    dims = parse_image_dimensions_from_bytes(data)
                    if dims:
                        return dims
                    if len(data) >= 8192:
                        break
    except Exception:
        pass
    return None


async def try_fetch_url_resilient(
    url: str,
    base_headers: dict,
    cookies: Optional[Dict[str, str]] = None,
    retries: int = 3
) -> Optional[str]:
    """Fetches HTML with UA rotation, domain referer spoofing, and TLS/library fallbacks."""
    parsed_domain = urlparse(url)
    headers = dict(base_headers)
    headers["Referer"] = f"{parsed_domain.scheme}://{parsed_domain.netloc}/"
    headers["Origin"] = f"{parsed_domain.scheme}://{parsed_domain.netloc}"

    if cookies:
        cookie_str = "; ".join([f"{k}={v}" for k, v in cookies.items()])
        if "Cookie" in headers:
            headers["Cookie"] = headers["Cookie"] + "; " + cookie_str
        else:
            headers["Cookie"] = cookie_str

    clients = []
    if httpx:
        clients.append("httpx")
    if aiohttp:
        clients.append("aiohttp")
    if requests:
        clients.append("requests")

    if not clients:
        logger.error("[Scraper] No active HTTP request client library (httpx, aiohttp, requests) found.")
        return None

    for attempt in range(1, retries + 1):
        headers["User-Agent"] = random.choice(USER_AGENTS)
        client_type = clients[(attempt - 1) % len(clients)]
        logger.info(f"[Scraper] HTTP client request {attempt}/{retries} via {client_type}")

        start_t = time.time()
        try:
            if client_type == "httpx":
                async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code == 200:
                        logger.info(f"[Scraper] Fetch success ({int((time.time() - start_t)*1000)}ms)")
                        return resp.text
                    elif resp.status_code in (403, 429):
                        logger.warning(f"[Scraper] Blocked status {resp.status_code} in client {client_type}")
                        return None
            elif client_type == "aiohttp":
                async with aiohttp.ClientSession(headers=headers) as session:
                    async with session.get(url, timeout=30.0, allow_redirects=True) as resp:
                        if resp.status == 200:
                            text = await resp.text()
                            logger.info(f"[Scraper] Fetch success ({int((time.time() - start_t)*1000)}ms)")
                            return text
                        elif resp.status in (403, 429):
                            logger.warning(f"[Scraper] Blocked status {resp.status} in client {client_type}")
                            return None
            elif client_type == "requests":
                def sync_req():
                    return requests.get(url, headers=headers, timeout=30.0, allow_redirects=True)
                loop = asyncio.get_running_loop()
                resp = await loop.run_in_executor(None, sync_req)
                if resp.status_code == 200:
                    logger.info(f"[Scraper] Fetch success ({int((time.time() - start_t)*1000)}ms)")
                    return resp.text
                elif resp.status_code in (403, 429):
                    logger.warning(f"[Scraper] Blocked status {resp.status_code} in client {client_type}")
                    return None
        except Exception as e:
            logger.warning(f"[Scraper] Attempt {attempt} via {client_type} failed: {e}")

        if attempt < retries:
            await asyncio.sleep(0.5 + random.random())

    return None


async def try_fetch_with_playwright(
    url: str,
    user_agent: str,
    referer: str,
    cookies: Optional[Dict[str, str]] = None,
    interactive: bool = True
) -> Optional[str]:
    """Playwright rendering fallback with lazy-load scrolling, clicker hooks, and HTML5 Canvas extraction."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.warning("[Scraper] Playwright not found. Browser rendering fallback bypassed.")
        return None

    logger.info("[Scraper] Launching Playwright browser instance...")
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=user_agent,
                extra_http_headers={"Referer": referer}
            )

            if cookies:
                parsed = urlparse(url)
                playwright_cookies = [
                    {"name": k, "value": v, "domain": parsed.netloc, "path": "/"}
                    for k, v in cookies.items()
                ]
                await context.add_cookies(playwright_cookies)

            page = await context.new_page()
            await page.set_viewport_size({"width": 1280, "height": 1080})
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)

            # Interactive click expansions
            if interactive:
                try:
                    expand_selectors = [
                        "button:has-text('Agree')", "button:has-text('Agree & Continue')",
                        "button:has-text('Confirm')", "button:has-text('Yes')",
                        "a:has-text('View Full')", ".btn_agree", ".btn_confirm",
                        "button:has-text('Load More')", "button:has-text('Show More')"
                    ]
                    for sel in expand_selectors:
                        buttons = await page.query_selector_all(sel)
                        for btn in buttons:
                            if await btn.is_visible():
                                logger.info(f"[Scraper] Playwright clicker clicked: {sel}")
                                await btn.click()
                                await asyncio.sleep(0.5)
                except Exception as click_err:
                    logger.debug(f"[Scraper] Interactive clicker exception: {click_err}")

            # Scrolling script to trigger lazy loading
            logger.info("[Scraper] Running scroll script for lazy-loaded assets...")
            for _ in range(8):
                await page.evaluate("window.scrollBy(0, 2000)")
                await page.wait_for_timeout(1000)

            # Extract HTML5 canvases to base64 Data URLs
            logger.info("[Scraper] Running canvas extraction script...")
            await page.evaluate("""() => {
                const canvases = document.querySelectorAll('canvas');
                canvases.forEach((canvas) => {
                    try {
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                        const img = document.createElement('img');
                        img.src = dataUrl;
                        img.className = '_images _canvas_extracted';
                        img.setAttribute('data-url', dataUrl);
                        img.style.display = 'block';
                        canvas.parentNode.replaceChild(img, canvas);
                    } catch (e) {
                        console.warn("Failed to extract canvas:", e);
                    }
                });
            }""")

            await page.wait_for_timeout(200)
            html = await page.content()
            await browser.close()
            return html
    except Exception as e:
        logger.error(f"[Scraper] Playwright task failed: {e}")
        return None
