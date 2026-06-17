"""
backend/python/utils/url_utils.py
─────────────────────────────────────────────────────────────────────────────
URL parsing helpers for Webtoon episode URLs.
─────────────────────────────────────────────────────────────────────────────
"""

import re
from urllib.parse import urlparse, urlunparse

def extract_webtoon_url(url_str: str) -> str:
    """Extracts the first valid URL when a pasted string contains duplicate or concatenated Webtoon links."""
    if not url_str:
        return ""
    trimmed = url_str.strip()
    match = re.search(r'https?://(?:[^\s"\']+?)(?=https?://|$)', trimmed, re.IGNORECASE)
    return match.group(0) if match else trimmed

def strip_region_from_url(url_str: str) -> str:
    """Strips language/region prefix (e.g. /en/, /fr/, /zh-hans/) from a Webtoon URL"""
    if not url_str:
        return ""
    working_url = extract_webtoon_url(url_str)
    if working_url and not re.match(r'^https?://', working_url, re.IGNORECASE):
        working_url = "https://" + working_url
    try:
        parsed = urlparse(working_url)
        parts = [p for p in parsed.path.split('/') if p]
        if parts:
            # Check for region prefix like en, fr, zh-hans
            if re.match(r'^[a-z]{2}(-[a-z]{2,4})?$', parts[0], re.IGNORECASE):
                parts.pop(0)
                parsed = parsed._replace(path='/' + '/'.join(parts))
        
        result = urlunparse(parsed)
        if not url_str.strip().startswith(("http://", "https://")):
            result = re.sub(r'^https?://', '', result, flags=re.IGNORECASE)
        return result
    except Exception:
        return url_str

def parse_webtoon_url(url_str: str) -> dict:
    """Extracts title, genre, and episode from a Webtoon URL path."""
    try:
        cleaned_url = strip_region_from_url(url_str)
        working_url = cleaned_url if cleaned_url.startswith("http") else "https://" + cleaned_url
        parsed = urlparse(working_url)
        parts = [p for p in parsed.path.split('/') if p]
        host = parsed.netloc.lower()

        genre = "general"
        title = "Webtoon Comic"
        episode = "Intro Chapter"

        def titlecase_hyphens(s: str) -> str:
            # Capitalize each word, replace hyphens with spaces
            words = s.replace('-', ' ').split()
            return ' '.join(w[0].upper() + w[1:] if len(w) > 0 else '' for w in words)

        if 'webcomicsapp.com' in host:
            genre = "WebComicsApp"
            if len(parts) >= 2 and parts[0] == 'view':
                title = titlecase_hyphens(parts[1])
                episode = titlecase_hyphens(' '.join(parts[2:])) if len(parts) >= 3 else "Chapter"
            elif len(parts) >= 1:
                title = titlecase_hyphens(parts[-1])
            return {"genre": genre, "title": title, "episode": episode}

        if len(parts) >= 2:
            genre = parts[0] or "general"
            title = titlecase_hyphens(parts[1])
            if len(parts) >= 3 and parts[2] != 'viewer':
                episode = titlecase_hyphens(parts[2])
        elif len(parts) == 1:
            title = titlecase_hyphens(parts[0])

        return {"genre": genre, "title": title, "episode": episode}
    except Exception:
        return {"genre": "general", "title": "Custom Storyboard", "episode": "Dynamic Chapter"}
