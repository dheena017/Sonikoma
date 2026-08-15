"""
backend/app/services/scraper/extraction/api.py
─────────────────────────────────────────────────────────────────────────────
REST and GraphQL chapter API discovery and asset extraction.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional
from ..models import CandidateImage, ImageSourceType

logger = logging.getLogger("sonikoma.services.scraper.extraction.api")


class ApiExtractor:
    """Parses JSON responses from REST or GraphQL chapter endpoints into image lists."""

    @classmethod
    def extract_images_from_json(cls, data: Any, base_url: str = "") -> List[CandidateImage]:
        """Recursively parses JSON dictionary/array to find chapter image URLs with order."""
        candidates: List[CandidateImage] = []
        seen = set()

        def _traverse(obj: Any):
            if isinstance(obj, dict):
                # Check for explicit image URL fields
                for key in ("url", "src", "imageUrl", "image_url", "cdn_url", "downloadUrl", "cut_url"):
                    val = obj.get(key)
                    if isinstance(val, str) and val.startswith(("http://", "https://", "data:image/")):
                        if val not in seen:
                            seen.add(val)
                            candidates.append(CandidateImage(
                                url=val,
                                source_type=ImageSourceType.API,
                                dom_index=len(candidates),
                                is_inside_reader=True,
                                raw_attributes=obj
                            ))
                for v in obj.values():
                    _traverse(v)

            elif isinstance(obj, list):
                for item in obj:
                    if isinstance(item, str) and item.startswith(("http://", "https://", "data:image/")):
                        if item not in seen:
                            seen.add(item)
                            candidates.append(CandidateImage(
                                url=item,
                                source_type=ImageSourceType.API,
                                dom_index=len(candidates),
                                is_inside_reader=True
                            ))
                    else:
                        _traverse(item)

        _traverse(data)
        return candidates
