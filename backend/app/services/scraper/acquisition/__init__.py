"""
backend/app/services/scraper/acquisition/__init__.py
"""
from .session import SessionManager
from .http import HttpFetcher
from .browser import BrowserFetcher
from .network import NetworkInterceptor
from .storage import BrowserStorageExtractor

__all__ = [
    "SessionManager",
    "HttpFetcher",
    "BrowserFetcher",
    "NetworkInterceptor",
    "BrowserStorageExtractor"
]
