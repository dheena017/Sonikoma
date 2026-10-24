"""
AI Series Studio Domain Module.
"""

from .story_planner import plan_story_arc
from .chapter_writer import write_chapter
from .panel_prompts import make_panel_prompts
from .image_generator import make_panel_image
from .voice_dubber import dub_chapter_voices
from .series_memory import save_series_memory
from .chapter_builder import build_full_chapter
from .repositories import AISeriesRepository

from fastapi import APIRouter

ai_series_master_router = APIRouter()

__all__ = [
    "plan_story_arc",
    "write_chapter",
    "make_panel_prompts",
    "make_panel_image",
    "dub_chapter_voices",
    "save_series_memory",
    "build_full_chapter",
    "AISeriesRepository",
    "ai_series_master_router",
]

