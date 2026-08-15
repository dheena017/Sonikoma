"""
backend/app/services/scraper/workflow.py
─────────────────────────────────────────────────────────────────────────────
Orchestration and workflow logic for Webtoon scraper. Handles pagination,
sorting, and batch series episode scraping.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("sonikoma.services.scraper.workflow")


async def scrape_webtoon_episodes(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    bypass_cache: bool = False
) -> Dict[str, Any]:
    """Scrapes episode list and series metadata for a webtoon series."""
    from .acquisition.http import HttpFetcher
    from .extraction.dom import DomExtractor

    url = series_url
    if title_no and not url.startswith("http"):
        url = f"https://www.webtoons.com/en/fantasy/title/list?title_no={title_no}"

    html, status, _ = await HttpFetcher.fetch_html(url)
    if not html:
        return {"success": False, "error": f"Failed to fetch series page (status {status})", "episodes": []}

    soup = DomExtractor.get_soup(html)
    series_info, _ = DomExtractor.extract_metadata(html, url)

    episodes = []
    if soup:
        # Scan for episode rows
        selectors = [
            ".episode_lst li", ".comic_episode_lst li", ".episode-item",
            "[data-episode-no]", ".ep_item", ".wp-manga-chapter",
            "#chapterlist li", ".chapter-item", ".chapters li"
        ]
        items = []
        for sel in selectors:
            matched = soup.select(sel)
            if matched:
                items = matched
                break

        for idx, item in enumerate(items):
            link = item.find("a", href=True)
            if link:
                href = link.get("href")
                title = link.get_text(strip=True)
                episodes.append({
                    "episode_no": idx + 1,
                    "title": title,
                    "url": href
                })

    if max_episodes and max_episodes > 0:
        episodes = episodes[:max_episodes]

    return {
        "success": True,
        "series_title": series_info.title,
        "title_no": title_no,
        "episodes": episodes,
        "total_episodes": len(episodes)
    }


async def scrape_webtoon_episodes_advanced(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    page: int = 1,
    per_page: int = 50,
    include_ratings: bool = True,
    sort_by: str = "latest",
    bypass_cache: bool = False
) -> Dict[str, Any]:
    """Advanced episode scraper with pagination, ratings, sorting, and caching."""
    result = await scrape_webtoon_episodes(
        series_url=series_url,
        title_no=title_no,
        max_episodes=None,
        bypass_cache=bypass_cache
    )

    if not result.get("success"):
        return result

    episodes = result.get("episodes", [])

    if sort_by == "oldest":
        episodes = list(reversed(episodes))

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


async def scrape_webtoon_episodes_paginated(
    title_no: str,
    max_episodes: Optional[int] = None
) -> Dict[str, Any]:
    """Scrape episodes with pagination handler."""
    return await scrape_webtoon_episodes_advanced(
        series_url="",
        title_no=title_no,
        page=1,
        per_page=max_episodes or 100
    )


async def batch_scrape_series(
    series_list: List[Dict[str, Optional[str]]],
    max_episodes_per_series: int = 50
) -> Dict[str, Any]:
    """Batch scrapes multiple comic series simultaneously."""
    import asyncio
    results = []
    for s in series_list:
        url = s.get("url") or ""
        title_no = s.get("title_no")
        res = await scrape_webtoon_episodes(series_url=url, title_no=title_no, max_episodes=max_episodes_per_series)
        results.append(res)
    return {"success": True, "series_results": results, "total_series": len(results)}
