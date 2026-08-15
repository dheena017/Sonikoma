"""
backend/app/services/scraper/acquisition/network.py
─────────────────────────────────────────────────────────────────────────────
Browser network traffic interception and asset tracking.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("sonikoma.services.scraper.network")


class NetworkInterceptor:
    """Tracks and intercepts network responses emitted during browser sessions."""

    def __init__(self):
        self.intercepted_images: List[str] = []
        self.intercepted_json_endpoints: List[Dict[str, Any]] = []

    async def handle_response(self, response: Any) -> None:
        """Playwright on('response') handler."""
        try:
            url = response.url
            if not url or not url.startswith(("http://", "https://")):
                return

            headers = response.headers
            ct = (headers.get("content-type") or "").lower()

            if "image/" in ct and not any(ign in ct for ign in ["svg", "gif", "icon"]):
                if url not in self.intercepted_images:
                    self.intercepted_images.append(url)
            elif "application/json" in ct or "text/json" in ct:
                self.intercepted_json_endpoints.append({
                    "url": url,
                    "status": response.status
                })
        except Exception as e:
            logger.debug(f"[NetworkInterceptor] Response handling exception: {e}")

    def get_image_urls(self) -> List[str]:
        """Returns list of unique intercepted image URLs."""
        return list(self.intercepted_images)
