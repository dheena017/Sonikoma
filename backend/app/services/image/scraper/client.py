"""
backend/app/services/image/scraper/client.py
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

from services.image.scraper.parsers import parse_image_dimensions_from_bytes, USER_AGENTS

logger = logging.getLogger("sonikoma.services.image.scraper.client")


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
                async for chunk in response.aiter_bytes(chunk_size=1024):
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
            if client_type == "httpx" and httpx is not None:
                async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code == 200:
                        logger.info(f"[Scraper] Fetch success ({int((time.time() - start_t)*1000)}ms)")
                        return resp.text
                    elif resp.status_code in (403, 429):
                        logger.warning(f"[Scraper] Blocked status {resp.status_code} in client {client_type}")
                        return None
            elif client_type == "aiohttp" and aiohttp is not None:
                async with aiohttp.ClientSession(headers=headers) as session:
                    async with session.get(url, timeout=aiohttp.ClientTimeout(total=30.0), allow_redirects=True) as resp:
                        if resp.status == 200:
                            text = await resp.text()
                            logger.info(f"[Scraper] Fetch success ({int((time.time() - start_t)*1000)}ms)")
                            return text
                        elif resp.status in (403, 429):
                            logger.warning(f"[Scraper] Blocked status {resp.status} in client {client_type}")
                            return None
            elif client_type == "requests" and requests is not None:
                req_mod = requests
                def sync_req():
                    return req_mod.get(url, headers=headers, timeout=30.0, allow_redirects=True)
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
                netloc = parsed.netloc or ""
                playwright_cookies = []
                for k, v in cookies.items():
                    c_dict = {"name": k, "value": str(v), "path": "/"}
                    if netloc:
                        c_dict["domain"] = netloc
                    elif url and url.startswith(("http://", "https://")):
                        c_dict["url"] = url
                    if "domain" in c_dict or "url" in c_dict:
                        playwright_cookies.append(c_dict)

                if playwright_cookies:
                    try:
                        await context.add_cookies(playwright_cookies)
                    except Exception as c_err:
                        logger.warning(f"[Scraper] Failed to set Playwright cookies: {c_err}")

            page = await context.new_page()
            await page.set_viewport_size({"width": 1280, "height": 1080})

            intercepted_image_urls = []
            async def handle_response(res):
                try:
                    ct = (res.headers.get("content-type") or "").lower()
                    if "image/" in ct and not any(ign in ct for ign in ["svg", "gif", "icon"]):
                        u = res.url
                        if u and u.startswith(("http://", "https://")):
                            intercepted_image_urls.append(u)
                except Exception:
                    pass

            page.on("response", handle_response)

            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            except Exception as nav_err:
                logger.info(f"[Scraper] Playwright domcontentloaded timeout, proceeding with commit state: {nav_err}")
                await page.goto(url, wait_until="commit", timeout=10000)

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

            logger.info("[Scraper] Running dynamic continuous scroll script to reach page bottom...")
            try:
                await page.evaluate("""async () => {
                    await new Promise((resolve) => {
                        let lastScrollTop = -1;
                        let sameCount = 0;
                        let maxTicks = 200;
                        let tick = 0;
                        const timer = setInterval(() => {
                            window.scrollBy(0, 3500);
                            const currentScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
                            tick++;
                            if (currentScrollTop === lastScrollTop) {
                                sameCount++;
                            } else {
                                sameCount = 0;
                                lastScrollTop = currentScrollTop;
                            }
                            if (sameCount >= 8 || tick >= maxTicks) {
                                clearInterval(timer);
                                resolve();
                            }
                        }, 120);
                    });
                }""")
                await page.wait_for_timeout(3000)
            except Exception as scroll_err:
                logger.debug(f"[Scraper] Dynamic scroll exception: {scroll_err}")

            logger.info("[Scraper] Running lazy-load DOM normalization and canvas extraction...")
            await page.evaluate("""() => {
                const lazyTags = document.querySelectorAll('img, source, [data-src], [data-original], [data-lazy-src], [data-url], [data-bg], [data-raw-src]');
                lazyTags.forEach((el) => {
                    const lazySrc = el.getAttribute('data-src') || 
                                    el.getAttribute('data-original') || 
                                    el.getAttribute('data-lazy-src') || 
                                    el.getAttribute('data-url') ||
                                    el.getAttribute('data-bg') ||
                                    el.getAttribute('data-original-src') ||
                                    el.getAttribute('data-raw-src') ||
                                    el.getAttribute('data-cdn') ||
                                    el.getAttribute('data-echo') ||
                                    el.getAttribute('srcset');
                    if (lazySrc) {
                        let cleanVal = lazySrc.trim();
                        if (cleanVal.includes(' ') && !cleanVal.startsWith('http')) {
                            cleanVal = cleanVal.split(' ')[0];
                        }
                        const curSrc = el.getAttribute('src') || '';
                        if (!curSrc || curSrc.includes('1x1.gif') || curSrc.includes('spacer.gif') || curSrc.includes('blank.gif') || curSrc.startsWith('data:image/gif')) {
                            el.setAttribute('src', cleanVal);
                        }
                    }
                });

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

            await page.wait_for_timeout(500)
            html = await page.content()
            if intercepted_image_urls:
                import json
                script_tag = f'<script id="__intercepted_images__" type="application/json">{json.dumps(intercepted_image_urls)}</script>'
                html = html + "\n" + script_tag
            await browser.close()
            return html
    except Exception as e:
        logger.error(f"[Scraper] Playwright task failed: {e}")
        return None
