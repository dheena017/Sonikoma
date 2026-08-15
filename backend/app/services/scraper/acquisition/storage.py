"""
backend/app/services/scraper/acquisition/storage.py
─────────────────────────────────────────────────────────────────────────────
Browser Storage acquisition (localStorage and sessionStorage).
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from typing import Dict, Any

logger = logging.getLogger("sonikoma.services.scraper.storage")


class BrowserStorageExtractor:
    """Extracts client-side storage states from a Playwright page instance."""

    @classmethod
    async def extract_storage(cls, page: Any) -> Dict[str, Dict[str, Any]]:
        """
        Extracts localStorage and sessionStorage from the active page.
        Returns {"local_storage": {...}, "session_storage": {...}}.
        """
        try:
            storage_data = await page.evaluate("""() => {
                const local = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    local[key] = localStorage.getItem(key);
                }
                const session = {};
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    session[key] = sessionStorage.getItem(key);
                }
                return { local_storage: local, session_storage: session };
            }""")
            return storage_data or {"local_storage": {}, "session_storage": {}}
        except Exception as e:
            logger.debug(f"[BrowserStorageExtractor] Storage extraction warning: {e}")
            return {"local_storage": {}, "session_storage": {}}
