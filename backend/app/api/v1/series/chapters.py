"""Chapters and Sessions sub-router for AI Generated Series.

Handles session hierarchies, chapter retrieval, and chapter-level panel synthesis.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.schemas.series import ChapterSession, SeriesSession
from app.repositories.series import ai_series_repo
from app.services.series.series_orchestrator import series_orchestrator

router = APIRouter(tags=["AI Series - Chapters & Sessions"])


@router.get("/{series_id}/sessions", response_model=List[SeriesSession])
async def list_series_sessions(series_id: str):
    """Retrieve all sessions and nested chapter summaries for an AI Series."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"AI Series '{series_id}' not found.")
    return project.sessions


@router.get("/{series_id}/sessions/{session_number}/chapters/{chapter_number}", response_model=ChapterSession)
async def get_series_chapter(series_id: str, session_number: int, chapter_number: int):
    """Retrieve a specific chapter with all panels, speech bubbles, and kinetic motion data."""
    chapter = ai_series_repo.get_chapter(series_id, session_number, chapter_number)
    if not chapter:
        raise HTTPException(
            status_code=404,
            detail=f"Chapter S{session_number}:C{chapter_number} not found in series '{series_id}'.",
        )
    # If chapter was not generated or has empty panels, synthesize immediately on demand
    if not chapter.panels or len(chapter.panels) == 0:
        chapter = await series_orchestrator.generate_chapter(
            series_id=series_id,
            session_number=session_number,
            chapter_number=chapter_number,
        )
    return chapter


@router.post(
    "/{series_id}/sessions/{session_number}/chapters/{chapter_number}/synthesize",
    response_model=ChapterSession,
    status_code=status.HTTP_200_OK,
)
async def synthesize_chapter(
    series_id: str,
    session_number: int,
    chapter_number: int,
    panel_count: int = Query(8, ge=2, le=30),
    image_model: str = Query(None, description="Optional image model override (e.g. stable-diffusion, flux)"),
):
    """Trigger AI generation for a chapter's panels, speech bubbles, and kinetic video motion."""
    try:
        updated_chapter = await series_orchestrator.generate_chapter(
            series_id=series_id,
            session_number=session_number,
            chapter_number=chapter_number,
            panel_count=panel_count,
            image_model=image_model,
        )
        return updated_chapter
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate chapter: {str(e)}")


@router.post(
    "/{series_id}/sessions/{session_number}/chapters/{chapter_number}/render-images",
    response_model=ChapterSession,
    status_code=status.HTTP_200_OK,
)
async def render_chapter_images_endpoint(
    series_id: str,
    session_number: int,
    chapter_number: int,
    image_model: str = Query("flux-anime", description="Model: flux-anime, turbo, flux, stable-diffusion"),
    force: bool = Query(False, description="Force re-rendering even if cached"),
):
    """Batch render and locally cache all panel images for a chapter using the chosen AI model."""
    from app.services.series.series_image_service import series_image_service
    try:
        chapter = await series_image_service.render_chapter_images(
            series_id=series_id,
            session_number=session_number,
            chapter_number=chapter_number,
            model=image_model,
            force_regenerate=force,
        )
        return chapter
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render chapter images: {str(e)}")


class RenderPanelRequest(BaseModel):
    panel_id: str
    prompt: Optional[str] = None
    image_model: Optional[str] = "flux-anime"
    session_number: int = 1
    chapter_number: int = 1


@router.post("/{series_id}/panels/{panel_id}/render-image")
async def render_single_panel_image(series_id: str, panel_id: str, req: RenderPanelRequest):
    """Render or re-render a single panel image with customized prompt and AI model."""
    from app.services.series.series_image_service import series_image_service
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    chapter = ai_series_repo.get_chapter(series_id, req.session_number, req.chapter_number)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    panel = next((p for p in chapter.panels if (p.panel_id or p.id) == panel_id), None)
    if not panel:
        raise HTTPException(status_code=404, detail="Panel not found")

    prompt = req.prompt or panel.prompt
    fmt = (project.format_type.value if hasattr(project.format_type, "value") else str(project.format_type)).lower()
    w, h = (1024, 576) if "anime" in fmt else ((768, 1024) if ("comic" in fmt or "manga" in fmt) else (768, 1152))

    res = await series_image_service.render_panel_image(
        series_id=series_id,
        panel_id=panel_id,
        prompt=prompt,
        width=w,
        height=h,
        model=req.image_model or "flux-anime",
        force_regenerate=True,
    )

    if res.get("status") == "error":
        err_msg = res.get("error", "Image generation failed")
        status_code = 402 if "402" in str(err_msg) or "Payment" in str(err_msg) else 502
        raise HTTPException(status_code=status_code, detail=err_msg)

    if res.get("image_url"):
        panel.image_url = res["image_url"]
        if req.prompt:
            panel.prompt = req.prompt
        ai_series_repo.update_chapter(series_id, chapter)

    return res

