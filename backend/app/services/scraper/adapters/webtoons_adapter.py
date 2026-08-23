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
from ..scraper_constants import WEBTOONS_DOMAINS, NAVER_DOMAINS, TAPAS_DOMAINS
from ..acquisition import HttpFetcher, BrowserFetcher
from ..extraction import DomExtractor

logger = logging.getLogger("sonikoma.services.scraper.adapters.webtoons")


class WebtoonsAdapter(BaseSiteAdapter):
    """Specialized adapter for Webtoons.com, Naver Webtoon, Tapas, and top webcomic portals."""

    name: str = "Line Webtoon & Official Portals"
    icon: str = "🟢"
    description: str = "Official webtoon reader adapter covering Webtoons, Naver, Toomics, Tapas, Tappytoon, Lezhin, Copin, and Pocket Comics."
    supported_domains: list = list(WEBTOONS_DOMAINS + NAVER_DOMAINS + TAPAS_DOMAINS)

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

        is_toomics = "toomics.com" in parsed.netloc.lower()
        referer = "https://global.toomics.com/" if is_toomics else "https://www.webtoons.com/"
        cookies = "age_check=1; needGDPR=false; adult_check=1; countryCode=US"

        html, status, _ = await HttpFetcher.fetch_html(
            target_url,
            headers={"Referer": referer, "Cookie": cookies}
        )
        # Fall back to browser if HTTP is blocked (Cloudflare / geo-gate)
        if not html or status not in (200, 206):
            logger.info(f"[WebtoonsAdapter] HTTP blocked ({status}), falling back to browser: {target_url}")
            wait_sel = "li.normal_ep, .list-ep li, .ep-item, a[href*='/webtoon/detail'], #_listUl li, ul#_episodeList li, .detail_lst li, h1"
            html, _, _ = await BrowserFetcher.render_page(
                target_url,
                auto_scroll=True,
                wait_selector=wait_sel,
                timeout_seconds=25.0
            )
        if not html:
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

        desc_elem = soup.select_one(".summary, .desc, .summary_content, meta[property='og:description']")
        description = (desc_elem.get("content") or desc_elem.get_text(strip=True)) if desc_elem else (series_meta.description or "")

        cover_elem = soup.select_one(".detail_thumb img, .thmb img, .detail_header img, meta[property='og:image'], meta[name='twitter:image']")
        cover_image = self.extract_image_src(cover_elem, target_url) if cover_elem else (series_meta.cover_image or "")
        if not cover_image and series_meta and series_meta.cover_image:
            cover_image = self.extract_image_src(series_meta.cover_image, target_url)

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
                thmb_src = self.extract_image_src(thmb_img, target_url) if thmb_img else cover_image

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
                    "cover_image": thmb_src or cover_image,
                    "date": date_str,
                    "likes": likes_str,
                    "language": "en"
                })

            if not found_new:
                break

            # Try the next page even if no explicit next-button is found in HTML.
            # Webtoons renders pagination dynamically; we just probe page_num+1 and stop if empty.
            page_num += 1

        # Browser retry if HTTP episode list came back empty (geo-block / lazy render)
        if not episodes:
            logger.info(f"[WebtoonsAdapter] No episodes from HTTP, triggering browser retry: {target_url}")
            b_html, _, _ = await BrowserFetcher.render_page(
                target_url,
                auto_scroll=True,
                wait_selector="#_listUl li, ul#_episodeList li, .detail_lst li",
                timeout_seconds=25.0
            )
            if b_html:
                b_soup = DomExtractor.get_soup(b_html)
                if not cover_image:
                    cover_el2 = b_soup.select_one(".detail_thumb img, .thmb img, meta[property='og:image']")
                    if cover_el2:
                        cover_image = cover_el2.get("content") or cover_el2.get("src") or cover_el2.get("data-src") or ""
                for li in b_soup.select("#_listUl li, ul#_episodeList li, .detail_lst li, li.normal_ep, .list-ep li, .ep-item, a[href*='/webtoon/detail']"):
                    a_tag = li if li.name == "a" else li.find("a", href=True)
                    if not a_tag:
                        continue
                    ep_url = urljoin(target_url, a_tag["href"])
                    if ep_url in seen_urls:
                        continue
                    seen_urls.add(ep_url)
                    sub_el = li.select_one(".subj span, .subj, .sub_title, .ep-title, h4, .title")
                    ep_title = sub_el.get_text(strip=True) if sub_el else a_tag.get_text(strip=True)
                    thmb_img = li.select_one(".thmb img, img, img[data-src]")
                    thmb_src = self.extract_image_src(thmb_img, ep_url) if thmb_img else cover_image
                    ep_parsed = urlparse(ep_url)
                    ep_q = parse_qs(ep_parsed.query)
                    ep_no_str = ep_q.get("episode_no", [""])[0]
                    m_ep = re.search(r"/ep/(\d+)", ep_url)
                    if m_ep and not ep_no_str:
                        ep_no_str = m_ep.group(1)
                    num_val, _ = self.extract_number_and_type(ep_title)
                    if num_val is None and ep_no_str:
                        try:
                            num_val = float(ep_no_str)
                        except ValueError:
                            pass
                    ep_cover = thmb_src or cover_image
                    episodes.append({
                        "episode_no": len(episodes) + 1,
                        "chapter_number": num_val,
                        "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or ep_no_str or len(episodes)+1)),
                        "title": ep_title or f"Episode {ep_no_str or len(episodes)+1}",
                        "url": ep_url,
                        "cover_image": ep_cover or cover_image,
                        "date": "",
                        "language": "en"
                    })

        sorted_eps = self.deduplicate_and_sort_episodes(episodes, sort_by=sort_by, preferred_language=preferred_language)

        return {
            "success": True,
            "title": series_title,
            "series_title": series_title,
            "title_no": title_no,
            "url": target_url,
            "author": author,
            "genre": genre,
            "description": description if 'description' in locals() else "",
            "cover_image": cover_image,
            "series": {
                "title": series_title,
                "author": author,
                "genre": genre,
                "description": description if 'description' in locals() else "",
                "cover_image": cover_image,
                "url": target_url
            },
            "chapters": sorted_eps,
            "total_chapters": len(sorted_eps)
        }

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes Webtoon-specific extraction with proper headers and episode parsing."""
        if not context.config.headers:
            context.config.headers = {}
        
        is_toomics = "toomics.com" in (context.normalized_url or context.url or "").lower()
        if is_toomics:
            context.config.headers["Referer"] = "https://global.toomics.com/"
            context.config.cookies = {"age_check": "1", "needGDPR": "false", "adult_check": "1", "countryCode": "US"}
            context.series_info.publisher = "TOOMICS"
            m_ep = re.search(r"/ep/(\d+)", context.normalized_url or context.url)
            if m_ep:
                try:
                    context.chapter_info.number = float(m_ep.group(1))
                    context.chapter_info.episode = f"Episode {m_ep.group(1)}"
                except ValueError:
                    pass
        else:
            context.config.headers["Referer"] = "https://www.webtoons.com/"
            context.series_info.publisher = "WEBTOON"

        # Extract title_no, episode_no, slug, and genre from URL structure
        parsed = urlparse(context.normalized_url or context.url)
        q = parse_qs(parsed.query)

        path_parts = [p for p in parsed.path.split("/") if p]
        if len(path_parts) >= 3 and not is_toomics:
            genre = path_parts[1]
            slug = path_parts[2]
            context.series_info.slug = slug
            if genre and genre.lower() not in ("en", "viewer", "list", "episode"):
                context.series_info.genres = [genre.capitalize()]

        title_no = q.get("title_no", [""])[0]
        if title_no and context.series_info.slug and not is_toomics:
            context.series_info.url = f"https://www.webtoons.com/en/{path_parts[1] if len(path_parts) >= 2 else 'general'}/{context.series_info.slug}/list?title_no={title_no}"

        if "episode_no" in q and not is_toomics:
            try:
                context.chapter_info.number = float(q["episode_no"][0])
                context.chapter_info.episode = f"Episode {q['episode_no'][0]}"
            except ValueError:
                pass

        generic_engine = GenericAdaptiveAdapter()
        return await generic_engine.scrape(context)
