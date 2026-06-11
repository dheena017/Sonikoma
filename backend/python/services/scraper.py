"""
backend/python/services/scraper.py
─────────────────────────────────────────────────────────────────────────────
Webtoon page content scraping and HTML parsing computational service.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import re
import os
import sys
import time
import logging
import asyncio
import hashlib
import random
import zipfile
import shutil
import tempfile
import uuid
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse, urljoin, quote, parse_qs

# Graceful optional imports
try:
    import httpx
except ImportError:
    httpx = None

try:
    import aiohttp
except ImportError:
    aiohttp = None

try:
    import requests
except ImportError:
    requests = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

# Local Database Integration
try:
    from database.db import save_scrape_session, get_latest_scrape_session
except ImportError:
    save_scrape_session = None
    get_latest_scrape_session = None

from utils.url_utils import extract_webtoon_url

logger = logging.getLogger("anivox.services.scraper")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

# ─── Constants & Metadata Caches ─────────────────────────────────────────────

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
]

UNWANTED_PATTERNS = [
    'logo', 'bg_', 'icon', 'button', 'loading', 'pixel', 'progress', 'arrow', 'favicon',
    'banner', 'thumb', 'profile', 'comment', 'avatar', 'user', 'reply', 'creator', 'author',
    'social', 'shari', 'mobile', 'thumbnail', 'footer', 'widget', 'ad_s', 'advertisement',
    'tracking', 'spacer', 'nav_', 'menu', 'search', 'rating', 'star', 'emoji', 'reaction'
]

# Global metadata store for current scraped sessions
scraped_metadata_cache: Dict[str, Dict[str, str]] = {}


# ─── Utility Helpers ─────────────────────────────────────────────────────────

def decode_escaped_js_string(value: str) -> str:
    """Helper to decode JS escapes (e.g. \\u002F -> /)"""
    try:
        decoded = value.encode().decode('unicode-escape')
        for raw, clean in [('\\n', ''), ('\\r', ''), ('\\t', ''), ("\\'", "'"), ('\\"', '"'), ('\\\\', '\\')]:
            decoded = decoded.replace(raw, clean)
        return decoded
    except Exception:
        return value


def natural_sort_key(s: str) -> List[Any]:
    """Helper to sort strings containing numbers naturally (e.g. panel_2 before panel_10)."""
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]


def parse_episode_index(title_or_url: str) -> Optional[float]:
    """Extract numerical chapter index (e.g. Chapter 4.5 -> 4.5)."""
    if not title_or_url:
        return None
    match = re.search(r'\b(?:ch(?:apter)?|ep(?:isode)?|vol(?:ume)?)\s*#?\s*(\d+(?:\.\d+)?)\b', title_or_url, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    match = re.search(r'\b(\d+(?:\.\d+)?)\b', title_or_url)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return None


# ─── Image Header Dimension Parser ───────────────────────────────────────────

def parse_image_dimensions_from_bytes(data: bytes) -> Optional[Tuple[int, int]]:
    """Parses width and height from the first few bytes of JPEG, PNG, GIF, WebP image data."""
    try:
        size = len(data)
        if size >= 10 and data.startswith(b'\x89PNG\r\n\x1a\n'):
            w = int.from_bytes(data[16:20], byteorder='big')
            h = int.from_bytes(data[20:24], byteorder='big')
            return w, h
        elif size >= 6 and data.startswith((b'GIF87a', b'GIF89a')):
            w = int.from_bytes(data[6:8], byteorder='little')
            h = int.from_bytes(data[8:10], byteorder='little')
            return w, h
        elif size >= 30 and data.startswith(b'RIFF') and data[8:12] == b'WEBP':
            if data[12:16] == b'VP8 ':
                w = int.from_bytes(data[26:28], byteorder='little') & 0x3FFF
                h = int.from_bytes(data[28:30], byteorder='little') & 0x3FFF
                return w, h
            elif data[12:16] == b'VP8L':
                b0, b1, b2, b3 = data[21], data[22], data[23], data[24]
                w = 1 + (((b1 & 0x3F) << 8) | b0)
                h = 1 + (((b3 & 0xF) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6))
                return w, h
            elif data[12:16] == b'VP8X':
                w = 1 + int.from_bytes(data[24:27], byteorder='little')
                h = 1 + int.from_bytes(data[27:30], byteorder='little')
                return w, h
        elif data.startswith(b'\xff\xd8'):
            idx = 2
            while idx < size:
                if data[idx] != 0xFF:
                    break
                marker = data[idx+1]
                if marker in (0xD9, 0xDA):
                    break
                if idx + 4 > size:
                    break
                block_len = int.from_bytes(data[idx+2:idx+4], byteorder='big')
                if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                    if idx + 9 <= size:
                        h = int.from_bytes(data[idx+5:idx+7], byteorder='big')
                        w = int.from_bytes(data[idx+7:idx+9], byteorder='big')
                        return w, h
                    break
                idx += 2 + block_len
    except Exception:
        pass
    return None


async def prefetch_image_dimensions(url: str, headers: dict) -> Optional[Tuple[int, int]]:
    """Stream-downloads the first few bytes of an image to extract dimensions without pulling the whole payload."""
    if not httpx:
        return None
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=5.0) as client:
            async with client.stream("GET", url, headers=headers) as response:
                if response.status_code != 200:
                    return None
                data = b''
                async for chunk in response.iter_bytes(chunk_size=1024):
                    data += chunk
                    dims = parse_image_dimensions_from_bytes(data)
                    if dims:
                        return dims
                    if len(data) >= 8192:
                        break
    except Exception:
        pass
    return None


# ─── Local Archive Comic Parser ──────────────────────────────────────────────

def scrape_local_archive(path: str) -> List[str]:
    """Extracts image files from a local .zip or .cbz file and flat-stores them in temporary paths."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Local archive not found: {path}")
        
    temp_parent = os.path.join(tempfile.gettempdir(), "webtoon_scraped_archives")
    os.makedirs(temp_parent, exist_ok=True)
    session_id = str(uuid.uuid4())[:8]
    extract_dir = os.path.join(temp_parent, session_id)
    os.makedirs(extract_dir, exist_ok=True)
    
    extracted_files = []
    valid_exts = ('.png', '.jpg', '.jpeg', '.webp', '.gif')
    
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path, 'r') as zf:
            for name in zf.namelist():
                if '__MACOSX' in name or name.split('/')[-1].startswith('.'):
                    continue
                if name.lower().endswith(valid_exts):
                    ext = os.path.splitext(name)[1]
                    flat_name = f"panel_{len(extracted_files):04d}{ext}"
                    target_path = os.path.join(extract_dir, flat_name)
                    with zf.open(name) as src, open(target_path, 'wb') as dst:
                        shutil.copyfileobj(src, dst)
                    extracted_files.append(target_path)
    else:
        raise ValueError("Unsupported archive format. Only ZIP and CBZ packages are supported.")
        
    extracted_files.sort(key=natural_sort_key)
    logger.info(f"[Scraper] Extracted {len(extracted_files)} panels from local file: {path}")
    
    file_urls = []
    for p in extracted_files:
        clean_p = p.replace('\\', '/')
        if not clean_p.startswith('/'):
            clean_p = '/' + clean_p
        file_urls.append(f"file://{clean_p}")
    return file_urls


# ─── Fail-Safe SVG Placeholder Fallback ───────────────────────────────────────

def generate_failsafe_svgs(url: str, reason: str) -> List[str]:
    """Generates informative instruction panels if scraping fails entirely."""
    logger.warning(f"[Scraper] Scrape failed: {reason}. Compiling instructions SVG placeholders...")
    placeholders = []
    colors = ["%232e1065", "%230f172a", "%231e1b4b", "%23064e3b", "%231c1917"]
    messages = [
        "Web Scrape Blocked by Host",
        "Use Crop Editor to manually load panels",
        "Or paste direct image URLs in Storyboard",
        "Verify your target webtoon URL works",
        "Check backend console logs for errors"
    ]
    for i in range(5):
        color = colors[i]
        msg = messages[i]
        svg = (
            f"<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>"
            f"<rect width='100%' height='100%' fill='{color}'/>"
            f"<text x='50%' y='45%' fill='%23f8fafc' font-weight='bold' font-size='24' text-anchor='middle'>Scraper Fallback Panel {i+1}</text>"
            f"<text x='50%' y='55%' fill='%23cbd5e1' font-size='18' text-anchor='middle'>{msg}</text>"
            f"</svg>"
        )
        encoded = quote(svg)
        placeholders.append(f"data:image/svg+xml;utf8,{encoded}")
    return placeholders


# ─── SQLite & In-Memory Scrape Caches ─────────────────────────────────────────

def check_sqlite_cache(url: str) -> Optional[List[str]]:
    if get_latest_scrape_session:
        try:
            session = get_latest_scrape_session(url)
            if session and session.get('image_urls'):
                logger.info(f"[Scraper] Cache HIT (SQLite persisted): {url}")
                return session['image_urls']
        except Exception as e:
            logger.warning(f"[Scraper] SQLite cache read failed: {e}")
    return None


def save_sqlite_cache(url: str, images: List[str]) -> None:
    if save_scrape_session:
        try:
            save_scrape_session(url, images)
            logger.info(f"[Scraper] Cache WRITE (SQLite persisted): {len(images)} images for {url}")
        except Exception as e:
            logger.warning(f"[Scraper] SQLite cache write failed: {e}")


# ─── HTML Parsers & Metadata Crawlers ─────────────────────────────────────────

def extract_metadata(html: str, url: str) -> Dict[str, str]:
    """Extracts Title, Description, Genre, Cover Image, and Author from page headers."""
    metadata = {"title": "", "description": "", "cover_image": "", "author": "", "genre": ""}
    if not BeautifulSoup:
        return metadata
    try:
        try:
            soup = BeautifulSoup(html, 'lxml')
        except Exception:
            soup = BeautifulSoup(html, 'html.parser')
            
        og_title = soup.find('meta', attrs={'property': 'og:title'}) or soup.find('meta', attrs={'name': 'twitter:title'})
        metadata["title"] = og_title['content'] if og_title and og_title.has_attr('content') else (soup.title.string if soup.title else "")
        
        og_desc = soup.find('meta', attrs={'property': 'og:description'}) or soup.find('meta', attrs={'name': 'description'})
        metadata["description"] = og_desc['content'] if og_desc and og_desc.has_attr('content') else ""
        
        og_img = soup.find('meta', attrs={'property': 'og:image'}) or soup.find('meta', attrs={'name': 'twitter:image'})
        if og_img and og_img.has_attr('content'):
            metadata["cover_image"] = urljoin(url, og_img['content'])
            
        author_tag = soup.find('meta', attrs={'name': 'author'}) or soup.find('meta', attrs={'property': 'og:creator'})
        metadata["author"] = author_tag['content'] if author_tag and author_tag.has_attr('content') else ""
        
        genre_tag = soup.find('meta', attrs={'property': 'og:genre'}) or soup.find('meta', attrs={'property': 'comic:genre'})
        metadata["genre"] = genre_tag['content'] if genre_tag and genre_tag.has_attr('content') else ""
        
        for k in metadata:
            if isinstance(metadata[k], str):
                metadata[k] = metadata[k].strip()
    except Exception as e:
        logger.warning(f"[Scraper] Metadata extraction warning: {e}")
    return metadata


def parse_with_bs4(html: str, base_url: str, custom_selectors: Optional[List[str]] = None) -> List[str]:
    """Uses BeautifulSoup to fetch images inside typical reader containers."""
    if not BeautifulSoup:
        return []
    try:
        soup = BeautifulSoup(html, 'html.parser')
    except Exception:
        return []
        
    selectors = custom_selectors or [
        '.viewer_lst', '._imageList', '.wt_viewer', '.reader-area', '.comic-page',
        '.chapter-content', '.episode-view', '.comic-content', '.panel-container',
        '#comic_view_area', '#comic-image', '#comic-view', '.ep-contents', '.chapter-img'
    ]
    
    container = None
    for sel in selectors:
        container = soup.select_one(sel)
        if container:
            logger.info(f"[Scraper] BS4 isolated reader container: {sel}")
            break
            
    search_root = container if container else soup
    images = []
    for img in search_root.find_all('img'):
        src = img.get('data-url') or img.get('data-src') or img.get('src') or img.get('origin-src') or img.get('lazy-src')
        if src:
            src = src.strip()
            abs_src = urljoin(base_url, src)
            images.append(abs_src)
    return images


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


# ─── Robust Request Client Callers ───────────────────────────────────────────

async def try_fetch_url_resilient(
    url: str,
    base_headers: dict,
    cookies: Optional[Dict[str, str]] = None,
    retries: int = 3
) -> Optional[str]:
    """Fetches HTML with UA rotation, domain referer spoofing, and TLS/library fallbacks."""
    parsed_domain = urlparse(url)
    headers = dict(base_headers)
    headers["Referer"] = f"{parsed_domain.scheme}://{parsed_domain.netloc}/"
    headers["Origin"] = f"{parsed_domain.scheme}://{parsed_domain.netloc}"
    
    if cookies:
        cookie_str = "; ".join([f"{k}={v}" for k, v in cookies.items()])
        if "Cookie" in headers:
            headers["Cookie"] = headers["Cookie"] + "; " + cookie_str
        else:
            headers["Cookie"] = cookie_str
            
    clients = []
    if httpx:
        clients.append("httpx")
    if aiohttp:
        clients.append("aiohttp")
    if requests:
        clients.append("requests")
        
    if not clients:
        logger.error("[Scraper] No active HTTP request client library (httpx, aiohttp, requests) found.")
        return None
        
    for attempt in range(1, retries + 1):
        headers["User-Agent"] = random.choice(USER_AGENTS)
        client_type = clients[(attempt - 1) % len(clients)]
        logger.info(f"[Scraper] HTTP client request {attempt}/{retries} via {client_type}")
        
        start_t = time.time()
        try:
            if client_type == "httpx":
                async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code == 200:
                        logger.info(f"[Scraper] Fetch success ({int((time.time() - start_t)*1000)}ms)")
                        return resp.text
                    elif resp.status_code in (403, 429):
                        logger.warning(f"[Scraper] Blocked status {resp.status_code} in client {client_type}")
            elif client_type == "aiohttp":
                async with aiohttp.ClientSession(headers=headers) as session:
                    async with session.get(url, timeout=30.0, allow_redirects=True) as resp:
                        if resp.status == 200:
                            text = await resp.text()
                            logger.info(f"[Scraper] Fetch success ({int((time.time() - start_t)*1000)}ms)")
                            return text
                        elif resp.status in (403, 429):
                            logger.warning(f"[Scraper] Blocked status {resp.status} in client {client_type}")
            elif client_type == "requests":
                def sync_req():
                    return requests.get(url, headers=headers, timeout=30.0, allow_redirects=True)
                loop = asyncio.get_running_loop()
                resp = await loop.run_in_executor(None, sync_req)
                if resp.status_code == 200:
                    logger.info(f"[Scraper] Fetch success ({int((time.time() - start_t)*1000)}ms)")
                    return resp.text
                elif resp.status_code in (403, 429):
                    logger.warning(f"[Scraper] Blocked status {resp.status_code} in client {client_type}")
        except Exception as e:
            logger.warning(f"[Scraper] Attempt {attempt} via {client_type} failed: {e}")
            
        if attempt < retries:
            await asyncio.sleep(0.5 + random.random())
            
    return None


async def try_fetch_with_playwright(
    url: str,
    user_agent: str,
    referer: str,
    cookies: Optional[Dict[str, str]] = None,
    interactive: bool = True
) -> Optional[str]:
    """Playwright rendering fallback with lazy-load scrolling, clicker hooks, and HTML5 Canvas extraction."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.warning("[Scraper] Playwright not found. Browser rendering fallback bypassed.")
        return None
        
    logger.info("[Scraper] Launching Playwright browser instance...")
    start_t = time.time()
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=user_agent,
                extra_http_headers={"Referer": referer}
            )
            
            if cookies:
                parsed = urlparse(url)
                playwright_cookies = [
                    {"name": k, "value": v, "domain": parsed.netloc, "path": "/"}
                    for k, v in cookies.items()
                ]
                await context.add_cookies(playwright_cookies)
                
            page = await context.new_page()
            await page.set_viewport_size({"width": 1280, "height": 1080})
            await page.goto(url, wait_until="load", timeout=45000)
            
            # Interactive click expansions
            if interactive:
                try:
                    expand_selectors = [
                        "button:has-text('Agree')", "button:has-text('Agree & Continue')",
                        "button:has-text('Confirm')", "button:has-text('Yes')",
                        "a:has-text('View Full')", ".btn_agree", ".btn_confirm",
                        "button:has-text('Load More')", "button:has-text('Show More')"
                    ]
                    for sel in expand_selectors:
                        buttons = await page.query_selector_all(sel)
                        for btn in buttons:
                            if await btn.is_visible():
                                logger.info(f"[Scraper] Playwright clicker clicked: {sel}")
                                await btn.click()
                                await asyncio.sleep(0.5)
                except Exception as click_err:
                    logger.debug(f"[Scraper] Interactive clicker exception: {click_err}")
                    
            # Scrolling script to trigger lazy loading
            logger.info("[Scraper] Running scroll script for lazy-loaded assets...")
            await page.evaluate("""async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 350;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight - window.innerHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 80);
                });
            }""")
            
            # Extract HTML5 canvases to base64 Data URLs
            logger.info("[Scraper] Running canvas extraction script...")
            await page.evaluate("""() => {
                const canvases = document.querySelectorAll('canvas');
                canvases.forEach((canvas) => {
                    try {
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                        const img = document.createElement('img');
                        img.src = dataUrl;
                        img.className = '_images _canvas_extracted';
                        img.setAttribute('data-url', dataUrl);
                        img.style.display = 'block';
                        canvas.parentNode.replaceChild(img, canvas);
                    } catch (e) {
                        console.warn("Failed to extract canvas:", e);
                    }
                });
            }""")
            
            await page.wait_for_timeout(1000)
            html = await page.content()
            await browser.close()
            logger.info(f"[Scraper] Playwright render succeeded in {int(time.time() - start_t)}s")
            return html
    except Exception as e:
        logger.error(f"[Scraper] Playwright task failed: {e}")
        return None


# ─── Core Scraper Orchestration ───────────────────────────────────────────────

async def scrape_images_from_url(
    url: str,
    source: Optional[str] = None,
    cookies: Optional[Dict[str, str]] = None,
    bypass_cache: bool = False,
    limit: Optional[int] = None
) -> List[str]:
    """
    Crawls a Webtoon episode page and isolates the panel image URLs.
    Handles dynamic headers, Playwright rendering fallbacks, metadata cache extraction, and local CBZ/ZIP archives.
    """
    fetch_url = extract_webtoon_url(url)
    if not fetch_url:
        return []
        
    start_time = time.time()
    
    # Check if local path ZIP or CBZ
    if fetch_url.startswith("file://") or fetch_url.lower().endswith(('.zip', '.cbz')) or os.path.exists(fetch_url):
        local_path = fetch_url
        if local_path.startswith("file://"):
            parsed_file = urlparse(local_path)
            local_path = parsed_file.path
            if local_path.startswith('/') and local_path[2] == ':':
                local_path = local_path[1:]
        try:
            return scrape_local_archive(local_path)
        except Exception as e:
            logger.error(f"[Scraper] Archive extract failed: {e}")
            if fetch_url.startswith("file://"):
                return generate_failsafe_svgs(fetch_url, str(e))
                
    # Cache lookup
    if not bypass_cache:
        cached = check_sqlite_cache(fetch_url)
        if cached:
            return [f"/api/proxy-image?url={quote(img)}" for img in cached]
            
    parsed_domain = urlparse(fetch_url)
    base_domain = f"{parsed_domain.scheme}://{parsed_domain.netloc}/"
    referer = "https://www.webcomicsapp.com/" if source == 'webcomicsapp' else base_domain
    
    fetch_headers = {
        "User-Agent": USER_AGENTS[0],
        "Referer": referer,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
    }
    
    merged_cookies = {
        "needZoneZone": "true",
        "locale": "en",
        "cc": "US",
        "ageGatePass": "true",
        "adult": "true"
    }
    if cookies:
        merged_cookies.update(cookies)
        
    logger.info(f"[Scraper] Commencing scrape for url: {fetch_url}")
    html = await try_fetch_url_resilient(fetch_url, fetch_headers, cookies=merged_cookies)
    
    if not html:
        # Regional fallback checks
        try:
            path_parts = [p for p in parsed_domain.path.split('/') if p]
            if path_parts and not re.match(r'^[a-z]{2}(-[a-z]{2,4})?$', path_parts[0], re.IGNORECASE):
                fallback_path = '/en/' + '/'.join(path_parts)
                fallback_url = parsed_domain._replace(path=fallback_path).geturl()
                logger.info(f"[Scraper] Retrying fallback regional endpoint: {fallback_url}")
                html = await try_fetch_url_resilient(fallback_url, fetch_headers, cookies=merged_cookies)
        except Exception as e:
            logger.debug(f"[Scraper] Regional completion fallback failed: {e}")
            
    if not html:
        logger.info("[Scraper] Standard request fallbacks failed. Initializing Playwright browser crawling...")
        html = await try_fetch_with_playwright(
            fetch_url,
            user_agent=fetch_headers["User-Agent"],
            referer=fetch_headers["Referer"],
            cookies=merged_cookies
        )
        
    # HTML Dump for diagnostics
    if html:
        try:
            debug_dir = os.path.join(PROJECT_ROOT, "data", "scraped_html")
            os.makedirs(debug_dir, exist_ok=True)
            dump_filename = f"dump_{hashlib.md5(fetch_url.encode()).hexdigest()[:8]}.html"
            with open(os.path.join(debug_dir, dump_filename), "w", encoding="utf-8") as f:
                f.write(html)
        except Exception:
            pass
            
    if not html:
        # Generate informative SVG panels if blocked entirely by protection software
        return generate_failsafe_svgs(fetch_url, "Endpoint connection blocked by server security context.")
        
    # Metadata extraction
    meta = extract_metadata(html, fetch_url)
    if meta and meta.get("title"):
        logger.info(f"[Scraper] Extracted Meta Title: '{meta['title']}' | Creator: '{meta['author']}'")
        scraped_metadata_cache[fetch_url] = meta
        
    image_dict = {}
    
    # 1. BeautifulSoup parsing
    bs_imgs = parse_with_bs4(html, fetch_url)
    for img in bs_imgs:
        image_dict[img] = True
        
    # 2. Nuxt payload extraction
    nuxt_imgs = extract_images_from_nuxt_payload(html)
    for img in nuxt_imgs:
        image_dict[urljoin(fetch_url, img)] = True
        
    # 3. Regex parser fallback
    if not image_dict:
        logger.info("[Scraper] Standard DOM parser returned empty results. Running regex extraction fallback...")
        search_block = html
        start_idx = -1
        
        container_match = re.search(r'<(div|ul|section)\s+[^>]*?class=["\'][^"\']*?viewer_lst[^"\']*?["\'][^>]*?>', html, re.IGNORECASE)
        if not container_match:
            container_match = re.search(r'<(div|ul|section)\s+[^>]*?(?:id=["\']_imageList["\']|class=["\'][^"\']*?_imageList[^"\']*?")[^>]*?>', html, re.IGNORECASE)
            
        if container_match:
            start_idx = container_match.start()
            start_tag = container_match.group(0)
            tag_type = container_match.group(1)
            
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
                search_block = html[start_idx:start_idx + len(start_tag) + end_idx_in_after]
            else:
                search_block = html[start_idx:start_idx + 300000]
        else:
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
                    end_keys = ['class="rt_area"', 'id="commentArea"', 'class="comment_area"', 'class="banner_area"', 'class="footer"']
                    for key in end_keys:
                        idx = html.find(key, start_idx)
                        if idx != -1 and (end_idx == -1 or idx < end_idx):
                            end_idx = idx
                if end_idx != -1:
                    search_block = html[start_idx:end_idx]
                else:
                    search_block = html[start_idx:start_idx + 300000]

        img_regex = re.compile(r'<img\s+([^>]+)>', re.IGNORECASE)
        for m in img_regex.finditer(search_block):
            attrs = m.group(1)
            class_match = re.search(r'class=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
            class_name = class_match.group(1) if class_match else ""
            data_url_match = re.search(r'data-url=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
            src_match = re.search(r'src=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
            
            candidate = (data_url_match.group(1) if data_url_match else (src_match.group(1) if src_match else "")).strip()
            candidate = candidate.replace('\\u002F', '/').replace('\\', '').replace('&amp;', '&')
            if candidate:
                abs_cand = urljoin(fetch_url, candidate)
                image_dict[abs_cand] = True
                
        # Regex scanner matching phinf URLs
        fallback_regexes = [
            re.compile(r'https?://webtoon-phinf\.pstatic\.net/[^"\'\s>]+', re.IGNORECASE),
            re.compile(r'https?://[^"\'\s>]*?phinf\.net/[^"\'\s>]+', re.IGNORECASE)
        ]
        for rx in fallback_regexes:
            for m in rx.finditer(search_block):
                img = m.group(0).replace('\\u002F', '/').replace('\\', '').replace('&amp;', '&')
                image_dict[urljoin(fetch_url, img)] = True
                
    raw_images = list(image_dict.keys())
    filtered_images = []
    
    # Blacklist filter check
    for img in raw_images:
        lower = img.lower()
        if any(pat in lower for pat in UNWANTED_PATTERNS):
            continue
        if 'type=' in lower and 'type=q90' not in lower:
            continue
        filtered_images.append(img)
        
    # Natural alphanumeric sort
    filtered_images.sort(key=natural_sort_key)
    
    if limit:
        filtered_images = filtered_images[:limit]
        
    logger.info(f"[Scraper] Final parsed panel candidates count: {len(filtered_images)} (elapsed: {int((time.time() - start_time)*1000)}ms)")
    
    if not filtered_images:
        return generate_failsafe_svgs(fetch_url, "No comic panels extracted from DOM tree structures.")
        
    # Save cache
    save_sqlite_cache(fetch_url, filtered_images)
    
    return [f"/api/proxy-image?url={quote(img)}" for img in filtered_images]


# ─── Standalone Command-Line Interface (CLI) ──────────────────────────────────

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Anivox Webtoon Scraper CLI tool")
    parser.add_argument("--url", required=True, help="URL or local ZIP/CBZ path to scrape panels from")
    parser.add_argument("--source", default=None, help="Referer source identifier override (e.g. webcomicsapp)")
    parser.add_argument("--limit", type=int, default=None, help="Limit maximum extracted panels count")
    parser.add_argument("--bypass_cache", action="store_true", help="Bypass local SQLite session cache reading")
    parser.add_argument("--cookies", default=None, help="Custom cookies payload string formatted as key=val; key2=val2")
    
    args = parser.parse_args()
    
    parsed_cookies = {}
    if args.cookies:
        for item in args.cookies.split(';'):
            if '=' in item:
                k, v = item.split('=', 1)
                parsed_cookies[k.strip()] = v.strip()
                
    # Run the scraping routine synchronously
    try:
        urls = asyncio.run(scrape_images_from_url(
            url=args.url,
            source=args.source,
            cookies=parsed_cookies,
            bypass_cache=args.bypass_cache,
            limit=args.limit
        ))
        result = {
            "success": True,
            "url": args.url,
            "total_images": len(urls),
            "images": urls,
            "metadata": scraped_metadata_cache.get(args.url, {})
        }
        print(json.dumps(result, indent=2))
    except Exception as err:
        print(json.dumps({"success": False, "error": str(err)}))
        sys.exit(1)
