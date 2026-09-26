"""
backend/app/api/v1/scraper/_shared.py
─────────────────────────────────────────────────────────────────────────────
Shared helpers, common imports, and utilities used across all scraper
sub-modules. Centralises dependency imports so each sub-module stays clean.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, Dict
from urllib.parse import urlparse, quote

from fastapi import HTTPException

from services.scraper.domain_rate_limiter import domain_block_manager

logger = logging.getLogger("sonikoma.api.scraper")


def parse_cookie_string(raw: Optional[str]) -> Optional[Dict[str, str]]:
    """Parse a standard HTTP cookie header string into a key-value dictionary."""
    if not raw:
        return None
    cookies = {}
    for chunk in raw.split(";"):
        chunk = chunk.strip()
        if not chunk or "=" not in chunk:
            continue
        name, value = chunk.split("=", 1)
        name = name.strip()
        value = value.strip().strip('"')
        if name:
            cookies[name] = value
    return cookies if cookies else None


def assert_not_blocked(url: str) -> None:
    """Raise 403 HTTPException if the target URL's domain is blocked."""
    if domain_block_manager.is_blocked(url):
        domain = urlparse(url).netloc or url
        logger.warning(f"[ScraperAPI] Blocked domain rejected: {domain}")
        raise HTTPException(
            status_code=403,
            detail=f"This domain ({domain}) is currently in the blocked exclusion list."
        )


def validate_chapter_url(url: str) -> str:
    """Validate that the target URL is a full chapter viewer URL and reject incomplete links, homepages, or catalog lists."""
    if not url or not url.strip():
        raise HTTPException(status_code=400, detail="Target Chapter URL is required.")
    
    clean_url = url.strip()
    try:
        parsed = urlparse(clean_url if "://" in clean_url else f"https://{clean_url}")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid URL format.")
    
    if not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid URL format: Hostname is missing.")
    
    domain = parsed.netloc.lower()
    path = parsed.path.strip("/")
    segments = [s for s in path.split("/") if s]
    
    # 1. Reject bare root / homepage URLs (e.g. https://www.webtoons.com or https://asuracomic.net)
    if not segments:
        raise HTTPException(
            status_code=400,
            detail=f"Incomplete URL for {domain}. Please provide a direct chapter viewer URL, not the homepage."
        )
    
    lang_codes = {"en", "ko", "kr", "jp", "ja", "zh", "cn", "fr", "es", "de", "id", "th", "tw", "vi"}
    if len(segments) == 1 and segments[0].lower() in lang_codes:
        raise HTTPException(
            status_code=400,
            detail=f"Incomplete URL for {domain}. Please provide a direct chapter viewer URL, not a language homepage."
        )
    
    # 2. Platform-specific validation
    # ── A. Webtoons ──
    if "webtoons.com" in domain or "webtoon.com" in domain:
        is_viewer = any(s.lower() == "viewer" for s in segments)
        is_list = any(s.lower() == "list" for s in segments)
        if is_list:
            raise HTTPException(
                status_code=400,
                detail="This is a series episode list page. Please enter a direct episode viewer URL containing '/viewer' (e.g. https://www.webtoons.com/.../viewer?title_no=...&episode_no=...)."
            )
        if not is_viewer:
            raise HTTPException(
                status_code=400,
                detail="Incomplete Webtoon URL. Only full chapter viewer URLs containing '/viewer' (e.g. https://www.webtoons.com/.../viewer?title_no=958&episode_no=1270) are allowed."
            )

    # ── B. Naver Webtoon ──
    elif "comic.naver.com" in domain or "naver.com" in domain:
        is_detail = any(s.lower() == "detail" for s in segments)
        if not is_detail:
            raise HTTPException(
                status_code=400,
                detail="Incomplete Naver Webtoon URL. Please provide a direct chapter detail URL (e.g. https://comic.naver.com/webtoon/detail?titleId=...&no=...)."
            )

    # ── C. MangaDex ──
    elif "mangadex.org" in domain:
        is_chapter = any(s.lower() == "chapter" for s in segments)
        if not is_chapter:
            if any(s.lower() == "title" for s in segments):
                raise HTTPException(
                    status_code=400,
                    detail="This is a MangaDex series title page. Please enter a direct chapter reader URL (e.g. https://mangadex.org/chapter/{uuid})."
                )
            raise HTTPException(
                status_code=400,
                detail="Incomplete MangaDex URL. Only direct chapter URLs containing '/chapter/' are allowed."
            )

    # ── D. Tapas ──
    elif "tapas.io" in domain:
        is_episode = any(s.lower() == "episode" for s in segments)
        if not is_episode:
            if any(s.lower() == "series" for s in segments):
                raise HTTPException(
                    status_code=400,
                    detail="This is a Tapas series overview page. Please enter a direct episode reader URL (e.g. https://tapas.io/episode/{id})."
                )
            raise HTTPException(
                status_code=400,
                detail="Incomplete Tapas URL. Only direct episode URLs containing '/episode/' are allowed."
            )

    # ── E. Bato.to Network ──
    elif any(d in domain for d in ("bato.to", "mangatoto.com", "battwo.com", "readtoto.com", "batotoo.com", "batocomic.com")):
        is_chapter = any(s.lower() == "chapter" for s in segments)
        if not is_chapter:
            if any(s.lower() in ("series", "title") for s in segments):
                raise HTTPException(
                    status_code=400,
                    detail="This is a Bato.to series catalog page. Please enter a direct chapter reader URL (e.g. https://bato.to/chapter/{id})."
                )
            raise HTTPException(
                status_code=400,
                detail="Incomplete Bato.to URL. Only direct chapter URLs containing '/chapter/' are allowed."
            )

    # ── F. Toomics ──
    elif "toomics.com" in domain:
        is_ep = any(s.lower() == "ep" for s in segments)
        if not is_ep:
            raise HTTPException(
                status_code=400,
                detail="Incomplete Toomics URL. Please enter a direct episode reader URL containing '/ep/' (e.g. https://global.toomics.com/en/index/ep/id/.../num/1)."
            )

    # ── G. Generic Comic & Scanlation Platforms ──
    else:
        import re
        from services.scraper.url_utils import UrlNormalizer
        is_chapter = any(
            UrlNormalizer.READER_TOKEN_PATTERN.match(s) or UrlNormalizer.CHAPTER_PATH_REGEX.search(s)
            for s in segments
        )
        has_query_chapter = any(
            k in parsed.query.lower()
            for k in ("chapter", "episode", "ch", "ep", "chapter_no", "episode_no", "no")
        )

        last_seg = segments[-1].lower() if segments else ""
        penultimate_seg = segments[-2].lower() if len(segments) >= 2 else ""

        if not is_chapter and not has_query_chapter:
            if penultimate_seg in UrlNormalizer.SERIES_SEGMENT_KEYWORDS or last_seg in UrlNormalizer.SERIES_SEGMENT_KEYWORDS:
                raise HTTPException(
                    status_code=400,
                    detail=f"This appears to be a series catalog page on {domain}. Please enter a direct chapter reader URL (e.g. .../chapter-1)."
                )
            if len(segments) <= 2:
                raise HTTPException(
                    status_code=400,
                    detail=f"Incomplete comic URL for {domain}. Please provide a direct chapter or reader page URL."
                )

    return clean_url
