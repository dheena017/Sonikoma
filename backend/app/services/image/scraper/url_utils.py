"""
backend/app/services/image/scraper/url_utils.py
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
    """Dynamically extracts title, genre, and episode from any Webtoon/Manhwa URL path or query parameters without hardcoded site branches."""
    try:
        import re
        from urllib.parse import parse_qs, urlparse, unquote
        
        cleaned_url = strip_region_from_url(url_str)
        working_url = cleaned_url if cleaned_url.startswith("http") else "https://" + cleaned_url
        working_url = unquote(working_url)
        parsed = urlparse(working_url)
        parts = [p for p in parsed.path.split('/') if p]
        query_params = parse_qs(parsed.query)

        source_name = get_source_name(url_str)
        genre = "general"
        title = ""
        chapter_number = ""

        for q_key in ('no', 'episode_no', 'episodeId', 'episode', 'chapter', 'ep', 'chapter_no'):
            if q_key in query_params and query_params[q_key]:
                val = query_params[q_key][0]
                m = re.search(r'\d+', val)
                if m:
                    chapter_number = m.group(0)
                    break

        path_title = ""
        path_ep = ""

        keywords_series = {'series', 'comic', 'webtoon', 'campaign', 'content', 'action', 'fantasy', 'romance', 'drama', 'slice-of-life', 'thriller'}
        keywords_ep = {'episode', 'episodes', 'chapter', 'chapters', 'viewer', 'detail', 'ep'}

        for idx, p in enumerate(parts):
            p_lower = p.lower()
            if p_lower in keywords_series and idx + 1 < len(parts):
                cand = parts[idx + 1]
                if not cand.isdigit() and cand.lower() not in keywords_ep:
                    path_title = cand
            if p_lower in keywords_ep and idx + 1 < len(parts):
                cand = parts[idx + 1]
                m = re.search(r'\d+', cand)
                if m:
                    path_ep = m.group(0)

        if not path_title and parts:
            for p in parts:
                p_clean = re.sub(r'^[0-9]+[-_]', '', p)
                if not p_clean.isdigit() and p.lower() not in keywords_ep and p.lower() not in keywords_series and p.lower() not in ('en', 'ko', 'list'):
                    path_title = p
                    break

        def titlecase_slug(s: str) -> str:
            if not s:
                return f"{source_name} Comic"
            if re.match(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', s, re.IGNORECASE) or s.isdigit():
                return f"{source_name} #{s[:8]}"
            cleaned = re.sub(r'^\d+[-_]', '', s)
            cleaned = re.sub(r'-[a-f0-9]{8}$', '', cleaned, flags=re.IGNORECASE)
            words = cleaned.replace('-', ' ').replace('_', ' ').split()
            return ' '.join(w.capitalize() for w in words)

        title = titlecase_slug(path_title)

        if not chapter_number:
            if path_ep:
                chapter_number = path_ep
            else:
                for p in reversed(parts):
                    m = re.search(r'\b\d+\b', p)
                    if m and p.lower() not in ('list', 'index'):
                        chapter_number = m.group(0)
                        break

        episode = f"Episode {chapter_number}" if chapter_number else "Chapter 1"

        if parts and parts[0].lower() in keywords_series:
            genre = parts[0].lower()

        return {
            "genre": genre,
            "title": title,
            "episode": episode,
            "source_name": source_name
        }
    except Exception:
        return {"genre": "general", "title": "Custom Storyboard", "episode": "Dynamic Chapter", "source_name": "Custom Source"}

def get_source_name(url_str: str) -> str:
    """Derives a friendly website/source name dynamically from any URL string without hardcoded site links."""
    if not url_str:
        return "Custom Source"
    try:
        from urllib.parse import urlparse
        working_url = url_str if url_str.startswith("http") else "https://" + url_str
        parsed = urlparse(working_url)
        host = parsed.netloc.lower()
        if not host:
            return "Custom Source"
        
        parts = [p for p in host.split('.') if p not in ('www', 'com', 'net', 'org', 'io', 'co', 'kr', 'app', 'fan', 'mobi', 'tv', 'cc', 'us', 'me', 'xyz', 'top', 'site', 'online', 'store')]
        if not parts:
            return "Custom Source"
        
        name_parts = [p for p in parts if p not in ('m', 'api', 'cdn', 'static', 'assets', 'v1', 'v2', 'v3', 'en', 'kr', 'jp', 'cn', 'fr', 'es', 'de')]
        if not name_parts:
            name_parts = parts
            
        return ' '.join(w.capitalize() for w in ' '.join(name_parts).replace('-', ' ').replace('_', ' ').split())
    except Exception:
        return "Custom Source"
