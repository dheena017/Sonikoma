"""
backend/app/services/scraper/reconstruction/canvas.py
─────────────────────────────────────────────────────────────────────────────
HTML5 Canvas rasterization and image extraction.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Optional, Any
from ..models import CandidateImage, ImageSourceType

logger = logging.getLogger("sonikoma.services.scraper.reconstruction.canvas")


class CanvasReconstructor:
    """Recovers and converts HTML5 Canvas elements into valid image candidates."""

    @classmethod
    async def extract_canvases_from_page(cls, page: Any) -> List[CandidateImage]:
        """
        Executes in-browser JavaScript to export all HTML5 Canvas elements as JPEG data URLs.
        """
        try:
            data_urls = await page.evaluate("""() => {
                const results = [];
                const canvases = document.querySelectorAll('canvas');
                canvases.forEach((c) => {
                    try {
                        const d = c.toDataURL('image/jpeg', 0.95);
                        if (d && d.startsWith('data:image/')) {
                            results.push({
                                dataUrl: d,
                                width: c.width || 0,
                                height: c.height || 0
                            });
                        }
                    } catch (e) {
                        console.warn("Canvas export error:", e);
                    }
                });
                return results;
            }""")

            candidates = []
            for idx, item in enumerate(data_urls or []):
                candidates.append(CandidateImage(
                    url=item["dataUrl"],
                    source_type=ImageSourceType.CANVAS,
                    dom_index=idx,
                    is_inside_reader=True,
                    width=item.get("width"),
                    height=item.get("height")
                ))
            return candidates
        except Exception as e:
            logger.debug(f"[CanvasReconstructor] Canvas extraction failed: {e}")
            return []
