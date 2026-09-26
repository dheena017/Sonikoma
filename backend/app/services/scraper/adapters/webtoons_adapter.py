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
import time
import asyncio
import logging
from urllib.parse import urlparse, parse_qs, urljoin, urlencode, urlunparse
from typing import Optional, Dict, Any, List

from .base_site_adapter import BaseSiteAdapter
from .generic_site_adapter import GenericAdaptiveAdapter
from ..scrape_context import ScrapeContext
from ..scraper_models import (
    ChapterResult,
    SourceInfo,
    SeriesInfo,
    CandidateImage,
    ImageSourceType,
    ScrapeCompleteness
)
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

        # Clean target URL: strip transient page / episode parameters to normalize to clean base series list URL
        clean_q = {k: v for k, v in q.items() if k.lower() not in ("page", "episode_no")}
        if title_no and "title_no" not in clean_q:
            clean_q["title_no"] = [title_no]
        clean_query = urlencode(clean_q, doseq=True)
        clean_path = parsed.path
        if "/viewer" in parsed.path:
            path_parts = [p for p in parsed.path.split("/") if p]
            if len(path_parts) >= 3 and title_no:
                clean_path = f"/{path_parts[0]}/{path_parts[1]}/{path_parts[2]}/list"
        target_url = urlunparse((
            parsed.scheme or "https",
            parsed.netloc or "www.webtoons.com",
            clean_path,
            "",
            clean_query,
            ""
        ))

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


        # 2. Paginated Episode Extraction
        def extract_page_episodes(page_soup) -> List[Dict[str, Any]]:
            items = page_soup.select("#_listUl li, ul#_episodeList li, .detail_lst li")
            if not items:
                return []
            page_eps = []
            for li in items:
                a_tag = li.find("a", href=True)
                if not a_tag:
                    continue

                ep_url = urljoin(target_url, a_tag["href"])
                sub_title_el = li.select_one(".subj span, .subj, .sub_title, .title")
                ep_title = sub_title_el.get_text(strip=True) if sub_title_el else a_tag.get_text(strip=True)

                ep_parsed = urlparse(ep_url)
                ep_q = parse_qs(ep_parsed.query)
                ep_no_str = ep_q.get("episode_no", [""])[0] or li.get("data-episode-no", "")

                num_val, _ = self.extract_number_and_type(ep_title)
                if num_val is None and ep_no_str:
                    try:
                        num_val = float(ep_no_str)
                    except ValueError:
                        pass

                thmb_img = li.select_one(".thmb img, img")
                thmb_src = self.extract_image_src(thmb_img, target_url) if thmb_img else cover_image

                date_el = li.select_one(".date, .tx")
                date_str = self.normalize_date(date_el.get_text(strip=True) if date_el else "")

                like_el = li.select_one(".like_area em, .like_area, .like")
                likes_str = like_el.get_text(strip=True) if like_el else ""

                page_eps.append({
                    "episode_no": num_val or ep_no_str or len(page_eps) + 1,
                    "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or ep_no_str or len(page_eps) + 1)),
                    "chapter_number": num_val,
                    "title": ep_title or f"Episode {ep_no_str or len(page_eps) + 1}",
                    "url": ep_url,
                    "cover_image": thmb_src or cover_image,
                    "date": date_str,
                    "likes": likes_str,
                    "language": "en"
                })
            return page_eps

        episodes: List[Dict[str, Any]] = []
        seen_urls = set()

        # Extract page 1 episodes from the initial soup
        for ep in extract_page_episodes(soup):
            if ep["url"] not in seen_urls:
                seen_urls.add(ep["url"])
                episodes.append(ep)

        # Estimate total pages from latest episode number on page 1
        est_pages = 50
        first_item = soup.select_one("#_listUl li, ul#_episodeList li, .detail_lst li")
        if first_item:
            data_ep = first_item.get("data-episode-no", "")
            if not data_ep:
                a_first = first_item.find("a", href=True)
                if a_first:
                    ep_q = parse_qs(urlparse(a_first["href"]).query)
                    data_ep = ep_q.get("episode_no", [""])[0]
            if data_ep and data_ep.isdigit():
                est_pages = (int(data_ep) + 9) // 10

        target_pages = min(est_pages, (max_episodes + 9) // 10) if max_episodes else min(max(est_pages, 50), 300)

        # Fetch remaining pages concurrently in batches
        batch_size = 5
        curr_page = 2
        consecutive_empty = 0

        while curr_page <= target_pages and consecutive_empty < 2:
            if max_episodes and len(episodes) >= max_episodes:
                break
            batch_pages = list(range(curr_page, min(curr_page + batch_size, target_pages + 1)))
            batch_urls = [f"{target_url}&page={p}" if "?" in target_url else f"{target_url}?page={p}" for p in batch_pages]

            tasks = [
                HttpFetcher.fetch_html(
                    b_url,
                    headers={"Referer": referer, "Cookie": cookies}
                )
                for b_url in batch_urls
            ]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            batch_new_count = 0
            for p, res in zip(batch_pages, batch_results):
                if isinstance(res, Exception) or not res or not res[0] or res[1] != 200:
                    continue
                p_html = res[0]
                p_soup = DomExtractor.get_soup(p_html)
                if not p_soup:
                    continue
                p_eps = extract_page_episodes(p_soup)
                for ep in p_eps:
                    if ep["url"] not in seen_urls:
                        seen_urls.add(ep["url"])
                        episodes.append(ep)
                        batch_new_count += 1
                        if max_episodes and len(episodes) >= max_episodes:
                            break
                if max_episodes and len(episodes) >= max_episodes:
                    break

            if batch_new_count == 0:
                consecutive_empty += 1
            else:
                consecutive_empty = 0

            curr_page += batch_size

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

        # Dedicated Webtoons High-Speed DOM Extraction in Strict Presentation Sequence
        target_url = context.normalized_url or context.url
        start_time = time.time()
        html, status, _ = await HttpFetcher.fetch_html(
            target_url,
            headers=context.config.headers,
            cookies=context.config.cookies
        )

        soup = DomExtractor.get_soup(html) if html and status == 200 else None
        img_nodes = soup.select("#_imageList img, .viewer_lst img, div.viewer_img img, .viewer_img img, ._viewerBox img") if soup else []

        if not img_nodes and context.config.enable_browser_fallback:
            logger.info(f"[WebtoonsAdapter] Static HTML yielded 0 viewer images, escalating to headless browser for {target_url}")
            b_html, _, _ = await BrowserFetcher.render_page(
                target_url,
                auto_scroll=True,
                wait_selector="#_imageList img, .viewer_lst img",
                timeout_seconds=25.0
            )
            if b_html:
                soup = DomExtractor.get_soup(b_html)
                img_nodes = soup.select("#_imageList img, .viewer_lst img, div.viewer_img img, .viewer_img img, ._viewerBox img") if soup else []

        if soup:
            series_meta, chapter_meta = DomExtractor.extract_metadata(soup, target_url)
            if series_meta:
                if series_meta.title and not context.series_info.title:
                    context.series_info.title = series_meta.title
                if series_meta.author and not context.series_info.author:
                    context.series_info.author = series_meta.author
                if series_meta.description and not context.series_info.description:
                    context.series_info.description = series_meta.description
                if series_meta.cover_image and not context.series_info.cover_image:
                    context.series_info.cover_image = series_meta.cover_image
                if series_meta.genres and not context.series_info.genres:
                    context.series_info.genres = series_meta.genres

            # Webtoon specific series title extraction from viewer headers
            series_node = soup.select_one(".subj_info a.subj, .viewer_header .subj, .title_area h2, .info h1")
            if series_node and not context.series_info.title:
                context.series_info.title = series_node.get_text(strip=True)

            if not context.series_info.title and context.series_info.slug:
                context.series_info.title = context.series_info.slug.replace("-", " ").replace("_", " ").title()

            # Webtoon specific author extraction
            author_meta = soup.select_one(
                "meta[property='com-linewebtoon:episode:author'], meta[name='author'], meta[property='og:creator'], meta[name='twitter:creator']"
            )
            if author_meta and author_meta.get("content"):
                context.series_info.author = author_meta["content"].strip()
            if not context.series_info.author:
                author_node = soup.select_one(".author_area, span.author, .author, .subj_info .author, .creator, a.author")
                if author_node and author_node.get_text(strip=True):
                    context.series_info.author = author_node.get_text(strip=True)

            # Webtoon specific synopsis / description extraction
            desc_meta = soup.select_one(
                "meta[property='og:description'], meta[name='description'], meta[name='twitter:description']"
            )
            if desc_meta and desc_meta.get("content"):
                context.series_info.description = desc_meta["content"].strip()
            if not context.series_info.description:
                desc_node = soup.select_one(".summary, .desc, .summary_content, .detail_header .desc")
                if desc_node and desc_node.get_text(strip=True):
                    context.series_info.description = desc_node.get_text(strip=True)

            # Webtoon specific cover image extraction (high-res official thumbnail)
            og_img = soup.select_one("meta[property='og:image'], meta[name='twitter:image']")
            if og_img and og_img.get("content"):
                context.series_info.cover_image = og_img["content"].strip()

            # Webtoon specific chapter title extraction (prioritizing episode header, NOT series title link)
            ch_title_node = soup.select_one("h1.subj_episode, .subj_episode, .subj_sub, .title_area h1")
            if ch_title_node:
                ch_txt = ch_title_node.get_text(strip=True)
                if ch_txt and ch_txt.lower() != (context.series_info.title or "").lower():
                    context.chapter_info.title = ch_txt

            # Fallback chapter title from og:title if needed (e.g. "Series - Episode Title")
            if not context.chapter_info.title:
                og_title_el = soup.select_one("meta[property='og:title']")
                if og_title_el and og_title_el.get("content"):
                    raw_og_t = og_title_el["content"].strip()
                    if " - " in raw_og_t:
                        candidate_title = raw_og_t.split(" - ", 1)[1].strip()
                        if candidate_title:
                            context.chapter_info.title = candidate_title

            # Fallback chapter title and number from URL path (e.g. /1270-backache-1/viewer)
            if context.chapter_info.number is None:
                m_num = re.search(r"/(\d+)[-_]([a-zA-Z0-9-_]+)", target_url)
                if m_num:
                    try:
                        context.chapter_info.number = float(m_num.group(1))
                        context.chapter_info.episode = f"Episode {m_num.group(1)}"
                    except ValueError:
                        pass
                    if not context.chapter_info.title:
                        context.chapter_info.title = m_num.group(2).replace("-", " ").title()

            seen_urls = set()
            for idx, img in enumerate(img_nodes):
                raw_src = (
                    img.get("data-url")
                    or img.get("data-src")
                    or img.get("data-original")
                    or img.get("src")
                    or ""
                ).strip()
                if not raw_src or raw_src in seen_urls:
                    continue
                if any(ext in raw_src.lower() for ext in ["1x1.gif", "spacer.gif", "blank.gif", "loading.gif", "pixel.gif"]):
                    continue
                full_src = urljoin(target_url, raw_src)
                if not full_src.startswith("http"):
                    continue
                seen_urls.add(raw_src)
                context.candidate_images.append(CandidateImage(
                    url=full_src,
                    source_type=ImageSourceType.DOM,
                    index=len(context.candidate_images),
                    is_inside_reader=True,
                    confidence=0.98
                ))

            if context.candidate_images:
                context.completeness = ScrapeCompleteness.COMPLETE
                return self._finalize(context, start_time)

        # Generic fallback if specialized selectors found nothing
        generic_engine = GenericAdaptiveAdapter()
        return await generic_engine.scrape(context)
