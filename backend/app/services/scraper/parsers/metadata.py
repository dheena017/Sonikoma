"""
backend/app/services/scraper/parsers/metadata.py
"""
import re
import logging
from typing import Dict, Optional, Tuple
from urllib.parse import urljoin

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

logger = logging.getLogger("sonikoma.services.scraper.parsers.metadata")

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
