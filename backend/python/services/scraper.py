"""
backend/python/services/scraper.py
─────────────────────────────────────────────────────────────────────────────
Webtoon page content scraping and HTML parsing computational service.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import logging
import asyncio
import httpx
from typing import List, Optional
from urllib.parse import urlparse, quote

from utils.url_utils import extract_webtoon_url

logger = logging.getLogger("anivox.services.scraper")

def decode_escaped_js_string(value: str) -> str:
    """Helper to decode JS escapes (e.g. \\u002F -> /)"""
    try:
        # Decode Unicode sequences
        decoded = value.encode().decode('unicode-escape')
        # Standard cleanups
        for raw, clean in [('\\n', ''), ('\\r', ''), ('\\t', ''), ("\\'", "'"), ('\\"', '"'), ('\\\\', '\\')]:
            decoded = decoded.replace(raw, clean)
        return decoded
    except Exception:
        return value


def extract_images_from_nuxt_payload(html: str) -> List[str]:
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


async def try_fetch_url(url: str, headers: dict, timeout_sec=30.0, retries=2) -> Optional[str]:
    for attempt in range(1, retries + 1):
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=timeout_sec) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    return resp.text
                logger.warning(f"[Scraper] Fetch status {resp.status_code} for {url} (attempt {attempt}/{retries})")
        except Exception as e:
            logger.warning(f"[Scraper] Fetch error for {url} (attempt {attempt}/{retries}): {e}")
            if attempt < retries:
                await asyncio.sleep(0.6)
    return None


async def scrape_images_from_url(url: str, source: Optional[str] = None) -> List[str]:
    """
    Crawls a Webtoon episode page and isolates the panel image URLs.
    Spins up Playwright fallback if static HTTP fetches fail.
    """
    fetch_url = extract_webtoon_url(url)
    referer = "https://www.webcomicsapp.com/" if source == 'webcomicsapp' else "https://www.webtoons.com/"
    
    fetch_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": referer,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Cookie": "needZoneZone=true; locale=en; cc=US; ageGatePass=true; adult=true"
    }

    logger.info(f"[Scraper] Scraping: {fetch_url}")
    html = await try_fetch_url(fetch_url, fetch_headers, timeout_sec=45.0)

    if not html:
        # Fallback to regional completion
        try:
            parsed_url = urlparse(url)
            path_parts = [p for p in parsed_url.path.split('/') if p]
            # If path lacks regional language code e.g. /en/
            if path_parts and not re.match(r'^[a-z]{2}(-[a-z]{2,4})?$', path_parts[0], re.IGNORECASE):
                fallback_path = '/en/' + '/'.join(path_parts)
                fallback_url = parsed_url._replace(path=fallback_path).geturl()
                logger.info(f"[Scraper] Fallback: trying regional URL: {fallback_url}")
                html = await try_fetch_url(fallback_url, fetch_headers, timeout_sec=45.0)
        except Exception as e:
            logger.warning(f"[Scraper] Regional completion fallback failed: {e}")

    # Playwright browser fallback
    if not html:
        logger.info("[Scraper] Direct fetch failed. Attempting Playwright fallback...")
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page(
                    user_agent=fetch_headers["User-Agent"],
                    extra_http_headers={"Referer": fetch_headers["Referer"]}
                )
                await page.goto(fetch_url, wait_until="networkidle", timeout=45000)
                html = await page.content()
                await browser.close()
                logger.info("[Scraper] Playwright fallback succeeded.")
        except ImportError:
            logger.warning("[Scraper] Playwright library not installed. Skipping browser fallback.")
        except Exception as e:
            logger.error(f"[Scraper] Playwright fallback failed: {e}")

    if not html:
        raise RuntimeError("Failed to retrieve page content from all scraping avenues.")

    image_dict = {}

    # Isolate viewer container blocks for precise search (prevents ads/comments from polluting results)
    search_block = html
    start_idx = -1

    # Match viewer_lst container
    container_match = re.search(r'<(div|ul|section)\s+[^>]*?class=["\'][^"\']*?viewer_lst[^"\']*?["\'][^>]*?>', html, re.IGNORECASE)
    if not container_match:
        container_match = re.search(r'<(div|ul|section)\s+[^>]*?(?:id=["\']_imageList["\']|class=["\'][^"\']*?_imageList[^"\']*?")[^>]*?>', html, re.IGNORECASE)

    if container_match:
        start_idx = container_match.start()
        start_tag = container_match.group(0)
        tag_type = container_match.group(1)
        
        # Balance tags to find closing container tag
        after_start = html[start_idx + len(start_tag):]
        balance = 1
        end_idx_in_after = -1
        tag_regex = re.compile(rf'</?{tag_type}\b[^>]*>', re.IGNORECASE)
        
        for m in tag_regex.finditer(after_start):
            matched_tag = m.group(0)
            if matched_tag.startswith('</'):
                balance -= 1
            elif not matched_tag.endswith('/>'):
                balance += 1
                
            if balance == 0:
                end_idx_in_after = m.end()
                break
                
        if end_idx_in_after != -1:
            absolute_end_idx = start_idx + len(start_tag) + end_idx_in_after
            search_block = html[start_idx:absolute_end_idx]
            logger.info(f"[Scraper] Isolated reader container from index {start_idx} to {absolute_end_idx}")
        else:
            search_block = html[start_idx:start_idx + 300000]
    else:
        # Generic container identifier fallback
        candidate_keys = ['id="_imageList"', 'class="_imageList"', 'class="viewer_img"', 'class="viewer_lst"', 'id="image_list"']
        for key in candidate_keys:
            potential_idx = html.find(key)
            body_idx = html.find("<body")
            if potential_idx != -1 and (body_idx == -1 or potential_idx > body_idx):
                start_idx = potential_idx
                break
                
        if start_idx != -1:
            end_idx = -1
            end_tag_regex = re.compile(r'<(?:div|section|aside|footer)\s+[^>]*?(?:id=["\'](?:commentArea|siblingArea)["\']|class=["\'][^"\']*?(?:rt_area|comment_area|banner_area|recommend_area|sibling_area|lc_detail|footer)[^"\']*?")[^>]*?>', re.IGNORECASE)
            remaining = html[start_idx:]
            end_match = end_tag_regex.search(remaining)
            if end_match:
                end_idx = start_idx + end_match.start()
            else:
                end_keys = [
                    'class="rt_area"', 'id="commentArea"', 'class="comment_area"', 'class="banner_area"',
                    'class="recommend_area"', 'class="sibling_area"', 'id="siblingArea"', 'class="lc_detail"', 'class="footer"'
                ]
                for key in end_keys:
                    idx = html.find(key, start_idx)
                    if idx != -1 and (end_idx == -1 or idx < end_idx):
                        end_idx = idx
                        
            if end_idx != -1:
                search_block = html[start_idx:end_idx]
            else:
                search_block = html[start_idx:start_idx + 300000]

    # Parse <img> tags in search_block
    img_regex = re.compile(r'<img\s+([^>]+)>', re.IGNORECASE)
    for m in img_regex.finditer(search_block):
        attrs = m.group(1)
        
        class_match = re.search(r'class=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
        class_name = class_match.group(1) if class_match else ""
        
        data_url_match = re.search(r'data-url=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
        src_match = re.search(r'src=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
        id_match = re.search(r'id=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
        
        data_url = data_url_match.group(1) if data_url_match else ""
        src_url = src_match.group(1) if src_match else ""
        id_name = id_match.group(1) if id_match else ""
        
        classes = class_name.split()
        is_comic_class = any(c == '_images' or '_images' in c or c == 'viewer_img' or 'viewer_img' in c for c in classes)
        is_comic_id = id_name.startswith('img_') or id_name.startswith('volume_')
        
        candidate = (data_url or src_url).strip()
        candidate = candidate.replace('\\u002F', '/').replace('\\', '').replace('&amp;', '&')
        if not candidate:
            continue
            
        is_phinf = 'phinf.net' in candidate or 'pstatic.net' in candidate
        is_unwanted = any(x in candidate.lower() for x in [
            'logo', 'icon', 'avatar', 'banner', 'loading', 'pixel', 'bg_', 'thumb',
            'profile', 'comment', 'creator', 'author', 'button'
        ])
        
        is_comic_panel = False
        if is_phinf and not is_unwanted:
            if is_comic_class or is_comic_id or start_idx != -1:
                is_comic_panel = True
                
        if is_comic_panel:
            image_dict[candidate] = True

    # Nuxt extraction
    nuxt_images = extract_images_from_nuxt_payload(html)
    for img in nuxt_images:
        image_dict[img] = True

    # Regex scanner fallbacks if empty
    if not image_dict:
        fallback_regexes = [
            re.compile(r'https?://webtoon-phinf\.pstatic\.net/[^"\'\s>]+', re.IGNORECASE),
            re.compile(r'https?://[^"\'\s>]*?phinf\.net/[^"\'\s>]+', re.IGNORECASE)
        ]
        for rx in fallback_regexes:
            for m in rx.finditer(search_block):
                img = m.group(0).replace('\\u002F', '/').replace('\\', '').replace('&amp;', '&')
                is_unwanted = any(x in img.lower() for x in [
                    'logo', 'icon', 'avatar', 'banner', 'loading', 'pixel', 'bg_', 'thumb',
                    'profile', 'comment', 'creator', 'author', 'button'
                ])
                if not is_unwanted:
                    image_dict[img] = True

    raw_images = list(image_dict.keys())
    # Filters
    unwanted_patterns = [
        'logo', 'bg_', 'icon', 'button', 'loading', 'pixel', 'progress', 'arrow', 'favicon',
        'banner', 'thumb', 'profile', 'comment', 'avatar', 'user', 'reply', 'creator', 'author',
        'social', 'shari', 'mobile', 'thumbnail', 'footer'
    ]
    filtered_images = []
    for img in raw_images:
        lower = img.lower()
        if any(pat in lower for pat in unwanted_patterns):
            continue
        if 'type=' in lower and 'type=q90' not in lower:
            continue
        filtered_images.append(img)

    logger.info(f"[Scraper] Final parsed panel candidates count: {len(filtered_images)}")

    if not filtered_images:
        raise RuntimeError("No eligible comic panel images were parsed from this Webtoon URL page.")

    # Return proxied URL endpoints
    return [f"/api/proxy-image?url={quote(img)}" for img in filtered_images]
