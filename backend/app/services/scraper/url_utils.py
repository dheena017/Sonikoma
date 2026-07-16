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
    """Extracts title, genre, and episode from a Webtoon URL path or query parameters."""
    try:
        import re
        from urllib.parse import parse_qs, urlparse
        
        cleaned_url = strip_region_from_url(url_str)
        working_url = cleaned_url if cleaned_url.startswith("http") else "https://" + cleaned_url
        parsed = urlparse(working_url)
        parts = [p for p in parsed.path.split('/') if p]
        host = parsed.netloc.lower()

        genre = "general"
        title = "Webtoon Comic"
        episode = "Chapter 1"

        # Check query params for episode/chapter indicators
        query_params = parse_qs(parsed.query)
        ep_val = None
        for key in ('episode_no', 'episode', 'chapter', 'ep', 'no', 'chapter_no'):
            if key in query_params and query_params[key]:
                ep_val = query_params[key][0]
                break

        def titlecase_hyphens(s: str) -> str:
            # Check if original is UUID
            is_uuid = bool(re.match(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', s, re.IGNORECASE))
            if is_uuid:
                return get_source_name(url_str) + " Comic"
            # Strip leading numeric ID (e.g. 9523-solo-leveling -> solo-leveling)
            cleaned = re.sub(r'^\d+[-_]', '', s)
            is_pure_num = bool(re.match(r'^\d+$', cleaned))
            if is_pure_num:
                return get_source_name(url_str) + " Comic"
            # Strip 8-character hex suffix commonly appended to Webtoon series slugs (e.g. boundless-necromancer-19cdf401 -> boundless-necromancer)
            cleaned = re.sub(r'-[a-f0-9]{8}$', '', cleaned, flags=re.IGNORECASE)
            words = cleaned.replace('-', ' ').split()
            return ' '.join(w[0].upper() + w[1:] if len(w) > 0 else '' for w in words)

        chapter_number = ep_val or "1"
        chapter_title = ""

        if len(parts) >= 2:
            genre = parts[0] or "general"
            
            # Check for merged chapter inside series slug (e.g., aggregators)
            merge_match = re.match(r'^(.*?)[-_](?:chapter|episode|ep|ch|no)[-_]?(\d+)(?:[-_].*)?$', parts[1], re.IGNORECASE)
            if merge_match:
                title = titlecase_hyphens(merge_match.group(1))
                if not ep_val:
                    chapter_number = merge_match.group(2)
            else:
                title = titlecase_hyphens(parts[1])
                
            # Scan remaining segments for episode number/title
            ep_part = ""
            for p in parts[2:]:
                if re.search(r'\d+', p) and p != 'viewer':
                    ep_part = p
                    break
            
            if not ep_part and len(parts) >= 3 and parts[2] != 'viewer':
                ep_part = parts[2]

            if ep_part:
                num_match = re.search(r'(?:^|[^0-9])(\d+)(?:[^0-9]|$)', ep_part)
                path_num = num_match.group(1) if num_match else ""
                if not ep_val and path_num:
                    chapter_number = path_num
                
                raw_title = ep_part
                if path_num:
                    num_idx = ep_part.find(path_num)
                    after = ep_part[num_idx + len(path_num):]
                    raw_title = re.sub(r'[-_]+', ' ', after).strip()
                    if not raw_title:
                        before = ep_part[:num_idx]
                        raw_title = re.sub(r'(?:chapter|episode|ep|no)', '', before, flags=re.IGNORECASE)
                        raw_title = re.sub(r'[-_]+', ' ', raw_title).strip()
                else:
                    raw_title = re.sub(r'(?:chapter|episode|ep|no)', '', ep_part, flags=re.IGNORECASE)
                    raw_title = re.sub(r'[-_]+', ' ', raw_title).strip()
                
                words = raw_title.split()
                chapter_title = ' '.join(w[0].upper() + w[1:] if len(w) > 0 else '' for w in words)
        elif len(parts) == 1:
            merge_match = re.match(r'^(.*?)[-_](?:chapter|episode|ep|ch|no)[-_]?(\d+)(?:[-_].*)?$', parts[0], re.IGNORECASE)
            if merge_match:
                title = titlecase_hyphens(merge_match.group(1))
                if not ep_val:
                    chapter_number = merge_match.group(2)
            else:
                title = titlecase_hyphens(parts[0])

        episode = f"Chapter {chapter_number}"
        if chapter_title:
            episode = f"Chapter {chapter_number} - {chapter_title}"

        return {"genre": genre, "title": title, "episode": episode, "source_name": get_source_name(url_str)}
    except Exception:
        return {"genre": "general", "title": "Custom Storyboard", "episode": "Dynamic Chapter", "source_name": "Custom Source"}

def get_source_name(url_str: str) -> str:
    """Derives a friendly website/source name from a URL string."""
    try:
        from urllib.parse import urlparse
        if not url_str:
            return "Custom Source"
        working_url = url_str if url_str.startswith("http") else "https://" + url_str
        parsed = urlparse(working_url)
        host = parsed.netloc.lower()
        if "asurascans.com" in host:
            return "Asura Scans"
        if "webtoons.com" in host or "webtoon.com" in host:
            return "Webtoons"
        if "manhuato.com" in host:
            return "ManhuaTo"
        if "mangadex.org" in host:
            return "MangaDex"
        if "webcomicsapp.com" in host:
            return "WebComics App"
        if "toomics.com" in host:
            return "Toomics"
        
        parts = host.replace("www.", "").split(".")
        if parts:
            return parts[0].capitalize()
        return "Custom Source"
    except Exception:
        return "Custom Source"
