"""
backend/app/services/scraper/scraper.py
─────────────────────────────────────────────────────────────────────────────
Lightweight coordinator facade for Webtoon scraping. Exposes main scraper
entry points while delegating fetching, parsing, and caching to sub-modules.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import time
import logging
import random
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, urljoin, quote, parse_qs

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
    natural_sort_key,
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

    # Strategy 1: Isolated BS4 Image extraction
    image_dict = {}
    bs4_imgs = parse_with_bs4(html, fetch_url)
    for img in bs4_imgs:
        image_dict[img] = True

    # Strategy 2: Nuxt window state parser
    nuxt_imgs = extract_images_from_nuxt_payload(html)
    for img in nuxt_imgs:
        image_dict[img] = True

    # Strategy 3: Loose regular expressions matching typical panel content
    if not image_dict:
        logger.info("[Scraper] Running Strategy 3 (Loose regex patterns) fallback...")
        loose_regex = [
            r'https?://[^\s"\']+\.(?:png|jpg|jpeg|webp|gif|svg|bmp|tiff)(?:\?[^\s"\']*)?',
            r'"url"\s*:\s*"([^"]+)"',
            r'"src"\s*:\s*"([^"]+)"'
        ]
        for pat in loose_regex:
            for match in re.finditer(pat, html, re.IGNORECASE):
                val = match.group(1) if '(' in pat or ')' in pat else match.group(0)
                val = decode_escaped_js_string(val)
                if val.startswith(('http://', 'https://')):
                    image_dict[val] = True

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
    """
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.error("[Episode Scraper] Playwright not installed")
        return {"success": False, "error": "Playwright not available"}

    logger.info(f"[Episode Scraper] Starting episode list scrape: {series_url}")

    if not title_no:
        parsed = urlparse(series_url)
        query_params = parse_qs(parsed.query)
        if 'title_no' in query_params:
            title_no = query_params['title_no'][0]
        else:
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
        episode_selectors = [
            '.episode_lst li', '.comic_episode_lst li', '.episode-item',
            '[data-episode-no]', '.ep_item'
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
            all_links = soup.find_all('a')
            for link in all_links:
                href = link.get('href', '')
                if 'episode_no=' in href or '/episode/' in href:
                    episode_container = [link]
                    break

        for idx, ep_elem in enumerate(episode_container or []):
            if max_episodes and len(episodes) >= max_episodes:
                break

            try:
                ep_no_elem = ep_elem.find(attrs={'class': re.compile(r'ep.*no|episode.*no', re.I)})
                ep_no = ep_no_elem.get_text(strip=True) if ep_no_elem else f"Episode {idx + 1}"

                title_elem = ep_elem.find(attrs={'class': re.compile(r'title|ep.*title|subject', re.I)})
                ep_title = title_elem.get_text(strip=True) if title_elem else ep_no

                date_elem = ep_elem.find(attrs={'class': re.compile(r'date|time|upload', re.I)})
                ep_date = date_elem.get_text(strip=True) if date_elem else ""

                img_elem = ep_elem.find('img')
                thumbnail = ""
                if img_elem:
                    thumbnail = img_elem.get('src') or img_elem.get('data-src') or img_elem.get('data-lazy-src')
                    if thumbnail:
                        thumbnail = urljoin(fetch_url, thumbnail)

                link_elem = ep_elem.find('a')
                ep_url = ""
                if link_elem:
                    ep_url = link_elem.get('href', '')
                    if ep_url:
                        ep_url = urljoin(fetch_url, ep_url)

                rating = None
                likes = None
                rating_elem = ep_elem.find(attrs={'class': re.compile(r'rating|score|like|vote', re.I)})
                if rating_elem:
                    rating_text = rating_elem.get_text(strip=True)
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
            except Exception as e:
                logger.debug(f"[Episode Scraper] Error parsing episode {idx}: {e}")
                continue

        logger.info(f"[Episode Scraper] Successfully extracted {len(episodes)} episodes")

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

