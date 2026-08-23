"""
backend/app/services/scraper/acquisition/pool.py
─────────────────────────────────────────────────────────────────────────────
Browser Resource Pool & Concurrency Manager for Headless Playwright.
Controls maximum simultaneous browser workers (default: 4), ensuring memory
stability, ephemeral context isolation per domain, and queue lifecycle management.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import asyncio
import logging
from typing import Optional, Dict, Any, Tuple, List, Callable, Awaitable
from urllib.parse import urlparse

# Windows Python 3.8-3.12 ProactorEventLoop Pipe Transport Cleanup Patch
if sys.platform == "win32":
    try:
        from functools import wraps
        from asyncio.proactor_events import _ProactorBasePipeTransport
        from asyncio.base_subprocess import BaseSubprocessTransport

        def _silence_asyncio_del(func):
            @wraps(func)
            def wrapper(self, *args, **kwargs):
                try:
                    func(self, *args, **kwargs)
                except (RuntimeError, BaseException):
                    pass
            return wrapper

        if hasattr(_ProactorBasePipeTransport, "__del__"):
            _ProactorBasePipeTransport.__del__ = _silence_asyncio_del(_ProactorBasePipeTransport.__del__)
        if hasattr(BaseSubprocessTransport, "__del__"):
            BaseSubprocessTransport.__del__ = _silence_asyncio_del(BaseSubprocessTransport.__del__)
    except Exception:
        pass

logger = logging.getLogger("sonikoma.services.scraper.browser.pool")


class BrowserPool:
    """
    Centralized resource manager for Playwright instances.
    Controls concurrency via an asynchronous semaphore and provides isolated browser contexts.
    """

    _instance: Optional["BrowserPool"] = None
    _lock = asyncio.Lock()

    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self._semaphore: Optional[asyncio.Semaphore] = None
        self._playwright = None
        self._browser = None
        self._active_jobs = 0
        self._is_closing = False

    @classmethod
    def get_instance(cls) -> "BrowserPool":
        if cls._instance is None:
            max_workers = int(os.getenv("MAX_BROWSER_WORKERS", "4"))
            cls._instance = cls(max_workers=max_workers)
        return cls._instance

    def _get_semaphore(self) -> asyncio.Semaphore:
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(self.max_workers)
        return self._semaphore

    async def _close_internal(self):
        if self._browser:
            try:
                await self._browser.close()
            except Exception:
                pass
            self._browser = None
        if self._playwright:
            try:
                await self._playwright.stop()
            except Exception:
                pass
            self._playwright = None

    async def _ensure_browser(self):
        """Initializes shared Playwright Chromium instance if not already running."""
        async with self._lock:
            if self._browser is not None:
                try:
                    if not self._browser.is_connected():
                        await self._close_internal()
                except Exception:
                    await self._close_internal()

            if self._browser is None:
                try:
                    from playwright.async_api import async_playwright
                    if self._playwright is None:
                        self._playwright = await async_playwright().start()
                    self._browser = await self._playwright.chromium.launch(
                        headless=True,
                        args=[
                            "--disable-gpu",
                            "--disable-dev-shm-usage",
                            "--no-sandbox",
                            "--disable-blink-features=AutomationControlled",
                        ]
                    )
                    logger.info(f"[BrowserPool] Started shared Chromium instance (Max workers: {self.max_workers})")
                except Exception as e:
                    logger.error(f"[BrowserPool] Failed to launch Playwright browser: {e}")
                    await self._close_internal()
                    raise

    async def execute_task(
        self,
        task_coro_fn: Callable[[Any, Any], Awaitable[Any]],
        user_agent: Optional[str] = None,
        referer: Optional[str] = None,
        cookies: Optional[Dict[str, str]] = None,
        domain: Optional[str] = None,
        timeout_seconds: float = 30.0
    ) -> Any:
        """
        Acquires a concurrency slot from the pool, creates an isolated BrowserContext,
        executes the task, and ensures context destruction afterwards.
        """
        sem = self._get_semaphore()
        logger.debug(f"[BrowserPool] Waiting for available worker slot (Active: {self._active_jobs}/{self.max_workers})")

        async with sem:
            self._active_jobs += 1
            await self._ensure_browser()

            # Create ephemeral isolated context with auto-recovery
            try:
                context = await self._browser.new_context(
                    user_agent=user_agent or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    extra_http_headers={"Referer": referer or ""} if referer else {},
                    viewport={"width": 1280, "height": 1080}
                )
            except Exception:
                await self._close_internal()
                await self._ensure_browser()
                context = await self._browser.new_context(
                    user_agent=user_agent or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    extra_http_headers={"Referer": referer or ""} if referer else {},
                    viewport={"width": 1280, "height": 1080}
                )

            # Set domain cookies if supplied
            if cookies and domain:
                pw_cookies = [{"name": k, "value": str(v), "domain": domain, "path": "/"} for k, v in cookies.items()]
                try:
                    await context.add_cookies(pw_cookies)
                except Exception:
                    pass

            page = await context.new_page()
            try:
                result = await asyncio.wait_for(
                    task_coro_fn(page, context),
                    timeout=timeout_seconds
                )
                return result
            except (asyncio.TimeoutError, asyncio.CancelledError):
                logger.debug(f"[BrowserPool] Task timed out or was cancelled after {timeout_seconds}s")
                return "", [], {}
            except Exception as e:
                if "TargetClosedError" not in type(e).__name__ and "closed" not in str(e).lower():
                    logger.debug(f"[BrowserPool] Worker task error: {e}")
                return "", [], {}
            finally:
                self._active_jobs = max(0, self._active_jobs - 1)
                try:
                    if not page.is_closed():
                        await page.close()
                except Exception:
                    pass
                try:
                    await context.close()
                except Exception:
                    pass

    async def close_all(self):
        """Gracefully closes all browser instances and stops Playwright."""
        async with self._lock:
            if self._browser:
                try:
                    await self._browser.close()
                except Exception:
                    pass
                self._browser = None
            if self._playwright:
                try:
                    await self._playwright.stop()
                except Exception:
                    pass
                self._playwright = None
            logger.info("[BrowserPool] Closed all browser instances.")


browser_pool = BrowserPool.get_instance()
get_browser_pool = BrowserPool.get_instance
