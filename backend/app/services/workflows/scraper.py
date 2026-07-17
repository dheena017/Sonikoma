"""
backend/app/services/workflows/scraper.py
─────────────────────────────────────────────────────────────────────────────
Orchestration and workflow logic for Webtoon scraper. Handles pagination,
batch processing, and advanced episode scraping on top of the base scraper.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional

from services.scraper.scraper import scrape_webtoon_episodes

logger = logging.getLogger("sonikoma.services.workflows.scraper")


async def scrape_webtoon_episodes_advanced(
    series_url: str,
    title_no: Optional[str] = None,
    max_episodes: Optional[int] = None,
    page: int = 1,
    per_page: int = 50,
    include_ratings: bool = True,
    sort_by: str = "latest"
) -> Dict[str, Any]:
    """Advanced episode scraper with pagination, ratings, sorting, and caching."""
    result = await scrape_webtoon_episodes(
        series_url=series_url,
        title_no=title_no,
        max_episodes=None
    )

    if not result.get("success"):
        return result

    episodes = result.get("episodes", [])
    title_no = result.get("title_no")

    if sort_by == "oldest":
        episodes = list(reversed(episodes))
    elif sort_by == "rating" and include_ratings:
        episodes.sort(key=lambda e: e.get("rating") or 0, reverse=True)
    elif sort_by == "likes" and include_ratings:
        episodes.sort(key=lambda e: e.get("likes") or "0", reverse=True)

    if max_episodes:
        episodes = episodes[:max_episodes]

    total_episodes = len(episodes)
    if not per_page or per_page <= 0:
        per_page = total_episodes if total_episodes > 0 else 1

    total_pages = max(1, (total_episodes + per_page - 1) // per_page)
    if page < 1:
        page = 1
    if page > total_pages:
        page = total_pages

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
    """Scrape episodes with built-in pagination handler."""
    all_episodes = []
    page = 1
    per_page = 100
    series_metadata = None

    while True:
        result = await scrape_webtoon_episodes_advanced(
            series_url="",
            title_no=title_no,
            page=page,
            per_page=per_page,
            include_ratings=True
        )

        if not result.get("success"):
            break

        if series_metadata is None:
            series_metadata = result.get("series")

        page_episodes = result.get("episodes", [])
        all_episodes.extend(page_episodes)

        pagination = result.get("pagination", {})
        if max_episodes and len(all_episodes) >= max_episodes:
            all_episodes = all_episodes[:max_episodes]
            break

        if not pagination.get("has_next"):
            break
        page += 1

    return {
        "success": True,
        "series": series_metadata,
        "title_no": title_no,
        "total_episodes": len(all_episodes),
        "episodes": all_episodes,
        "pages_fetched": page - 1
    }


async def batch_scrape_series(
    series_list: List[Dict[str, str]],
    max_episodes_per_series: Optional[int] = 50
) -> Dict[str, Any]:
    """Batch scrape multiple WEBTOON series."""
    results = {
        "total": len(series_list),
        "successful": 0,
        "failed": 0,
        "series": []
    }

    for idx, series_info in enumerate(series_list):
        try:
            result = await scrape_webtoon_episodes(
                series_url=series_info.get("url", ""),
                title_no=series_info.get("title_no"),
                max_episodes=max_episodes_per_series
            )

            if result.get("success"):
                results["successful"] += 1
                results["series"].append({
                    "title_no": result.get("title_no"),
                    "title": result.get("series", {}).get("title"),
                    "total_episodes": result.get("total_episodes"),
                    "episodes": result.get("episodes", [])[:10]
                })
            else:
                results["failed"] += 1
                results["series"].append({
                    "title_no": series_info.get("title_no"),
                    "error": result.get("error")
                })
        except Exception as e:
            results["failed"] += 1
            results["series"].append({
                "title_no": series_info.get("title_no"),
                "error": str(e)
            })
    return results
