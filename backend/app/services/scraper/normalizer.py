"""
backend/app/services/scraper/normalizer.py
─────────────────────────────────────────────────────────────────────────────
URL Normalization, Canonicalization, and Site/Platform Analysis.
─────────────────────────────────────────────────────────────────────────────
"""

import re
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
from typing import Optional, Dict, Any, Tuple
from .models import SourceInfo


class UrlNormalizer:
    """Normalizes and canonicalizes input URLs for scraper consumption."""

    TRACKING_PARAMS = {
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "fbclid", "gclid", "_ga", "_gl", "ref", "source", "spm"
    }

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
            # If scheme is missing, assume https://
            if "." in url and not url.startswith("/"):
                url = "https://" + url

        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return url

            # Filter out tracking query params
            query_dict = parse_qs(parsed.query, keep_blank_values=True)
            clean_query_dict = {
                k: v for k, v in query_dict.items()
                if k.lower() not in cls.TRACKING_PARAMS
            }

            clean_query = urlencode(clean_query_dict, doseq=True)
            # Remove trailing slash from path if path is not just '/'
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

    @classmethod
    def resolve_parent_series_url(cls, raw_url: str) -> str:
        """
        Dynamically decomposes and canonicalizes any reader or chapter URL into its parent
        series/catalog URL using semantic path token decomposition (zero hardcoding).
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

            # 1. Separate identifying vs transient query parameters
            # Identifying params relate to the series (e.g. title_no, series_id, id)
            # Transient params relate to reading progress (e.g. episode_no, chapter_no, progress, page)
            identifying_keys = {"title_no", "series_id", "comic_id", "manga_id", "id", "title"}
            transient_keys = {"episode_no", "chapter_no", "ch", "ep", "progress", "page", "p", "read_pos", "scroll"}

            filtered_query = {
                k: v for k, v in query_dict.items()
                if k.lower() in identifying_keys or (k.lower() not in transient_keys and "episode" not in k.lower() and "chapter" not in k.lower())
            }

            # 2. Dynamic Viewer-to-Catalog segment normalization (e.g. /viewer -> /list)
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

            # 3. Dynamic Path Pruning from Right-to-Left
            # Detect chapter/reader segments and prune back to parent series container
            reader_token_pattern = re.compile(
                r"^(?:chapter|episode|ep|ch|c|chap|read|viewer|volume|vol)[-_]?\d*.*$|"
                r"^[-_]?(?:chapter|episode|ep|ch|c)[-_]\d+.*$|"
                r"^\d+(?:\.\d+)?$",
                re.IGNORECASE
            )

            pruned_segments = list(path_segments)
            while pruned_segments and reader_token_pattern.match(pruned_segments[-1]):
                pruned_segments.pop()

            # If pruned segments removed the chapter layer, return reconstructed parent URL
            if pruned_segments and len(pruned_segments) < len(path_segments):
                return urlunparse((
                    parsed.scheme,
                    parsed.netloc,
                    "/" + "/".join(pruned_segments),
                    "",
                    urlencode(filtered_query, doseq=True),
                    ""
                ))

            # 4. In-segment suffix stripping (e.g. /series/slug-chapter-10 -> /series/slug)
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
    def separate_url(cls, raw_url: str) -> Dict[str, Any]:
        """
        Dynamically deconstructs and separates any comic/manga/webtoon URL into its
        constituent entities (domain, platform, series URL, chapter URL, title/chapter slug, IDs).
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
                "chapter_slug": None,
                "chapter_number": None,
                "title_no": None,
                "recommended_action": "none",
                "supported_actions": []
            }

        parsed = urlparse(canonical)
        domain = parsed.netloc.lower()
        path = parsed.path
        query = parse_qs(parsed.query)

        source_info = SiteAnalyzer.analyze(canonical)
        series_url = cls.resolve_parent_series_url(canonical)
        is_chapter = source_info.is_chapter_url

        # Extract title_no / series identifiers dynamically
        title_no = None
        for k, v in query.items():
            if k.lower() in ("title_no", "series_id", "comic_id", "manga_id", "id"):
                title_no = v[0]
                break

        # Dynamic title slug and numeric ID extraction from path
        title_slug = None
        title_id = None
        path_segments = [s for s in path.split("/") if s]

        for idx, seg in enumerate(path_segments):
            if seg.lower() in ("title", "series", "manga", "comic", "manhwa", "webtoon", "comic-detail") and idx + 1 < len(path_segments):
                title_slug = path_segments[idx + 1]
                num_match = re.match(r"^(\d+)", title_slug)
                if num_match:
                    title_id = num_match.group(1)
                break

        if not title_slug and path_segments:
            # Fallback: first non-generic segment
            candidate = [s for s in path_segments if s.lower() not in ("en", "kr", "jp", "cn", "fr", "es", "de", "viewer", "reader", "read", "list")]
            if candidate:
                title_slug = candidate[0]
                num_match = re.match(r"^(\d+)", title_slug)
                if num_match:
                    title_id = num_match.group(1)

        # Dynamic chapter slug and number extraction
        chapter_slug = None
        chapter_number = None

        for idx, seg in enumerate(path_segments):
            if seg.lower() in ("chapter", "episode", "ep", "ch", "viewer", "read") and idx + 1 < len(path_segments):
                chapter_slug = path_segments[idx + 1]
                num_match = re.search(r"(\d+(?:\.\d+)?)", chapter_slug)
                if num_match:
                    chapter_number = num_match.group(1)
                break

        if not chapter_number:
            if query.get("episode_no"):
                chapter_number = query.get("episode_no")[0]
                chapter_slug = f"episode-{chapter_number}"
            elif query.get("chapter_no"):
                chapter_number = query.get("chapter_no")[0]
                chapter_slug = f"chapter-{chapter_number}"
            elif path_segments:
                suffix_num = re.search(r"[-_](?:chapter|episode|ep|ch|c)[-_]?(\d+(?:\.\d+)?)", path_segments[-1], re.IGNORECASE)
                if suffix_num:
                    chapter_number = suffix_num.group(1)
                    chapter_slug = f"chapter-{chapter_number}"

        chapter_url = canonical if is_chapter else None

        return {
            "success": True,
            "raw_url": raw_trimmed,
            "canonical_url": canonical,
            "series_url": series_url,
            "chapter_url": chapter_url,
            "is_chapter_url": is_chapter,
            "is_series_url": not is_chapter or (series_url == canonical),
            "platform": source_info.platform,
            "domain": domain,
            "title_slug": title_slug,
            "title_id": title_id or title_no,
            "chapter_slug": chapter_slug,
            "chapter_number": chapter_number,
            "title_no": title_no,
            "recommended_action": "scrape_chapter" if is_chapter else "scrape_series",
            "supported_actions": ["scrape_series", "scrape_chapter"]
        }


class SiteAnalyzer:
    """Dynamically analyzes a URL to extract domain, platform signatures, and page classification."""

    CHAPTER_PATH_INDICATORS = {
        "episode", "episodes", "chapter", "chapters", "viewer",
        "read", "ch-", "ep-", "c-", "chap"
    }

    @classmethod
    def analyze(cls, raw_url: str) -> SourceInfo:
        """Performs dynamic site analysis on the provided URL using registered adapters and generic heuristics."""
        canonical_url = UrlNormalizer.normalize_url(raw_url)
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

        # Fallback to dynamic SLD extraction (e.g. comic-walker.com -> comic-walker)
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

        # Auth requirement hints
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
