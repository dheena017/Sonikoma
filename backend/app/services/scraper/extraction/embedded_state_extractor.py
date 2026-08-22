"""
backend/app/services/scraper/extraction/embedded_state.py
─────────────────────────────────────────────────────────────────────────────
Extracts chapter assets and metadata from embedded application state
payloads (Next.js __NEXT_DATA__, Nuxt __NUXT__, JSON-LD, React SSR).
─────────────────────────────────────────────────────────────────────────────
"""

import re
import json
import logging
from typing import List, Dict, Any, Optional
from ..scraper_models import CandidateImage, ImageSourceType

logger = logging.getLogger("sonikoma.services.scraper.extraction.embedded")


class EmbeddedStateExtractor:
    """Extracts chapter images and metadata from embedded script tags and state trees."""

    @staticmethod
    def _decode_escaped_js_string(s: str) -> str:
        """Decodes unicode escaped sequences in Javascript strings."""
        if not s:
            return ""
        try:
            return s.encode('utf-8').decode('unicode-escape')
        except Exception:
            return s.replace('\\/', '/')

    @classmethod
    def extract_from_html(cls, html: str, base_url: str) -> List[CandidateImage]:
        """Extracts images from all supported embedded state formats."""
        if not html:
            return []

        candidates: List[CandidateImage] = []
        seen = set()

        def _add(url: str, source_type: ImageSourceType):
            if not url or not url.startswith(("http://", "https://", "data:image/")):
                return
            clean_url = cls._decode_escaped_js_string(url)
            if clean_url not in seen:
                seen.add(clean_url)
                candidates.append(CandidateImage(
                    url=clean_url,
                    source_type=source_type,
                    dom_index=len(candidates),
                    is_inside_reader=True
                ))

        # 1. Next.js __NEXT_DATA__
        next_match = re.search(r'<script\s+id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
        if next_match:
            try:
                data = json.loads(next_match.group(1))
                data_str = json.dumps(data)
                img_matches = re.findall(r'https?://[^\s"\']+\.(?:png|jpg|jpeg|webp|avif)(?:\?[^\s"\']*)?', data_str, re.IGNORECASE)
                for img in img_matches:
                    _add(img, ImageSourceType.EMBEDDED_STATE)
            except Exception as e:
                logger.debug(f"[EmbeddedStateExtractor] Next.js parse error: {e}")

        # 2. Nuxt.js window.__NUXT__
        nuxt_index = html.find('window.__NUXT__=')
        if nuxt_index != -1:
            end_index = html.find('</script>', nuxt_index)
            block = html[nuxt_index:] if end_index == -1 else html[nuxt_index:end_index]
            src_matches = re.findall(r'src:\s*"((?:\\.|[^"\\])*)"', block)
            for src in src_matches:
                _add(src, ImageSourceType.EMBEDDED_STATE)

            img_matches = re.findall(r'https?://[^\s"\']+\.(?:png|jpg|jpeg|webp|avif)(?:\?[^\s"\']*)?', block, re.IGNORECASE)
            for img in img_matches:
                _add(img, ImageSourceType.EMBEDDED_STATE)

        # 3. Generic window.__INITIAL_STATE__ or hydrationData
        init_matches = re.findall(r'window\.__INITIAL_STATE__\s*=\s*(\{.*?\}\s*;)', html, re.DOTALL)
        for state_str in init_matches:
            img_matches = re.findall(r'https?://[^\s"\']+\.(?:png|jpg|jpeg|webp|avif)(?:\?[^\s"\']*)?', state_str, re.IGNORECASE)
            for img in img_matches:
                _add(img, ImageSourceType.EMBEDDED_STATE)

        # 5. Generic <script type="application/json"> payloads
        app_json_matches = re.findall(r'<script\s+type="application/json"[^>]*>(.*?)</script>', html, re.DOTALL)
        for aj_text in app_json_matches:
            try:
                aj_data = json.loads(aj_text)
                aj_str = json.dumps(aj_data)
                img_matches = re.findall(r'https?://[^\s"\']+\.(?:png|jpg|jpeg|webp|avif)(?:\?[^\s"\']*)?', aj_str, re.IGNORECASE)
                for img in img_matches:
                    _add(img, ImageSourceType.EMBEDDED_STATE)
            except Exception:
                pass

        return candidates

    extract_state_images = extract_from_html

