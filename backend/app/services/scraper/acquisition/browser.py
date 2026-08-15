"""
backend/app/services/scraper/acquisition/browser.py
─────────────────────────────────────────────────────────────────────────────
Playwright browser automation and rendering client with configurable
User Agent, viewport, headers, session cookies, and lazy scrolling.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import asyncio
import random
from typing import Optional, Dict, Any, Tuple, List
from urllib.parse import urlparse

from .session import SessionManager
from .network import NetworkInterceptor
from .storage import BrowserStorageExtractor
from ..constants import USER_AGENTS

logger = logging.getLogger("sonikoma.services.scraper.browser")


class BrowserFetcher:
    """Manages headless browser automation via Playwright."""

    @classmethod
    async def render_page(
        cls,
        url: str,
        cookies: Optional[Dict[str, str]] = None,
        headers: Optional[Dict[str, str]] = None,
        interactive: bool = True,
        auto_scroll: bool = True,
        timeout_seconds: float = 30.0
    ) -> Tuple[Optional[str], List[str], Dict[str, Any]]:
        """
        Renders a page using Playwright.
        Returns:
            (rendered_html, intercepted_image_urls, storage_data)
        """
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            logger.warning("[BrowserFetcher] Playwright is not installed. Browser rendering bypassed.")
            return None, [], {}

        user_agent = (headers or {}).get("User-Agent") or random.choice(USER_AGENTS)
        referer = (headers or {}).get("Referer") or f"{urlparse(url).scheme}://{urlparse(url).netloc}/"
        merged_cookies = SessionManager.build_cookies(cookies)

        logger.info(f"[BrowserFetcher] Launching Playwright browser for: {url}")
        interceptor = NetworkInterceptor()

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent=user_agent,
                    extra_http_headers={"Referer": referer},
                    viewport={"width": 1280, "height": 1080}
                )

                # Set session cookies
                parsed = urlparse(url)
                netloc = parsed.netloc or ""
                playwright_cookies = []
                for k, v in merged_cookies.items():
                    c_dict = {"name": k, "value": str(v), "path": "/"}
                    if netloc:
                        c_dict["domain"] = netloc
                    elif url and url.startswith(("http://", "https://")):
                        c_dict["url"] = url
                    playwright_cookies.append(c_dict)

                if playwright_cookies:
                    try:
                        await context.add_cookies(playwright_cookies)
                    except Exception as c_err:
                        logger.debug(f"[BrowserFetcher] Cookie setup warning: {c_err}")

                page = await context.new_page()
                page.on("response", interceptor.handle_response)

                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=int(timeout_seconds * 500))
                except Exception:
                    try:
                        await page.goto(url, wait_until="commit", timeout=int(timeout_seconds * 300))
                    except Exception as e:
                        logger.debug(f"[BrowserFetcher] Navigation exception: {e}")

                # Interactive clickers (age gate, consent dialogs, load more)
                if interactive:
                    try:
                        selectors = [
                            "button:has-text('Agree')", "button:has-text('Agree & Continue')",
                            "button:has-text('Confirm')", "button:has-text('Yes')",
                            "a:has-text('View Full')", ".btn_agree", ".btn_confirm",
                            "button:has-text('Load More')", "button:has-text('Show More')"
                        ]
                        for sel in selectors:
                            buttons = await page.query_selector_all(sel)
                            for btn in buttons:
                                if await btn.is_visible():
                                    await btn.click()
                                    await asyncio.sleep(0.3)
                    except Exception as e:
                        logger.debug(f"[BrowserFetcher] Interactive click warning: {e}")

                # Progressive auto-scrolling for lazy-loaded assets
                if auto_scroll:
                    try:
                        await page.evaluate("""async () => {
                            await new Promise((resolve) => {
                                let lastScrollTop = -1;
                                let sameCount = 0;
                                let maxTicks = 150;
                                let tick = 0;
                                const timer = setInterval(() => {
                                    window.scrollBy(0, 3000);
                                    const currentScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
                                    tick++;
                                    if (currentScrollTop === lastScrollTop) {
                                        sameCount++;
                                    } else {
                                        sameCount = 0;
                                        lastScrollTop = currentScrollTop;
                                    }
                                    if (sameCount >= 6 || tick >= maxTicks) {
                                        clearInterval(timer);
                                        resolve();
                                    }
                                }, 100);
                            });
                        }""")
                        await page.wait_for_timeout(1500)
                    except Exception as e:
                        logger.debug(f"[BrowserFetcher] Auto-scroll warning: {e}")

                # Normalize lazy attributes in DOM
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
                            if (!curSrc || curSrc.includes('1x1.gif') || curSrc.includes('spacer.gif') || curSrc.includes('blank.gif')) {
                                el.setAttribute('src', cleanVal);
                            }
                        }
                    });
                }""")

                # Extract storage
                storage_data = await BrowserStorageExtractor.extract_storage(page)

                html = await page.content()
                await browser.close()
                return html, interceptor.get_image_urls(), storage_data

        except Exception as e:
            logger.error(f"[BrowserFetcher] Browser task failed: {e}")
            return None, [], {}
