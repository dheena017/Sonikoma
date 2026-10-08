"""Narrative Director & Epilogue Audit sub-router for AI Generated Series.

Guarantees 0-cliffhanger epilogue resolution and provides the multi-session pacing timeline.
"""

from __future__ import annotations

import logging
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status

from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.services.series_memory_engine import series_memory_engine

logger = logging.getLogger("sonikoma.series.router.narrative")

router = APIRouter(tags=["AI Series - Narrative & Story Arc"])


@router.get("/{series_id}/timeline")
async def get_series_timeline(series_id: str):
    """Retrieve the multi-session story arc roadmap with pacing roles and climactic beats."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Narrative] Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found in database.",
        )

    timeline = []
    total_chapters_count = 0
    completed_chapters_count = 0

    for s in project.sessions:
        chapters_summary = []
        for c in s.chapters:
            total_chapters_count += 1
            st = c.status.value if hasattr(c.status, "value") else str(c.status)
            if st.lower() in ("completed", "projectstatus.completed") or len(c.panels) > 0:
                completed_chapters_count += 1

            chapters_summary.append({
                "chapter_id": c.chapter_id or c.id,
                "chapter_number": c.chapter_number,
                "title": c.title,
                "pacing_role": c.pacing_role,
                "summary": c.summary or c.synopsis,
                "is_series_finale": c.is_series_finale,
                "status": st,
                "panel_count": len(c.panels),
                "progress_percent": c.progress_percent if hasattr(c, "progress_percent") else (100.0 if len(c.panels) > 0 else 0.0),
            })

        timeline.append({
            "session_number": s.session_number,
            "title": s.title,
            "theme": s.summary,
            "chapters": chapters_summary,
        })

    progress_percent = round((completed_chapters_count / max(1, total_chapters_count)) * 100, 1)

    return {
        "series_id": series_id,
        "title": project.title,
        "format_type": project.format_type.value if hasattr(project.format_type, "value") else str(project.format_type),
        "art_style": project.art_style.value if hasattr(project.art_style, "value") else str(project.art_style),
        "total_sessions": project.total_sessions,
        "chapters_per_session": project.chapters_per_session,
        "total_chapters": total_chapters_count,
        "completed_chapters": completed_chapters_count,
        "overall_progress_percent": progress_percent,
        "timeline": timeline,
    }


@router.get("/{series_id}/epilogue-audit")
async def get_epilogue_audit(series_id: str):
    """Verify that all mysteries, enemy threats, and lore threads have 100% complete narrative closure."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Narrative] Epilogue audit failed: Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found in database.",
        )

    audit = series_memory_engine.get_epilogue_audit(series_id)
    audit["title"] = project.title
    return audit
