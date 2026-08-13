"""
backend/app/services/scraper/parsers/html.py
"""
import re
import csv
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urljoin

def _to_str(val: Any) -> str:
    """Safely convert an HTML element attribute value (str, list, or None) to a string."""
    if val is None:
        return ""
    if isinstance(val, list):
        return " ".join(str(v) for v in val).strip()
    return str(val).strip()


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

    if BeautifulSoup is not None:
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
    if BeautifulSoup is None:
        return []
    try:
        soup = BeautifulSoup(html, 'html.parser')
    except Exception:
        return []

    selectors = custom_selectors or [
        '#readerarea', '.readerarea', '#reader-area', '.reader-area-wrap', '.reader-area',
        '#_imageList', '._img_viewer_area', '.viewer_lst', '.wt_viewer', '._imageList',
        '.read-container', '.reader-page', '.gc-reader', '[data-gc-page]', '#reader',
        '.wp-manga-chapter-img', '.rd-page', '.page-break', '.reading-content', '.main-col',
        '.entry-content', '.reading-detail', '.chapter-content', '.episode-view', '.comic-content',
        '.panel-container', '#comic_view_area', '#comic-image', '#comic-view', '.ep-contents',
        '.chapter-img', '.page-content', '.comic-page-img', '.chapter-images', '.viewer-images',
        '.comic-pages', '.manga-reader', '#chapter-reader', '#manga-reader', '.vng-reader',
        '.reader-image-list', '.reader-content', '.reading-area', '.chapter-area',
        '.viewer-cnt', '.viewer-wrap', '#viewer-container', '.manga-image', '.read-img',
        '.chapter-img-list', '.chapter-image', '.reader-images', '#chapter-images', '.page-img',
        '#pages', '#images-container', '#pages-container', '.canvas-container', '.manga-page',
        '[data-page]', '[data-page-id]', '[class*="reader-content"]', '[class*="chapter-content"]',
        '[class*="reader-area"]', '[class*="viewer-area"]', '[class*="comic-view"]'
    ]

    container = None
    for sel in selectors:
        cand = soup.select_one(sel)
        if cand:
            if cand.name == 'img':
                container = cand.parent
                logger.info(f"[Scraper] BS4 isolated reader matched img selector '{sel}', using parent element")
                break
            elif cand.select_one('img, [data-src], [data-original]'):
                container = cand
                logger.info(f"[Scraper] BS4 isolated reader container matched: {sel}")
                break

    if not container and soup.body:
        candidates = soup.body.find_all(['div', 'main', 'article', 'section'])
        best_cand = None
        max_imgs = 0
        for cand in candidates:
            img_count = len(cand.find_all(['img', 'source']))
            if img_count > max_imgs:
                max_imgs = img_count
                best_cand = cand
        if max_imgs >= 2 and best_cand:
            container = best_cand
            logger.info(f"[Scraper] BS4 universal image-density container matched element with {max_imgs} images")

    def _extract_images_from_root(root, target_list: List[str]):
        for img in root.find_all(['img', 'source']):
            src = (
                _to_str(img.get('data-url')) or
                _to_str(img.get('data-src')) or
                _to_str(img.get('data-original')) or
                _to_str(img.get('data-original-src')) or
                _to_str(img.get('data-lazy-src')) or
                _to_str(img.get('data-raw-src')) or
                _to_str(img.get('data-cdn')) or
                _to_str(img.get('data-image')) or
                _to_str(img.get('data-bg')) or
                _to_str(img.get('data-echo')) or
                _to_str(img.get('origin-src')) or
                _to_str(img.get('lazy-src')) or
                _to_str(img.get('srcset')) or
                _to_str(img.get('src'))
            )
            if src:
                if ',' in src:
                    src = src.split(',')[0].strip()
                if ' ' in src:
                    src = src.split()[0].strip()
                if 'bg_transparency' in src or src.endswith('1x1.gif') or src.endswith('spacer.gif') or 'blank.gif' in src:
                    continue
                abs_src = urljoin(base_url, src)
                if abs_src not in target_list:
                    target_list.append(abs_src)

        for div in root.find_all(['div', 'picture', 'canvas', 'a', 'section']):
            data_src = (
                _to_str(div.get('data-src')) or
                _to_str(div.get('data-original')) or
                _to_str(div.get('data-url')) or
                _to_str(div.get('data-image')) or
                _to_str(div.get('data-cdn'))
            )
            if data_src:
                abs_src = urljoin(base_url, data_src)
                if abs_src not in target_list and not any(ext in abs_src for ext in ['1x1.gif', 'spacer.gif']):
                    target_list.append(abs_src)
            
            style = _to_str(div.get('style'))
            if 'url(' in style:
                bg_match = re.search(r'url\s*\(\s*["\']?([^"\'\)]+)["\']?\s*\)', style, re.IGNORECASE)
                if bg_match:
                    bg_url = bg_match.group(1).strip()
                    if bg_url and not bg_url.startswith('data:'):
                        abs_src = urljoin(base_url, bg_url)
                        if abs_src not in target_list:
                            target_list.append(abs_src)

    images = []
    if container:
        _extract_images_from_root(container, images)

    if not images:
        soup_copy = BeautifulSoup(str(soup), 'html.parser') if BeautifulSoup is not None else None
        if soup_copy:
            for unwanted in soup_copy.select(
                'header, footer, nav, aside, .creator_note, .author_area, .profile_area, '
                '#cList, .area_comment, .rt_area, .recommend_area, .comment_area, '
                '.viewer_lst_recommend, .viewer_lst_author, .author_avatar, .user_avatar, '
                '.reply_area, .comment_list, .aside, .header, .footer'
            ):
                unwanted.decompose()
            _extract_images_from_root(soup_copy, images)
        else:
            _extract_images_from_root(soup, images)

    return images
