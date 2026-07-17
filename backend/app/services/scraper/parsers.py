"""
backend/app/services/scraper/parsers.py
─────────────────────────────────────────────────────────────────────────────
HTML BeautifulSoup parsers, image dimension scanners, Nuxt page parser, and
local ZIP/CBZ comic archive reader.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import csv
import uuid
import shutil
import tempfile
import zipfile
import logging
import random
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse, urljoin, quote, parse_qs

# Graceful optional imports
try:
    import requests
except ImportError:
    requests = None

try:
    import httpx
except ImportError:
    httpx = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

logger = logging.getLogger("sonikoma.services.scraper.parsers")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
]

# URL substrings that indicate a non-panel image (icons, logos, ads, ui elements, etc.)
# Used by scraper.py to filter out irrelevant images from scraped pages.
UNWANTED_PATTERNS = [
    "logo",
    "icon",
    "banner",
    "avatar",
    "thumbnail",
    "cover",
    "thumb",
    "favicon",
    "sprite",
    "button",
    "badge",
    "advertisement",
    "ads/",
    "/ad/",
    "tracking",
    "pixel",
    "1x1",
    "spacer",
    "placeholder",
    "loading",
    "spinner",
    "background",
]



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


def _fetch_source(source: str) -> Optional[str]:
    """Fetches HTML from a URL or reads a local file path. Returns HTML string."""
    if os.path.exists(source):
        with open(source, 'r', encoding='utf-8') as f:
            return f.read()
    if requests:
        try:
            resp = requests.get(source, headers={'User-Agent': random.choice(USER_AGENTS)}, timeout=10)
            if resp.status_code == 200:
                return resp.text
        except Exception:
            return None
    elif httpx:
        try:
            resp = httpx.get(source, headers={'User-Agent': random.choice(USER_AGENTS)}, timeout=10)
            if resp.status_code == 200:
                return resp.text
        except Exception:
            return None
    return None


def _parse_date_string(s: str) -> Optional[datetime]:
    """Normalize human-readable date strings to datetime. Handles "Jul 7, 2026" etc."""
    if not s:
        return None
    s = s.strip()
    fmts = ["%b %d, %Y", "%B %d, %Y", "%Y-%m-%d", "%d %b %Y", "%d %B %Y"]
    for fmt in fmts:
        try:
            return datetime.strptime(s, fmt)
        except Exception:
            pass

    m = re.search(r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b', s, re.IGNORECASE)
    if m:
        try:
            return datetime.strptime(m.group(0), "%b %d, %Y")
        except Exception:
            try:
                return datetime.strptime(m.group(0), "%B %d, %Y")
            except Exception:
                pass

    m = re.search(r'(\d{4})', s)
    if m:
        try:
            y = int(m.group(1))
            return datetime(y, 1, 1)
        except Exception:
            pass
    return None


def extract_episode_date_pairs_from_html(html: str) -> List[Tuple[int, Optional[datetime], str]]:
    """Extract (episode_number, date, raw_text_context) tuples from HTML."""
    results: List[Tuple[int, Optional[datetime], str]] = []
    if not html:
        return results

    if BeautifulSoup:
        try:
            soup = BeautifulSoup(html, 'html.parser')
            text_nodes = []

            for tag in soup.find_all(text=re.compile(r'episode\s*\d+', re.IGNORECASE)):
                text_nodes.append(tag)

            for node in text_nodes:
                container = node.parent
                txt = container.get_text(separator=' ', strip=True)
                m = re.search(r'episode\s*(\d+)', txt, re.IGNORECASE)
                if not m:
                    continue
                try:
                    ep = int(m.group(1))
                except Exception:
                    continue

                date_candidate = None
                date_candidate = re.search(r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b', txt, re.IGNORECASE)
                if not date_candidate:
                    for sib in container.find_next_siblings(limit=3):
                        stext = sib.get_text(separator=' ', strip=True)
                        date_candidate = re.search(r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b', stext, re.IGNORECASE)
                        if date_candidate:
                            break

                if date_candidate:
                    date_raw = date_candidate.group(0)
                    parsed = _parse_date_string(date_raw)
                else:
                    parsed = None

                results.append((ep, parsed, txt))
            return results
        except Exception:
            pass

    for m in re.finditer(r'episode\s*(\d+)', html, re.IGNORECASE):
        try:
            ep = int(m.group(1))
        except Exception:
            continue
        span_start = max(0, m.start() - 200)
        span_end = min(len(html), m.end() + 200)
        context = html[span_start:span_end]
        date_m = re.search(r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b', context, re.IGNORECASE)
        parsed = _parse_date_string(date_m.group(0)) if date_m else None
        results.append((ep, parsed, context))

    return results


def compare_two_sources(source_a: str, source_b: str, name_a: str = 'A', name_b: str = 'B') -> Dict[str, Any]:
    """Fetch/Read two HTML sources, extract episodes, and produce comparison dict."""
    html_a = _fetch_source(source_a)
    html_b = _fetch_source(source_b)

    a_list = extract_episode_date_pairs_from_html(html_a or '')
    b_list = extract_episode_date_pairs_from_html(html_b or '')

    def to_rows(lst, name):
        rows = []
        for ep, dt, ctx in lst:
            rows.append({
                'view': name,
                'episode': ep,
                'date': dt.isoformat() if dt else '',
                'raw': ctx[:180].replace('\n', ' ')
            })
        return rows

    rows_a = to_rows(a_list, name_a)
    rows_b = to_rows(b_list, name_b)

    by_date = {}
    for r in rows_a:
        key = r['date'] or f"A_ep{r['episode']}"
        by_date.setdefault(key, []).append(r)
    for r in rows_b:
        key = r['date'] or f"B_ep{r['episode']}"
        by_date.setdefault(key, []).append(r)

    only_in_a = [r for r in rows_a if r['date'] and not any(rb['date'] == r['date'] for rb in rows_b)]
    only_in_b = [r for r in rows_b if r['date'] and not any(ra['date'] == r['date'] for ra in rows_a)]

    return {
        'rows_a': rows_a,
        'rows_b': rows_b,
        'only_in_a': only_in_a,
        'only_in_b': only_in_b,
        'by_date': by_date
    }


def write_csv(rows: List[Dict[str, Any]], outpath: str) -> None:
    keys = ['view', 'episode', 'date', 'raw']
    with open(outpath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        for r in rows:
            writer.writerow({k: r.get(k, '') for k in keys})


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

        title_str = metadata["title"]
        if title_str:
            title_str = re.sub(r'\s*[-|–—]\s*(?:Asura Scans|MangaDex|Webtoons|Line Webtoon|Flame Comics|Reaper Scans|Void Scans|Luminous Scans|Tapas|Tappytoon|ManhuaTo|Manhua Plus|Manganato|Mangakakalot|Bato\.to|Toomics|WebComics App|Copin Comics|Pocket Comics|Lezhin|Bilibili Comics|MangaToon|Webnovel)\b.*$', '', title_str, flags=re.IGNORECASE)
            metadata["title"] = title_str.strip()

        og_desc = soup.find('meta', attrs={'property': 'og:description'}) or soup.find('meta', attrs={'name': 'description'})
        metadata["description"] = og_desc['content'] if og_desc and og_desc.has_attr('content') else ""

        og_img = soup.find('meta', attrs={'property': 'og:image'}) or soup.find('meta', attrs={'name': 'twitter:image'})
        if og_img and og_img.has_attr('content'):
            metadata["cover_image"] = urljoin(url, og_img['content'])

        if not metadata["cover_image"]:
            cover_selectors = [
                'img.wp-post-image', 'img[src*="cover"]', '.summary_image img',
                '.thumb img', '.manga-poster img', 'img.cover', 'img.thumbnail',
                '.poster img', '.cover-image img', '#manga-cover', '.anime-cover img',
                '.series-cover img', 'img[src*="thumbnail"]'
            ]
            for sel in cover_selectors:
                try:
                    img_tag = soup.select_one(sel)
                    if img_tag:
                        src = img_tag.get('src') or img_tag.get('data-src') or img_tag.get('data-lazy-src') or img_tag.get('data-original')
                        if src:
                            metadata["cover_image"] = urljoin(url, src.strip())
                            break
                except Exception:
                    continue

        author_tag = soup.find('meta', attrs={'name': 'author'}) or soup.find('meta', attrs={'property': 'og:creator'})
        metadata["author"] = author_tag['content'] if author_tag and author_tag.has_attr('content') else ""

        if not metadata["author"]:
            author_selectors = [
                '.author-content a', '.author-content', '.creator', '.artist-content a',
                '[class*=author] a', '[class*=creator] a', '[class*=artist] a',
                '[itemprop=author]', '[itemprop=creator]',
                '.series-author', '.comic-author', '.manga-author',
                'span.author', 'p.author', '.info-author',
                'dt:-soup-contains("Author") + dd', 'dt:-soup-contains("Artist") + dd',
                '.wp-author', '.post-author a',
            ]
            for sel in author_selectors:
                try:
                    el = soup.select_one(sel)
                    if el and el.get_text(strip=True):
                        metadata["author"] = el.get_text(separator=', ', strip=True)
                        break
                except Exception:
                    continue

        genre_tag = soup.find('meta', attrs={'property': 'og:genre'}) or soup.find('meta', attrs={'property': 'comic:genre'})
        metadata["genre"] = genre_tag['content'] if genre_tag and genre_tag.has_attr('content') else ""

        if not metadata["genre"]:
            genre_selectors = [
                '.genres-content a', '.genre-content a', '[class*=genre] a',
                '.tags a', '.category a', '.tag-item',
            ]
            for sel in genre_selectors:
                try:
                    els = soup.select(sel)
                    if els:
                        metadata["genre"] = ', '.join(e.get_text(strip=True) for e in els[:3])
                        break
                except Exception:
                    continue

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
        # Webtoons-specific: the actual panel image list (excludes thumbnail sidebar)
        '#_imageList', '._img_viewer_area',
        # Generic Webtoons/Naver viewer
        '.viewer_lst', '.wt_viewer',
        # Other common readers
        '._imageList', '.reader-area', '.comic-page',
        '.chapter-content', '.episode-view', '.comic-content', '.panel-container',
        '#comic_view_area', '#comic-image', '#comic-view', '.ep-contents', '.chapter-img',
        '#readerarea', '.readerarea', '#reader-area', '.wp-manga-chapter-img'
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
        src = (
            img.get('data-url') or
            img.get('data-src') or
            img.get('data-lazy-src') or
            img.get('data-original') or
            img.get('origin-src') or
            img.get('lazy-src') or
            img.get('src')
        )
        if src:
            src = src.strip()
            # Skip transparent placeholder images used by Webtoons
            if 'bg_transparency' in src or src.endswith('1x1.gif') or src.endswith('spacer.gif'):
                continue
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
