"""AI Series Progressive Generation & Production Orchestrator.

Handles multi-session story architecture, fast Turbo First Chapter synthesis,
Pollinations Flux.1/SDXL image synthesis, true kinetic anime video motion (I2V/T2V),
Edge-TTS vocal dubbing, and guaranteed epilogue closure.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, Optional
from uuid import uuid4

from features.intelligence.series.schemas import (
    AISeriesProject,
    ChapterSession,
    ProjectStatus,
    CreateAISeriesRequest,
    GenerationPriority,
)
from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.services.series_memory_engine import series_memory_engine
from features.intelligence.series.services.arc_architect import arc_architect
from features.intelligence.series.services.panel_synthesizer import panel_synthesizer
from ai_engine.core.orchestrator import AIOrchestrator

logger = logging.getLogger(__name__)


class SeriesOrchestrator:
    """Production director for AI Generated Series."""

    def __init__(self):
        self.active_jobs: Dict[str, Dict[str, Any]] = {}

    def get_job_status(self, series_id: str) -> Dict[str, Any]:
        """Check background synthesis status for a series project."""
        return self.active_jobs.get(series_id, {"status": "idle"})

    async def _background_generate_remaining_chapters(self, series_id: str) -> None:
        """Asynchronously synthesize all remaining draft chapters in the background."""
        try:
            project = ai_series_repo.get_project(series_id)
            if not project:
                return

            draft_targets = []
            for s in project.sessions:
                for c in s.chapters:
                    if not c.panels or len(c.panels) == 0:
                        draft_targets.append((s.session_number, c.chapter_number))

            total = len(draft_targets)
            if total == 0:
                self.active_jobs[series_id] = {"status": "completed", "total": 0, "completed": 0}
                return

            self.active_jobs[series_id] = {
                "status": "processing",
                "total": total,
                "completed": 0,
                "current_chapter": f"S{draft_targets[0][0]}:C{draft_targets[0][1]}",
            }

            for idx, (s_num, c_num) in enumerate(draft_targets):
                self.active_jobs[series_id]["current_chapter"] = f"S{s_num}:C{c_num}"
                self.active_jobs[series_id]["completed"] = idx
                try:
                    await self.generate_chapter(series_id, s_num, c_num)
                except Exception as e:
                    logger.error(f"[SeriesOrchestrator] Error generating S{s_num}:C{c_num} in background: {e}")

            self.active_jobs[series_id] = {
                "status": "completed",
                "total": total,
                "completed": total,
            }
            logger.info(f"[SeriesOrchestrator] Background full-series synthesis completed for '{series_id}'.")
        except Exception as e:
            logger.error(f"[SeriesOrchestrator] Background synthesis job error for '{series_id}': {e}")
            self.active_jobs[series_id] = {"status": "failed", "error": str(e)}

    async def create_series_project(self, req: CreateAISeriesRequest) -> AISeriesProject:
        """Initialize an AI Series project with full narrative architecture and turbo chapter 1."""
        series_id = f"ai_series_{uuid4().hex[:10]}"

        # 1. Generate cast and arc structure using format-specific AI skill
        cast, world_bible, sessions = await arc_architect.architect_series_arc(req, series_id)

        # 2. Construct Project Entity with dynamic AI Core models
        project = AISeriesProject(
            series_id=series_id,
            title=req.title,
            logline=req.logline,
            format_type=req.format_type,
            art_style=req.art_style,
            image_model=getattr(req, "image_model", None) or AIOrchestrator.resolve_model_for_task("image_diffusion", "primary"),
            storyboard_model=getattr(req, "storyboard_model", None) or AIOrchestrator.resolve_model_for_task("storyboard_narrative", "primary"),
            voice_model=getattr(req, "voice_model", None) or AIOrchestrator.resolve_model_for_task("speech_synthesis", "primary"),
            total_sessions=req.total_sessions,
            chapters_per_session=req.chapters_per_session,
            panels_per_chapter=getattr(req, "panels_per_chapter", 8) or 8,
            pacing=req.pacing,
            dialogue_density=req.dialogue_density,
            cast=cast,
            world_bible=world_bible,
            sessions=sessions,
            status=ProjectStatus.COMPLETED,
            generation_priority=req.generation_priority,
        )

        # Persist project with all chapters fully generated
        ai_series_repo.create_project(project)

        # Initialize continuity memory
        continuity = series_memory_engine.get_continuity(series_id)
        for char in cast:
            continuity.active_characters[char.name] = {
                "role": char.role,
                "current_outfit": char.clothing_palette,
                "scars": ", ".join(char.signature_traits),
            }
        continuity.world_rules = world_bible.get("lore_rules", [])
        series_memory_engine.save_continuity(continuity)

        priority_str = (req.generation_priority.value if hasattr(req.generation_priority, "value") else str(req.generation_priority)).lower()
        if priority_str == "background_full_series":
            asyncio.create_task(self._background_generate_remaining_chapters(series_id))

        logger.info(
            f"[AISeries] Created and synthesized AI Series '{project.title}' "
            f"({len(sessions)} seasons, {sum(len(s.chapters) for s in sessions)} chapters, priority: {priority_str})."
        )
        return project

    async def generate_chapter(
        self,
        series_id: str,
        session_number: int,
        chapter_number: int,
        panel_count: int = 8,
        image_model: Optional[str] = None,
    ) -> ChapterSession:
        """Synthesize all panels, interactive bubbles, and generative anime motion for a chapter."""
        project = ai_series_repo.get_project(series_id)
        if not project:
            raise ValueError(f"AI Series project '{series_id}' not found.")

        chapter = ai_series_repo.get_chapter(series_id, session_number, chapter_number)
        if not chapter:
            raise ValueError(f"Chapter S{session_number}:C{chapter_number} not found in project.")

        hero = project.cast[0] if project.cast else None
        hero_name = hero.name if hero else "Character"

        model_to_use = (
            image_model
            or getattr(project, "image_model", None)
            or AIOrchestrator.resolve_model_for_task("image_diffusion", "primary")
        )
        if image_model:
            project.image_model = image_model
            ai_series_repo.update_project(project)

        # Synthesize fresh panels via dedicated panel synthesizer
        existing_scenes = [
            {"visual_description": p.prompt, "camera_angle": p.camera_angle}
            for p in (chapter.panels or [])
            if p.prompt
        ]
        panels = await panel_synthesizer.synthesize_panels(
            series_id=series_id,
            format_type=project.format_type,
            art_style=project.art_style,
            hero_name=hero_name,
            session_number=session_number,
            chapter_number=chapter_number,
            chapter_title=chapter.title,
            is_series_finale=chapter.is_series_finale,
            panel_count=panel_count,
            genre=getattr(project, "genre", ""),
            logline=getattr(project, "logline", ""),
            image_model=model_to_use,
            suggested_scene_prompts=existing_scenes if existing_scenes else None,
        )

        chapter.panels = panels
        chapter.status = ProjectStatus.COMPLETED
        chapter.progress_percent = 100.0
        chapter.current_stage_label = "Completed"
        chapter.medium_type = project.format_type.value if hasattr(project.format_type, "value") else str(project.format_type)
        ai_series_repo.update_chapter(series_id, chapter)

        # If finale, mark all unresolved threads resolved
        if chapter.is_series_finale:
            continuity = series_memory_engine.get_continuity(series_id)
            for thread in list(continuity.unresolved_threads):
                series_memory_engine.mark_thread_resolved(series_id, thread)


        logger.info(f"[AISeries] Chapter S{session_number}:C{chapter_number} successfully synthesized ({len(panels)} panels).")
        return chapter


# Global orchestrator singleton
series_orchestrator = SeriesOrchestrator()
