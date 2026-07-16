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
import sqlite3
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse, urljoin, quote, parse_qs
from datetime import datetime, timedelta

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

from services.scraper.url_utils import extract_webtoon_url

logger = logging.getLogger("sonikoma.services.scraper")

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


# ─── Episode Cache Manager ──────────────────────────────────────────────────

class EpisodeCacheManager:
    """SQLite-based caching for scraped WEBTOON episodes."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or os.path.join(
            os.path.dirname(__file__), "..", "..", "database", "webtoon_episodes_cache.db"
        )
        self._init_db()

    def _init_db(self):
        """Initialize SQLite database schema if needed."""
        try:
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS episode_cache (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title_no TEXT NOT NULL,
                        genre TEXT,
                        cache_key TEXT UNIQUE NOT NULL,
                        episodes_json TEXT NOT NULL,
                        series_metadata TEXT,
                        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        expires_at DATETIME,
                        hit_count INTEGER DEFAULT 0
                    )
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_title_no_genre
                    ON episode_cache(title_no, genre)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_expires_at
                    ON episode_cache(expires_at)
                """)
                conn.commit()
            logger.info(f"[Cache Manager] Database initialized at {self.db_path}")
        except Exception as e:
            logger.warning(f"[Cache Manager] Failed to initialize: {e}")

    def _make_cache_key(self, title_no: str, genre: Optional[str] = None) -> str:
        """Generate cache key."""
        key_str = f"{title_no}:{genre or 'any'}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def save_episodes(
        self,
        title_no: str,
        episodes: List[Dict[str, Any]],
        series_metadata: Optional[Dict[str, Any]] = None,
        genre: Optional[str] = None,
        ttl_hours: int = 24
    ) -> bool:
        """Save episodes to cache."""
        try:
            cache_key = self._make_cache_key(title_no, genre)
            expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)

            episodes_json = json.dumps(episodes)
            metadata_json = json.dumps(series_metadata) if series_metadata else None

            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO episode_cache
                    (title_no, genre, cache_key, episodes_json, series_metadata, expires_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (title_no, genre, cache_key, episodes_json, metadata_json, expires_at))
                conn.commit()

            logger.info(f"[Cache Manager] Cached {len(episodes)} episodes for {title_no}")
            return True
        except Exception as e:
            logger.warning(f"[Cache Manager] Save failed: {e}")
            return False

    def get_episodes(self, title_no: str, genre: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieve episodes from cache if valid."""
        try:
            cache_key = self._make_cache_key(title_no, genre)

            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT episodes_json, series_metadata, hit_count, expires_at
                    FROM episode_cache
                    WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
                """, (cache_key,))

                row = cursor.fetchone()
                if row:
                    episodes_json, metadata_json, hit_count, _ = row

                    # Update hit count
                    cursor.execute(
                        "UPDATE episode_cache SET hit_count = hit_count + 1 WHERE cache_key = ?",
                        (cache_key,)
                    )
                    conn.commit()

                    episodes = json.loads(episodes_json)
                    metadata = json.loads(metadata_json) if metadata_json else None

                    logger.info(f"[Cache Manager] Cache HIT for {title_no} ({len(episodes)} episodes, hits: {hit_count + 1})")
                    return {
                        "episodes": episodes,
                        "series_metadata": metadata,
                        "from_cache": True
                    }

                logger.debug(f"[Cache Manager] Cache MISS for {title_no}")
                return None
        except Exception as e:
            logger.warning(f"[Cache Manager] Retrieval failed: {e}")
            return None

    def clear_expired(self) -> int:
        """Remove expired cache entries."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "DELETE FROM episode_cache WHERE expires_at IS NOT NULL AND expires_at < datetime('now')"
                )
                deleted = cursor.rowcount
                conn.commit()

            if deleted > 0:
                logger.info(f"[Cache Manager] Cleared {deleted} expired entries")
            return deleted
        except Exception as e:
            logger.warning(f"[Cache Manager] Clear failed: {e}")
            return 0


# Global cache manager instance
_episode_cache = None

def get_episode_cache() -> EpisodeCacheManager:
    """Get global episode cache manager."""
    global _episode_cache
    if _episode_cache is None:
        _episode_cache = EpisodeCacheManager()
    return _episode_cache


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


# ─── Scraper Core ─────────────────────────────────────────────────────────────


# ─── SQLite & In-Memory Scrape Caches ─────────────────────────────────────────

def check_sqlite_cache(url: str) -> Optional[List[str]]:
    if get_latest_scrape_session:
        try:
            session = get_latest_scrape_session(url)
            if session and session.get('image_urls'):
                urls = session['image_urls']
                if any("data:" in str(u) or "data%" in str(u) or "svg" in str(u).lower() for u in urls):
                    return None
                logger.info(f"[Scraper] Cache HIT (SQLite persisted): {url}")
                return urls
        except Exception as e:
            logger.warning(f"[Scraper] SQLite cache read failed: {e}")


# ---------------------------------------------------------------------------
# Episode extraction & HTML compare helpers (CLI-friendly)
# ---------------------------------------------------------------------------

import csv


def _fetch_source(source: str) -> Optional[str]:
    """Fetches HTML from a URL or reads a local file path. Returns HTML string."""
    # local file
    if os.path.exists(source):
        with open(source, 'r', encoding='utf-8') as f:
            return f.read()
    # try HTTP GET via requests or httpx
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
    # try common formats
    fmts = ["%b %d, %Y", "%B %d, %Y", "%Y-%m-%d", "%d %b %Y", "%d %B %Y"]
    for fmt in fmts:
        try:
            return datetime.strptime(s, fmt)
        except Exception:
            pass

    # fallback: search for Month Day, Year inside string
    m = re.search(r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b', s, re.IGNORECASE)
    if m:
        try:
            return datetime.strptime(m.group(0), "%b %d, %Y")
        except Exception:
            try:
                return datetime.strptime(m.group(0), "%B %d, %Y")
            except Exception:
                pass

    # last-resort: find YYYY and numbers
    m = re.search(r'(\d{4})', s)
    if m:
        try:
            y = int(m.group(1))
            return datetime(y, 1, 1)
        except Exception:
            pass
    return None


def extract_episode_date_pairs_from_html(html: str) -> List[Tuple[int, Optional[datetime], str]]:
    """Extract (episode_number, date, raw_text_context) tuples from HTML.

    Returns list ordered by appearance.
    """
    results: List[Tuple[int, Optional[datetime], str]] = []
    if not html:
        return results

    # If BeautifulSoup is available, use it to better localize dates near episode labels
    if BeautifulSoup:
        try:
            soup = BeautifulSoup(html, 'html.parser')
            text_nodes = []

            # find nodes that include the word 'Episode' or 'Episode #'
            for tag in soup.find_all(text=re.compile(r'episode\s*\d+', re.IGNORECASE)):
                text_nodes.append(tag)

            # additionally, search for numeric "Episode X" inside headings/buttons
            for node in text_nodes:
                container = node.parent
                txt = container.get_text(separator=' ', strip=True)
                # episode number
                m = re.search(r'episode\s*(\d+)', txt, re.IGNORECASE)
                if not m:
                    continue
                try:
                    ep = int(m.group(1))
                except Exception:
                    continue

                # try to find a nearby date: search the container and nearby siblings
                date_candidate = None
                # check container first
                date_candidate = re.search(r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b', txt, re.IGNORECASE)
                if not date_candidate:
                    # look at siblings text
                    for sib in container.find_next_siblings(limit=3):
                        stext = sib.get_text(separator=' ', strip=True)
                        date_candidate = re.search(r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b', stext, re.IGNORECASE)
                        if date_candidate:
                            date_raw = date_candidate.group(0)
                            break
                else:
                    date_raw = date_candidate.group(0)

                if date_candidate:
                    date_raw = date_candidate.group(0)
                    parsed = _parse_date_string(date_raw)
                else:
                    parsed = None

                results.append((ep, parsed, txt))
            return results
        except Exception:
            pass

    # Fallback: regex over raw HTML
    for m in re.finditer(r'episode\s*(\d+)', html, re.IGNORECASE):
        try:
            ep = int(m.group(1))
        except Exception:
            continue
        # look around match for a date
        span_start = max(0, m.start() - 200)
        span_end = min(len(html), m.end() + 200)
        context = html[span_start:span_end]
        date_m = re.search(r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b', context, re.IGNORECASE)
        parsed = _parse_date_string(date_m.group(0)) if date_m else None
        results.append((ep, parsed, context))

    return results


def compare_two_sources(source_a: str, source_b: str, name_a: str = 'A', name_b: str = 'B') -> Dict[str, Any]:
    """Fetch/Read two HTML sources, extract episodes, and produce comparison dict.

    Returns a dict with lists and mismatches.
    """
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

    # Build maps by date string (ISO) for quick cross-checks
    by_date = {}
    for r in rows_a:
        key = r['date'] or f"A_ep{r['episode']}"
        by_date.setdefault(key, []).append(r)
    for r in rows_b:
        key = r['date'] or f"B_ep{r['episode']}"
        by_date.setdefault(key, []).append(r)

    # Simple mismatch detection: dates that appear in only one view
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


if __name__ == '__main__':
    # Simple CLI: python scraper.py <source_a> <source_b> [out.csv]
    if len(sys.argv) < 3:
        print("Usage: python scraper.py <source_a> <source_b> [out.csv]")
        sys.exit(1)
    src_a = sys.argv[1]
    src_b = sys.argv[2]
    outcsv = sys.argv[3] if len(sys.argv) > 3 else None

    comp = compare_two_sources(src_a, src_b, name_a='ViewTop', name_b='ViewGrid')
    all_rows = comp['rows_a'] + comp['rows_b']
    if outcsv:
        write_csv(all_rows, outcsv)
        print(f"Wrote CSV to {outcsv}")
    else:
        # Print concise report
        print("Summary:\n")
        print(f"Top view rows: {len(comp['rows_a'])}")
        print(f"Grid view rows: {len(comp['rows_b'])}\n")
        print("Dates only in Top view:")
        for r in comp['only_in_a']:
            print(f" - Ep{r['episode']} @ {r['date']}")
        print("\nDates only in Grid view:")
        for r in comp['only_in_b']:
            print(f" - Ep{r['episode']} @ {r['date']}")


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

        # Clean up title: remove common site suffix brandings
        title_str = metadata["title"]
        if title_str:
            title_str = re.sub(r'\s*[-|–—]\s*(?:Asura Scans|MangaDex|Webtoons|Line Webtoon|Flame Comics|Reaper Scans|Void Scans|Luminous Scans|Tapas|Tappytoon|ManhuaTo|Manhua Plus|Manganato|Mangakakalot|Bato\.to|Toomics|WebComics App|Copin Comics|Pocket Comics|Lezhin|Bilibili Comics|MangaToon|Webnovel)\b.*$', '', title_str, flags=re.IGNORECASE)
            metadata["title"] = title_str.strip()

        og_desc = soup.find('meta', attrs={'property': 'og:description'}) or soup.find('meta', attrs={'name': 'description'})
        metadata["description"] = og_desc['content'] if og_desc and og_desc.has_attr('content') else ""

        og_img = soup.find('meta', attrs={'property': 'og:image'}) or soup.find('meta', attrs={'name': 'twitter:image'})
        if og_img and og_img.has_attr('content'):
            metadata["cover_image"] = urljoin(url, og_img['content'])

        # Fallback selectors for cover image from DOM if meta tag missing or empty
        if not metadata["cover_image"]:
            cover_selectors = [
                'img.wp-post-image',
                'img[src*="cover"]',
                '.summary_image img',
                '.thumb img',
                '.manga-poster img',
                'img.cover',
                'img.thumbnail',
                '.poster img',
                '.cover-image img',
                '#manga-cover',
                '.anime-cover img',
                '.series-cover img',
                'img[src*="thumbnail"]'
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

        # Fallback: DOM-based author selectors for sites that don't expose meta author
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

        # Fallback: DOM-based genre selectors
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
        '.viewer_lst', '._imageList', '.wt_viewer', '.reader-area', '.comic-page',
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
            img.get('src') or
            img.get('origin-src') or
            img.get('lazy-src')
        )
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
                        return None
            elif client_type == "aiohttp":
                async with aiohttp.ClientSession(headers=headers) as session:
                    async with session.get(url, timeout=30.0, allow_redirects=True) as resp:
                        if resp.status == 200:
                            text = await resp.text()
                            logger.info(f"[Scraper] Fetch success ({int((time.time() - start_t)*1000)}ms)")
                            return text
                        elif resp.status in (403, 429):
                            logger.warning(f"[Scraper] Blocked status {resp.status} in client {client_type}")
                            return None
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
                    return None
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
        # pyrefly: ignore [missing-import]
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
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)

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
            # Scroll down incrementally with pauses to allow lazy-loaded assets to load and render
            for _ in range(8):
                await page.evaluate("window.scrollBy(0, 2000)")
                await page.wait_for_timeout(1000)

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

            await page.wait_for_timeout(200)
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

    # Check if data URL image
    if fetch_url.startswith("data:image/"):
        logger.info("[Scraper] Direct Data URL image detected")
        return [fetch_url]

    # Check if direct image URL (jpg, jpeg, png, webp, gif, svg, bmp, tiff)
    lower_url = fetch_url.lower()
    is_img = False
    if lower_url.startswith(('http://', 'https://')):
        if any(ext in lower_url for ext in ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.tiff']):
            is_img = True
        elif httpx:
            try:
                # Try a HEAD request to check Content-Type for query-parameterized or extensionless image URLs
                async with httpx.AsyncClient(follow_redirects=True, timeout=3.0) as client:
                    resp = await client.head(fetch_url, headers={"User-Agent": USER_AGENTS[0]})
                    if resp.status_code == 200:
                        ct = resp.headers.get("Content-Type", "").lower()
                        if ct.startswith("image/"):
                            is_img = True
            except Exception:
                pass

        if is_img:
            logger.info(f"[Scraper] Direct image URL detected: {fetch_url}")
            return [f"/api/proxy-image?url={quote(fetch_url)}"]

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
                return []

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
        return []

    # Metadata extraction
    meta = extract_metadata(html, fetch_url)
    if meta:
        logger.info(f"[Scraper] Extracted Meta — Title: '{meta.get('title','')}' | Author: '{meta.get('author','')}' | Cover: {'yes' if meta.get('cover_image') else 'no'}")
        scraped_metadata_cache[fetch_url] = meta
    else:
        logger.warning(f"[Scraper] Metadata extraction failed for: {fetch_url}")

    image_dict = {}

    # 1. BeautifulSoup parsing
    bs_imgs = parse_with_bs4(html, fetch_url)
    if bs_imgs:
        logger.info(f"[Scraper] Found {len(bs_imgs)} images using BS4.")
    for img in bs_imgs:
        image_dict[img] = True

    # 2. Nuxt payload extraction
    nuxt_imgs = extract_images_from_nuxt_payload(html)
    if nuxt_imgs:
        logger.info(f"[Scraper] Found {len(nuxt_imgs)} images using Nuxt payload extraction.")
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

    if not image_dict:
        logger.info("[Scraper] No images found with standard HTML fetch. Initializing Playwright browser crawling fallback...")
        html = await try_fetch_with_playwright(
            fetch_url,
            user_agent=fetch_headers["User-Agent"],
            referer=fetch_headers["Referer"],
            cookies=merged_cookies
        )
        if html:
            # Re-extract metadata in case it was missing
            meta = extract_metadata(html, fetch_url)
            if meta:
                scraped_metadata_cache[fetch_url] = meta

            bs_imgs = parse_with_bs4(html, fetch_url)
            if bs_imgs:
                logger.info(f"[Scraper] Found {len(bs_imgs)} images using BS4 after Playwright render.")
            for img in bs_imgs:
                image_dict[img] = True

            nuxt_imgs = extract_images_from_nuxt_payload(html)
            for img in nuxt_imgs:
                image_dict[urljoin(fetch_url, img)] = True

            if not image_dict:
                img_regex = re.compile(r'<img\s+([^>]+)>', re.IGNORECASE)
                for m in img_regex.finditer(html):
                    attrs = m.group(1)
                    data_url_match = re.search(r'data-url=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
                    src_match = re.search(r'src=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
                    candidate = (data_url_match.group(1) if data_url_match else (src_match.group(1) if src_match else "")).strip()
                    candidate = candidate.replace('\\u002F', '/').replace('\\', '').replace('&amp;', '&')
                    if candidate:
                        image_dict[urljoin(fetch_url, candidate)] = True

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

    if limit:
        filtered_images = filtered_images[:limit]

    logger.info(f"[Scraper] Final parsed panel candidates count: {len(filtered_images)} (elapsed: {int((time.time() - start_time)*1000)}ms)")

    if not filtered_images:
        return []

    # Save cache
    save_sqlite_cache(fetch_url, filtered_images)

    return [f"/api/proxy-image?url={quote(img)}" for img in filtered_images]


def normalize_series_url(url: str) -> str:
    if not url:
        return url
    if "webtoons.com" not in url and "webtoon.com" not in url:
        return url
    try:
        from urllib.parse import urlparse, parse_qs, urlunparse, urlencode
        import re
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        
        # We only want title_no in the query parameters
        title_no = query_params.get("title_no")
        new_query = ""
        if title_no:
            new_query = urlencode({"title_no": title_no[0]})
            
        path_parts = [p for p in parsed.path.split('/') if p]
        if path_parts:
            # Check for region prefix
            has_region = False
            region = ""
            if re.match(r'^[a-z]{2}(-[a-z]{2,4})?$', path_parts[0], re.IGNORECASE):
                has_region = True
                region = path_parts.pop(0)
                
            if path_parts and path_parts[-1] == "viewer":
                if len(path_parts) >= 4:
                    # Remove episode slug if it exists (e.g. ep-5-...)
                    path_parts.pop(-2)
                path_parts[-1] = "list"
                
            if has_region:
                path_parts.insert(0, region)
                
        new_path = "/" + "/".join(path_parts)
        return urlunparse(parsed._replace(path=new_path, query=new_query))
    except Exception as e:
        logger.error(f"[Episode Scraper] Error normalizing series URL: {e}")
        return url


# ─── WEBTOON Episode List Scraper ───────────────────────────────────────────

async def scrape_webtoon_episodes(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None
) -> Dict[str, Any]:
    if series_url:
        series_url = normalize_series_url(series_url)

    """
    Scrapes episode metadata from WEBTOON series list page.
    Extracts: episode number, title, date, thumbnail, episode URL.

    Args:
        series_url: WEBTOON series URL or just the title_no parameter
        title_no: Override series ID if URL doesn't contain it
        max_episodes: Limit total episodes to scrape

    Returns:
        Dict with series metadata and list of episodes
    """
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.error("[Episode Scraper] Playwright not installed")
        return {"success": False, "error": "Playwright not available"}

    logger.info(f"[Episode Scraper] Starting episode list scrape: {series_url}")

    # Parse URL to get title_no
    if not title_no:
        # Extract from URL if not provided
        parsed = urlparse(series_url)
        query_params = parse_qs(parsed.query)
        if 'title_no' in query_params:
            title_no = query_params['title_no'][0]
        else:
            # Try to extract from path
            path_parts = [p for p in parsed.path.split('/') if p]
            if len(path_parts) >= 2:
                title_no = path_parts[1].split('?')[0]

    if not title_no:
        return {"success": False, "error": "Could not extract title_no from URL"}

    # Check cache first
    cache_mgr = get_episode_cache()
    cached = cache_mgr.get_episodes(title_no)
    if cached:
        logger.info(f"[Episode Scraper] Returning cached episodes for {title_no}")
        return {
            "success": True,
            "title_no": title_no,
            "series": cached.get("series_metadata", {}),
            "total_episodes": len(cached.get("episodes", [])),
            "episodes": cached.get("episodes", []),
            "from_cache": True
        }

    # Determine candidate fetch URLs. If a full URL provided, use it directly.
    candidate_urls = []
    if series_url and series_url.startswith("http"):
        candidate_urls = [series_url]
    else:
        # If title_no provided, try multiple possible genre listing pages instead of defaulting to one hardcoded genre.
        genres = ["action", "fantasy", "comedy", "drama", "slice-of-life", "supernatural", "sci-fi", "romance"]
        candidate_urls = [f"https://www.webtoons.com/en/{g}/list?title_no={title_no}" for g in genres]

    logger.info(f"[Episode Scraper] Candidate URLs count: {len(candidate_urls)}")

    html = None
    fetch_url = None
    # Try candidate URLs sequentially until a valid HTML payload is returned.
    for test_url in candidate_urls:
        logger.info(f"[Episode Scraper] Attempting fetch: {test_url}")
        html = await try_fetch_with_playwright(
            test_url,
            user_agent=random.choice(USER_AGENTS),
            referer="https://www.webtoons.com/",
            interactive=True
        )
        if html and len(html) > 1000:
            fetch_url = test_url
            logger.info(f"[Episode Scraper] Successfully fetched URL: {fetch_url}")
            break
        else:
            logger.info(f"[Episode Scraper] Fetch returned no/short HTML for: {test_url}")

    if not html:
        logger.warning(f"[Episode Scraper] Failed to fetch episode list HTML")
        return {"success": False, "error": "Failed to fetch episode list"}

    # Extract series metadata
    series_metadata = extract_metadata(html, fetch_url)

    # Parse episodes from HTML
    episodes = []

    if not BeautifulSoup:
        logger.error("[Episode Scraper] BeautifulSoup not available")
        return {
            "success": False,
            "error": "BeautifulSoup not available",
            "series": series_metadata
        }

    try:
        soup = BeautifulSoup(html, 'html.parser')

        # WEBTOON episode list selectors
        episode_selectors = [
            '.episode_lst li',  # Main episode list item
            '.comic_episode_lst li',
            '.episode-item',
            '[data-episode-no]',
            '.ep_item'
        ]

        episode_container = None
        for sel in episode_selectors:
            items = soup.select(sel)
            if items:
                logger.info(f"[Episode Scraper] Found {len(items)} episodes with selector: {sel}")
                episode_container = items
                break

        if not episode_container:
            logger.warning("[Episode Scraper] Could not find episode container")
            # Try to find any links that look like episodes
            all_links = soup.find_all('a')
            logger.info(f"[Episode Scraper] Found {len(all_links)} total links, analyzing...")

            for link in all_links:
                href = link.get('href', '')
                if 'episode_no=' in href or '/episode/' in href:
                    episode_container = [link]
                    break

        # Extract episode data
        for idx, ep_elem in enumerate(episode_container or []):
            if max_episodes and len(episodes) >= max_episodes:
                break

            try:
                # Extract episode number
                ep_no_elem = ep_elem.find(attrs={'class': re.compile(r'ep.*no|episode.*no', re.I)})
                ep_no = ep_no_elem.get_text(strip=True) if ep_no_elem else f"Episode {idx + 1}"

                # Extract episode title
                title_elem = ep_elem.find(attrs={'class': re.compile(r'title|ep.*title|subject', re.I)})
                ep_title = title_elem.get_text(strip=True) if title_elem else ep_no

                # Extract episode date
                date_elem = ep_elem.find(attrs={'class': re.compile(r'date|time|upload', re.I)})
                ep_date = date_elem.get_text(strip=True) if date_elem else ""

                # Extract thumbnail
                img_elem = ep_elem.find('img')
                thumbnail = ""
                if img_elem:
                    thumbnail = img_elem.get('src') or img_elem.get('data-src') or img_elem.get('data-lazy-src')
                    if thumbnail:
                        thumbnail = urljoin(fetch_url, thumbnail)

                # Extract episode link
                link_elem = ep_elem.find('a')
                ep_url = ""
                if link_elem:
                    ep_url = link_elem.get('href', '')
                    if ep_url:
                        ep_url = urljoin(fetch_url, ep_url)

                # Extract ratings (new enhancement)
                rating = None
                likes = None
                rating_elem = ep_elem.find(attrs={'class': re.compile(r'rating|score|like|vote', re.I)})
                if rating_elem:
                    rating_text = rating_elem.get_text(strip=True)
                    # Try to extract number (e.g., "4.5", "4.5/5", "★★★★☆")
                    rating_match = re.search(r'(\d+(?:\.\d+)?)', rating_text)
                    if rating_match:
                        try:
                            rating = float(rating_match.group(1))
                        except ValueError:
                            pass

                likes_elem = ep_elem.find(attrs={'class': re.compile(r'likes?|thumbs?up|favorites?', re.I)})
                if likes_elem:
                    likes_text = likes_elem.get_text(strip=True)
                    likes_match = re.search(r'(\d+(?:[KMB])?)', likes_text)
                    if likes_match:
                        likes = likes_match.group(1)

                episode_data = {
                    "number": ep_no,
                    "chapter_number": parse_episode_index(ep_no) or parse_episode_index(ep_title) or (idx + 1),
                    "title": ep_title,
                    "date": ep_date,
                    "thumbnail": thumbnail,
                    "url": ep_url,
                    "index": idx,
                    "rating": rating,
                    "likes": likes
                }

                episodes.append(episode_data)
                logger.debug(f"[Episode Scraper] Extracted: {ep_no} - {ep_title} (rating: {rating})")

            except Exception as e:
                logger.debug(f"[Episode Scraper] Error parsing episode {idx}: {e}")
                continue

        logger.info(f"[Episode Scraper] Successfully extracted {len(episodes)} episodes")

        # Cache the episodes
        cache_mgr = get_episode_cache()
        genre = series_metadata.get("genre") if series_metadata else None
        cache_mgr.save_episodes(title_no, episodes, series_metadata, genre, ttl_hours=24)

        return {
            "success": True,
            "series": series_metadata,
            "title_no": title_no,
            "url": fetch_url,
            "total_episodes": len(episodes),
            "episodes": episodes
        }

    except Exception as e:
        logger.error(f"[Episode Scraper] Parsing error: {e}")
        return {
            "success": False,
            "error": str(e),
            "series": series_metadata
        }


# ─── Enhanced Episode Scraper with Ratings & Advanced Features ─────────────

async def scrape_webtoon_episodes_advanced(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    page: int = 1,
    per_page: int = 50,
    include_ratings: bool = True,
    sort_by: str = "latest"  # latest, oldest, rating, likes
) -> Dict[str, Any]:
    """
    Advanced episode scraper with pagination, ratings, sorting, and caching.

    Args:
        series_url: WEBTOON series URL
        title_no: Series ID override
        max_episodes: Max episodes to fetch
        page: Page number for pagination (1-indexed)
        per_page: Episodes per page
        include_ratings: Whether to extract ratings
        sort_by: Sorting preference (latest, oldest, rating, likes)
    """
    from urllib.parse import urlparse, parse_qs, urljoin

    # First, get all episodes using base scraper
    result = await scrape_webtoon_episodes(
        series_url=series_url,
        title_no=title_no,
        max_episodes=None  # Get all first
    )

    if not result.get("success"):
        return result

    episodes = result.get("episodes", [])
    title_no = result.get("title_no")

    # Apply sorting
    if sort_by == "oldest":
        episodes = list(reversed(episodes))
    elif sort_by == "rating" and include_ratings:
        episodes.sort(key=lambda e: e.get("rating") or 0, reverse=True)
    elif sort_by == "likes" and include_ratings:
        episodes.sort(key=lambda e: e.get("likes") or "0", reverse=True)

    # Apply max_episodes limit if specified (before pagination)
    if max_episodes:
        episodes = episodes[:max_episodes]

    # Apply pagination
    total_episodes = len(episodes)

    # If no per_page specified or we want all, return all on page 1
    if not per_page or per_page <= 0:
        per_page = total_episodes if total_episodes > 0 else 1

    total_pages = max(1, (total_episodes + per_page - 1) // per_page)

    if page < 1:
        page = 1
    if page > total_pages:
        page = total_pages

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_episodes = episodes[start_idx:end_idx]

    result["episodes"] = paginated_episodes
    result["pagination"] = {
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "total_episodes": total_episodes,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }
    result["sort_by"] = sort_by

    logger.info(f"[Episode Scraper] Pagination: page {page}/{total_pages}, returned {len(paginated_episodes)} episodes")

    return result


async def scrape_webtoon_episodes_paginated(
    title_no: str,
    max_episodes: Optional[int] = None
) -> Dict[str, Any]:
    """
    Scrape episodes with built-in pagination handler.
    Automatically handles large series (100+ episodes).

    Args:
        title_no: Series ID
        max_episodes: Maximum episodes to fetch across all pages

    Returns:
        All episodes from all pages, up to max_episodes limit
    """
    all_episodes = []
    page = 1
    per_page = 100
    series_metadata = None

    logger.info(f"[Paginated Scraper] Starting multi-page scrape for title_no={title_no}")

    while True:
        result = await scrape_webtoon_episodes_advanced(
            series_url="",
            title_no=title_no,
            page=page,
            per_page=per_page,
            include_ratings=True
        )

        if not result.get("success"):
            logger.warning(f"[Paginated Scraper] Page {page} failed, stopping pagination")
            break

        if series_metadata is None:
            series_metadata = result.get("series")

        page_episodes = result.get("episodes", [])
        all_episodes.extend(page_episodes)

        pagination = result.get("pagination", {})
        logger.info(f"[Paginated Scraper] Page {page}: fetched {len(page_episodes)} episodes, total now {len(all_episodes)}")

        # Check if we've reached the limit
        if max_episodes and len(all_episodes) >= max_episodes:
            all_episodes = all_episodes[:max_episodes]
            break

        # Check if there are more pages
        if not pagination.get("has_next"):
            break

        page += 1

    return {
        "success": True,
        "series": series_metadata,
        "title_no": title_no,
        "total_episodes": len(all_episodes),
        "episodes": all_episodes,
        "pages_fetched": page - 1
    }


async def batch_scrape_series(
    series_list: List[Dict[str, str]],
    max_episodes_per_series: Optional[int] = 50
) -> Dict[str, Any]:
    """
    Batch scrape multiple WEBTOON series.

    Args:
        series_list: List of {"url": "...", "title_no": "..."} or {"title_no": "..."}
        max_episodes_per_series: Max episodes per series

    Returns:
        Aggregated results with success/failure counts
    """
    results = {
        "total": len(series_list),
        "successful": 0,
        "failed": 0,
        "series": []
    }

    logger.info(f"[Batch Scraper] Starting batch scrape of {len(series_list)} series")

    for idx, series_info in enumerate(series_list):
        try:
            logger.info(f"[Batch Scraper] Scraping {idx + 1}/{len(series_list)}")

            result = await scrape_webtoon_episodes(
                series_url=series_info.get("url", ""),
                title_no=series_info.get("title_no"),
                max_episodes=max_episodes_per_series
            )

            if result.get("success"):
                results["successful"] += 1
                results["series"].append({
                    "title_no": result.get("title_no"),
                    "title": result.get("series", {}).get("title"),
                    "total_episodes": result.get("total_episodes"),
                    "episodes": result.get("episodes", [])[:10]  # Store first 10 for summary
                })
            else:
                results["failed"] += 1
                results["series"].append({
                    "title_no": series_info.get("title_no"),
                    "error": result.get("error")
                })

        except Exception as e:
            logger.error(f"[Batch Scraper] Series {idx} failed: {e}")
            results["failed"] += 1
            results["series"].append({
                "title_no": series_info.get("title_no"),
                "error": str(e)
            })

    logger.info(f"[Batch Scraper] Completed: {results['successful']} successful, {results['failed']} failed")
    return results


# ─── Standalone Command-Line Interface (CLI) ──────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Sonikoma Webtoon Scraper CLI tool")
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
