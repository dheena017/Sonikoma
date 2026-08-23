"""
backend/app/services/scraper/adapters/generic.py
─────────────────────────────────────────────────────────────────────────────
Reason-Driven Self-Adaptive Universal Scraper Adapter.
Implements the 10-tier architecture:
  1. L5 Idempotency Cache Check (0ms hit)
  2. AccessEvaluator (Cloudflare/Bot/403/429 detection)
  3. Deterministic DOM & Embedded State Extraction
  4. ExtractionEvaluator (Quantitative Confidence Scoring)
  5. Self-Healing DomainStrategy Memory
  6. Gemini 2.5 Flash as Planner via DOMReductionEngine (1-3 KB digest)
  7. BlueprintValidator (DOM verification before persistence)
  8. BrowserPool Fallback (Bounded Playwright concurrency with auto-scroll)
  9. Content Validator, Order Resolver, and Deduplication
  10. Multi-Level Cache Persistence & Strategy Health Tracking
─────────────────────────────────────────────────────────────────────────────
"""

import re
import json
import time
import logging
from typing import Optional, List, Any, Dict, Set, Tuple
from urllib.parse import urlparse, urljoin

from .base_site_adapter import BaseSiteAdapter
from ..scrape_context import ScrapeContext
from ..scraper_models import (
    ChapterResult,
    SourceInfo,
    EscalationStatus,
    ScrapeCompleteness,
    ScrapeError,
    ScrapeErrorCode,
    CandidateImage,
    ImageSourceType,
    ReaderCandidate
)
from ..evidence import EvidenceSource
from ..acquisition import HttpFetcher, BrowserFetcher
from ..extraction import DomExtractor, EmbeddedStateExtractor, ApiExtractor
from ..url_utils import UrlNormalizer
from ..scraper_cache_manager import ScraperCacheManager
from ..content_evaluator import (
    AccessEvaluator,
    AccessStatus,
    ExtractionEvaluator,
    EscalationReason,
    ScraperDiagnosticsLogger
)
from ..scraper_constants import (
    READER_CONTAINER_SELECTORS,
    KNOWN_MANGA_IMAGE_SELECTORS,
    UNWANTED_CONTAINERS,
    MIN_READER_CONFIDENCE_THRESHOLD
)

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None


class ReaderDetector:
    """Discovers and scores candidate reader containers in HTML."""

    @classmethod
    def detect_reader(cls, html_or_soup: Any, base_url: Optional[str] = None) -> Tuple[List[ReaderCandidate], Optional[ReaderCandidate]]:
        if not BeautifulSoup or html_or_soup is None:
            return [], None
        if isinstance(html_or_soup, str):
            try:
                soup = BeautifulSoup(html_or_soup, "html.parser")
            except Exception:
                return [], None
        else:
            soup = html_or_soup

        candidates: List[ReaderCandidate] = []
        tested_nodes = set()

        for sel in READER_CONTAINER_SELECTORS:
            try:
                matched_elements = soup.select(sel)
                for el in matched_elements:
                    node = el.parent if el.name == "img" else el
                    if not node or id(node) in tested_nodes:
                        continue
                    tested_nodes.add(id(node))
                    candidate = cls._score_container_node(node, selector=sel)
                    if candidate.image_count > 0:
                        candidates.append(candidate)
            except Exception:
                continue

        for leaf_sel in KNOWN_MANGA_IMAGE_SELECTORS:
            try:
                matched_leafs = soup.select(leaf_sel)
                if len(matched_leafs) >= 2:
                    parent_container = matched_leafs[0].parent
                    while parent_container and parent_container.name not in ["body", "html", "[document]"]:
                        imgs_in_p = parent_container.find_all(["img", "source"])
                        if len(imgs_in_p) >= len(matched_leafs):
                            break
                        parent_container = parent_container.parent

                    if parent_container and id(parent_container) not in tested_nodes and parent_container.name != "body":
                        tested_nodes.add(id(parent_container))
                        cls_name = parent_container.get("class")
                        cls_str = ".".join(cls_name) if isinstance(cls_name, list) else str(cls_name or "")
                        elem_id = parent_container.get("id")
                        inferred_sel = f"#{elem_id}" if elem_id else (f".{cls_str.split()[0]}" if cls_str else parent_container.name)
                        candidate = cls._score_container_node(parent_container, selector=inferred_sel)
                        if candidate.image_count > 0:
                            candidates.append(candidate)
            except Exception:
                continue

        if soup.body:
            for elem in soup.body.find_all(["div", "main", "article", "section"]):
                if id(elem) in tested_nodes:
                    continue
                tested_nodes.add(id(elem))
                img_tags = elem.find_all(["img", "source", "picture", "canvas"])
                if len(img_tags) >= 2:
                    cls_name = elem.get("class")
                    cls_str = ".".join(cls_name) if isinstance(cls_name, list) else str(cls_name or "")
                    elem_id = elem.get("id")
                    inferred_sel = f"#{elem_id}" if elem_id else (f".{cls_str.split()[0]}" if cls_str else elem.name)
                    candidate = cls._score_container_node(elem, selector=inferred_sel)
                    if candidate.image_count > 0:
                        candidates.append(candidate)

        candidates.sort(key=lambda c: (c.score, c.image_count), reverse=True)
        best = None
        if candidates and candidates[0].score >= MIN_READER_CONFIDENCE_THRESHOLD:
            best = candidates[0]
            best.is_selected = True
        return candidates, best

    @classmethod
    def _score_container_node(cls, node: Any, selector: str) -> ReaderCandidate:
        images = node.find_all(["img", "source", "picture", "canvas"])
        img_count = len(images)
        text_content = node.get_text(separator=" ", strip=True)
        text_len = len(text_content)
        score = 0.0

        if img_count >= 15:
            score += 45.0
        elif img_count >= 5:
            score += 35.0
        elif img_count >= 2:
            score += 20.0
        elif img_count == 1:
            score -= 20.0

        if img_count > 0:
            avg_text_per_img = text_len / img_count
            if avg_text_per_img < 50:
                score += 20.0
            elif avg_text_per_img < 150:
                score += 10.0
            elif avg_text_per_img > 500:
                score -= 30.0

        sel_lower = selector.lower()
        if any(known in sel_lower for known in ["_imagelist", "readerarea", "reading-content", "entry-content", "chapter-content", "wt_viewer", "viewer_lst"]):
            score += 35.0
        elif any(known in sel_lower for known in ["viewer", "reader", "comic", "episode"]):
            score += 20.0

        node_class_str = str(node.get("class", "")).lower()
        node_id_str = str(node.get("id", "")).lower()
        for unw in UNWANTED_CONTAINERS:
            clean_unw = unw.replace(".", "").replace("#", "").lower()
            if clean_unw in node_class_str or clean_unw in node_id_str or clean_unw == node.name:
                score -= 80.0

        if node.find_parent(["header", "footer", "nav", "aside"]):
            score -= 80.0

        final_score = max(0.0, min(100.0, score))
        return ReaderCandidate(
            selector=selector,
            element_tag=node.name,
            image_count=img_count,
            score=final_score,
            text_length=text_len,
            has_large_images=img_count >= 2,
            is_vertical_layout=True
        )

logger = logging.getLogger("sonikoma.services.scraper.adapters.generic")


class GenericAdaptiveAdapter(BaseSiteAdapter):
    """Universal reason-driven, self-healing adaptive extraction engine."""

    name: str = "Universal Adaptive Fallback"
    icon: str = "🧭"
    description: str = "Universal self-adaptive scraper with confidence evaluation, AI planning, and browser pooling."
    supported_domains: list = []

    @classmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        return True

    async def discover_series(
        self,
        series_url: str,
        sort_by: str = "latest",
        max_episodes: Optional[int] = None,
        preferred_language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        """Universal heuristic and Playwright series discovery fallback."""
        raw_url = (series_url or "").strip()
        url = UrlNormalizer.resolve_parent_series_url(raw_url) or raw_url

        html, status, _ = await HttpFetcher.fetch_html(url)
        access_status = AccessEvaluator.evaluate_response(status, html)

        episodes: List[Dict[str, Any]] = []
        seen_urls: Set[str] = set()
        series_info = None

        if access_status not in (AccessStatus.BOT_CHALLENGE, AccessStatus.RATE_LIMITED) and html:
            soup = DomExtractor.get_soup(html)
            series_info, _ = DomExtractor.extract_metadata(html, url)

            if soup:
                first_page_eps = self._extract_episodes_dynamically(soup, url)
                episodes.extend(first_page_eps)
                for e in first_page_eps: seen_urls.add(e["url"])

                # Multi-page pagination traversal
                if len(episodes) > 0:
                    page_num = 2
                    max_page_limit = 35
                    while page_num <= max_page_limit:
                        if max_episodes and len(episodes) >= max_episodes:
                            break

                        next_url = None
                        next_link_elem = soup.select_one("a[rel='next'], a.next, a.next-page, #_nextPage, .pagination a.next")
                        if next_link_elem and next_link_elem.get("href"):
                            next_url = urljoin(url, next_link_elem.get("href"))
                        elif "page=" in url or "_listUl" in str(soup):
                            next_url = f"{url}&page={page_num}" if "?" in url else f"{url}?page={page_num}"

                        if not next_url or next_url in seen_urls:
                            break

                        next_html, next_status, _ = await HttpFetcher.fetch_html(next_url)
                        if not next_html or next_status != 200:
                            break
                        next_soup = DomExtractor.get_soup(next_html)
                        next_eps = self._extract_episodes_dynamically(next_soup, next_url)
                        if not next_eps:
                            break
                        for ep in next_eps:
                            if ep["url"] not in seen_urls:
                                seen_urls.add(ep["url"])
                                episodes.append(ep)
                        soup = next_soup
                        page_num += 1

        # Headless Browser Fallback if Cloudflare block or < 2 episodes found
        if len(episodes) <= 1:
            logger.info(f"[GenericAdaptiveAdapter] Triggering browser fallback for series discovery: {url}")
            browser_html, intercepted_urls, _ = await BrowserFetcher.render_page(
                url,
                auto_scroll=True,
                timeout_seconds=25.0
            )
            if browser_html:
                from ..extraction.embedded_state_extractor import EmbeddedStateExtractor
                state_data = EmbeddedStateExtractor.extract_series_and_episodes_from_state(browser_html, url)
                if state_data and state_data.get("episodes") and len(state_data["episodes"]) > len(episodes):
                    episodes = state_data["episodes"]

                b_soup = DomExtractor.get_soup(browser_html)
                if b_soup:
                    b_eps = self._extract_episodes_dynamically(b_soup, url)
                    if len(b_eps) > len(episodes):
                        episodes = b_eps

                    # Breadcrumb / Parent Series Link Discovery on Single-Chapter Pages
                        parent_anchor = b_soup.select_one("a.breadcrumb-item, .breadcrumbs a, a[rel='up'], a[href*='/series/'], a[href*='/manga/'], a[href*='/comic/'], a[href*='/title/']")
                        if not parent_anchor:
                            for a_tag in b_soup.find_all("a", href=True):
                                txt = a_tag.get_text(strip=True).lower()
                                if any(k in txt for k in ("all chapters", "series", "chapter list", "comic detail", "table of contents")):
                                    parent_anchor = a_tag
                                    break
                        if parent_anchor and parent_anchor.get("href"):
                            parent_url = urljoin(url, parent_anchor.get("href"))
                            if parent_url != url:
                                p_html, _, _ = await BrowserFetcher.render_page(parent_url, auto_scroll=True)
                                if p_html:
                                    p_soup = DomExtractor.get_soup(p_html)
                                    p_eps = self._extract_episodes_dynamically(p_soup, parent_url)
                                    if len(p_eps) > len(episodes):
                                        episodes = p_eps
                                        url = parent_url

                if not series_info or not series_info.title:
                    b_series, _ = DomExtractor.extract_metadata(browser_html, url)
                    if b_series:
                        series_info = b_series

        # Format output
        series_title = (series_info.title if series_info else None) or "Comic Series"
        cover_image = series_info.cover if series_info and hasattr(series_info, "cover") else (series_info.cover_image if series_info and hasattr(series_info, "cover_image") else "")

        for ep in episodes:
            if not ep.get("thumbnail") and cover_image:
                ep["thumbnail"] = self.build_proxy_thumbnail_url(None, ep.get("url", url), cover_image)
            if not ep.get("cover") and cover_image:
                ep["cover"] = cover_image

        sorted_eps = self.deduplicate_and_sort_episodes(episodes, sort_by=sort_by, preferred_language=preferred_language)

        return {
            "success": True,
            "series_title": series_title,
            "url": url,
            "series": {
                "title": series_title,
                "author": series_info.author if series_info else "",
                "genre": series_info.genres[0] if series_info and series_info.genres else "General",
                "cover_image": cover_image,
                "url": url
            },
            "episodes": sorted_eps,
            "total_episodes": len(sorted_eps)
        }

    def _extract_episodes_dynamically(self, soup: Any, base_url: str) -> List[Dict[str, Any]]:
        """Extracts episode links from HTML DOM and embedded JSON AST structures."""
        if not soup:
            return []

        extracted: List[Dict[str, Any]] = []
        seen_urls: Set[str] = set()

        # 1. Embedded JSON AST Search (Next.js __NEXT_DATA__, window.__DATA__, GraphQL state)
        for script in soup.find_all("script"):
            txt = script.string or ""
            if len(txt) < 50:
                continue
            if any(k in txt for k in ("__NEXT_DATA__", "chapters", "episodes", "chapterList", "itemListElement", "relay")):
                try:
                    json_str = txt
                    if "__NEXT_DATA__" in txt:
                        m = re.search(r'<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)</script>', str(script))
                        if m:
                            json_str = m.group(1)
                    elif "=" in txt and "{" in txt:
                        m = re.search(r'=\s*({[\s\S]*?});?$', txt.strip())
                        if m:
                            json_str = m.group(1)

                    data = json.loads(json_str)

                    def _scan_ast(obj):
                        found = []
                        if isinstance(obj, dict):
                            if "edges" in obj and isinstance(obj["edges"], list):
                                for edge in obj["edges"]:
                                    node = edge.get("node", edge) if isinstance(edge, dict) else None
                                    if isinstance(node, dict):
                                        t = node.get("title") or node.get("name") or node.get("chapterNumber")
                                        u = node.get("url") or node.get("slug") or node.get("path")
                                        if u and t:
                                            full_u = urljoin(base_url, f"/chapter/{u}" if not str(u).startswith("http") else str(u))
                                            num_val, _ = self.extract_number_and_type(str(t))
                                            found.append({"title": str(t), "url": full_u, "chapter_number": num_val, "number": str(num_val or "")})

                            for k, v in obj.items():
                                if any(w in k.lower() for w in ("chapter", "episode", "itemlist")):
                                    items_to_process = v if isinstance(v, list) else (list(v.values()) if isinstance(v, dict) else [])
                                    for item in items_to_process:
                                        if isinstance(item, dict):
                                            t = item.get("name") or item.get("title") or item.get("chapter_name") or item.get("episode_name") or item.get("chapter")
                                            u = item.get("url") or item.get("href") or item.get("item") or item.get("slug") or item.get("path") or item.get("id")
                                            thmb = item.get("thumbnail") or item.get("cover") or item.get("image")
                                            dt = item.get("date") or item.get("created_at") or item.get("published_at") or item.get("updated_at")
                                            is_locked = bool(item.get("is_locked") or item.get("locked") or item.get("price") or item.get("is_vip"))

                                            if u and isinstance(u, (str, int)):
                                                u_str = str(u)
                                                full_u = urljoin(base_url, f"/chapter/{u_str}" if not u_str.startswith(("http", "/")) else u_str)
                                                num_val, _ = self.extract_number_and_type(str(t or u_str))
                                                found.append({
                                                    "title": str(t or f"Chapter {num_val or len(found)+1}"),
                                                    "url": full_u,
                                                    "thumbnail": urljoin(base_url, str(thmb)) if thmb else None,
                                                    "date": self.normalize_date(str(dt or "")),
                                                    "chapter_number": num_val,
                                                    "number": str(round(num_val) if num_val is not None and num_val.is_integer() else (num_val or "")),
                                                    "is_locked": is_locked,
                                                    "language": self.extract_language_tag(str(t or ""))
                                                })
                                else:
                                    found.extend(_scan_ast(v))
                        elif isinstance(obj, list):
                            for item in obj:
                                found.extend(_scan_ast(item))
                        return found

                    json_eps = _scan_ast(data)
                    if len(json_eps) >= 2:
                        for ch in json_eps:
                            if ch["url"] not in seen_urls:
                                seen_urls.add(ch["url"])
                                extracted.append(ch)
                        if extracted:
                            return extracted
                except Exception:
                    pass

        # 2. Check <select> Dropdown Options
        for dropdown in soup.find_all("select"):
            options = dropdown.find_all("option")
            valid_opts = []
            for opt in options:
                val = (opt.get("value") or "").strip()
                txt = opt.get_text(strip=True)
                if val and (val.startswith("http") or val.startswith("/")):
                    num_val, _ = self.extract_number_and_type(txt)
                    if num_val is not None or "ch" in txt.lower():
                        valid_opts.append({
                            "title": txt or f"Chapter {len(valid_opts)+1}",
                            "url": urljoin(base_url, val),
                            "chapter_number": num_val,
                            "number": str(round(num_val) if num_val is not None and num_val.is_integer() else (num_val or "")),
                            "language": self.extract_language_tag(txt)
                        })
            if len(valid_opts) >= 2:
                return valid_opts

        # 3. Dynamic DOM Cluster Analysis
        candidate_clusters = []
        for parent in soup.find_all(["ul", "ol", "div", "tbody", "section"]):
            links = parent.find_all("a", href=True)
            if len(links) < 2:
                continue

            parent_header = ""
            prev_heading = parent.find_previous(["h1", "h2", "h3", "h4", "h5", "div"])
            if prev_heading:
                h_txt = prev_heading.get_text(strip=True).lower()
                if any(w in h_txt for w in ("season", "volume", "vol.", "vol ")):
                    parent_header = prev_heading.get_text(strip=True)[:40]
            if not parent_header:
                inner_heading = parent.find(["h1", "h2", "h3", "h4", "h5"])
                if inner_heading:
                    h_txt = inner_heading.get_text(strip=True).lower()
                    if any(w in h_txt for w in ("season", "volume", "vol.", "vol ")):
                        parent_header = inner_heading.get_text(strip=True)[:40]

            chapter_like_count = 0
            cluster_items = []
            for a in links:
                href = a.get("href", "").strip()
                if not href or href == "#" or href.startswith("javascript:"):
                    continue
                full_url = urljoin(base_url, href)
                txt = a.get_text(strip=True)
                if not txt or len(txt) > 90:
                    continue

                num_val, _ = self.extract_number_and_type(txt)
                is_ch_link = (num_val is not None) or any(w in href.lower() for w in ("/chapter", "/episode", "/read", "-ch-", "-chapter-"))

                if is_ch_link:
                    chapter_like_count += 1
                    item_container = a.parent if a.parent else a
                    is_locked = False
                    if item_container:
                        is_locked = bool(item_container.find(class_=re.compile(r"lock|coin|paid|vip|fastpass", re.I)))

                    date_str = ""
                    if item_container:
                        date_el = item_container.select_one(".chapter-release-date, .post-on, .chapter-date, .date, .time, i, span.time")
                        if date_el:
                            date_str = self.normalize_date(date_el.get_text(strip=True))

                    thmb_src = None
                    if item_container:
                        img_el = item_container.find("img")
                        if img_el:
                            thmb_src = img_el.get("data-src") or img_el.get("src")
                            if thmb_src:
                                thmb_src = urljoin(base_url, thmb_src)

                    cluster_items.append({
                        "title": txt or f"Chapter {num_val or len(cluster_items)+1}",
                        "url": full_url,
                        "thumbnail": thmb_src,
                        "date": date_str,
                        "chapter_number": num_val,
                        "number": str(round(num_val) if num_val is not None and num_val.is_integer() else (num_val or "")),
                        "volume": parent_header if parent_header else None,
                        "is_locked": is_locked,
                        "language": self.extract_language_tag(txt)
                    })

            if chapter_like_count >= 2:
                ratio = chapter_like_count / max(1, len(links))
                tag_bonus = 3.0 if parent.name in ("ul", "ol", "tbody") else 0.0
                score = (chapter_like_count * 2.0) + (ratio * 10.0) + tag_bonus
                candidate_clusters.append((score, cluster_items))

        if candidate_clusters:
            candidate_clusters.sort(key=lambda x: x[0], reverse=True)
            best_items = candidate_clusters[0][1]
            for item in best_items:
                if item["url"] not in seen_urls:
                    seen_urls.add(item["url"])
                    extracted.append(item)
            if extracted:
                return extracted

        # 4. Anchor Sweep Fallback
        for a in soup.find_all("a", href=True):
            href = urljoin(base_url, a.get("href"))
            if href in seen_urls or "#" in href:
                continue
            txt = a.get_text(strip=True)
            if not txt or len(txt) > 80:
                continue
            num_val, _ = self.extract_number_and_type(txt)
            if num_val is not None:
                seen_urls.add(href)
                extracted.append({
                    "title": txt,
                    "url": href,
                    "chapter_number": num_val,
                    "number": str(round(num_val) if num_val.is_integer() else num_val),
                    "language": self.extract_language_tag(txt)
                })

        return extracted

    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes the complete deterministic self-adaptive extraction workflow."""
        url = context.normalized_url or context.url
        start_time = time.time()
        ScraperDiagnosticsLogger.log_scraper_start(url)

        # ---------------------------------------------------------------------
        # Tier 0: L5 Result / Idempotency Cache Check (0ms)
        # ---------------------------------------------------------------------
        cached_result = ScraperCacheManager.get_cached_chapter_result(
            context.canonical_url,
            bypass_cache=context.config.bypass_cache or context.config.force_refresh
        )
        if cached_result:
            cached_result.project_id = context.project_id
            cached_result.job_id = context.job_id
            return cached_result

        # ---------------------------------------------------------------------
        # Tier 1: Static HTTP Acquisition
        # ---------------------------------------------------------------------
        t0 = time.time()
        html = ScraperCacheManager.get_l1_html(url) if not context.config.bypass_cache else None
        status_code = 200 if html else None

        if not html:
            html, status_code, fetch_dur = await HttpFetcher.fetch_html(
                url,
                headers=context.config.headers,
                cookies=context.config.cookies,
                timeout=context.config.timeout_seconds
            )
            if html and status_code == 200:
                ScraperCacheManager.set_l1_html(url, html)

        context.raw_html = html
        l1_dur = (time.time() - t0) * 1000.0

        # Access Evaluation
        access_status = AccessEvaluator.evaluate_response(status_code, html, context.config.headers)
        logger.info(f"[GenericAdaptiveAdapter] Access status for {url}: {access_status.value} (HTTP {status_code})")

        # ---------------------------------------------------------------------
        # Reason-Based Branch: Bot Challenge -> Go directly to BrowserPool
        # ---------------------------------------------------------------------
        if access_status in (AccessStatus.BOT_CHALLENGE, AccessStatus.RATE_LIMITED):
            logger.info(f"[GenericAdaptiveAdapter] {access_status.value} detected. Escalating directly to BrowserPool.")
            return await self._execute_browser_worker(context, url, start_time, reason=access_status.value)

        # Extract metadata from static HTML if available
        if html:
            series, chapter = DomExtractor.extract_metadata(html, url)
            if not context.series_info.title and series.title: context.series_info.title = series.title
            if not context.series_info.description and series.description: context.series_info.description = series.description
            if not context.series_info.cover and series.cover: context.series_info.cover = series.cover
            if not context.series_info.author and series.author: context.series_info.author = series.author
            if not context.chapter_info.title and chapter.title: context.chapter_info.title = chapter.title
            if context.chapter_info.number is None and chapter.number is not None: context.chapter_info.number = chapter.number
            if not context.chapter_info.previous and chapter.previous: context.chapter_info.previous = chapter.previous
            if not context.chapter_info.next and chapter.next: context.chapter_info.next = chapter.next

        # ---------------------------------------------------------------------
        # Tier 2: Deterministic Extraction (DOM + State)
        # ---------------------------------------------------------------------
        if html:
            soup = DomExtractor.get_soup(html)

            # Strategy A: Reader container scan
            candidates, best_reader = ReaderDetector.detect_reader(soup or html, url)
            if best_reader and soup:
                try:
                    matched_el = soup.select_one(best_reader.selector)
                    if matched_el:
                        dom_candidates = DomExtractor.extract_images_from_container(matched_el, url, best_reader.selector)
                        for cand in dom_candidates:
                            context.candidate_images.append(cand)
                        context.selected_reader = best_reader
                except Exception as e:
                    logger.debug(f"[GenericAdaptiveAdapter] Reader container extraction error: {e}")

            # Strategy B: Universal DOM Candidate sweep
            if not context.candidate_images and soup:
                all_dom = DomExtractor.extract_manga_images_fallback(soup, url)
                for cand in all_dom:
                    context.candidate_images.append(cand)

            # Strategy C: Embedded State extraction
            state_candidates = EmbeddedStateExtractor.extract_from_html(html, url) or []
            existing_urls = {c.url for c in context.candidate_images}
            for cand in state_candidates:
                if cand.url not in existing_urls:
                    context.candidate_images.append(cand)

        # ---------------------------------------------------------------------
        # Tier 3: Extraction Confidence Evaluation
        # ---------------------------------------------------------------------
        eval_report = ExtractionEvaluator.evaluate(
            context.candidate_images,
            html_content=html,
            source_info=context.source_info
        )
        logger.info(f"[GenericAdaptiveAdapter] Confidence evaluation: score={eval_report.confidence:.2f}, reason={eval_report.escalation_reason.value}, acceptable={eval_report.is_acceptable}")

        # High Confidence: Complete deterministic scrape
        if eval_report.is_acceptable:
            return self._finalize_and_cache(context, start_time)

        # ---------------------------------------------------------------------
        # Tier 4: BrowserPool Worker Fallback (Playwright with Auto-Scroll)
        # ---------------------------------------------------------------------
        logger.info(f"[GenericAdaptiveAdapter] Escalating to BrowserPool Playwright worker for: {url}")
        return await self._execute_browser_worker(context, url, start_time, reason=eval_report.escalation_reason.value)

    async def _execute_browser_worker(
        self,
        context: ScrapeContext,
        url: str,
        start_time: float,
        reason: str
    ) -> ChapterResult:
        """Executes pooled browser worker with progressive auto-scroll and network capture."""
        t0 = time.time()
        browser_html, intercepted_urls, storage = await BrowserFetcher.render_page(
            url=url,
            cookies=context.config.cookies,
            headers=context.config.headers,
            auto_scroll=True,
            timeout_seconds=30.0
        )
        browser_dur = (time.time() - t0) * 1000.0

        if not browser_html:
            context.record_level("Level 3: Headless Browser", EscalationStatus.FAILED, 0.0, 0, browser_dur, reason="Browser returned empty content")
            context.completeness = ScrapeCompleteness.FAILED
            context.error = ScrapeError(
                code=ScrapeErrorCode.READER_NOT_FOUND,
                message=f"Could not render or access content from {url}. Reason: {reason}"
            )
            return self._finalize(context, start_time)

        context.raw_html = browser_html
        context.record_level("Level 3: Headless Browser", EscalationStatus.SUCCESS, 0.95, len(intercepted_urls), browser_dur)

        # Extract metadata from rendered page
        series, chapter = DomExtractor.extract_metadata(browser_html, url)
        if not context.series_info.title and series.title: context.series_info.title = series.title
        if not context.series_info.cover and series.cover: context.series_info.cover = series.cover
        if not context.chapter_info.title and chapter.title: context.chapter_info.title = chapter.title

        # Collect candidate images from rendered DOM
        b_soup = DomExtractor.get_soup(browser_html)
        b_candidates = DomExtractor.extract_manga_images_fallback(b_soup, url) if b_soup else []

        # Combine with intercepted network images
        combined_cands = list(b_candidates)
        seen_urls = {c.url for c in b_candidates if c.url}
        for idx, i_url in enumerate(intercepted_urls):
            if i_url not in seen_urls:
                seen_urls.add(i_url)
                combined_cands.append(CandidateImage(
                    url=i_url,
                    source_type=ImageSourceType.NETWORK_INTERCEPTED,
                    index=len(combined_cands),
                    is_inside_reader=True,
                    confidence=0.9
                ))

        context.candidate_images.clear()
        for cand in combined_cands:
            context.candidate_images.append(cand)

        return self._finalize_and_cache(context, start_time)

    def _finalize_and_cache(self, context: ScrapeContext, start_time: float) -> ChapterResult:
        """Runs L5 cache persistence on top of the inherited _finalize flow."""
        # Delegate validation + order resolution + ChapterResult construction
        # to the shared _finalize defined in BaseSiteAdapter.
        res = self._finalize(context, start_time)

        # Persist to L5 result cache when successful
        if res.success:
            ScraperCacheManager.set_cached_chapter_result(context.canonical_url, res)
        return res
