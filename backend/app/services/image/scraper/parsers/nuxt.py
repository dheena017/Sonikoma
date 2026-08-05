"""
backend/app/services/image/scraper/parsers/nuxt.py
"""
import re
from typing import List
from .utils import decode_escaped_js_string

import json

def extract_images_from_nuxt_payload(html: str) -> List[str]:
    """Extracts chapter panel image URLs from Nuxt (__NUXT__), Next.js (__NEXT_DATA__), and JS initial state payloads."""
    page_images = []

    # 1. Next.js __NEXT_DATA__ payload
    next_match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
    if next_match:
        try:
            data = json.loads(next_match.group(1))
            data_str = json.dumps(data)
            img_matches = re.findall(r'https?://[^\s"\']+\.(?:png|jpg|jpeg|webp)(?:\?[^\s"\']*)?', data_str, re.IGNORECASE)
            for img in img_matches:
                if not any(ign in img.lower() for ign in ['logo', 'avatar', 'icon', 'profile', 'ogimage', 'banner', 'shared/']):
                    if img not in page_images:
                        page_images.append(img)
        except Exception:
            pass

    # 2. Nuxt.js window.__NUXT__ payload
    nuxt_index = html.find('window.__NUXT__=')
    if nuxt_index != -1:
        end_script_index = html.find('</script>', nuxt_index)
        script_block = html[nuxt_index:] if end_script_index == -1 else html[nuxt_index:end_script_index]

        pages_match = re.search(r'pages:\s*\[([\s\S]*?)\]', script_block)
        if pages_match:
            pages_content = pages_match.group(1)
            src_matches = re.findall(r'src:\s*"((?:\\.|[^"\\])*)"', pages_content)
            for src in src_matches:
                decoded = decode_escaped_js_string(src)
                if decoded.startswith(('http://', 'https://')) and decoded not in page_images:
                    page_images.append(decoded)

    # 3. Generic window.__INITIAL_STATE__ payload
    init_match = re.search(r'window\.__INITIAL_STATE__\s*=\s*(\{.*?\}\s*;)', html, re.DOTALL)
    if init_match:
        try:
            state_str = init_match.group(1)
            img_matches = re.findall(r'https?://[^\s"\']+\.(?:png|jpg|jpeg|webp)(?:\?[^\s"\']*)?', state_str, re.IGNORECASE)
            for img in img_matches:
                if not any(ign in img.lower() for ign in ['logo', 'avatar', 'icon', 'profile', 'banner']):
                    if img not in page_images:
                        page_images.append(img)
        except Exception:
            pass

    return page_images
