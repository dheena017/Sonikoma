"""
backend/app/services/scraper/url_separator.py
─────────────────────────────────────────────────────────────────────────────
Dynamic Universal Comic & Manga URL Separator, Normalizer, & Site Analyzer.
Deconstructs, normalizes, and decomposes ANY comic/manga/manhwa URL into its
constituent parts (series URL, chapter URL, domain, platform, slugs, IDs, chapter numbers,
and recommended actions) WITHOUT hardcoded URL constraints.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import logging
from typing import Dict, Any, Optional, List, Tuple
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode, urljoin

from .scraper_models import SeparateUrlResponse, SourceInfo

logger = logging.getLogger("sonikoma.services.scraper.url_separator")


class UniversalUrlSeparator:
    """
    Universal Dynamic URL Deconstructor & Normalizer.
    Handles all comic/manhwa/manga platforms and scanlation formats.
    """

    TRACKING_QUERY_PARAMS = {
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "fbclid", "gclid", "yclid", "_ga", "_gl", "ref", "source", "aff",
        "spm", "from", "share", "timestamp", "session_id"
    }

    SERIES_SEGMENT_KEYWORDS = {
        "series", "manga", "manhwa", "manhua", "comic", "comics", "webtoon",
        "webtoons", "title", "titles", "comic-detail", "detail", "book", "show"
    }

    CHAPTER_SEGMENT_KEYWORDS = {
        "chapter", "chapters", "episode", "episodes", "ep", "ch", "chap",
        "viewer", "reader", "read", "view"
    }

    # Generic chapter pattern matches: chapter-123, ep_45, ch-10.5, c100, etc.
    CHAPTER_PATH_REGEX = re.compile(
        r'[-_/]?(?:chapter|episode|ep|ch|chap|c)[-_/]?(\d+(?:\.\d+)?)',
        re.IGNORECASE
    )

    READER_TOKEN_PATTERN = re.compile(
        r"^(?:chapter|episode|ep|ch|c|chap|read|viewer|volume|vol)[-_]?\d*.*$|"
        r"^[-_]?(?:chapter|episode|ep|ch|c)[-_]\d+.*$|"
        r"^\d+(?:\.\d+)?$",
        re.IGNORECASE
    )

    @classmethod
    def extract_first_url(cls, raw_input: str) -> str:
        """Extracts the first valid URL if multiple links or strings were pasted together."""
        if not raw_input:
            return ""
        trimmed = raw_input.strip()
        m = re.search(r'https?://[^\s"\']+', trimmed, re.IGNORECASE)
        return m.group(0) if m else trimmed

    @classmethod
    def normalize_url(cls, raw_url: str) -> str:
        """Strips tracking params, cleans whitespace, and normalizes structure."""
        url = cls.extract_first_url(raw_url)
        if not url:
            return ""

        if not url.startswith(("http://", "https://", "file://", "data:image/")):
            if "." in url and not url.startswith("/"):
                url = "https://" + url

        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return url

            query_dict = parse_qs(parsed.query, keep_blank_values=True)
            clean_query_dict = {
                k: v for k, v in query_dict.items()
                if k.lower() not in cls.TRACKING_QUERY_PARAMS
            }

            clean_query = urlencode(clean_query_dict, doseq=True)
            clean_path = parsed.path
            if len(clean_path) > 1 and clean_path.endswith("/"):
                clean_path = clean_path[:-1]

            canonical = urlunparse((
                parsed.scheme.lower(),
                parsed.netloc.lower(),
                clean_path,
                parsed.params,
                clean_query,
                ""  # Strip fragment
            ))
            return canonical
        except Exception:
            return url

    clean_canonical_url = normalize_url

    @classmethod
    def resolve_parent_series_url(cls, raw_url: str) -> str:
        """
        Dynamically decomposes and canonicalizes any reader or chapter URL into its parent
        series/catalog URL using semantic path token decomposition.
        """
        normalized = cls.normalize_url(raw_url)
        if not normalized:
            return ""

        try:
            parsed = urlparse(normalized)
            path_segments = [s for s in parsed.path.split("/") if s]
            query_dict = parse_qs(parsed.query, keep_blank_values=True)

            if not path_segments:
                return normalized

            # Specialized Platform Parent Series Resolvers
            netloc_lower = parsed.netloc.lower()
            if "toomics.com" in netloc_lower:
                if "/webtoon/detail/" in parsed.path:
                    m_toon = re.search(r"/toon/(\d+)", parsed.path)
                    lang = path_segments[0] if path_segments else "en"
                    if m_toon:
                        return f"{parsed.scheme}://{parsed.netloc}/{lang}/webtoon/episode/toon/{m_toon.group(1)}"
                elif "/webtoon/episode/toon/" in parsed.path:
                    return normalized

            if "comic.naver.com" in netloc_lower or "naver.com" in netloc_lower:
                t_id = query_dict.get("titleId", [""])[0] or query_dict.get("title_id", [""])[0]
                if t_id:
                    return f"{parsed.scheme}://{parsed.netloc}/webtoon/list?titleId={t_id}"

            if "kakao.com" in netloc_lower:
                if "/viewer/" in parsed.path and len(path_segments) >= 2:
                    return f"{parsed.scheme}://{parsed.netloc}/content/{path_segments[-2]}"
                elif "/content/" in parsed.path:
                    return normalized

            if "mangadex.org" in netloc_lower:
                if "/chapter/" in parsed.path:
                    return normalized
                elif "/title/" in parsed.path:
                    return normalized

            identifying_keys = {"title_no", "series_id", "comic_id", "manga_id", "id", "title"}
            transient_keys = {"episode_no", "chapter_no", "ch", "ep", "progress", "page", "p", "read_pos", "scroll"}

            filtered_query = {
                k: v for k, v in query_dict.items()
                if k.lower() in identifying_keys or (k.lower() not in transient_keys and "episode" not in k.lower() and "chapter" not in k.lower())
            }

            # Viewer-to-Catalog normalization (e.g. /viewer -> /list)
            if path_segments[-1].lower() in ("viewer", "reader", "read", "view"):
                parent_segments = path_segments[:-1] + ["list"]
                return urlunparse((
                    parsed.scheme,
                    parsed.netloc,
                    "/" + "/".join(parent_segments),
                    "",
                    urlencode(filtered_query, doseq=True),
                    ""
                ))

            # Dynamic Path Pruning from Right-to-Left
            pruned_segments = list(path_segments)
            while len(pruned_segments) > 1:
                last = pruned_segments[-1]

                # Stop pruning if the preceding segment is a series keyword (e.g. /series/165, /manga/555, /comic/123)
                # Unless the last token explicitly contains a chapter identifier (e.g. chapter-1, ch-1, ep-1)
                if len(pruned_segments) >= 2 and pruned_segments[-2].lower() in cls.SERIES_SEGMENT_KEYWORDS:
                    if not re.match(r"^(?:chapter|episode|ep|ch|chap|c)[-_]?\d+", last, re.IGNORECASE):
                        break

                if cls.READER_TOKEN_PATTERN.match(last):
                    pruned_segments.pop()
                else:
                    break

            if pruned_segments and len(pruned_segments) < len(path_segments):
                return urlunparse((
                    parsed.scheme,
                    parsed.netloc,
                    "/" + "/".join(pruned_segments),
                    "",
                    urlencode(filtered_query, doseq=True),
                    ""
                ))

            # In-segment suffix stripping (e.g. /series/slug-chapter-10 -> /series/slug)
            last_seg = path_segments[-1]
            cleaned_last_seg = re.sub(r"[-_](?:chapter|episode|ep|ch|c)[-_]?\d+.*$", "", last_seg, flags=re.IGNORECASE)
            if cleaned_last_seg != last_seg and len(cleaned_last_seg) > 1:
                new_segments = path_segments[:-1] + [cleaned_last_seg]
                return urlunparse((
                    parsed.scheme,
                    parsed.netloc,
                    "/" + "/".join(new_segments),
                    "",
                    urlencode(filtered_query, doseq=True),
                    ""
                ))

            return normalized
        except Exception:
            return normalized

    @classmethod
    def separate(cls, raw_url: str) -> Dict[str, Any]:
        """
        Deconstructs any given comic/manhwa/manga URL into structured components.
        """
        raw_trimmed = (raw_url or "").strip()
        canonical = cls.normalize_url(raw_trimmed)

        if not canonical:
            return {
                "success": False,
                "raw_url": raw_trimmed,
                "canonical_url": "",
                "series_url": "",
                "chapter_url": None,
                "is_chapter_url": False,
                "is_series_url": False,
                "platform": "unknown",
                "domain": "",
                "title_slug": None,
                "title_id": None,
                "series_slug": None,
                "series_id": None,
                "chapter_slug": None,
                "chapter_number": None,
                "title_no": None,
                "target_adapter": "GenericAdaptiveAdapter",
                "recommended_action": "none",
                "supported_actions": []
            }

        parsed = urlparse(canonical)
        domain = parsed.netloc.lower().split(":")[0]
        if domain.startswith("www."):
            domain = domain[4:]

        path = parsed.path
        path_lower = path.lower()
        query = parse_qs(parsed.query)
        path_segments = [s for s in path.split("/") if s]

        is_novel = any(seg in path_lower for seg in ["/novel/", "/novels/", "/lightnovel/", "/webnovel/"])

        # 1. Resolve Target Adapter and Platform dynamically
        target_adapter_name = "GenericAdaptiveAdapter"
        platform_name = "generic"

        try:
            from .adapters.registry import AdapterRegistry
            temp_source = SourceInfo(
                original_url=raw_trimmed,
                canonical_url=canonical,
                domain=domain,
                platform="generic"
            )
            adapter = AdapterRegistry.get_adapter(temp_source)
            target_adapter_name = adapter.__class__.__name__
            platform_name = getattr(adapter, "name", domain.split(".")[0]).lower().replace(" ", "_")
        except Exception:
            domain_parts = [p for p in domain.split(".") if p not in ("com", "net", "org", "to", "io", "app", "me", "co", "xyz")]
            platform_name = domain_parts[0] if domain_parts else "generic"

        # Toomics Platform Specialized Extraction
        if "toomics.com" in domain:
            if "/webtoon/episode/toon/" in path:
                series_id = path_segments[-1] if path_segments else None
                return {
                    "success": True,
                    "raw_url": raw_trimmed,
                    "canonical_url": canonical,
                    "series_url": canonical,
                    "chapter_url": None,
                    "is_chapter_url": False,
                    "is_series_url": True,
                    "platform": "toomics",
                    "domain": domain,
                    "title_slug": f"toon-{series_id}",
                    "title_id": series_id,
                    "series_slug": f"toon-{series_id}",
                    "series_id": series_id,
                    "chapter_slug": None,
                    "chapter_number": None,
                    "title_no": series_id,
                    "target_adapter": "WebtoonsAdapter",
                    "recommended_action": "import_episodes",
                    "supported_actions": ["import_chapter", "import_episodes", "batch_scrape"]
                }
            elif "/webtoon/detail/" in path:
                m_ep = re.search(r"/ep/(\d+)", path)
                m_toon = re.search(r"/toon/(\d+)", path)
                chapter_number = m_ep.group(1) if m_ep else None
                series_id = m_toon.group(1) if m_toon else None
                lang = path_segments[0] if path_segments else "en"
                parent_url = f"{parsed.scheme}://{parsed.netloc}/{lang}/webtoon/episode/toon/{series_id}" if series_id else canonical
                return {
                    "success": True,
                    "raw_url": raw_trimmed,
                    "canonical_url": canonical,
                    "series_url": parent_url,
                    "chapter_url": canonical,
                    "is_chapter_url": True,
                    "is_series_url": False,
                    "platform": "toomics",
                    "domain": domain,
                    "title_slug": f"toon-{series_id}",
                    "title_id": series_id,
                    "series_slug": f"toon-{series_id}",
                    "series_id": series_id,
                    "chapter_slug": f"ep-{chapter_number}" if chapter_number else None,
                    "chapter_number": chapter_number,
                    "title_no": series_id,
                    "target_adapter": "WebtoonsAdapter",
                    "recommended_action": "import_chapter",
                    "supported_actions": ["import_chapter", "import_episodes", "batch_scrape"]
                }

        # Naver Webtoon Platform Specialized Extraction
        if "comic.naver.com" in domain or "naver.com" in domain:
            title_id = query.get("titleId", [""])[0] or query.get("title_id", [""])[0]
            if "/webtoon/list" in path or "no" not in query:
                return {
                    "success": True,
                    "raw_url": raw_trimmed,
                    "canonical_url": canonical,
                    "series_url": canonical,
                    "chapter_url": None,
                    "is_chapter_url": False,
                    "is_series_url": True,
                    "platform": "naver",
                    "domain": domain,
                    "title_slug": f"title-{title_id}" if title_id else "webtoon",
                    "title_id": title_id or None,
                    "series_slug": f"title-{title_id}" if title_id else "webtoon",
                    "series_id": title_id or None,
                    "chapter_slug": None,
                    "chapter_number": None,
                    "title_no": title_id or None,
                    "target_adapter": "WebtoonsAdapter",
                    "recommended_action": "import_episodes",
                    "supported_actions": ["import_chapter", "import_episodes", "batch_scrape"]
                }
            elif "/webtoon/detail" in path or "no" in query:
                ch_num = query.get("no", [""])[0]
                parent_url = f"{parsed.scheme}://{parsed.netloc}/webtoon/list?titleId={title_id}" if title_id else canonical
                return {
                    "success": True,
                    "raw_url": raw_trimmed,
                    "canonical_url": canonical,
                    "series_url": parent_url,
                    "chapter_url": canonical,
                    "is_chapter_url": True,
                    "is_series_url": False,
                    "platform": "naver",
                    "domain": domain,
                    "title_slug": f"title-{title_id}" if title_id else "webtoon",
                    "title_id": title_id or None,
                    "series_slug": f"title-{title_id}" if title_id else "webtoon",
                    "series_id": title_id or None,
                    "chapter_slug": f"no-{ch_num}",
                    "chapter_number": ch_num or None,
                    "title_no": title_id or None,
                    "target_adapter": "WebtoonsAdapter",
                    "recommended_action": "import_chapter",
                    "supported_actions": ["import_chapter", "import_episodes", "batch_scrape"]
                }

        # Kakao Webtoon Platform Specialized Extraction
        if "kakao.com" in domain:
            if "/content/" in path:
                series_id = path_segments[-1] if path_segments else None
                title_slug = path_segments[-2] if len(path_segments) >= 2 else "comic"
                return {
                    "success": True,
                    "raw_url": raw_trimmed,
                    "canonical_url": canonical,
                    "series_url": canonical,
                    "chapter_url": None,
                    "is_chapter_url": False,
                    "is_series_url": True,
                    "platform": "kakao",
                    "domain": domain,
                    "title_slug": title_slug,
                    "title_id": series_id,
                    "series_slug": title_slug,
                    "series_id": series_id,
                    "chapter_slug": None,
                    "chapter_number": None,
                    "title_no": series_id,
                    "target_adapter": "GenericAdaptiveAdapter",
                    "recommended_action": "import_episodes",
                    "supported_actions": ["import_chapter", "import_episodes", "batch_scrape"]
                }
            elif "/viewer/" in path:
                chapter_id = path_segments[-1] if path_segments else None
                chapter_slug_part = path_segments[-2] if len(path_segments) >= 2 else "chapter"
                m_num = re.search(r"(\d+)", chapter_slug_part)
                ch_num = m_num.group(1) if m_num else None
                return {
                    "success": True,
                    "raw_url": raw_trimmed,
                    "canonical_url": canonical,
                    "series_url": f"{parsed.scheme}://{parsed.netloc}/content/{chapter_slug_part}",
                    "chapter_url": canonical,
                    "is_chapter_url": True,
                    "is_series_url": False,
                    "platform": "kakao",
                    "domain": domain,
                    "title_slug": chapter_slug_part,
                    "title_id": chapter_id,
                    "series_slug": chapter_slug_part,
                    "series_id": chapter_id,
                    "chapter_slug": f"ep-{ch_num or chapter_id}",
                    "chapter_number": ch_num,
                    "title_no": chapter_id,
                    "target_adapter": "GenericAdaptiveAdapter",
                    "recommended_action": "import_chapter",
                    "supported_actions": ["import_chapter", "import_episodes", "batch_scrape"]
                }

        # Tapas Platform Specialized Extraction
        if "tapas.io" in domain:
            if "/episode/" in path:
                ep_id = path_segments[-1] if path_segments else None
                return {
                    "success": True,
                    "raw_url": raw_trimmed,
                    "canonical_url": canonical,
                    "series_url": canonical,
                    "chapter_url": canonical,
                    "is_chapter_url": True,
                    "is_series_url": False,
                    "platform": "tapas",
                    "domain": domain,
                    "title_slug": f"episode-{ep_id}",
                    "title_id": ep_id,
                    "series_slug": f"episode-{ep_id}",
                    "series_id": ep_id,
                    "chapter_slug": f"ep-{ep_id}",
                    "chapter_number": ep_id,
                    "title_no": ep_id,
                    "target_adapter": "WebtoonsAdapter",
                    "recommended_action": "import_chapter",
                    "supported_actions": ["import_chapter", "import_episodes", "batch_scrape"]
                }
            elif "/series/" in path:
                series_slug = path_segments[1] if len(path_segments) >= 2 else path_segments[-1]
                return {
                    "success": True,
                    "raw_url": raw_trimmed,
                    "canonical_url": canonical,
                    "series_url": canonical,
                    "chapter_url": None,
                    "is_chapter_url": False,
                    "is_series_url": True,
                    "platform": "tapas",
                    "domain": domain,
                    "title_slug": series_slug,
                    "title_id": series_slug,
                    "series_slug": series_slug,
                    "series_id": series_slug,
                    "chapter_slug": None,
                    "chapter_number": None,
                    "title_no": None,
                    "target_adapter": "WebtoonsAdapter",
                    "recommended_action": "import_episodes",
                    "supported_actions": ["import_chapter", "import_episodes", "batch_scrape"]
                }

        # 2. Extract series ID from query parameters
        series_id = None
        for q_key in ("title_no", "series_id", "comic_id", "manga_id", "titleId", "id", "book_id"):
            if q_key in query and query[q_key]:
                series_id = query[q_key][0]
                break

        # 3. Detect chapter indicators in path and query
        is_chapter = False
        chapter_number: Optional[str] = None
        chapter_slug: Optional[str] = None

        for ch_key in ("episode_no", "chapter_no", "ep_no", "episodeNo", "chapterNo", "ch", "ep"):
            if ch_key in query and query[ch_key]:
                is_chapter = True
                chapter_number = query[ch_key][0]
                chapter_slug = f"episode-{chapter_number}"
                break

        # Check path for chapter keywords and patterns
        chapter_seg_idx = -1
        for idx, seg in enumerate(path_segments):
            seg_lower = seg.lower()
            if seg_lower in cls.CHAPTER_SEGMENT_KEYWORDS:
                is_chapter = True
                chapter_seg_idx = idx
                if idx + 1 < len(path_segments):
                    chapter_slug = path_segments[idx + 1]
                    m = re.search(r"(\d+(?:\.\d+)?)", chapter_slug)
                    if m:
                        chapter_number = m.group(1)
                break
            else:
                m = cls.CHAPTER_PATH_REGEX.search(seg)
                if m:
                    is_chapter = True
                    chapter_seg_idx = idx
                    chapter_number = m.group(1)
                    chapter_slug = seg
                    break

        if "viewer" in path.lower() or "reader" in path.lower():
            is_chapter = True

        # 4. Extract series title slug and ID from path
        series_slug = None
        for idx, seg in enumerate(path_segments):
            seg_lower = seg.lower()
            if seg_lower in cls.SERIES_SEGMENT_KEYWORDS and idx + 1 < len(path_segments):
                series_slug = path_segments[idx + 1]
                num_m = re.match(r"^(\d+)", series_slug)
                if num_m and not series_id:
                    series_id = num_m.group(1)
                break

        if not series_slug and path_segments:
            non_generic = [
                s for s in path_segments
                if s.lower() not in ("en", "kr", "jp", "cn", "fr", "es", "de", "viewer", "reader", "read", "list", "index")
                and not cls.CHAPTER_PATH_REGEX.search(s)
            ]
            if non_generic:
                series_slug = non_generic[0]
                num_m = re.match(r"^(\d+)", series_slug)
                if num_m and not series_id:
                    series_id = num_m.group(1)

        # 5. Resolve Parent Series URL and Clean Chapter URL
        series_url = cls.resolve_parent_series_url(canonical)
        chapter_url = canonical if is_chapter else None

        is_series = not is_chapter or (series_url == canonical)

        # Recommended action based on detected structure
        if is_chapter:
            recommended_action = "import_chapter"
        else:
            recommended_action = "import_episodes"

        supported_actions = ["import_chapter", "import_episodes", "batch_scrape"]

        return {
            "success": True,
            "raw_url": raw_trimmed,
            "canonical_url": canonical,
            "series_url": series_url,
            "chapter_url": chapter_url,
            "is_chapter_url": is_chapter,
            "is_series_url": is_series,
            "platform": platform_name,
            "domain": domain,
            "title_slug": series_slug,
            "title_id": series_id,
            "series_slug": series_slug,
            "series_id": series_id,
            "chapter_slug": chapter_slug,
            "chapter_number": chapter_number,
            "title_no": series_id,
            "target_adapter": target_adapter_name,
            "recommended_action": recommended_action,
            "supported_actions": supported_actions
        }

    separate_url = separate


class SiteAnalyzer:
    """Dynamically analyzes a URL to extract domain, platform signatures, and page classification."""

    CHAPTER_PATH_INDICATORS = {
        "episode", "episodes", "chapter", "chapters", "viewer",
        "reader", "read", "ch-", "ep-", "c-", "chap"
    }

    @classmethod
    def analyze(cls, raw_url: str) -> SourceInfo:
        """Performs dynamic site analysis on the provided URL using registered adapters and generic heuristics."""
        canonical_url = UniversalUrlSeparator.normalize_url(raw_url)
        parsed = urlparse(canonical_url)
        domain = parsed.netloc.lower()

        # 1. Dynamic platform resolution from registered Site Adapters
        platform = "generic"
        try:
            from .adapters.registry import AdapterRegistry
            temp_source = SourceInfo(original_url=raw_url, canonical_url=canonical_url, domain=domain, platform="generic")
            for adapter_cls in AdapterRegistry._adapters:
                if adapter_cls.matches(temp_source):
                    platform = getattr(adapter_cls, "name", "generic").lower().replace(" ", "_")
                    break
        except Exception:
            pass

        if platform == "generic" and domain:
            domain_parts = [p for p in domain.split(".") if p not in ("www", "m", "cdn", "api", "static", "com", "net", "org", "to", "io", "app", "me", "co")]
            if domain_parts:
                platform = domain_parts[0]

        # 2. Check if URL looks like a chapter or series page
        path_lower = parsed.path.lower()
        query_dict = parse_qs(parsed.query)

        is_chapter = False
        if "episode_no" in query_dict or "chapter_no" in query_dict:
            is_chapter = True
        elif any(f"/{ind}/" in path_lower or path_lower.endswith(f"/{ind}") or f"-{ind}-" in path_lower for ind in cls.CHAPTER_PATH_INDICATORS):
            is_chapter = True
        elif re.search(r'/(?:ep|ch|chap|chapter|episode|c)[-_]?\d+', path_lower):
            is_chapter = True
        elif "viewer" in path_lower or "reader" in path_lower:
            is_chapter = True

        requires_auth = False
        if any(term in path_lower for term in ["locked", "coin", "premium", "paywall"]):
            requires_auth = True

        return SourceInfo(
            original_url=raw_url,
            canonical_url=canonical_url,
            domain=domain,
            platform=platform,
            is_chapter_url=is_chapter,
            requires_auth=requires_auth
        )


UrlNormalizer = UniversalUrlSeparator
UrlSeparator = UniversalUrlSeparator
