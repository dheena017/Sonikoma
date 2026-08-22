"""
backend/app/services/scraper/adapters/webtoons.py
─────────────────────────────────────────────────────────────────────────────
Specialized Adapter for Line Webtoon, Naver Webtoon, and official portals.
Provides:
  1. Full Series Discovery & Multi-Page Paginated Episode Crawling
  2. Series Metadata & High-Res Cover Poster Extraction
  3. Chapter Images Scraping with proper Anti-Hotlink Referer Headers
─────────────────────────────────────────────────────────────────────────────
"""

import re
import logging
from urllib.parse import urlparse, parse_qs, urljoin
from typing import Optional, Dict, Any, List

from .base_site_adapter import BaseSiteAdapter
from .generic_site_adapter import GenericAdaptiveAdapter
from ..scrape_context import ScrapeContext
from ..scraper_models import ChapterResult, SourceInfo, SeriesInfo
from ..acquisition import HttpFetcher, BrowserFetcher
from ..extraction import DomExtractor

logger = logging.getLogger("sonikoma.services.scraper.adapters.webtoons")


class WebtoonsAdapter(BaseSiteAdapter):
    """Specialized adapter for Webtoons.com, Naver Webtoon, and top webcomic portals."""

    name: str = "Line Webtoon & Official Portals"
    icon: str = "🟢"
    description: str = "Official webtoon reader adapter covering Webtoons, Naver, Toomics, Tapas, Tappytoon, Lezhin, Copin, and Pocket Comics."
    supported_domains: list = [
        "webtoons.com", "webtoon.com", "naver.com", "toomics.com",
        "tapas.io", "tappytoon.com", "copincomics.com", "pocketcomics.com",
        "lezhin.com", "lezhinus.com", "bilibilicomics.com", "mangatoon.mobi", "webnovel.com"
    ]

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        domain = source_info.domain.lower()
        return any(d in domain for d in cls.supported_domains)

    async def discover_series(
        self,
        series_url: str,
        sort_by: str = "latest",
        max_episodes: Optional[int] = None,
        preferred_language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        """
        Crawls the complete paginated episode list for a Webtoon series.
        Extracts high-res cover image, author, genre, episode thumbnails, and release dates.
        """
        raw_url = (series_url or "").strip()
        parsed = urlparse(raw_url)
        q = parse_qs(parsed.query)
        title_no = q.get("title_no", [""])[0]

        # If given a viewer/chapter URL, resolve the parent list URL
        target_url = raw_url
        if "/viewer" in parsed.path:
            path_parts = [p for p in parsed.path.split("/") if p]
            if len(path_parts) >= 3 and title_no:
                target_url = f"https://www.webtoons.com/{path_parts[0]}/{path_parts[1]}/{path_parts[2]}/list?title_no={title_no}"

        html, status, _ = await HttpFetcher.fetch_html(
            target_url,
            headers={"Referer": "https://www.webtoons.com/"}
        )
        if not html or status != 200:
            return None

        soup = DomExtractor.get_soup(html)
        if not soup:
            return None

        # 1. Extract Series Info & Cover Poster
        series_meta, _ = DomExtractor.extract_metadata(html, target_url)
        title_elem = soup.select_one(".subj, .detail_header .subj, h1.subj, .info h1")
        series_title = title_elem.get_text(strip=True) if title_elem else (series_meta.title or "Webtoon Series")

        author_elem = soup.select_one(".author, .detail_header .author, .creator, a.author")
        author = author_elem.get_text(strip=True) if author_elem else (series_meta.author or "")

        genre_elem = soup.select_one(".genre, .detail_header .genre")
        genre = genre_elem.get_text(strip=True) if genre_elem else (series_meta.genres[0] if series_meta.genres else "General")

        cover_elem = soup.select_one(".detail_thumb img, .thmb img, .detail_header img, meta[property='og:image']")
        cover_image = ""
        if cover_elem:
            cover_image = cover_elem.get("content") or cover_elem.get("src") or cover_elem.get("data-src") or ""

        # 2. Paginated Episode Extraction Loop
        episodes: List[Dict[str, Any]] = []
        seen_urls = set()
        page_num = 1
        max_pages = 50

        while page_num <= max_pages:
            if max_episodes and len(episodes) >= max_episodes:
                break

            current_page_url = target_url
            if page_num > 1:
                current_page_url = f"{target_url}&page={page_num}" if "?" in target_url else f"{target_url}?page={page_num}"
                p_html, p_status, _ = await HttpFetcher.fetch_html(
                    current_page_url,
                    headers={"Referer": "https://www.webtoons.com/"}
                )
                if not p_html or p_status != 200:
                    break
                soup = DomExtractor.get_soup(p_html)
                if not soup:
                    break

            list_items = soup.select("#_listUl li, ul#_episodeList li, .detail_lst li")
            if not list_items:
                break

            found_new = False
            for li in list_items:
                a_tag = li.find("a", href=True)
                if not a_tag:
                    continue

                ep_url = urljoin(target_url, a_tag["href"])
                if ep_url in seen_urls:
                    continue
                seen_urls.add(ep_url)
                found_new = True

                # Episode number and title
                sub_title_el = li.select_one(".subj span, .subj, .sub_title, .title")
                ep_title = sub_title_el.get_text(strip=True) if sub_title_el else a_tag.get_text(strip=True)
                
                # Check for episode_no in query
                ep_parsed = urlparse(ep_url)
                ep_q = parse_qs(ep_parsed.query)
                ep_no_str = ep_q.get("episode_no", [""])[0]

                num_val, _ = self.extract_number_and_type(ep_title)
                if num_val is None and ep_no_str:
                    try:
                        num_val = float(ep_no_str)
                    except ValueError:
                        pass

                # Thumbnail image
                thmb_img = li.select_one(".thmb img, img")
                thmb_src = ""
                if thmb_img:
                    thmb_src = thmb_img.get("data-url") or thmb_img.get("data-src") or thmb_img.get("src") or ""

                # Date
                date_el = li.select_one(".date, .tx")
                date_str = self.normalize_date(date_el.get_text(strip=True) if date_el else "")

                # Likes count
                like_el = li.select_one(".like_area em, .like_area, .like")
                likes_str = like_el.get_text(strip=True) if like_el else ""

                episodes.append({
                    "episode_no": len(episodes) + 1,
                    "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or ep_no_str or len(episodes)+1)),
                    "chapter_number": num_val,
                    "title": ep_title or f"Episode {ep_no_str or len(episodes)+1}",
                    "url": ep_url,
                    "thumbnail": self.build_proxy_thumbnail_url(thmb_src, ep_url, cover_image),
                    "cover": cover_image,
                    "date": date_str,
                    "likes": likes_str,
                    "language": "en"
                })

            if not found_new:
                break

            # Check if there is a next page button or if list is exhausted
            next_btn = soup.select_one("#_nextPage, .pagination a.next, a.pg_next")
            if not next_btn:
                break

            page_num += 1

        sorted_eps = self.deduplicate_and_sort_episodes(episodes, sort_by=sort_by, preferred_language=preferred_language)

        return {
            "success": True,
            "series_title": series_title,
            "title_no": title_no,
            "url": target_url,
            "series": {
                "title": series_title,
                "author": author,
                "genre": genre,
                "cover_image": cover_image,
                "url": target_url
            },
            "episodes": sorted_eps,
            "total_episodes": len(sorted_eps)
        }

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes Webtoon-specific extraction with proper headers and episode parsing."""
        if not context.config.headers:
            context.config.headers = {}
        context.config.headers["Referer"] = "https://www.webtoons.com/"

        # Extract title_no, episode_no, slug, and genre from URL structure
        parsed = urlparse(context.normalized_url or context.url)
        q = parse_qs(parsed.query)

        path_parts = [p for p in parsed.path.split("/") if p]
        if len(path_parts) >= 3:
            genre = path_parts[1]
            slug = path_parts[2]
            context.series_info.slug = slug
            if genre and genre.lower() not in ("en", "viewer", "list", "episode"):
                context.series_info.genres = [genre.capitalize()]

        title_no = q.get("title_no", [""])[0]
        if title_no and context.series_info.slug:
            context.series_info.url = f"https://www.webtoons.com/en/{path_parts[1] if len(path_parts) >= 2 else 'general'}/{context.series_info.slug}/list?title_no={title_no}"

        context.series_info.publisher = "WEBTOON"

        if "episode_no" in q:
            try:
                context.chapter_info.number = float(q["episode_no"][0])
                context.chapter_info.episode = f"Episode {q['episode_no'][0]}"
            except ValueError:
                pass

        generic_engine = GenericAdaptiveAdapter()
        return await generic_engine.scrape(context)
