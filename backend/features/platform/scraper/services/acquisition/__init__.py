"""
backend/app/services/scraper/acquisition/__init__.py
─────────────────────────────────────────────────────────────────────────────
Layer 1: Page Acquisition (Getting the Page)
─────────────────────────────────────────────────────────────────────────────
"""
from .http_page_fetcher import HttpFetcher
from .browser_page_fetcher import BrowserFetcher
from .browser_pool import BrowserPool, get_browser_pool, browser_pool
from .network_image_interceptor import NetworkInterceptor

__all__ = [
    "HttpFetcher",
    "BrowserFetcher",
    "BrowserPool",
    "get_browser_pool",
    "browser_pool",
    "NetworkInterceptor"
]
