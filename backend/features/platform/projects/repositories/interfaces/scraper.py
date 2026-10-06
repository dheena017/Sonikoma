"""
backend/app/repositories/interfaces/scraper.py
─────────────────────────────────────────────────────────────────────────────
Abstract interface contracts for Scraper operations and panel editing history.
─────────────────────────────────────────────────────────────────────────────
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class IScraperRepository(ABC):
    """Abstract interface contract for persisting web scraping sessions and comic panel editing history."""

    @abstractmethod
    def save_scrape_session(self, url: str, image_urls: List[str]) -> None:
        """Saves a scrape session result, parsing and listing processed images."""
        pass

    @abstractmethod
    def get_latest_scrape_session(self, url: str) -> Optional[Dict[str, Any]]:
        """Retrieves the most recent scrape session matching a URL for local caching."""
        pass

    @abstractmethod
    def save_edit_history(self, edited_url: str, original_url: str, edit_type: str = 'edit') -> None:
        """Persists a panel edit history entry (for undo operations across restarts)."""
        pass

    @abstractmethod
    def get_edit_history(self, edited_url: str) -> Optional[Dict[str, Any]]:
        """Gets the previous panel image state before a modification occurred."""
        pass
