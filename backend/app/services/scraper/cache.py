"""
Service layer for managing scraper cache.

Orchestrates the retrieval and storage of scraped HTML/Image data to prevent
redundant external network calls during subsequent pipeline runs.
"""

import logging
from repositories.episode_cache import get_episode_cache, check_sqlite_cache, save_sqlite_cache

logger = logging.getLogger('sonikoma.services.scraper.cache')

__all__ = ['get_episode_cache', 'check_sqlite_cache', 'save_sqlite_cache']
