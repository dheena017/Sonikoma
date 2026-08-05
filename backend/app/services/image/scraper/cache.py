"""
backend/app/services/image/scraper/cache.py
─────────────────────────────────────────────────────────────────────────────
Service layer for managing scraper cache.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from repositories.episode_cache import get_episode_cache, check_sqlite_cache, save_sqlite_cache

logger = logging.getLogger('sonikoma.services.image.scraper.cache')

__all__ = ['get_episode_cache', 'check_sqlite_cache', 'save_sqlite_cache']
