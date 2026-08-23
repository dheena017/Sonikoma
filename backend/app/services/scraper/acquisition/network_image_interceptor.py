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
            url = getattr(response, "url", None)
            if not url or not url.startswith(("http://", "https://")):
                return

            try:
                headers = response.headers
            except BaseException:
                headers = {}

            ct = (headers.get("content-type") or "").lower() if headers else ""
            url_clean = url.lower().split("?")[0]

            is_image = (
                ("image/" in ct and not any(ign in ct for ign in ["svg", "gif", "icon"])) or
                any(url_clean.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".avif"])
            )
            if is_image and not any(ign in url_clean for ign in ["1x1", "spacer", "blank", "loading", "pixel", "avatar", "logo", "spinner"]):
                if url not in self.intercepted_images:
                    self.intercepted_images.append(url)
            elif ct and ("application/json" in ct or "text/json" in ct):
                try:
                    status_code = response.status
                except BaseException:
                    status_code = 200
                self.intercepted_json_endpoints.append({
                    "url": url,
                    "status": status_code
                })
        except BaseException:
            pass

    def get_image_urls(self) -> List[str]:
        """Returns list of unique intercepted image URLs."""
        return list(self.intercepted_images)
