"""
backend/app/services/scraper/reconstruction/blob.py
─────────────────────────────────────────────────────────────────────────────
Blob URL resolution and binary data conversion.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Optional, Any
from ..models import CandidateImage, ImageSourceType

logger = logging.getLogger("sonikoma.services.scraper.reconstruction.blob")


class BlobReconstructor:
    """Converts browser-native blob: URLs into standard Data URLs."""

    @classmethod
    async def resolve_blob_urls(cls, page: Any, blob_urls: List[str]) -> List[CandidateImage]:
        """
        Executes JavaScript in the browser to fetch blob URLs and convert them to base64 data URLs.
        """
        if not blob_urls:
            return []
        try:
            converted = await page.evaluate("""async (urls) => {
                const results = [];
                for (const u of urls) {
                    try {
                        const response = await fetch(u);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        const dataUrl = await new Promise((resolve, reject) => {
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        results.push({ original: u, dataUrl: dataUrl });
                    } catch (err) {
                        console.warn("Blob conversion error:", err);
                    }
                }
                return results;
            }""", blob_urls)

            candidates = []
            for idx, item in enumerate(converted or []):
                candidates.append(CandidateImage(
                    url=item["dataUrl"],
                    source_type=ImageSourceType.BLOB,
                    dom_index=idx,
                    is_inside_reader=True
                ))
            return candidates
        except Exception as e:
            logger.debug(f"[BlobReconstructor] Blob conversion failed: {e}")
            return []
