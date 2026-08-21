"""
backend/app/services/scraper/acquisition/browser.py
─────────────────────────────────────────────────────────────────────────────
Playwright browser automation client routed through BrowserPool.
Provides configurable User Agent, viewport, headers, session cookies,
progressive lazy scrolling, and network response interception.
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
from .pool import browser_pool
from ..constants import USER_AGENTS

logger = logging.getLogger("sonikoma.services.scraper.browser")


class BrowserFetcher:
    """Manages headless browser automation via pooled Playwright instances."""

    @classmethod
    async def render_page(
        cls,
        url: str,
        cookies: Optional[Dict[str, str]] = None,
        headers: Optional[Dict[str, str]] = None,
        interactive: bool = True,
        auto_scroll: bool = True,
        wait_selector: Optional[str] = None,
        timeout_seconds: float = 30.0
    ) -> Tuple[Optional[str], List[str], Dict[str, Any]]:
        """
        Renders a page using pooled Playwright workers.
        Returns:
            (rendered_html, intercepted_image_urls, storage_data)
        """
        user_agent = (headers or {}).get("User-Agent") or random.choice(USER_AGENTS)
        referer = (headers or {}).get("Referer") or f"{urlparse(url).scheme}://{urlparse(url).netloc}/"
        merged_cookies = SessionManager.build_cookies(cookies)
        domain = urlparse(url).netloc

        interceptor = NetworkInterceptor()

        async def _worker_task(page, context):
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
            await asyncio.sleep(1.2)

            if wait_selector:
                try:
                    await page.wait_for_selector(wait_selector, timeout=4000)
                except Exception:
                    pass

            # Interactive clickers (age gate, consent dialogs, chapter accordions, load more)
            if interactive:
                try:
                    selectors = [
                        "button:has-text('Agree')", "button:has-text('Agree & Continue')",
                        "button:has-text('Confirm')", "button:has-text('Yes')",
                        "a:has-text('View Full')", ".btn_agree", ".btn_confirm",
                        "button:has-text('Load More')", "button:has-text('Show More')",
                        "a:has-text('Load More')", "a:has-text('Show all chapters')",
                        ".btn-load-more", "#btn-more", ".chapter-readmore", ".show-all-chapters"
                    ]
                    # Click up to 5 times for multi-stage "Load More" lists
                    for _ in range(5):
                        clicked_any = False
                        for sel in selectors:
                            buttons = await page.query_selector_all(sel)
                            for btn in buttons:
                                if await btn.is_visible():
                                    try:
                                        await btn.click(timeout=1000)
                                        clicked_any = True
                                        await asyncio.sleep(0.3)
                                    except Exception:
                                        pass
                        if not clicked_any:
                            break
                except Exception as e:
                    logger.debug(f"[BrowserFetcher] Interactive click warning: {e}")

            # Progressive auto-scrolling for lazy-loaded asset discovery
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
                                        src = src.split(/\\s+/)[0];
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
                            let maxLoops = 60;
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

                                if (sameHeightCount >= 10 || loops >= maxLoops) {
                                    clearInterval(timer);
                                    scanImages();
                                    resolve();
                                }
                            }, 100);
                        });
                    }""")
                    await asyncio.sleep(0.8)
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

            accumulated_images = []
            try:
                accumulated_images = await page.evaluate("() => window.__scraped_accumulated_images || []")
            except Exception:
                pass

            storage_data = await BrowserStorageExtractor.extract_storage(page)
            html = await page.content()

            net_urls = interceptor.get_image_urls()
            all_combined = list(dict.fromkeys(net_urls + [img for img in accumulated_images if isinstance(img, str) and img.startswith("http")]))
            return html, all_combined, storage_data

        try:
            return await browser_pool.execute_task(
                _worker_task,
                user_agent=user_agent,
                referer=referer,
                cookies=merged_cookies,
                domain=domain,
                timeout_seconds=timeout_seconds
            )
        except Exception as e:
            logger.error(f"[BrowserFetcher] Pooled browser execution failed: {e}")
            return None, [], {}
