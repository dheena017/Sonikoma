"""
backend/app/services/scraper/scraper.py
─────────────────────────────────────────────────────────────────────────────
Lightweight coordinator facade for Webtoon scraping. Exposes main scraper
entry points while delegating fetching, parsing, and caching to sub-modules.
─────────────────────────────────────────────────────────────────────────────
"""

from urllib.parse import urlparse, urlunparse, urljoin, quote, parse_qs, urlencode
import os
import re
import time
import logging
import random
from typing import List, Dict, Any, Optional

# Graceful optional imports
try:
    import httpx
except ImportError:
    httpx = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

from services.scraper.url_utils import extract_webtoon_url
from services.scraper.parsers import (
    USER_AGENTS,
    UNWANTED_PATTERNS,
    parse_episode_index,
    decode_escaped_js_string,
    scrape_local_archive,
    extract_metadata,
    parse_with_bs4,
    extract_images_from_nuxt_payload
)
from services.scraper.client import (
    try_fetch_url_resilient,
    try_fetch_with_playwright
)
from services.scraper.cache import (
    get_episode_cache,
    check_sqlite_cache,
    save_sqlite_cache
)

logger = logging.getLogger("sonikoma.services.scraper")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

# Global metadata store for current scraped sessions
scraped_metadata_cache: Dict[str, Dict[str, str]] = {}


async def scrape_images_from_url(
    url: str,
    source: Optional[str] = None,
    cookies: Optional[Dict[str, str]] = None,
    headers: Optional[Dict[str, str]] = None,
    bypass_cache: bool = False,
    limit: Optional[int] = None,
    proxy_images: bool = True,
    filter_banners: bool = True
) -> List[str]:
    """
    Crawls a Webtoon episode page and isolates the panel image URLs.
    Handles dynamic headers, Playwright rendering fallbacks, metadata cache extraction, and local CBZ/ZIP archives.
    """
    fetch_url = extract_webtoon_url(url)
    if not fetch_url:
        return []

    # Check if local_upload or dummy non-HTTP string
    if fetch_url.lower() in ("local_upload", "local", "upload") or (
        not fetch_url.startswith(("http://", "https://", "file://", "data:image/"))
        and not os.path.exists(fetch_url)
    ):
        logger.info(f"[Scraper] Bypassing web scraper for local/dummy URL: {fetch_url}")
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
            if not proxy_images:
                return [fetch_url]
            return [f"/api/proxy-image?url={quote(fetch_url)}&referer={quote(fetch_url)}"]

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
            arch_imgs = scrape_local_archive(local_path)
            if limit and limit > 0:
                arch_imgs = arch_imgs[:limit]
            return arch_imgs
        except Exception as e:
            logger.error(f"[Scraper] Archive extract failed: {e}")
            if fetch_url.startswith("file://"):
                return []

    # Cache lookup
    if not bypass_cache:
        cached = check_sqlite_cache(fetch_url)
        if cached:
            if limit and limit > 0:
                cached = cached[:limit]
            if not proxy_images:
                return cached
            return [f"/api/proxy-image?url={quote(img)}&referer={quote(fetch_url)}" for img in cached]

    parsed_domain = urlparse(fetch_url)
    base_domain = f"{parsed_domain.scheme}://{parsed_domain.netloc}/"
    referer = "https://www.webcomicsapp.com/" if source == 'webcomicsapp' else base_domain

    default_headers = {
        "User-Agent": USER_AGENTS[0],
        "Referer": referer,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
    }
    fetch_headers = {
        **default_headers,
        **(headers or {})
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
    logger.debug(
        f"[Scraper] Config: bypass_cache={bypass_cache}, limit={limit}, "
        f"proxy_images={proxy_images}, filter_banners={filter_banners}, "
        f"cookies_count={len(merged_cookies)}, headers_count={len(fetch_headers)}"
    )
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
            dump_filename = f"dump_{re.sub(r'[^a-zA-Z0-9]', '_', fetch_url)[:30]}.html"
            with open(os.path.join(debug_dir, dump_filename), "w", encoding="utf-8") as f:
                f.write(html)
        except Exception as e:
            logger.warning(f"[Scraper] Diagnostic HTML dump warning: {e}")

    if not html:
        logger.error(f"[Scraper] Scraping workflow failed to resolve HTML payload for: {fetch_url}")
        return []

    # Parse metadata
    metadata = extract_metadata(html, fetch_url)
    scraped_metadata_cache[fetch_url] = metadata

    def extract_intercepted_images(raw_html: str) -> List[str]:
        if not raw_html or "__intercepted_images__" not in raw_html:
            return []
        try:
            import json
            m = re.search(r'<script id="__intercepted_images__" type="application/json">(.*?)</script>', raw_html, re.DOTALL)
            if m:
                urls = json.loads(m.group(1))
                if isinstance(urls, list):
                    filtered = []
                    for u in urls:
                        if isinstance(u, str) and u.startswith(("http://", "https://")):
                            lower_u = u.lower()
                            if not any(pat in lower_u for pat in UNWANTED_PATTERNS):
                                filtered.append(u)
                    return filtered
        except Exception as ie:
            logger.warning(f"[Scraper] Failed to parse intercepted images: {ie}")
        return []

    # Strategy 1: Isolated BS4 Image extraction
    image_dict = {}
    bs4_imgs = parse_with_bs4(html, fetch_url)
    for img in bs4_imgs:
        image_dict[img] = True

    # Strategy 2: Nuxt window state parser
    nuxt_imgs = extract_images_from_nuxt_payload(html)
    for img in nuxt_imgs:
        image_dict[img] = True

    # Strategy 2.5: Playwright Network Intercepted images (Fallback ONLY if isolated reader containers found 0 images)
    if not image_dict:
        for img in extract_intercepted_images(html):
            image_dict[img] = True

    # Strategy 3: Loose regular expressions matching typical panel content in HTML/JSON payload
    # Only run if primary isolated container/payload extractors found fewer than 3 panel images
    if len(image_dict) < 3:
        logger.info("[Scraper] Running Strategy 3 (Loose regex patterns) payload harvester...")
        loose_regex = [
            r'https?://[^\s"\']+\.(?:png|jpg|jpeg|webp|gif|svg|bmp|tiff)(?:\?[^\s"\']*)?',
            r'"(?:url|src|downloadUrl|download_url|originalUrl|image_url|imageUrl|cdn_url|cut_url)"\s*:\s*"([^"]+)"',
            r'"url"\s*:\s*"([^"]+)"',
            r'"src"\s*:\s*"([^"]+)"'
        ]
        for pat in loose_regex:
            for match in re.finditer(pat, html, re.IGNORECASE):
                val = match.group(1) if (match.lastindex and match.group(1) is not None) else match.group(0)
                val = decode_escaped_js_string(val)
                if val.startswith(('http://', 'https://')):
                    image_dict[val] = True

    # Strategy 3.5: Dynamic Playwright rendering fallback for JS-heavy web apps (GlobalComix, Webtoons React/Vue readers)
    if len(image_dict) < 15:
        logger.info("[Scraper] Harvested under 15 panel images from static HTML. Triggering Playwright dynamic browser rendering...")
        pw_html = await try_fetch_with_playwright(
            fetch_url,
            user_agent=fetch_headers["User-Agent"],
            referer=fetch_headers["Referer"],
            cookies=merged_cookies
        )
        if pw_html:
            html = pw_html
            pw_bs4_imgs = parse_with_bs4(pw_html, fetch_url)
            for img in pw_bs4_imgs:
                image_dict[img] = True
            pw_nuxt_imgs = extract_images_from_nuxt_payload(pw_html)
            for img in pw_nuxt_imgs:
                image_dict[img] = True
            if not image_dict:
                for img in extract_intercepted_images(pw_html):
                    image_dict[img] = True

    # Strategy 4: Series Landing Page Auto-Resolver (e.g. GlobalComix https://globalcomix.com/c/the-backwards-house or any comic hub)
    if len(image_dict) < 2 and BeautifulSoup:
        logger.info("[Scraper] Running Strategy 4 (Series Page Chapter Resolver)...")
        try:
            soup = BeautifulSoup(html, 'html.parser')
            ch_links = []
            for a in soup.find_all('a', href=True):
                href = a.get('href')
                if isinstance(href, list):
                    href = " ".join(href)
                if not isinstance(href, str):
                    continue
                if any(term in href.lower() for term in ['/read/', '/chapters/', '/chapter', '/episode', '/episodes/', '/viewer/', '/detail', '/comic/', '/ep-', '/ch-', 'no=', 'episode_no=']) and href != fetch_url:
                    full_ch = urljoin(fetch_url, href)
                    if full_ch != fetch_url and full_ch not in ch_links and not full_ch.endswith('/c/'):
                        ch_links.append(full_ch)
            
            if ch_links:
                target_ch = ch_links[0]
                logger.info(f"[Scraper] Series page auto-resolving to Chapter URL: {target_ch}")
                ch_html = await try_fetch_url_resilient(target_ch, fetch_headers, cookies=merged_cookies)
                if not ch_html:
                    ch_html = await try_fetch_with_playwright(target_ch, user_agent=fetch_headers["User-Agent"], referer=fetch_headers["Referer"])
                if ch_html:
                    ch_bs4_imgs = parse_with_bs4(ch_html, target_ch)
                    for img in ch_bs4_imgs:
                        image_dict[img] = True
                    ch_nuxt_imgs = extract_images_from_nuxt_payload(ch_html)
                    for img in ch_nuxt_imgs:
                        image_dict[img] = True
        except Exception as res_err:
            logger.warning(f"[Scraper] Strategy 4 resolver warning: {res_err}")

    # Strategy 5: OpenGraph / Metadata cover image fallback
    if not image_dict and metadata.get("cover_image"):
        cov_img = metadata.get("cover_image")
        if cov_img and cov_img.startswith(("http://", "https://")):
            logger.info(f"[Scraper] Fallback to metadata cover/page image: {cov_img}")
            image_dict[cov_img] = True

    raw_images = list(image_dict.keys())
    filtered_images = []

    # Blacklist & banner filter check
    banner_patterns = [
        '/logo', 'header', 'footer', 'banner', 'facebook', 'twitter', 'instagram', 'share_btn', 'icon_',
        'thum_', 'thumbnail', 'cover_', '_cover', 'poster_', '_poster', 'mobile_webtoon', 'recommend', 'author_', 'profile_',
        'creator_note', 'author_area', 'profile_area', 'author_avatar', 'user_avatar'
    ]
    for img in raw_images:
        lower = img.lower()
        if any(pat in lower for pat in UNWANTED_PATTERNS):
            continue
        if filter_banners and any(b_pat in lower for b_pat in banner_patterns) and not any(k in lower for k in ['page', 'panel', 'episode', 'chapter']):
            continue
        filtered_images.append(img)

    # Fallback to metadata cover/page image if no valid comic panel candidates survived filtering
    if not filtered_images and metadata.get("cover_image"):
        cov_img = metadata.get("cover_image")
        if cov_img and cov_img.startswith(("http://", "https://")):
            logger.info(f"[Scraper] Fallback to metadata cover/page image: {cov_img}")
            filtered_images.append(cov_img)

    if limit and limit > 0:
        filtered_images = filtered_images[:limit]

    logger.info(f"[Scraper] Final parsed panel candidates count: {len(filtered_images)} (elapsed: {int((time.time() - start_time)*1000)}ms)")

    if not filtered_images:
        return []

    # Save cache
    save_sqlite_cache(fetch_url, filtered_images)

    if not proxy_images:
        return filtered_images

    return [f"/api/proxy-image?url={quote(img)}&referer={quote(fetch_url)}" for img in filtered_images]


def normalize_series_url(url: str) -> str:
    if not url:
        return url
    if "webtoons.com" not in url and "webtoon.com" not in url:
        return url
    try:
        from urllib.parse import urlunparse, urlencode
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


def parse_episodes_from_soup(soup: Optional[BeautifulSoup], fetch_url: str) -> List[Dict[str, Any]]:
    if not soup:
        return []

    episode_selectors = [
        # ── Webtoons ──────────────────────────────────────────────
        '.episode_lst li', '.comic_episode_lst li', '.episode-item',
        '[data-episode-no]', '.ep_item',
        # ── WordPress Madara / WP Manga / MangaStream ─────────────
        '.wp-manga-chapter', '.listing-chapters_wrap li', 'li.wp-manga-chapter',
        '#chapterlist li', '#chapterlist a', '.chapterlist li', '.chapters-list li',
        '.chapter-item', '.chapters li', '.chapter-list li', '.chap-item',
        '.chapter_list li', '.chapter-row', '.version-chap li', '.vol-list li',
        '.chapter-box li', '.main-chapter-list li', '.ts-chapter-list li',
        '[class*="chapter-item"]', '[class*="chap_item"]', '[class*="wp-manga-chapter"]',
        # ── MangaDex / SPA sites ─────────────────────────────────
        '[data-chapter]', '[data-chapter-id]', '[class*="ChapterRow"]', '[class*="chapter_row"]',
        # ── Asura Scans / Flame Comics / Reaper / Tachiyomi sites ─
        '.eph-num a', '.item__wrap', '.clstyle li', '.epcur', '.epl-num',
        '[class*="epcur"]', '[class*="epl-num"]', '.ep-item', '.chapter-card',
        # ── Broad fallback selectors ──────────────────────────────
        'ul.row-content-chapter li', '.list-chapter li', '.ep-list li', '.episode-list li',
    ]

    episode_container: List[Any] = []
    for sel in episode_selectors:
        items = soup.select(sel)
        if len(items) > 0:
            episode_container = list(items)
            logger.debug(f"[Episode Scraper] Matched selector '{sel}' with {len(items)} items")
            break

    def _extract_str_attr(node, *attrs: str) -> str:
        if not node:
            return ""
        for attr in attrs:
            val = node.get(attr)
            if isinstance(val, list):
                val = " ".join(val)
            if isinstance(val, str) and val.strip():
                return val.strip()
        return ""

    # Broad link fallback — recognises Webtoon AND generic chapter URL patterns
    CHAPTER_URL_PATTERNS = (
        'episode_no=', '/episode/', '/chapter/', '/manga/',
        '/vol', '/ch-', '/chap', 'chapter_no=', '/read/',
        '/ep-', '/c/', '/series/', '/comic/', 'chapter-', 'episode-',
    )
    if len(episode_container) == 0:
        all_links = soup.find_all('a')
        episode_container = [
            link for link in all_links
            if any(pat in _extract_str_attr(link, 'href').lower() for pat in CHAPTER_URL_PATTERNS)
        ]
        logger.debug(f"[Episode Scraper] Link fallback found {len(episode_container)} chapter links")

    episodes = []
    for idx, ep_elem in enumerate(episode_container):
        try:
            link_elem = ep_elem if ep_elem.name == 'a' else (ep_elem.find('a') or ep_elem)
            
            ep_no_elem = ep_elem.find(attrs={'class': re.compile(r'ep.*no|episode.*no|chap.*num|chapter.*num', re.I)})
            title_elem = ep_elem.find(attrs={'class': re.compile(r'title|ep.*title|subject|chap.*title|chapter.*title', re.I)})
            ep_title = title_elem.get_text(strip=True) if title_elem else ""

            if ep_no_elem:
                ep_no = ep_no_elem.get_text(strip=True)
                ep_url_early = ""
            else:
                ep_url_early = _extract_str_attr(link_elem, 'href')
                extracted = parse_episode_index(ep_title) or parse_episode_index(ep_url_early)
                if extracted is not None:
                    ep_no = f"Episode {int(extracted) if extracted == int(extracted) else extracted}"
                else:
                    ep_no = f"Episode {idx + 1}"

            if not ep_title:
                # Try to read the link text or the full element text
                ep_title = link_elem.get_text(strip=True) if link_elem else ep_elem.get_text(strip=True)
                ep_title = ep_title or ep_no

            date_elem = ep_elem.find(attrs={'class': re.compile(r'date|time|upload|release', re.I)})
            ep_date = date_elem.get_text(strip=True) if date_elem else ""

            img_elem = ep_elem.find('img')
            thumbnail = ""
            if img_elem:
                raw_thumb = _extract_str_attr(img_elem, 'src', 'data-src', 'data-lazy-src', 'data-original')
                if raw_thumb:
                    thumbnail = urljoin(fetch_url, raw_thumb)

            ep_url = _extract_str_attr(link_elem, 'href')
            if ep_url:
                ep_url = urljoin(fetch_url, ep_url)
            elif ep_url_early:
                ep_url = urljoin(fetch_url, ep_url_early)

            rating = None
            likes = None
            views = None

            rating_elem = (
                ep_elem.find(class_=re.compile(r'grade_num|rating_num|score_num', re.I)) or
                ep_elem.find(attrs={'class': re.compile(r'rating|score|like|vote', re.I)})
            )
            if rating_elem:
                rating_text = rating_elem.get_text(strip=True)
                rating_match = re.search(r'(\d+(?:\.\d+)?)', rating_text)
                if rating_match:
                    try:
                        rating = float(rating_match.group(1))
                    except ValueError:
                        pass

            likes_elem = (
                ep_elem.find(class_=re.compile(r'like_area|ico_like|like_num|heart_num', re.I)) or
                ep_elem.find(attrs={'class': re.compile(r'likes?|thumbs?up|favorites?', re.I)})
            )
            if likes_elem:
                likes_text = likes_elem.get_text(strip=True)
                likes_match = re.search(r'([\d,]+(?:\.\d+)?[KMB]?)', likes_text)
                if likes_match:
                    likes = likes_match.group(1).replace(',', '')

            views_elem = (
                ep_elem.find(class_=re.compile(r'view_count|cnt_view|view_num|read_count', re.I)) or
                ep_elem.find(attrs={'class': re.compile(r'views?|reads?|count', re.I)})
            )
            if views_elem:
                views_text = views_elem.get_text(strip=True)
                views_match = re.search(r'([\d,]+)', views_text)
                if views_match:
                    try:
                        views = int(views_match.group(1).replace(',', ''))
                    except ValueError:
                        pass

            ch_num = parse_episode_index(ep_no) or parse_episode_index(ep_title) or (idx + 1)
            display_name = ep_title if ep_title and ep_title != ep_no else (ep_no or f"Chapter {ch_num}")

            episodes.append({
                "number": ep_no,
                "chapter_number": ch_num,
                "title": ep_title,
                "name": display_name,
                "date": ep_date,
                "thumbnail": thumbnail,
                "url": ep_url,
                "index": idx,
                "rating": rating,
                "likes": likes,
                "views": views,
            })
        except Exception as e:
            logger.debug(f"[Episode Scraper] Error parsing item {idx}: {e}")
            continue

    return episodes


def extract_max_page_from_soup(soup: Optional[BeautifulSoup]) -> int:
    max_page = 1
    if not soup:
        return max_page
    paginate_links = soup.select('.paginate a, .comic_paginate a, [class*="paginate"] a, #_pg a')
    for a in paginate_links:
        href = a.get('href')
        if isinstance(href, str):
            m = re.search(r'[?&]page=(\d+)', href)
            if m:
                try:
                    max_page = max(max_page, int(m.group(1)))
                except ValueError:
                    pass
    return max_page


def build_page_url(base_url: str, page_num: int) -> str:
    parsed = urlparse(base_url)
    qs = parse_qs(parsed.query)
    qs['page'] = [str(page_num)]
    new_query = urlencode(qs, doseq=True)
    return urlunparse(parsed._replace(query=new_query))


async def scrape_webtoon_episodes(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    bypass_cache: bool = False
) -> Dict[str, Any]:
    if series_url:
        series_url = normalize_series_url(series_url)

    logger.info(f"[Episode Scraper] Starting episode list scrape: {series_url}")

    if not title_no:
        parsed = urlparse(series_url or "")
        query_params = parse_qs(parsed.query)
        if 'title_no' in query_params:
            title_no = query_params['title_no'][0]
        else:
            path_parts = [p for p in parsed.path.split('/') if p]
            if len(path_parts) >= 2 and path_parts[1].split('?')[0].isdigit():
                title_no = path_parts[1].split('?')[0]

    if not title_no:
        if series_url:
            import hashlib
            title_no = "url_" + hashlib.md5(series_url.encode('utf-8')).hexdigest()[:12]
        else:
            return {"success": False, "error": "Could not identify series URL or ID"}

    # Check cache first (skip if bypass_cache=True)
    cache_mgr = get_episode_cache()
    if not bypass_cache:
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
    else:
        logger.info(f"[Episode Scraper] Bypassing cache for fresh scrape: {title_no}")

    candidate_urls = []
    if series_url and series_url.startswith("http"):
        candidate_urls = [series_url]
    else:
        genres = ["action", "fantasy", "comedy", "drama", "slice-of-life", "supernatural", "sci-fi", "romance"]
        candidate_urls = [f"https://www.webtoons.com/en/{g}/list?title_no={title_no}" for g in genres]

    logger.info(f"[Episode Scraper] Candidate URLs count: {len(candidate_urls)}")

    html = None
    fetch_url = None
    for test_url in candidate_urls:
        logger.info(f"[Episode Scraper] Attempting fetch: {test_url}")
        
        # Derive dynamic referer based on test_url domain
        p_test = urlparse(test_url)
        dynamic_ref = f"{p_test.scheme}://{p_test.netloc}/" if p_test.scheme and p_test.netloc else "https://www.webtoons.com/"
        
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Referer": dynamic_ref,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
        }
        
        # Fast HTTP resilient fetch first
        try:
            html = await try_fetch_url_resilient(test_url, headers)
        except Exception as e:
            logger.debug(f"[Episode Scraper] Resilient fetch exception: {e}")
            html = None
            
        # Playwright browser rendering fallback for SPA / JS-only sites
        if not html or len(html) < 1000:
            logger.info(f"[Episode Scraper] HTTP fetch produced short/no HTML. Fallback to Playwright browser for: {test_url}")
            html = await try_fetch_with_playwright(
                test_url,
                user_agent=headers["User-Agent"],
                referer=dynamic_ref,
                interactive=True
            )

        if html and len(html) > 1000:
            fetch_url = test_url
            logger.info(f"[Episode Scraper] Successfully fetched URL: {fetch_url} ({len(html)} bytes)")
            break
        else:
            logger.info(f"[Episode Scraper] Fetch returned no/short HTML for: {test_url}")
            logger.info(f"[Episode Scraper] Fetch returned no/short HTML for: {test_url}")

    if not html or not fetch_url:
        logger.warning("[Episode Scraper] Failed to fetch episode list HTML")
        return {"success": False, "error": "Failed to fetch episode list"}

    series_metadata = extract_metadata(html, fetch_url)
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
        episodes = parse_episodes_from_soup(soup, fetch_url)
        max_page = extract_max_page_from_soup(soup)

        logger.info(f"[Episode Scraper] Page 1 fetched {len(episodes)} episodes (detected max_page: {max_page})")

        # Multi-page fetching if pagination exists
        if max_page > 1:
            page_limit = min(max_page, 20)
            seen_urls = set(ep["url"] for ep in episodes if ep.get("url"))

            for p in range(2, page_limit + 1):
                if max_episodes and len(episodes) >= max_episodes:
                    break
                p_url = build_page_url(fetch_url, p)
                logger.info(f"[Episode Scraper] Fetching extra page {p}/{page_limit}: {p_url}")
                page_html = None

                headers = {"User-Agent": random.choice(USER_AGENTS), "Referer": "https://www.webtoons.com/"}
                try:
                    page_html = await try_fetch_url_resilient(p_url, headers)
                except Exception:
                    page_html = None

                if not page_html or len(page_html) < 1000:
                    page_html = await try_fetch_with_playwright(
                        p_url,
                        user_agent=random.choice(USER_AGENTS),
                        referer="https://www.webtoons.com/",
                        interactive=True
                    )

                if page_html and len(page_html) > 1000:
                    p_soup = BeautifulSoup(page_html, 'html.parser')
                    p_eps = parse_episodes_from_soup(p_soup, fetch_url)
                    added_count = 0
                    for ep in p_eps:
                        if ep.get("url") and ep["url"] in seen_urls:
                            continue
                        if ep.get("url"):
                            seen_urls.add(ep["url"])
                        episodes.append(ep)
                        added_count += 1
                    logger.info(f"[Episode Scraper] Page {p} added {added_count} episodes")
                else:
                    logger.warning(f"[Episode Scraper] Failed to fetch page {p}")
                    break

        # Re-index all accumulated episodes sequentially
        for idx, ep in enumerate(episodes):
            ep["index"] = idx

        if max_episodes:
            episodes = episodes[:max_episodes]

        logger.info(f"[Episode Scraper] Successfully extracted total {len(episodes)} episodes across pages")

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

