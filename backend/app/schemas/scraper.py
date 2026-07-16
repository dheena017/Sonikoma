"""
backend/app/schemas/scraper.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for scraper.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional, Literal, Union
from datetime import datetime

class ScrapeImagesRequest(BaseModel):
    url: str
    source: Optional[str] = None
    bypass_cache: Optional[bool] = True
    smart_slice: Optional[bool] = True
    title: Optional[str] = None
    episode: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None
    project_id: Optional[str] = None
    scrape_only: Optional[bool] = False


class GenerateStoryboardOnlyRequest(BaseModel):
    url: str
    project_id: str
    model: Optional[str] = "gemini-2.5-flash"
    narrationStyle: Optional[str] = "long"
    title: Optional[str] = None
    episode: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None


class GenerateStoryboardRequest(BaseModel):
    url: str
    episode_id: Optional[str] = None
    panels: Optional[List[Dict[str, Any]]] = None
    custom_background_video: Optional[str] = None
    model: Optional[str] = "gemini-2.5-flash"
    bypass_cache: Optional[bool] = True
    narrationStyle: Optional[str] = "long"
    title: Optional[str] = None
    episode: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None


class ProcessUrlRequest(BaseModel):
    url: str


class SaveScrapedImagesRequest(BaseModel):
    url: str
    images: List[str]


class ScrapeEpisodesRequest(BaseModel):
    url: Optional[str] = None
    title_no: Optional[str] = None
    max_episodes: Optional[int] = None


class ScrapeEpisodesAdvancedRequest(BaseModel):
    url: Optional[str] = None
    title_no: Optional[str] = None
    max_episodes: Optional[int] = None
    page: Optional[int] = 1
    include_ratings: Optional[bool] = True
    sort_by: Optional[str] = "latest"  # latest, oldest, rating, likes


class BatchScrapeSeriesRequest(BaseModel):
    series: List[Dict[str, Optional[str]]]
    max_episodes_per_series: Optional[int] = 50

