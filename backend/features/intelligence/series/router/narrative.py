"""Narrative Director & Epilogue Audit sub-router for AI Generated Series.

Guarantees 0-cliffhanger epilogue resolution and provides the multi-session pacing timeline.
"""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, HTTPException

from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.services.series_memory_engine import series_memory_engine

router = APIRouter(tags=["AI Series - Narrative & Story Arc"])


@router.get("/{series_id}/timeline")
async def get_series_timeline(series_id: str):
    """Retrieve the multi-session story arc roadmap with pacing roles and climactic beats."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"AI Series '{series_id}' not found.")

    timeline = []
    for s in project.sessions:
        chapters_summary = [
            {
                "chapter_number": c.chapter_number,
                "title": c.title,
                "pacing_role": c.pacing_role,
                "summary": c.summary,
                "is_series_finale": c.is_series_finale,
                "status": c.status.value,
            }
            for c in s.chapters
        ]
        timeline.append({
            "session_number": s.session_number,
            "title": s.title,
            "theme": s.summary,
            "chapters": chapters_summary,
        })

    return {
        "series_id": series_id,
        "title": project.title,
        "total_sessions": project.total_sessions,
        "chapters_per_session": project.chapters_per_session,
        "timeline": timeline,
    }


@router.get("/{series_id}/epilogue-audit")
async def get_epilogue_audit(series_id: str):
    """Verify that all mysteries, enemy threats, and lore threads have 100% complete narrative closure."""
    audit = series_memory_engine.get_epilogue_audit(series_id)
    return audit
