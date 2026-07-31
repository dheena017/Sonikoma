"""
backend/app/services/scraper/parsers/nuxt.py
"""
import re
from typing import List
from .utils import decode_escaped_js_string

def extract_images_from_nuxt_payload(html: str) -> List[str]:
    """Nuxt frame parsing fallback."""
    page_images = []
    nuxt_index = html.find('window.__NUXT__=')
    if nuxt_index == -1:
        return page_images

    end_script_index = html.find('</script>', nuxt_index)
    script_block = html[nuxt_index:] if end_script_index == -1 else html[nuxt_index:end_script_index]

    pages_match = re.search(r'pages:\s*\[([\s\S]*?)\]', script_block)
    if not pages_match:
        return page_images

    pages_content = pages_match.group(1)
    src_matches = re.findall(r'src:\s*"((?:\\.|[^"\\])*)"', pages_content)

    for src in src_matches:
        decoded = decode_escaped_js_string(src)
        if decoded.startswith(('http://', 'https://')):
            page_images.append(decoded)

    return page_images
