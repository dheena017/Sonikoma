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
from urllib.parse import urljoin
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
                pass

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

    @classmethod
    def extract_series_and_episodes_from_state(cls, html: str, base_url: str) -> Optional[Dict[str, Any]]:
        """Parses series info and chapter list from Next.js (__NEXT_DATA__) or Nuxt state trees."""
        if not html:
            return None

        # 0. Check meta og:image from HTML header
        og_match = re.search(r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
        if not og_match:
            og_match = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\']', html, re.I)
        og_cover = og_match.group(1).strip() if og_match and og_match.group(1).strip() else ""

        # 1. Next.js __NEXT_DATA__
        next_match = re.search(r'<script\s+id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
        if next_match:
            try:
                data = json.loads(next_match.group(1))
                props = data.get("props", {}).get("pageProps", {})
                
                # Check for series/manga object
                series_obj = props.get("series") or props.get("manga") or props.get("comic") or props.get("data") or {}
                if isinstance(series_obj, dict):
                    title = series_obj.get("title") or series_obj.get("name") or ""
                    series_id = series_obj.get("series_id") or series_obj.get("id")
                    raw_cover = series_obj.get("cover") or series_obj.get("thumbnail") or series_obj.get("cover_image") or series_obj.get("poster") or ""
                    clean_base = base_url if base_url.endswith("/") else (base_url + "/")
                    
                    # Resolve series cover
                    if og_cover:
                        cover = og_cover
                    elif "flamecomics" in base_url and series_id and raw_cover and not raw_cover.startswith("http"):
                        cover = f"https://cdn.flamecomics.xyz/uploads/images/series/{series_id}/{raw_cover}"
                    elif raw_cover:
                        cover = urljoin(clean_base, raw_cover)
                    else:
                        cover = ""

                    author = series_obj.get("author") or series_obj.get("artist") or ""
                    
                    # Chapters can be in props or inside series_obj
                    raw_chapters = props.get("chapters") or series_obj.get("chapters") or []
                    if isinstance(raw_chapters, list) and raw_chapters:
                        episodes = []
                        for idx, ch in enumerate(raw_chapters):
                            if not isinstance(ch, dict):
                                continue
                            ch_num_val = ch.get("chapter") or ch.get("number", idx + 1)
                            ch_name = ch.get("title") or ch.get("name") or f"Chapter {ch_num_val}"
                            slug = ch.get("slug") or ch.get("chapter_id") or ch.get("id") or str(ch_num_val)
                            ch_url = f"{base_url.rstrip('/')}/chapter/{slug}" if not str(slug).startswith("http") else str(slug)
                            
                            # Resolve chapter thumbnail/cover
                            ch_token = ch.get("token")
                            if "flamecomics" in base_url and series_id and ch_token:
                                edit_time = ch.get("edit_time") or ch.get("release_date") or ""
                                time_param = f"?{edit_time}" if edit_time else ""
                                ch_cover = f"https://cdn.flamecomics.xyz/uploads/images/series/{series_id}/{ch_token}/cover.png{time_param}"
                            elif ch.get("cover_image") or ch.get("thumbnail"):
                                raw_ch_cover = ch.get("cover_image") or ch.get("thumbnail")
                                ch_cover = urljoin(clean_base, raw_ch_cover) if raw_ch_cover else cover
                            else:
                                ch_cover = cover

                            # Resolve release date
                            raw_date = ch.get("release_date") or ch.get("created_at") or ch.get("date") or ""
                            date_str = ""
                            if isinstance(raw_date, (int, float)) and raw_date > 0:
                                try:
                                    from datetime import datetime
                                    date_str = datetime.fromtimestamp(raw_date).strftime("%d/%m/%Y")
                                except Exception:
                                    date_str = str(raw_date)
                            elif raw_date:
                                date_str = str(raw_date)

                            episodes.append({
                                "title": ch_name,
                                "url": ch_url,
                                "number": str(ch_num_val),
                                "cover_image": ch_cover,
                                "date": date_str
                            })
                        if episodes:
                            return {
                                "title": title,
                                "cover_image": cover,
                                "author": author,
                                "chapters": episodes
                            }
            except Exception as e:
                pass

        return None

    extract_state_images = extract_from_html

