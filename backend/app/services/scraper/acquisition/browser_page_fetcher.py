"""
backend/app/services/scraper/acquisition/browser.py
─────────────────────────────────────────────────────────────────────────────
High-fidelity headless browser rendering engine with stealth, auto-scroll,
DOM mutation tracking, and network asset interception.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import random
import asyncio
import logging
from typing import Tuple, List, Dict, Any, Optional
from urllib.parse import urlparse

from .browser_pool import browser_pool, BrowserPool
from .network_image_interceptor import NetworkInterceptor
from ..scraper_constants import USER_AGENTS

logger = logging.getLogger("sonikoma.services.scraper.browser")


class BrowserFetcher:
    """
    Tier-3 browser acquisition engine using pooled headless Playwright.
    Executes deep dynamic SPA rendering, auto-scrolling, and asset sniffing.
    """

    DEFAULT_COOKIES = {
        "content_view_mode": "scroll",
        "viewer_mode": "webtoon",
        "age_gate_pass": "1",
        "over19": "Y",
        "is_adult": "1",
        "adult": "true",
        "wls": "en_US"
    }

    @classmethod
    async def render_page(
        cls,
        url: str,
        cookies: Optional[Dict[str, str]] = None,
        headers: Optional[Dict[str, str]] = None,
        auto_scroll: bool = True,
        interactive: bool = True,
        wait_selector: Optional[str] = None,
        timeout_seconds: float = 30.0
    ) -> Tuple[Optional[str], List[str], Dict[str, Any]]:
        """
        Renders a webpage via headless Playwright, performing auto-scrolling,
        DOM sweeps, and network response interception.
        """
        user_agent = (headers or {}).get("User-Agent") or random.choice(USER_AGENTS)
        referer = (headers or {}).get("Referer") or f"{urlparse(url).scheme}://{urlparse(url).netloc}/"
        merged_cookies = dict(cls.DEFAULT_COOKIES)
        if cookies:
            merged_cookies.update(cookies)
        domain = urlparse(url).netloc

        interceptor = NetworkInterceptor()

        async def _worker_task(page, context):
            try:
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
                if not page.is_closed():
                    try:
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
                    except Exception as e:
                        logger.debug(f"[BrowserFetcher] DOM lazy normalization warning: {e}")

                accumulated_images = []
                if not page.is_closed():
                    try:
                        accumulated_images = await page.evaluate("() => window.__scraped_accumulated_images || []")
                    except Exception:
                        pass

                storage_data = {}
                if not page.is_closed():
                    try:
                        storage_data = await page.evaluate("""() => {
                            const local = {};
                            for (let i = 0; i < localStorage.length; i++) {
                                const k = localStorage.key(i);
                                local[k] = localStorage.getItem(k);
                            }
                            return { localStorage: local };
                        }""")
                    except Exception:
                        pass

                html = ""
                if not page.is_closed():
                    try:
                        html = await page.content()
                    except Exception:
                        pass

                net_urls = interceptor.get_image_urls()
                all_combined = list(dict.fromkeys(net_urls + [img for img in accumulated_images if isinstance(img, str) and img.startswith("http")]))
                return html, all_combined, storage_data
            except BaseException as e:
                if "TargetClosedError" not in type(e).__name__ and "closed" not in str(e).lower():
                    logger.debug(f"[BrowserFetcher] Worker task exception: {e}")
                return "", [], {}
            finally:
                try:
                    page.remove_listener("response", interceptor.handle_response)
                except BaseException:
                    pass

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
