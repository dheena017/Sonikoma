"""
backend/app/services/scraper/workflow.py
─────────────────────────────────────────────────────────────────────────────
Universal Multi-Platform Episode & Series Discovery Workflow Engine.

Autonomous, zero-hardcoded crawling pipeline supporting:
  • Webtoons, MangaDex, Madara CMS, ThemeSphere, Bato, Comick, MangaKakalot
  • Dynamic SPAs (GraphQL Relay edges/nodes, JSON AST state trees)
  • WAF / Cloudflare automatic headless browser escalation
  • Breadcrumb parent-series link recovery on single-chapter pages
  • Relative date normalization (ISO 8601 YYYY-MM-DD)
  • Natural float sorting (Prologue -> 0.0, Ch 105.5 -> 105.5, Extras -> 900+)
  • Scanlation group deduplication and language filtering
─────────────────────────────────────────────────────────────────────────────
"""

import re
import json
import time
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple, Set
from urllib.parse import urljoin, urlparse, parse_qs, quote

from .normalizer import UrlNormalizer
from .acquisition.http import HttpFetcher
from .acquisition.browser import BrowserFetcher
from .extraction.dom import DomExtractor
from .ai.domain_memory import DomainMemory
from .evaluator import AccessEvaluator, AccessStatus

try:
    from database.engine import get_db_connection
except ImportError:
    get_db_connection = None

logger = logging.getLogger("sonikoma.services.scraper.workflow")


# ═════════════════════════════════════════════════════════════════════════════
# 1. SQLite Series Episode Discovery Cache
# ═════════════════════════════════════════════════════════════════════════════

def _ensure_episodes_table():
    """Initializes the series_episodes_cache SQLite table if not already present."""
    if not get_db_connection:
        return
    try:
        with get_db_connection() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS series_episodes_cache (
                series_url      TEXT PRIMARY KEY,
                title           TEXT,
                data_json       TEXT NOT NULL,
                total_episodes  INTEGER DEFAULT 0,
                updated_at      REAL NOT NULL,
                created_at      TEXT DEFAULT (datetime('now'))
            )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_series_ep_url ON series_episodes_cache(series_url)")
            conn.commit()
    except Exception as e:
        logger.debug(f"[SeriesEpisodeCache] DB Init notice: {e}")


def _get_cached_episodes(series_url: str, ttl_seconds: float = 600.0) -> Optional[Dict[str, Any]]:
    """Retrieves cached series discovery results within the TTL window."""
    if not get_db_connection:
        return None
    _ensure_episodes_table()
    try:
        clean_url = series_url.strip().lower()
        now = time.time()
        with get_db_connection() as conn:
            row = conn.execute(
                "SELECT data_json, updated_at FROM series_episodes_cache WHERE LOWER(series_url) = ?",
                (clean_url,)
            ).fetchone()
            if row and row["data_json"] and (now - row["updated_at"] < ttl_seconds):
                logger.info(f"[SeriesEpisodeCache] HIT for {series_url} (age: {now - row['updated_at']:.1f}s)")
                return json.loads(row["data_json"])
    except Exception as e:
        logger.debug(f"[SeriesEpisodeCache] Read notice: {e}")
    return None


def _save_cached_episodes(series_url: str, title: str, result_dict: Dict[str, Any]):
    """Persists newly crawled series episodes to SQLite cache."""
    if not get_db_connection or not result_dict or not result_dict.get("episodes"):
        return
    _ensure_episodes_table()
    try:
        clean_url = series_url.strip()
        data_json = json.dumps(result_dict)
        total = len(result_dict.get("episodes", []))
        now = time.time()
        with get_db_connection() as conn:
            conn.execute("""
            INSERT INTO series_episodes_cache (series_url, title, data_json, total_episodes, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(series_url) DO UPDATE SET
                title           = excluded.title,
                data_json       = excluded.data_json,
                total_episodes  = excluded.total_episodes,
                updated_at      = excluded.updated_at
            """, (clean_url, title, data_json, total, now))
            conn.commit()
    except Exception as e:
        logger.debug(f"[SeriesEpisodeCache] Write notice: {e}")


# ═════════════════════════════════════════════════════════════════════════════
# 2. Parsing, Extraction & Normalization Utilities
# ═════════════════════════════════════════════════════════════════════════════

def _normalize_date_string(date_raw: Optional[str]) -> str:
    """
    Normalizes human relative timestamps ('2 hours ago', 'Yesterday', '3 days ago')
    and regional date formats into standard ISO YYYY-MM-DD.
    """
    if not date_raw:
        return ""
    text = date_raw.strip().lower()
    now = datetime.now()

    try:
        if "just now" in text or "moments ago" in text:
            return now.strftime("%Y-%m-%d")

        if "yesterday" in text:
            return (now - timedelta(days=1)).strftime("%Y-%m-%d")

        m_rel = re.search(r'(\d+)\s*(hour|hr|minute|min|second|sec|day|month|year)s?\s*ago', text)
        if m_rel:
            num = int(m_rel.group(1))
            unit = m_rel.group(2)
            if "sec" in unit or "min" in unit or "hr" in unit or "hour" in unit:
                return now.strftime("%Y-%m-%d")
            elif "day" in unit:
                return (now - timedelta(days=num)).strftime("%Y-%m-%d")
            elif "month" in unit:
                return (now - timedelta(days=num * 30)).strftime("%Y-%m-%d")
            elif "year" in unit:
                return (now - timedelta(days=num * 365)).strftime("%Y-%m-%d")

        iso_match = re.search(r'(\d{4})[./-](\d{1,2})[./-](\d{1,2})', text)
        if iso_match:
            y, m, d = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
            return f"{y:04d}-{m:02d}-{d:02d}"

        slash_match = re.search(r'(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})', text)
        if slash_match:
            p1, p2, p3 = int(slash_match.group(1)), int(slash_match.group(2)), int(slash_match.group(3))
            y = p3 if p3 > 99 else (2000 + p3)
            return f"{y:04d}-{p1:02d}-{p2:02d}"
    except Exception:
        pass

    return date_raw.strip()[:20]


def _extract_language_tag(text: str) -> Optional[str]:
    """Detects bracketed language indicators like [EN], [RAW], [ID], [ES], [FR], [KR]."""
    if not text:
        return None
    m = re.search(r'\[(EN|ENG|ENGLISH|RAW|ID|IND|INDO|ES|ESP|FR|KOR|KR|JP|JAP|TH|VI|PT|BR)\]', text, re.IGNORECASE)
    if m:
        code = m.group(1).upper()
        if code in ("EN", "ENG", "ENGLISH"): return "en"
        if code in ("RAW", "KOR", "KR"): return "ko"
        if code in ("JP", "JAP"): return "ja"
        if code in ("ES", "ESP"): return "es"
        if code in ("ID", "IND", "INDO"): return "id"
        if code in ("FR",): return "fr"
        if code in ("PT", "BR"): return "pt"
        if code in ("TH",): return "th"
        if code in ("VI",): return "vi"
    return None


def _extract_number_and_type_from_text(text: str) -> Tuple[Optional[float], str]:
    """
    Extracts numeric float value and identifies chapter type without hardcoded strings.
    Handles standard chapters (105.5), prologues (0.0), side stories (1001.0), and extras (901.0).
    """
    if not text:
        return None, "Chapter"

    t_lower = text.strip().lower()

    if any(k in t_lower for k in ("prologue", "ch. 0", "chapter 0", "intro", "ch 0")):
        return 0.0, "Prologue"

    # 1. Check explicit Chapter/Episode/Ch prefix first (e.g. 'Chapter 105.5: Extra')
    m_ch = re.search(r'(?:chapter|episode|ep|ch|c|chap|no|#)\s*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
    if m_ch:
        try:
            num = float(m_ch.group(1))
            return num, f"Chapter {num if not num.is_integer() else int(num)}"
        except ValueError:
            pass

    # 2. Check standalone Side Story & Extra
    if "side story" in t_lower or "sidestory" in t_lower:
        sm = re.search(r'(\d+(?:\.\d+)?)', text)
        sub_num = float(sm.group(1)) if sm else 1.0
        return 1000.0 + sub_num, f"Side Story {int(sub_num) if sub_num.is_integer() else sub_num}"

    if "extra" in t_lower or "special" in t_lower or "spin-off" in t_lower:
        em = re.search(r'(\d+(?:\.\d+)?)', text)
        sub_num = float(em.group(1)) if em else 1.0
        return 900.0 + sub_num, f"Extra {int(sub_num) if sub_num.is_integer() else sub_num}"

    # 3. Generic trailing number
    m_gen = re.search(r'(\d+(?:\.\d+)?)', text)
    if m_gen:
        try:
            num = float(m_gen.group(1))
            return num, f"Chapter {num if not num.is_integer() else int(num)}"
        except ValueError:
            pass

    return None, text[:30]


def _build_proxy_thumbnail_url(thumbnail_url: Optional[str], referer_url: str, series_cover: Optional[str] = None) -> str:
    """Builds a secure proxy image URL for hotlink-protected thumbnails with series cover fallback."""
    raw = thumbnail_url or series_cover or ""
    if not raw or raw.startswith("data:image/svg") or "1x1.gif" in raw or "blank" in raw:
        raw = series_cover or ""
    if not raw:
        return ""
    if raw.startswith("/api/proxy-image") or raw.startswith("/api/v1/proxy-image"):
        return raw

    encoded_url = quote(raw, safe="")
    encoded_ref = quote(referer_url, safe="")
    return f"/api/v1/proxy-image?url={encoded_url}&referer={encoded_ref}"


def _deduplicate_and_sort_episodes(
    episodes: List[Dict[str, Any]],
    sort_by: str = "latest",
    preferred_language: str = "en"
) -> List[Dict[str, Any]]:
    """Deduplicates multiple scanlation releases of the same chapter and naturally sorts by float."""
    if not episodes:
        return []

    has_preferred = any(ep.get("language") == preferred_language for ep in episodes if ep.get("language"))
    filtered = [ep for ep in episodes if not ep.get("language") or ep.get("language") == preferred_language] if has_preferred else episodes

    dedup_map: Dict[Any, Dict[str, Any]] = {}
    for ep in filtered:
        ch_num = ep.get("chapter_number")
        key = ch_num if ch_num is not None else ep.get("url")

        if key not in dedup_map:
            dedup_map[key] = ep
        else:
            existing = dedup_map[key]
            if not existing.get("thumbnail") and ep.get("thumbnail"):
                dedup_map[key] = ep

    unique_episodes = list(dedup_map.values())

    def _sort_key(e):
        num = e.get("chapter_number")
        return num if num is not None else 999999.0

    unique_episodes.sort(key=_sort_key)

    if sort_by == "latest":
        unique_episodes = list(reversed(unique_episodes))
    elif sort_by == "rating":
        unique_episodes.sort(key=lambda x: x.get("rating", 0) or 0, reverse=True)

    for idx, ep in enumerate(unique_episodes):
        ep["episode_no"] = idx + 1
        ep["index"] = idx

    return unique_episodes


# ═════════════════════════════════════════════════════════════════════════════
# 3. Dynamic DOM & Heterogeneous State AST Parser
# ═════════════════════════════════════════════════════════════════════════════

def _extract_episodes_dynamically(soup: Any, page_url: str) -> List[Dict[str, Any]]:
    """
    Zero-hardcoding Dynamic DOM & Heterogeneous State AST Parser.
    Extracts episodes from:
      1. Embedded JSON state trees (__NEXT_DATA__, __NUXT__, GraphQL Relay edges/nodes)
      2. Interactive <select> reader dropdowns
      3. Dynamic DOM subtree cluster density heuristics
      4. Fallback anchor scan
    """
    if not soup:
        return []

    base_tag = soup.find("base", href=True)
    base_url = urljoin(page_url, base_tag.get("href")) if base_tag else page_url

    extracted: List[Dict[str, Any]] = []
    seen_urls: Set[str] = set()

    # 1. Heterogeneous JSON AST Search
    for script in soup.find_all("script"):
        script_text = script.string or script.get_text() or ""
        if any(k in script_text for k in ('"chapters"', '"episodes"', '"chapterList"', '"edges"', '"itemListElement"', '__NEXT_DATA__', '__NUXT__')):
            try:
                data = json.loads(script_text)

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
                                        num_val, _ = _extract_number_and_type_from_text(str(t))
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
                                            num_val, _ = _extract_number_and_type_from_text(str(t or u_str))
                                            found.append({
                                                "title": str(t or f"Chapter {num_val or len(found)+1}"),
                                                "url": full_u,
                                                "thumbnail": urljoin(base_url, str(thmb)) if thmb else None,
                                                "date": _normalize_date_string(str(dt or "")),
                                                "chapter_number": num_val,
                                                "number": str(round(num_val) if num_val is not None and num_val.is_integer() else (num_val or "")),
                                                "is_locked": is_locked,
                                                "language": _extract_language_tag(str(t or ""))
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
                num_val, _ = _extract_number_and_type_from_text(txt)
                if num_val is not None or "ch" in txt.lower():
                    valid_opts.append({
                        "title": txt or f"Chapter {len(valid_opts)+1}",
                        "url": urljoin(base_url, val),
                        "chapter_number": num_val,
                        "number": str(round(num_val) if num_val is not None and num_val.is_integer() else (num_val or "")),
                        "language": _extract_language_tag(txt)
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

            num_val, _ = _extract_number_and_type_from_text(txt)
            is_ch_link = (num_val is not None) or any(w in href.lower() for w in ("/chapter", "/episode", "/read", "-ch-", "-chapter-"))

            if is_ch_link:
                chapter_like_count += 1
                item_container = a.parent if a.parent else a
                is_locked = False
                if item_container:
                    c_str = f"{item_container.get('class', '')} {item_container.get('id', '')}".lower()
                    has_lock_icon = bool(item_container.find(["svg", "i", "span"], class_=re.compile(r'lock|coin|pass|vip|paid', re.I)))
                    is_locked = has_lock_icon or any(w in c_str for w in ("locked", "fastpass", "coin", "paid", "vip"))

                img = a.find("img") or (item_container.find("img") if item_container else None)
                thmb = None
                if img:
                    src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
                    if src and not src.startswith("data:image/svg"):
                        thmb = urljoin(base_url, src)

                date_el = item_container.select_one(".date, .chapter-date, .post-on, .time, span.date, .tx") if item_container else None
                date_str = _normalize_date_string(date_el.get_text(strip=True) if date_el else "")

                cluster_items.append({
                    "title": txt,
                    "url": full_url,
                    "thumbnail": thmb,
                    "date": date_str,
                    "chapter_number": num_val,
                    "number": str(round(num_val) if num_val is not None and num_val.is_integer() else (num_val or "")),
                    "volume": parent_header if parent_header else None,
                    "is_locked": is_locked,
                    "language": _extract_language_tag(txt)
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

    # 4. Final Anchor Sweep Fallback
    for a in soup.find_all("a", href=True):
        href = urljoin(base_url, a.get("href"))
        if href in seen_urls or "#" in href:
            continue
        txt = a.get_text(strip=True)
        if not txt or len(txt) > 80:
            continue
        num_val, _ = _extract_number_and_type_from_text(txt)
        if num_val is not None:
            seen_urls.add(href)
            extracted.append({
                "title": txt,
                "url": href,
                "chapter_number": num_val,
                "number": str(round(num_val) if num_val.is_integer() else num_val),
                "language": _extract_language_tag(txt)
            })

    return extracted


# ═════════════════════════════════════════════════════════════════════════════
# 4. Dynamic Platform Feed & AJAX Crawlers
# ═════════════════════════════════════════════════════════════════════════════

async def _crawl_specialized_platform(raw_url: str) -> Optional[Dict[str, Any]]:
    """Inspects dynamic platform API feeds (e.g. MangaDex REST API v5)."""
    import httpx
    m = re.search(r'/(?:title|manga|chapter)/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})', raw_url, re.IGNORECASE)
    if ("mangadex.org" in raw_url or "mangadex.cc" in raw_url) and m:
        manga_id = m.group(1)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                m_resp = await client.get(f"https://api.mangadex.org/manga/{manga_id}", params={"includes[]": ["cover_art", "author", "artist"]})
                if m_resp.status_code == 200:
                    m_data = m_resp.json().get("data", {})
                    m_attrs = m_data.get("attributes", {})
                    titles = m_attrs.get("title", {})
                    title_str = titles.get("en") or next(iter(titles.values()), "Manga")
                    cover_file = next((r["attributes"]["fileName"] for r in m_data.get("relationships", []) if r.get("type") == "cover_art" and "attributes" in r), None)
                    cover_url = f"https://uploads.mangadex.org/covers/{manga_id}/{cover_file}" if cover_file else ""

                    feed_resp = await client.get(f"https://api.mangadex.org/manga/{manga_id}/feed", params={"translatedLanguage[]": ["en"], "order[chapter]": "asc", "limit": 500})
                    episodes = []
                    if feed_resp.status_code == 200:
                        for idx, ch in enumerate(feed_resp.json().get("data", [])):
                            c_attrs = ch.get("attributes", {})
                            c_num = c_attrs.get("chapter") or str(idx + 1)
                            num_val = float(c_num) if c_num.replace(".", "").isdigit() else (idx + 1)
                            episodes.append({
                                "episode_no": idx + 1,
                                "number": str(c_num),
                                "chapter_number": num_val,
                                "title": c_attrs.get("title") or f"Chapter {c_num}",
                                "url": f"https://mangadex.org/chapter/{ch['id']}",
                                "thumbnail": _build_proxy_thumbnail_url(cover_url, f"https://mangadex.org/chapter/{ch['id']}", cover_url),
                                "cover": cover_url,
                                "date": (c_attrs.get("publishAt") or "").split("T")[0],
                                "language": "en"
                            })
                    sorted_eps = _deduplicate_and_sort_episodes(episodes, sort_by="latest")
                    return {
                        "success": True,
                        "series_title": title_str,
                        "title_no": manga_id,
                        "url": f"https://mangadex.org/title/{manga_id}",
                        "series": {"title": title_str, "cover_image": cover_url, "url": f"https://mangadex.org/title/{manga_id}"},
                        "episodes": sorted_eps,
                        "total_episodes": len(sorted_eps)
                    }
        except Exception as e:
            logger.debug(f"[_crawl_specialized_platform] MangaDex crawler notice: {e}")

    return None


async def _crawl_madara_ajax(series_url: str, soup: Any) -> List[Dict[str, Any]]:
    """
    Fetches ALL chapters from WordPress WP-Manga (Madara) sites via AJAX.

    Madara CMS sites (manhuatop.org, manhuaplus.com, mangatx.com, etc.)
    only render the latest 3 chapters in static HTML. The full chapter list
    is returned by a POST to `{series_url}/ajax/chapters/` or via
    wp-admin/admin-ajax.php with action=manga_get_chapters.

    Returns a list of chapter dicts sorted oldest-first.
    """
    import httpx
    from bs4 import BeautifulSoup

    parsed = urlparse(series_url)
    base_origin = f"{parsed.scheme}://{parsed.netloc}"
    clean_url = series_url.rstrip("/")

    # Detect manga post ID from DOM for admin-ajax fallback
    manga_id = None
    if soup:
        holder = soup.select_one("[data-id], #manga-chapters-holder, .manga-chapters-holder, [data-manga]")
        if holder:
            manga_id = holder.get("data-id") or holder.get("data-manga")
        if not manga_id:
            # Try extracting from inline JS: var manga_chapter_id = "123";
            for script in soup.find_all("script"):
                txt = script.string or ""
                m = re.search(r'(?:manga_chapter_id|manga_id|mangaID)\s*[=:]\s*["\']?(\d+)["\']?', txt)
                if m:
                    manga_id = m.group(1)
                    break

    headers = {
        "X-Requested-With": "XMLHttpRequest",
        "Referer": clean_url + "/",
        "Origin": base_origin,
        "Content-Type": "application/x-www-form-urlencoded",
    }

    candidate_endpoints = [
        (f"{clean_url}/ajax/chapters/", {}),
    ]
    if manga_id:
        candidate_endpoints.append(
            (f"{base_origin}/wp-admin/admin-ajax.php",
             {"action": "manga_get_chapters", "manga": manga_id})
        )

    def _parse_madara_chapter_list(html_fragment: str, base_url: str) -> List[Dict[str, Any]]:
        """Parses the HTML fragment returned by the Madara AJAX endpoint."""
        sub = BeautifulSoup(html_fragment, "html.parser")
        chapters = []
        seen = set()

        for li in sub.find_all("li", class_=re.compile(r"wp-manga-chapter|chapter-li|chapter_list", re.I)):
            a = li.find("a", href=True)
            if not a:
                continue
            href = a.get("href", "").strip()
            if not href or href == "#":
                continue
            full_url = urljoin(base_url, href)
            if full_url in seen:
                continue
            seen.add(full_url)

            title_raw = a.get_text(strip=True)
            num_val, _ = _extract_number_and_type_from_text(title_raw)

            # Date is usually in a <span class="chapter-release-date">
            date_el = li.select_one(".chapter-release-date, .post-on, .chapter-date, i")
            date_str = _normalize_date_string(date_el.get_text(strip=True) if date_el else "")

            # Lock icon check
            is_locked = bool(li.find(class_=re.compile(r"lock|coin|paid|vip|fastpass", re.I)))

            chapters.append({
                "title": title_raw or f"Chapter {num_val or len(chapters)+1}",
                "url": full_url,
                "chapter_number": num_val,
                "number": str(int(num_val) if num_val is not None and float(num_val).is_integer() else (num_val or len(chapters)+1)),
                "date": date_str,
                "is_locked": is_locked,
                "language": _extract_language_tag(title_raw),
                "thumbnail": None,
            })

        return chapters

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for endpoint, post_data in candidate_endpoints:
                try:
                    resp = await client.post(endpoint, data=post_data, headers=headers)
                    if resp.status_code == 200 and resp.text and "<li" in resp.text:
                        chapters = _parse_madara_chapter_list(resp.text, series_url)
                        if chapters:
                            logger.info(f"[MadaraAjax] Fetched {len(chapters)} chapters from {endpoint}")
                            return chapters
                except Exception as e:
                    logger.debug(f"[MadaraAjax] Endpoint {endpoint} failed: {e}")
                    continue
    except Exception as e:
        logger.debug(f"[MadaraAjax] AJAX crawl error: {e}")

    return []


async def _crawl_ajax_endpoints(series_url: str, soup: Any) -> List[Dict[str, Any]]:
    """
    General AJAX chapter crawler. Delegates to _crawl_madara_ajax first (covers
    100+ Madara CMS sites), then falls back to generic DOM extraction on
    any HTML fragment endpoint.
    """
    import httpx
    from bs4 import BeautifulSoup

    # Try Madara-specific AJAX first (covers manhuatop, manhuaplus, mangatx, etc.)
    madara_eps = await _crawl_madara_ajax(series_url, soup)
    if madara_eps:
        return madara_eps

    if not soup:
        return []

    manga_id = None
    holder = soup.select_one("[data-id], #manga-chapters-holder, .manga-chapters-holder")
    if holder and holder.get("data-id"):
        manga_id = holder.get("data-id")

    parsed = urlparse(series_url)
    base_origin = f"{parsed.scheme}://{parsed.netloc}"

    headers = {"X-Requested-With": "XMLHttpRequest"}
    endpoints = []
    if manga_id:
        endpoints.append((f"{base_origin}/wp-admin/admin-ajax.php",
                          {"action": "manga_get_chapters", "manga": manga_id}))

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for ep_url, post_data in endpoints:
            try:
                resp = await client.post(ep_url, data=post_data, headers=headers)
                if resp.status_code == 200 and resp.text and "<li" in resp.text:
                    sub_soup = BeautifulSoup(resp.text, "html.parser")
                    eps = _extract_episodes_dynamically(sub_soup, series_url)
                    if eps:
                        return eps
            except Exception:
                continue

    return []


# ═════════════════════════════════════════════════════════════════════════════
# 5. Main Public API Workflow Functions
# ═════════════════════════════════════════════════════════════════════════════

async def scrape_series_episodes(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    bypass_cache: bool = False
) -> Dict[str, Any]:
    """
    Universal Multi-Platform Series & Episode Discovery Coordinator.

    Crawls complete episode list for any comic URL across all platforms
    (Webtoons, MangaDex, Madara CMS, ThemeSphere, Bato, Comick, MangaKakalot, etc.)
    with automatic Cloudflare browser escalation and single-chapter breadcrumb recovery.
    """
    raw_input = (series_url or "").strip()
    if title_no and not raw_input.startswith("http"):
        raw_input = f"https://www.webtoons.com/en/episode/list?title_no={title_no}"

    try:
        # 0. SQLite Delta Cache Check
        if not bypass_cache and raw_input:
            cached = _get_cached_episodes(raw_input)
            if cached and cached.get("success") and len(cached.get("episodes", [])) > 0:
                return cached

        # 1. Specialized Platform Crawler (MangaDex API)
        spec_res = await _crawl_specialized_platform(raw_input)
        if spec_res and spec_res.get("success"):
            _save_cached_episodes(raw_input, spec_res.get("series_title", ""), spec_res)
            return spec_res

        # 2. Resolve Canonical Parent Series URL
        url = UrlNormalizer.resolve_parent_series_url(raw_input) or raw_input
        parsed_query = parse_qs(urlparse(url).query) if url else {}
        detected_title_no = title_no or (parsed_query.get("title_no", [None])[0] if parsed_query else None)

        # 3. Fetch Page via HTTP
        html, status, _ = await HttpFetcher.fetch_html(url)
        access_status = AccessEvaluator.evaluate_response(status, html)

        episodes = []
        seen_urls: Set[str] = set()
        series_info = None

        # If Cloudflare/WAF block or empty, escalate directly to Browser
        if access_status not in (AccessStatus.BOT_CHALLENGE, AccessStatus.RATE_LIMITED) and html:
            soup = DomExtractor.get_soup(html)
            series_info, _ = DomExtractor.extract_metadata(html, url)

            # Dynamic AJAX check
            if soup:
                ajax_eps = await _crawl_ajax_endpoints(url, soup)
                if ajax_eps:
                    episodes.extend(ajax_eps)
                    for e in ajax_eps: seen_urls.add(e["url"])

            # Dynamic DOM Cluster Extraction
            if soup and not episodes:
                first_page_eps = _extract_episodes_dynamically(soup, url)
                episodes.extend(first_page_eps)
                for e in first_page_eps: seen_urls.add(e["url"])

            # 4. Multi-Page Traversal
            if soup and len(episodes) > 0:
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
                    next_eps = _extract_episodes_dynamically(next_soup, next_url)
                    if not next_eps:
                        break
                    for ep in next_eps:
                        if ep["url"] not in seen_urls:
                            seen_urls.add(ep["url"])
                            episodes.append(ep)
                    soup = next_soup
                    page_num += 1

        # 5. Headless Browser Fallback if Cloudflare block or < 2 episodes found
        if len(episodes) <= 1:
            logger.info(f"[scrape_series_episodes] Triggering browser fallback for: {url}")
            browser_html, intercepted_urls, _ = await BrowserFetcher.render_page(
                url,
                auto_scroll=True,
                timeout_seconds=25.0
            )
            if browser_html:
                b_soup = DomExtractor.get_soup(browser_html)
                b_ajax = await _crawl_ajax_endpoints(url, b_soup)
                if b_ajax and len(b_ajax) > len(episodes):
                    episodes = b_ajax
                else:
                    b_eps = _extract_episodes_dynamically(b_soup, url)
                    if len(b_eps) > len(episodes):
                        episodes = b_eps

                # Breadcrumb / Parent Series Link Discovery on Single-Chapter Pages
                if len(episodes) <= 1 and b_soup:
                    parent_anchor = b_soup.select_one("a.breadcrumb-item, .breadcrumbs a, a[rel='up'], a[href*='/series/'], a[href*='/manga/'], a:has-text('All Chapters'), a:has-text('Series')")
                    if parent_anchor and parent_anchor.get("href"):
                        parent_url = urljoin(url, parent_anchor.get("href"))
                        if parent_url != url:
                            logger.info(f"[scrape_series_episodes] Discovered parent series link via breadcrumbs: {parent_url}")
                            p_html, _, _ = await BrowserFetcher.render_page(parent_url, auto_scroll=True)
                            if p_html:
                                p_soup = DomExtractor.get_soup(p_html)
                                p_eps = _extract_episodes_dynamically(p_soup, parent_url)
                                if len(p_eps) > len(episodes):
                                    episodes = p_eps
                                    url = parent_url

                if not series_info or not series_info.title:
                    b_series, _ = DomExtractor.extract_metadata(browser_html, url)
                    if b_series:
                        series_info = b_series

        # 6. Fallback to single chapter entry if only chapter URL was provided and no catalog exists
        if not episodes and raw_input:
            episodes.append({
                "title": (series_info.title or "Chapter 1") if series_info else "Chapter 1",
                "url": raw_input,
                "number": "1",
                "chapter_number": 1.0
            })

        # Format Series Metadata
        series_title = (series_info.title if series_info else None) or "Comic Series"
        series_cover = (series_info.cover_image or series_info.cover if series_info else None) or ""
        series_author = (series_info.author if series_info else None) or "Unknown Author"
        series_genre = (", ".join(series_info.genres) if series_info and series_info.genres else "Webtoon")
        series_desc = (series_info.description if series_info else None) or ""

        formatted_episodes = []
        for idx, ep in enumerate(episodes):
            thmb = ep.get("thumbnail") or series_cover or ""
            proxied_thmb = _build_proxy_thumbnail_url(thmb, ep.get("url") or url, series_cover)

            raw_num = ep.get("number")
            if not raw_num or raw_num == "None":
                num_val = ep.get("chapter_number") or (idx + 1)
                raw_num = str(round(num_val) if isinstance(num_val, (int, float)) and float(num_val).is_integer() else num_val)

            formatted_episodes.append({
                "episode_no": idx + 1,
                "number": str(raw_num),
                "chapter_number": ep.get("chapter_number"),
                "title": ep.get("title") or f"Episode {raw_num}",
                "url": ep.get("url"),
                "thumbnail": proxied_thmb,
                "cover": proxied_thmb,
                "date": ep.get("date") or "",
                "volume": ep.get("volume"),
                "is_locked": ep.get("is_locked", False),
                "language": ep.get("language"),
                "index": idx
            })

        deduped_episodes = _deduplicate_and_sort_episodes(formatted_episodes, sort_by="latest")

        if max_episodes and max_episodes > 0:
            deduped_episodes = deduped_episodes[:max_episodes]

        final_result = {
            "success": True,
            "series_title": series_title,
            "title_no": detected_title_no or title_no,
            "url": url,
            "series": {
                "title": series_title,
                "author": series_author,
                "genre": series_genre,
                "cover_image": _build_proxy_thumbnail_url(series_cover, url) if series_cover else "",
                "description": series_desc,
                "url": url,
            },
            "episodes": deduped_episodes,
            "total_episodes": len(deduped_episodes)
        }

        _save_cached_episodes(raw_input, series_title, final_result)
        return final_result
    except Exception as e:
        logger.error(f"[scrape_series_episodes] Error discovering episodes for {raw_input}: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "series_title": "Unknown Series",
            "title_no": title_no,
            "url": raw_input,
            "series": {
                "title": "Unknown Series",
                "author": "Unknown",
                "genre": "Comic",
                "cover_image": "",
                "description": "",
                "url": raw_input
            },
            "episodes": [],
            "total_episodes": 0
        }


async def scrape_series_episodes_advanced(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    page: int = 1,
    per_page: int = 100,
    include_ratings: bool = True,
    sort_by: str = "latest",
    bypass_cache: bool = False
) -> Dict[str, Any]:
    """Universal advanced series & episode scraper with pagination, ratings, natural sorting, and caching."""
    result = await scrape_series_episodes(
        series_url=series_url,
        title_no=title_no,
        max_episodes=None,
        bypass_cache=bypass_cache
    )

    if not result.get("success"):
        return result

    episodes = result.get("episodes", [])
    episodes = _deduplicate_and_sort_episodes(episodes, sort_by=sort_by)

    if max_episodes:
        episodes = episodes[:max_episodes]

    total_episodes = len(episodes)
    if not per_page or per_page <= 0:
        per_page = total_episodes if total_episodes > 0 else 1

    total_pages = max(1, (total_episodes + per_page - 1) // per_page)
    page = max(1, min(page, total_pages))

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_episodes = episodes[start_idx:end_idx]

    result["episodes"] = paginated_episodes
    result["pagination"] = {
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "total_episodes": total_episodes,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }
    result["sort_by"] = sort_by
    return result


async def scrape_series_episodes_paginated(
    title_no: str,
    max_episodes: Optional[int] = None
) -> Dict[str, Any]:
    """Convenience pagination helper."""
    return await scrape_series_episodes_advanced(
        series_url="",
        title_no=title_no,
        page=1,
        per_page=max_episodes or 100
    )


# ═════════════════════════════════════════════════════════════════════════════
# 6. Batch Scraping & Multi-Series Crawlers
# ═════════════════════════════════════════════════════════════════════════════


async def batch_scrape_series(
    series_list: List[Dict[str, Optional[str]]],
    max_episodes_per_series: int = 50
) -> Dict[str, Any]:
    """Batch crawler for discovering episodes across multiple series URLs."""
    results = []
    for s in series_list:
        url = s.get("url") or ""
        title_no = s.get("title_no")
        res = await scrape_series_episodes(series_url=url, title_no=title_no, max_episodes=max_episodes_per_series)
        results.append(res)
    return {"success": True, "series_results": results, "total_series": len(results)}


async def batch_scrape_chapters_with_checkpoint(
    job_id: str,
    chapter_urls: List[str],
    project_id: Optional[str] = None
) -> Dict[str, Any]:
    """Scrapes a batch of chapter URLs with persistent SQLite checkpointing."""
    from .engine import AdaptiveScraperEngine
    from .cache_manager import ScraperCacheManager

    completed = []
    failed = []

    for idx, chap_url in enumerate(chapter_urls):
        cached_result = ScraperCacheManager.get_cached_chapter_result(chap_url)
        if cached_result and cached_result.success:
            completed.append({
                "url": chap_url,
                "status": "cached",
                "images_count": len(cached_result.images),
                "chapter": cached_result.chapter.model_dump()
            })
            continue

        try:
            res = await AdaptiveScraperEngine.scrape_url(
                url=chap_url,
                project_id=project_id,
                job_id=job_id
            )
            if res.success:
                completed.append({
                    "url": chap_url,
                    "status": "success",
                    "images_count": len(res.images),
                    "chapter": res.chapter.model_dump()
                })
            else:
                failed.append({
                    "url": chap_url,
                    "error": res.error.message if res.error else "Unknown scrape failure"
                })
        except Exception as e:
            failed.append({"url": chap_url, "error": str(e)})

    return {
        "success": len(failed) == 0,
        "job_id": job_id,
        "total_requested": len(chapter_urls),
        "completed_count": len(completed),
        "failed_count": len(failed),
        "completed": completed,
        "failed": failed
    }
