"""
backend/app/services/scraper/parsers/utils.py
"""
import os
import re
import random
from datetime import datetime
from typing import List, Optional, Any

try:
    import requests
except ImportError:
    requests = None

try:
    import httpx
except ImportError:
    httpx = None

from .constants import USER_AGENTS

def decode_escaped_js_string(value: str) -> str:
    """Helper to decode JS escapes (e.g. \\u002F -> /)"""
    try:
        decoded = value.encode().decode('unicode-escape')
        for raw, clean in [('\\n', ''), ('\\r', ''), ('\\t', ''), ("\\'", "'"), ('\\"', '"'), ('\\\\', '\\')]:
            decoded = decoded.replace(raw, clean)
        return decoded
    except Exception:
        return value
def natural_sort_key(s: str) -> List[Any]:
    """Helper to sort strings containing numbers naturally (e.g. panel_2 before panel_10)."""
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]
def _fetch_source(source: str) -> Optional[str]:
    """Fetches HTML from a URL or reads a local file path. Returns HTML string."""
    if os.path.exists(source):
        with open(source, 'r', encoding='utf-8') as f:
            return f.read()
    if requests:
        try:
            resp = requests.get(source, headers={'User-Agent': random.choice(USER_AGENTS)}, timeout=10)
            if resp.status_code == 200:
                return resp.text
        except Exception:
            return None
    elif httpx:
        try:
            resp = httpx.get(source, headers={'User-Agent': random.choice(USER_AGENTS)}, timeout=10)
            if resp.status_code == 200:
                return resp.text
        except Exception:
            return None
    return None
def _parse_date_string(s: str) -> Optional[datetime]:
    """Normalize human-readable date strings to datetime. Handles "Jul 7, 2026" etc."""
    if not s:
        return None
    s = s.strip()
    fmts = ["%b %d, %Y", "%B %d, %Y", "%Y-%m-%d", "%d %b %Y", "%d %B %Y"]
    for fmt in fmts:
        try:
            return datetime.strptime(s, fmt)
        except Exception:
            pass

    m = re.search(r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b', s, re.IGNORECASE)
    if m:
        try:
            return datetime.strptime(m.group(0), "%b %d, %Y")
        except Exception:
            try:
                return datetime.strptime(m.group(0), "%B %d, %Y")
            except Exception:
                pass

    m = re.search(r'(\d{4})', s)
    if m:
        try:
            y = int(m.group(1))
            return datetime(y, 1, 1)
        except Exception:
            pass
    return None
