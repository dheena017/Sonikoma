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
                    await page.goto(url, wait_until="networkidle", timeout=15000)
                except Exception:
                    try:
                        await page.goto(url, wait_until="load", timeout=10000)
                    except Exception:
                        try:
                            await page.goto(url, wait_until="domcontentloaded", timeout=6000)
                        except Exception as e:
                            logger.debug(f"[BrowserFetcher] Navigation exception: {e}")

                # Allow SPA dynamic hydration & API dispatch
                await asyncio.sleep(1.5)

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
                                    await btn.click(timeout=1000)
                                    await asyncio.sleep(0.1)
                    except Exception as e:
                        logger.debug(f"[BrowserFetcher] Interactive click warning: {e}")

                # Comprehensive progressive auto-scrolling for 100% lazy-loaded asset discovery
                if auto_scroll:
                    try:
                        await page.evaluate("""async () => {
                            window.__scraped_accumulated_images = window.__scraped_accumulated_images || [];
                            const scanImages = () => {
                                const els = document.querySelectorAll('img, source, [data-src], [data-original], [data-lazy-src], [data-url], [data-bg], [data-raw-src]');
                                els.forEach(el => {
                                    let raw = el.getAttribute('data-src') ||
                                              el.getAttribute('data-original') ||
                                              el.getAttribute('data-lazy-src') ||
                                              el.getAttribute('data-url') ||
                                              el.getAttribute('data-bg') ||
                                              el.getAttribute('data-cdn') ||
                                              el.src;
                                    if (raw && typeof raw === 'string') {
                                        let src = raw.trim();
                                        if (src.includes(' ') && !src.startsWith('data:')) {
                                            src = src.split(/\s+/)[0];
                                        }
                                        if (src && !src.startsWith('data:image/svg') && !src.includes('1x1') && !src.includes('spacer') && !window.__scraped_accumulated_images.includes(src)) {
                                            window.__scraped_accumulated_images.push(src);
                                        }
                                    }
                                });
                            };

                            scanImages();

                            await new Promise((resolve) => {
                                let totalHeight = 0;
                                let distance = 1500;
                                let maxLoops = 100;
                                let loops = 0;
                                let lastHeight = document.body.scrollHeight;
                                let sameHeightCount = 0;

                                const timer = setInterval(() => {
                                    window.scrollBy(0, distance);
                                    window.dispatchEvent(new Event('scroll'));
                                    totalHeight += distance;
                                    loops++;
                                    scanImages();

                                    const currentHeight = document.body.scrollHeight;
                                    if (currentHeight <= lastHeight && totalHeight >= currentHeight) {
                                        sameHeightCount++;
                                    } else {
                                        sameHeightCount = 0;
                                        lastHeight = Math.max(lastHeight, currentHeight);
                                    }

                                    if (sameHeightCount >= 16 || loops >= maxLoops) {
                                        clearInterval(timer);
                                        scanImages();
                                        resolve();
                                    }
                                }, 100);
                            });
                        }""")
                        await asyncio.sleep(1.0)
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

                # Extract accumulated images during scroll
                accumulated_images = []
                try:
                    accumulated_images = await page.evaluate("() => window.__scraped_accumulated_images || []")
                except Exception as e:
                    logger.debug(f"[BrowserFetcher] Accumulated images extract notice: {e}")

                # Extract storage
                storage_data = await BrowserStorageExtractor.extract_storage(page)

                html = await page.content()
                await browser.close()

                net_urls = interceptor.get_image_urls()
                all_combined_images = list(dict.fromkeys(net_urls + [img for img in accumulated_images if isinstance(img, str) and img.startswith("http")]))
                return html, all_combined_images, storage_data

        except Exception as e:
            logger.error(f"[BrowserFetcher] Browser task failed: {e}")
            return None, [], {}
