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
            url_clean = url.lower().split("?")[0]

            is_image = (
                ("image/" in ct and not any(ign in ct for ign in ["svg", "gif", "icon"])) or
                any(url_clean.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".avif"])
            )
            if is_image and not any(ign in url_clean for ign in ["1x1", "spacer", "blank", "loading", "pixel", "avatar", "logo", "spinner"]):
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
