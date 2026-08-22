"""
backend/app/services/scraper/extraction/dom.py
─────────────────────────────────────────────────────────────────────────────
DOM extraction using BeautifulSoup for candidate image nodes, metadata,
and structural elements.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urljoin

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

from ..scraper_models import CandidateImage, ImageSourceType, SeriesInfo, ChapterInfo
from ..scraper_constants import UNWANTED_CONTAINERS

logger = logging.getLogger("sonikoma.services.scraper.extraction.dom")


class DomExtractor:
    """Extracts images and metadata from raw or rendered HTML DOM structures."""

    @classmethod
    def get_soup(cls, html: str) -> Optional[Any]:
        """Safely parses HTML into a BeautifulSoup object."""
        if not BeautifulSoup or not html:
            return None
        try:
            return BeautifulSoup(html, "lxml")
        except Exception:
            try:
                return BeautifulSoup(html, "html.parser")
            except Exception:
                return None

    @classmethod
    def extract_images_from_container(
        cls,
        container_node: Any,
        base_url: str,
        container_selector: Optional[str] = None
    ) -> List[CandidateImage]:
        """Extracts candidate image objects in DOM order from a specific container node."""
        if not container_node:
            return []

        candidates: List[CandidateImage] = []
        seen_urls = set()

        def _clean_url(val: Any) -> Optional[str]:
            if val is None:
                return None
            s = (" ".join(str(v) for v in val) if isinstance(val, list) else str(val)).strip()
            if not s:
                return None
            if "," in s:
                s = s.split(",")[0].strip()
            if " " in s and not s.startswith(("http://", "https://", "//")):
                s = s.split()[0].strip()
            if s.startswith("//"):
                s = f"https:{s}"
            if any(ext in s.lower() for ext in ["1x1.gif", "spacer.gif", "blank.gif", "loading.gif", "pixel.gif", "bg_transparency", "transparency.png", "placeholder", "spinner"]):
                return None
            return s

        def _get_element_image_sources(elem: Any) -> List[str]:
            """Universally discovers image URLs from any standard or custom CMS attribute."""
            if not elem or not hasattr(elem, "attrs"):
                return []
            found_srcs = []
            known_attrs = (
                "data-url", "data-src", "data-original", "data-original-src",
                "data-lazy-src", "data-img", "data-echo", "data-full-url", "data-origin",
                "data-srcset", "data-high-res-src", "data-actualsrc", "data-pic",
                "lazy-src", "origin-src", "data-cfsrc", "nitro-lazy-src", "srcset",
                "data-orig", "data-ks-lazyload", "data-runner-src", "data-asset",
                "data-image", "data-bg", "src"
            )
            for attr in known_attrs:
                val = elem.get(attr)
                if val:
                    found_srcs.append(val)

            # Dynamic scan for novel / custom attributes (e.g. data-chapter-img, data-file-url)
            for attr_name, attr_val in elem.attrs.items():
                if attr_name not in known_attrs and (attr_name.startswith("data-") or "src" in attr_name or "img" in attr_name):
                    if isinstance(attr_val, str) and (
                        attr_val.startswith(("http://", "https://", "//", "/")) or
                        any(ext in attr_val.lower() for ext in (".jpg", ".jpeg", ".webp", ".png", ".avif"))
                    ):
                        found_srcs.append(attr_val)
            return found_srcs

        def _try_add(src_raw: Any, node_elem: Any, idx: int):
            cleaned = _clean_url(src_raw)
            if not cleaned:
                return
            abs_src = urljoin(base_url, cleaned)
            if abs_src and abs_src not in seen_urls:
                seen_urls.add(abs_src)
                candidates.append(CandidateImage(
                    url=abs_src,
                    source_type=ImageSourceType.DOM,
                    dom_index=idx,
                    container_selector=container_selector,
                    is_inside_reader=True,
                    raw_attributes=dict(node_elem.attrs) if hasattr(node_elem, "attrs") else {}
                ))

        # Check if container_node itself is an image
        if getattr(container_node, "name", "") in ["img", "source"]:
            for src_candidate in _get_element_image_sources(container_node):
                cleaned = _clean_url(src_candidate)
                if cleaned:
                    _try_add(cleaned, container_node, 0)
                    break
            return candidates

        # 1. Inspect <img>, <source>, and <picture> tags
        for idx, img in enumerate(container_node.find_all(["img", "source"])):
            for src_candidate in _get_element_image_sources(img):
                cleaned = _clean_url(src_candidate)
                if cleaned:
                    _try_add(cleaned, img, idx)
                    break

        # 2. Inspect container elements with data-src or background-image styles
        for idx, elem in enumerate(container_node.find_all(["div", "picture", "section", "a", "li", "figure"])):
            for src_candidate in _get_element_image_sources(elem):
                cleaned = _clean_url(src_candidate)
                if cleaned:
                    _try_add(cleaned, elem, len(candidates))
                    break

            style = str(elem.get("style", "") or "")
            if "url(" in style:
                bg_m = re.search(r'url\s*\(\s*["\']?([^"\'\)]+)["\']?\s*\)', style, re.IGNORECASE)
                if bg_m:
                    _try_add(bg_m.group(1), elem, len(candidates))

        return candidates

    # Class-level sets for fast rejection in fallback scan
    _FALLBACK_SKIP_PARENTS = frozenset([
        "header", "footer", "nav", "aside"
    ])
    _FALLBACK_SKIP_TERMS = frozenset([
        "sidebar", "footer", "header", "comment", "nav", "menu",
        "widget", "related", "recommend", "ads", "advertisement",
        "banner", "promo", "social", "share", "cover", "logo"
    ])
    _FALLBACK_SKIP_URL_TERMS = frozenset([
        "logo", "favicon", "sprite", "icon_", "/icon/", "avatar",
        "badge", "banner", "cover", "/ad/", "ads/", "tracking",
        "pixel", "1x1", "spacer", "placeholder", "spinner",
        "apple-touch", "android-chrome", "app_icon", "app-icon",
        "/_nuxt/", "share_btn", "promo"
    ])

    @classmethod
    def extract_manga_images_fallback(cls, soup: Any, base_url: str) -> List[CandidateImage]:
        """Fallback extraction using Image Density Clustering across the DOM."""
        if not soup:
            return []

        # 1. Smart Density Clustering: find container with highest consecutive comic panels
        containers = soup.find_all(["div", "section", "main", "article", "ul", "ol"])
        best_cluster_container = None
        max_img_count = 0

        for container in containers:
            # Ignore non-content containers (navbars, sidebars, comments, footers, ad zones)
            c_id = str(container.get("id", "") or "").lower()
            c_class = " ".join(container.get("class", [])) if isinstance(container.get("class"), list) else str(container.get("class", "") or "").lower()
            combined = f"{c_id} {c_class}"
            if any(term in combined for term in cls._FALLBACK_SKIP_TERMS):
                continue
            if container.find_parent(["header", "footer", "nav", "aside"]):
                continue

            c_imgs = container.find_all(["img", "source"])
            if len(c_imgs) >= 3 and len(c_imgs) > max_img_count:
                max_img_count = len(c_imgs)
                best_cluster_container = container

        if best_cluster_container and max_img_count >= 3:
            clustered = cls.extract_images_from_container(best_cluster_container, base_url, "density_cluster_container")
            if clustered and len(clustered) >= 2:
                return clustered

        # 2. General fallback scan — images get is_inside_reader=False so the
        #    validator can apply strict keyword-based rejection on them.
        candidates: List[CandidateImage] = []
        seen_urls = set()

        def _clean_url(val: Any) -> Optional[str]:
            if val is None:
                return None
            s = (" ".join(str(v) for v in val) if isinstance(val, list) else str(val)).strip()
            if not s or any(ext in s.lower() for ext in ["1x1.gif", "spacer.gif", "blank.gif", "loading.gif", "pixel.gif"]):
                return None
            if "," in s:
                s = s.split(",")[0].strip()
            if " " in s and not s.startswith(("http://", "https://", "//")):
                s = s.split()[0].strip()
            if s.startswith("//"):
                s = f"https:{s}"
            return s

        def _get_element_image_sources(elem: Any) -> List[str]:
            if not elem or not hasattr(elem, "attrs"):
                return []
            found_srcs = []
            known_attrs = (
                "data-src", "data-lazy-src", "data-original", "data-original-src",
                "data-url", "data-img", "data-echo", "data-full-url", "data-origin",
                "data-srcset", "data-high-res-src", "data-actualsrc", "data-pic",
                "lazy-src", "origin-src", "data-cfsrc", "nitro-lazy-src", "srcset",
                "data-orig", "data-ks-lazyload", "data-runner-src", "data-asset",
                "data-image", "data-bg", "src"
            )
            for attr in known_attrs:
                val = elem.get(attr)
                if val:
                    found_srcs.append(val)
            for attr_name, attr_val in elem.attrs.items():
                if attr_name not in known_attrs and (attr_name.startswith("data-") or "src" in attr_name or "img" in attr_name):
                    if isinstance(attr_val, str) and (
                        attr_val.startswith(("http://", "https://", "//", "/")) or
                        any(ext in attr_val.lower() for ext in (".jpg", ".jpeg", ".webp", ".png", ".avif"))
                    ):
                        found_srcs.append(attr_val)
            return found_srcs

        for idx, img in enumerate(soup.find_all(["img", "source"])):
            # Skip images inside structural/chrome elements
            if img.find_parent(list(cls._FALLBACK_SKIP_PARENTS)):
                continue

            # Skip images inside containers explicitly named as ads, covers, logos, etc.
            bad_parent = False
            for anc in img.parents:
                if anc.name in ("body", "html", "[document]"):
                    break
                p_id = str(anc.get("id", "") or "").lower()
                p_cls = " ".join(anc.get("class", [])) if isinstance(anc.get("class"), list) else str(anc.get("class", "") or "").lower()
                combined = f"{p_id} {p_cls}"
                if any(term in combined for term in cls._FALLBACK_SKIP_TERMS):
                    bad_parent = True
                    break
            if bad_parent:
                continue

            for raw_candidate in _get_element_image_sources(img):
                cleaned = _clean_url(raw_candidate)
                if not cleaned:
                    continue

                abs_src = urljoin(base_url, cleaned)
                if not abs_src or abs_src in seen_urls:
                    continue

                # Quick URL-level rejection for obvious non-panel images
                abs_lower = abs_src.lower()
                if any(term in abs_lower for term in cls._FALLBACK_SKIP_URL_TERMS):
                    continue

                seen_urls.add(abs_src)
                candidates.append(CandidateImage(
                    url=abs_src,
                    source_type=ImageSourceType.DOM,
                    dom_index=idx,
                    container_selector="body (manga fallback)",
                    is_inside_reader=False,   # Not confirmed in a reader container
                    confidence=0.60           # Lower confidence than clustered images
                ))

        return candidates

    @classmethod
    def extract_metadata(cls, html: str, base_url: str) -> Tuple[SeriesInfo, ChapterInfo]:
        """
        Universally extracts Series and Chapter metadata across ANY comic/manga platform
        using JSON-LD Schema.org microdata, OpenGraph, Dublin Core, standard meta tags, and URL structure.
        """
        import json
        from urllib.parse import urlparse

        soup = cls.get_soup(html)
        series = SeriesInfo()
        chapter = ChapterInfo(url=base_url)

        if not soup:
            return series, chapter

        def _get_meta(*names: str) -> Optional[str]:
            for name in names:
                tag = (
                    soup.find("meta", attrs={"property": name}) or
                    soup.find("meta", attrs={"name": name}) or
                    soup.find("meta", attrs={"itemprop": name})
                )
                if tag and tag.get("content"):
                    return str(tag.get("content")).strip()
            return None

        # 1. Parse structured JSON-LD (universal modern standard across WordPress, Next.js, and CMS platforms)
        for s_tag in soup.find_all("script", attrs={"type": "application/ld+json"}):
            try:
                raw_json = s_tag.string or s_tag.get_text()
                if not raw_json:
                    continue
                data = json.loads(raw_json.strip())
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    if "@graph" in item and isinstance(item["@graph"], list):
                        items.extend(item["@graph"])

                    # Series / Comic / Book / CreativeWork schema
                    if item.get("name") and not series.title:
                        series.title = str(item["name"])
                    if item.get("description") and not series.description:
                        series.description = str(item["description"])
                    if item.get("genre"):
                        g = item["genre"]
                        g_list = g if isinstance(g, list) else [g]
                        for gen in g_list:
                            if gen and str(gen) not in series.genres:
                                series.genres.append(str(gen).capitalize())
                    if item.get("author"):
                        auth = item["author"]
                        if isinstance(auth, dict) and auth.get("name"):
                            series.author = str(auth["name"])
                        elif isinstance(auth, str):
                            series.author = auth
                    if item.get("publisher"):
                        pub = item["publisher"]
                        if isinstance(pub, dict) and pub.get("name"):
                            series.publisher = str(pub["name"])
                        elif isinstance(pub, str):
                            series.publisher = pub
                    if item.get("image") and not series.cover:
                        img = item["image"]
                        img_url = img.get("url") if isinstance(img, dict) else str(img)
                        if img_url:
                            series.cover = urljoin(base_url, img_url)
            except Exception:
                pass

        # 2. Extract OpenGraph, Twitter, and standard HTML meta tags
        title = (
            _get_meta("og:title", "twitter:title") or
            (soup.title.string.strip() if soup.title and soup.title.string else None)
        )
        desc = _get_meta("og:description", "twitter:description", "description")
        cover = _get_meta("og:image", "twitter:image", "image")
        author = _get_meta("author", "article:author", "creator", "comic:creator")
        publisher = _get_meta("og:site_name", "publisher", "application-name")
        section = _get_meta("article:section", "genre", "category", "tag")

        if title and not series.title:
            # Clean common trailing site branding or reading junk (e.g. "Series Name - Read Manga Online | Site")
            cleaned_title = re.split(r'\s*(?:[-–|•·»~]\s*(?:read|manga|comic|webtoon|raw|online|chapter|scan|free|hd)\b|\|)', title, flags=re.IGNORECASE)[0].strip()
            series.title = cleaned_title if cleaned_title else title
        if desc and not series.description:
            series.description = desc
        if cover and not series.cover:
            series.cover = urljoin(base_url, cover)
        if author and not series.author:
            series.author = author
        if publisher and not series.publisher:
            series.publisher = publisher
        if section and section not in series.genres:
            series.genres.append(section.capitalize())

        # 3. Generic Chapter number and title resolution from title/h1
        text_for_ch = title or ""
        h1 = soup.find("h1")
        if h1:
            h1_text = h1.get_text(strip=True)
            if any(term in h1_text.lower() for term in ["chapter", "episode", "ch.", "ep.", "vol."]):
                text_for_ch = f"{text_for_ch} {h1_text}"

        m_num = re.search(r'\b(?:ep(?:isode)?|ch(?:apter)?|issue|vol(?:ume)?)\s*#?\s*(\d+(?:\.\d+)?)\b', text_for_ch, re.IGNORECASE)
        if m_num:
            try:
                chapter.number = float(m_num.group(1))
                chapter.episode = f"Episode {m_num.group(1)}"
            except ValueError:
                pass
        chapter.title = title or "Chapter"

        # 4. Universal Slug, Series URL, and Domain Publisher deduction from URL
        parsed_base = urlparse(base_url)
        path_segments = [p for p in parsed_base.path.split("/") if p]
        
        # Check standard routing: /series/{slug}/..., /manga/{slug}/..., /comic/{slug}/..., /read/{slug}/...
        for idx, seg in enumerate(path_segments):
            if seg.lower() in ("series", "manga", "comic", "comics", "read", "manhwa", "manhua", "title", "webtoon", "en", "ko", "ja"):
                if idx + 1 < len(path_segments):
                    candidate_slug = path_segments[idx + 1]
                    if not re.match(r'^(?:ch|ep|chapter|episode|v\d+)[-_]?\d+', candidate_slug, re.IGNORECASE):
                        series.slug = candidate_slug
                        break
        
        if not series.slug and len(path_segments) >= 2:
            # Fallback to first non-numeric segment
            for seg in path_segments:
                if not seg.isdigit() and len(seg) > 2 and not seg.startswith(("ep", "ch", "page", "viewer")):
                    series.slug = seg
                    break

        if not series.publisher and parsed_base.netloc:
            # Infer publisher/site brand from domain (e.g. "asurascans.com" -> "Asurascans")
            domain_name = parsed_base.netloc.split(".")[-2] if len(parsed_base.netloc.split(".")) >= 2 else parsed_base.netloc
            series.publisher = domain_name.capitalize()

        # 5. Universal Previous and Next navigation links
        for a in soup.find_all("a", href=True):
            href = a.get("href")
            txt = a.get_text(separator=" ", strip=True).lower()
            rel = (a.get("rel") or [""])[0] if isinstance(a.get("rel"), list) else (a.get("rel") or "")

            if rel == "prev" or any(p in txt for p in ["prev", "previous", "previous episode", "previous chapter", "이전화", "上一话"]):
                if not chapter.previous:
                    chapter.previous = urljoin(base_url, href)
            elif rel == "next" or any(n in txt for n in ["next", "next episode", "next chapter", "다음화", "下一话"]):
                if not chapter.next:
                    chapter.next = urljoin(base_url, href)

        return series, chapter
