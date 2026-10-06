"""
backend/features/workspace/services/viewer_service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for comic chapter pages retrieval and reading progress tracking.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Dict, Any, List, Optional

from app.core.config import STORAGE_DIR
from database.engine import get_db_connection
from features.workspace.schemas import (
    ViewerChapterResponse,
    ViewerPage,
    ViewerProgressUpdate,
    ViewerProgressResponse,
)

logger = logging.getLogger("sonikoma.features.workspace.viewer")

_READING_PROGRESS: Dict[str, Dict[str, Any]] = {}


class ViewerService:
    @staticmethod
    def get_chapter_pages(project_id: str, chapter_id: str) -> ViewerChapterResponse:
        """Retrieves ordered chapter pages from filesystem or database."""
        pages: List[ViewerPage] = []
        chapter_title = f"Chapter {chapter_id}"

        # 1. Check local storage folder for scraped pages
        chapter_dir = os.path.join(STORAGE_DIR, "projects", project_id, "chapters", chapter_id)
        if os.path.exists(chapter_dir):
            file_names = sorted(
                [f for f in os.listdir(chapter_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
            )
            for idx, fn in enumerate(file_names):
                rel_url = f"/api/v1/storage/projects/{project_id}/chapters/{chapter_id}/{fn}"
                pages.append(ViewerPage(index=idx + 1, image_url=rel_url))

        # Fallback to demo pages if directory is empty
        if not pages:
            pages = [
                ViewerPage(index=1, image_url=f"/api/v1/images/placeholder?text=Page+1"),
                ViewerPage(index=2, image_url=f"/api/v1/images/placeholder?text=Page+2"),
            ]

        return ViewerChapterResponse(
            project_id=project_id,
            chapter_id=chapter_id,
            chapter_title=chapter_title,
            total_pages=len(pages),
            reading_mode="webtoon",
            pages=pages
        )

    @staticmethod
    def get_progress(user_id: str, project_id: str, chapter_id: str) -> ViewerProgressResponse:
        key = f"{user_id}:{project_id}:{chapter_id}"
        prog = _READING_PROGRESS.get(key, {
            "current_page_index": 0,
            "scroll_offset_percent": 0.0,
            "completed": False
        })
        return ViewerProgressResponse(
            success=True,
            project_id=project_id,
            chapter_id=chapter_id,
            **prog
        )

    @staticmethod
    def save_progress(user_id: str, project_id: str, chapter_id: str, update: ViewerProgressUpdate) -> ViewerProgressResponse:
        key = f"{user_id}:{project_id}:{chapter_id}"
        data = {
            "current_page_index": update.current_page_index,
            "scroll_offset_percent": update.scroll_offset_percent,
            "completed": update.completed
        }
        _READING_PROGRESS[key] = data
        return ViewerProgressResponse(
            success=True,
            project_id=project_id,
            chapter_id=chapter_id,
            **data
        )


viewer_service = ViewerService()

__all__ = [
    "ViewerService",
    "viewer_service",
]
