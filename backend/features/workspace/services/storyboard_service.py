"""
backend/features/workspace/services/storyboard_service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for AI storyboard generation and persistence.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from typing import Dict, Any, Optional, List

from app.core.config import GEMINI_MODEL_PRIMARY
from features.platform.jobs import job_manager, JobType, JobStage, JobStatusResponse
from features.platform.scraper.schemas_scraper import GenerateStoryboardOnlyRequest
from database.engine import get_db_connection
from features.workspace.schemas import StoryboardData, StoryboardFrame, StoryboardUpdateRequest
from .storyboard_ai import generate_dynamic_panels, get_programmatic_panels

logger = logging.getLogger("sonikoma.features.workspace.storyboard")

_IN_MEMORY_STORYBOARDS: Dict[str, StoryboardData] = {}


class StoryboardService:
    generate_dynamic_panels = staticmethod(generate_dynamic_panels)
    get_programmatic_panels = staticmethod(get_programmatic_panels)

    @staticmethod
    def create_generation_job(
        body: GenerateStoryboardOnlyRequest,
        user_id: str,
        user_keys: dict
    ) -> JobStatusResponse:
        job = job_manager.create_job(
            job_type=JobType.GENERATE_STORYBOARD,
            user_id=user_id,
            project_id=body.project_id,
            metadata={"url": body.url, "model": body.model}
        )

        async def _storyboard_coro(report_progress):
            report_progress(20.0, JobStage.FETCHING.value)
            report_progress(50.0, JobStage.GENERATING_STORYBOARD.value)
            from features.platform.scraper.services.scraper_service import generate_storyboard_only_service
            result = await generate_storyboard_only_service(
                url=body.url,
                project_id=body.project_id,
                job_id=job.job_id,
                model=body.model or GEMINI_MODEL_PRIMARY,
                narration_style=body.narrationStyle or "long",
                user_id=user_id,
                user_keys=user_keys,
                title=getattr(body, "title", None),
                episode=getattr(body, "episode", None),
                genre=getattr(body, "genre", None),
                author=getattr(body, "author", None),
                cover_image=getattr(body, "cover_image", None),
                synopsis=getattr(body, "synopsis", None)
            )
            report_progress(100.0, JobStage.COMPLETED.value)
            return result

        job_manager.run_in_background(job.job_id, _storyboard_coro)
        return job.to_status_response()

    @staticmethod
    def get_storyboard(project_id: str, chapter_id: str) -> StoryboardData:
        key = f"{project_id}:{chapter_id}"
        if key in _IN_MEMORY_STORYBOARDS:
            return _IN_MEMORY_STORYBOARDS[key]

        # Check SQLite DB or create placeholder
        data = StoryboardData(
            project_id=project_id,
            chapter_id=chapter_id,
            title=f"Storyboard {chapter_id}",
            frames=[],
            total_duration_seconds=0.0
        )
        return data

    @staticmethod
    def save_storyboard(project_id: str, chapter_id: str, update: StoryboardUpdateRequest) -> StoryboardData:
        key = f"{project_id}:{chapter_id}"
        total_duration = sum(f.duration_seconds for f in update.frames)
        data = StoryboardData(
            project_id=project_id,
            chapter_id=chapter_id,
            title=f"Storyboard {chapter_id}",
            frames=update.frames,
            total_duration_seconds=round(total_duration, 2),
            metadata=update.metadata or {}
        )
        _IN_MEMORY_STORYBOARDS[key] = data
        return data


storyboard_service = StoryboardService()

__all__ = [
    "StoryboardService",
    "storyboard_service",
]
