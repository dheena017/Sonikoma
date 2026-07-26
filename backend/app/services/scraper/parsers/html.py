"""
backend/app/services/scraper/parsers/html.py
"""
import re
import csv
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urljoin

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

from .utils import _parse_date_string, _fetch_source

logger = logging.getLogger("sonikoma.services.scraper.parsers.html")

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

def parse_with_bs4(html: str, base_url: str, custom_selectors: Optional[List[str]] = None) -> List[str]:
    """Uses BeautifulSoup to fetch images inside typical reader containers."""
    if not BeautifulSoup:
        return []
    try:
        soup = BeautifulSoup(html, 'html.parser')
    except Exception:
        return []

    selectors = custom_selectors or [
        # GlobalComix reader
        '.read-container', '.reader-page', '.gc-reader', '[data-gc-page]', '#reader', '.reader-area-wrap',
        # Webtoons-specific: panel image list
        '#_imageList', '._img_viewer_area', '.viewer_lst', '.wt_viewer', '._imageList',
        # Asura, Reaper, Flame, WordPress Manga / Madara themes
        '#readerarea', '.readerarea', '#reader-area', '.wp-manga-chapter-img',
        '.rd-page', '.page-break', '.reading-content', '.main-col', '.entry-content',
        '.reading-detail', '.chapter-content', '.episode-view', '.comic-content',
        '.panel-container', '#comic_view_area', '#comic-image', '#comic-view',
        '.ep-contents', '.chapter-img', '.page-content', '.comic-page-img',
        '.chapter-images', '.viewer-images', '.comic-pages', '.manga-reader',
        '#chapter-reader', '#manga-reader', '.vng-reader', '.reader-image-list',
        '[class*="reader"]', '[class*="chapter-content"]', '[id*="reader"]'
    ]

    container = None
    for sel in selectors:
        container = soup.select_one(sel)
        if container:
            logger.info(f"[Scraper] BS4 isolated reader container: {sel}")
            break

    search_root = container if container else soup
    images = []
    
    def _to_str(val: Any) -> str:
        if isinstance(val, list):
            val = " ".join(val)
        return val.strip() if isinstance(val, str) else ""

    # 1. Standard img elements
    for img in search_root.find_all('img'):
        src = (
            _to_str(img.get('data-url')) or
            _to_str(img.get('data-src')) or
            _to_str(img.get('data-original')) or
            _to_str(img.get('data-lazy-src')) or
            _to_str(img.get('data-raw-src')) or
            _to_str(img.get('data-cdn')) or
            _to_str(img.get('data-image')) or
            _to_str(img.get('data-bg')) or
            _to_str(img.get('origin-src')) or
            _to_str(img.get('lazy-src')) or
            _to_str(img.get('src'))
        )
        if src:
            # Skip transparent placeholder images used by Webtoons/readers
            if 'bg_transparency' in src or src.endswith('1x1.gif') or src.endswith('spacer.gif') or 'blank.gif' in src:
                continue
            abs_src = urljoin(base_url, src)
            if abs_src not in images:
                images.append(abs_src)

    # 2. Div / Picture / Canvas elements with data-src or inline background-image (GlobalComix & SPAs)
    for div in search_root.find_all(['div', 'picture', 'canvas', 'a', 'section']):
        data_src = (
            _to_str(div.get('data-src')) or
            _to_str(div.get('data-original')) or
            _to_str(div.get('data-url')) or
            _to_str(div.get('data-image')) or
            _to_str(div.get('data-cdn'))
        )
        if data_src:
            abs_src = urljoin(base_url, data_src)
            if abs_src not in images and not any(ext in abs_src for ext in ['1x1.gif', 'spacer.gif']):
                images.append(abs_src)
        
        style = _to_str(div.get('style'))
        if 'url(' in style:
            bg_match = re.search(r'url\s*\(\s*["\']?([^"\'\)]+)["\']?\s*\)', style, re.IGNORECASE)
            if bg_match:
                bg_url = bg_match.group(1).strip()
                if bg_url and not bg_url.startswith('data:'):
                    abs_src = urljoin(base_url, bg_url)
                    if abs_src not in images:
                        images.append(abs_src)

    return images
