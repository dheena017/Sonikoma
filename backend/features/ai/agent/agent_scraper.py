"""
Agent Scraper for comic and webtoon chapter images.

Fetches comic chapter pictures from a web link and saves them locally
so the AI agent can process them.
"""

from typing import List, Optional
import os
import logging
from features.platform.scraper.services.scraper_service import scrape_chapter_service

logger = logging.getLogger("sonikoma.features.ai.agent.scraper")


def _download_file(file_path_or_url: str, destination_folder: str) -> str:
    """Ensures file is accessible locally within the destination folder."""
    if os.path.exists(file_path_or_url):
        return file_path_or_url
    return file_path_or_url


async def download_chapter(
    web_link: str,
    save_folder: str,
    max_pictures: Optional[int] = None
) -> List[str]:
    """Downloads all pictures from a webtoon link and saves them into the agent's work folder."""
    os.makedirs(save_folder, exist_ok=True)
    try:
        scraped_data = await scrape_chapter_service(web_link, save_folder)
        images = scraped_data.get("images", [])
        if max_pictures and len(images) > max_pictures:
            images = images[:max_pictures]
        return [_download_file(img, save_folder) for img in images]
    except Exception as e:
        logger.warning(f"Error scraping chapter from {web_link}: {e}")
        return []


__all__ = ["download_chapter"]
