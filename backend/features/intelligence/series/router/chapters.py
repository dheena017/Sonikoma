"""Chapters and Sessions sub-router for AI Generated Series.

Handles session hierarchies, chapter retrieval, chapter-level panel synthesis,
and high-speed bounded batch image rendering.
"""

from __future__ import annotations

import os
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from features.intelligence.series.schemas import ChapterSession, SeriesSession
from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.services.series_orchestrator import series_orchestrator
from features.intelligence.series.services.series_image_service import series_image_service
from ai_engine.core.orchestrator import AIOrchestrator

logger = logging.getLogger("sonikoma.series.router.chapters")

router = APIRouter(tags=["AI Series - Chapters & Sessions"])


def _enrich_chapter_image_timestamps(series_id: str, chapter: ChapterSession) -> ChapterSession:
    """Ensure every panel's image_url includes the latest file modification timestamp (?v=mtime) from disk."""
    if not chapter or not chapter.panels:
        return chapter
    from database.config import MEDIA_SERIES_IMAGES_DIR
    backend_media_dir = os.path.join(MEDIA_SERIES_IMAGES_DIR, series_id)
    for p in chapter.panels:
        if p.image_url and "/media/series_images/" in p.image_url:
            clean_url = p.image_url.split("?")[0]
            filename = os.path.basename(clean_url)
            disk_path = os.path.join(backend_media_dir, filename)
            if os.path.exists(disk_path):
                mtime = int(os.path.getmtime(disk_path))
                p.image_url = f"{clean_url}?v={mtime}"
    return chapter


@router.get("/{series_id}/sessions", response_model=List[SeriesSession])
async def list_series_sessions(series_id: str):
    """Retrieve all sessions and nested chapter summaries for an AI Series."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Chapters] Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found in database.",
        )
    return project.sessions


@router.get("/{series_id}/sessions/{session_number}/chapters/{chapter_number}", response_model=ChapterSession)
async def get_series_chapter(series_id: str, session_number: int, chapter_number: int):
    """Retrieve a specific chapter with all panels, speech bubbles, and kinetic motion data."""
    chapter = ai_series_repo.get_chapter(series_id, session_number, chapter_number)
    if not chapter:
        logger.error(f"[Chapters] Chapter S{session_number}:C{chapter_number} not found in series '{series_id}'.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chapter S{session_number}:C{chapter_number} not found in series '{series_id}'.",
        )

    # If chapter was not generated or has empty panels, synthesize immediately on demand
    if not chapter.panels or len(chapter.panels) == 0:
        logger.info(f"[Chapters] Chapter S{session_number}:C{chapter_number} is draft without panels. Synthesizing on-demand...")
        chapter = await series_orchestrator.generate_chapter(
            series_id=series_id,
            session_number=session_number,
            chapter_number=chapter_number,
        )

    logger.info(f"[Chapters] Loaded S{session_number}:C{chapter_number} for series '{series_id}' ({len(chapter.panels or [])} panels).")
    return _enrich_chapter_image_timestamps(series_id, chapter)


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
    image_model: Optional[str] = Query(None, description="Optional image model override (e.g. stable-diffusion, flux)"),
):
    """Trigger AI generation for a chapter's panels, speech bubbles, and kinetic video motion."""
    logger.info(f"[Chapters] Synthesizing S{session_number}:C{chapter_number} for series '{series_id}' ({panel_count} panels, model: {image_model or 'auto'})...")
    try:
        updated_chapter = await series_orchestrator.generate_chapter(
            series_id=series_id,
            session_number=session_number,
            chapter_number=chapter_number,
            panel_count=panel_count,
            image_model=image_model,
        )
        logger.info(f"[Chapters] Completed synthesis for S{session_number}:C{chapter_number} ({len(updated_chapter.panels or [])} panels ready).")
        return _enrich_chapter_image_timestamps(series_id, updated_chapter)
    except Exception as e:
        logger.exception(f"[Chapters] Failed to generate chapter S{session_number}:C{chapter_number}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate chapter S{session_number}:C{chapter_number}: {str(e)}",
        )


@router.post(
    "/{series_id}/sessions/{session_number}/chapters/{chapter_number}/render-images",
    response_model=ChapterSession,
    status_code=status.HTTP_200_OK,
)
async def render_chapter_images_endpoint(
    series_id: str,
    session_number: int,
    chapter_number: int,
    image_model: Optional[str] = Query(None, description="Image generation model ID"),
    force: bool = Query(False, description="Force re-rendering even if cached"),
):
    """Batch render and locally cache all panel images for a chapter using the chosen AI model."""
    try:
        resolved_model = image_model or AIOrchestrator.resolve_model_for_task("image_diffusion", "primary")
        chapter = await series_image_service.render_chapter_images(
            series_id=series_id,
            session_number=session_number,
            chapter_number=chapter_number,
            model=resolved_model,
            force_regenerate=force,
        )
        return _enrich_chapter_image_timestamps(series_id, chapter)
    except Exception as e:
        logger.exception(f"[Chapters] Failed to render chapter images S{session_number}:C{chapter_number}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to render chapter images: {str(e)}",
        )


@router.post("/{series_id}/chapters/{chapter_id}/render-batch")
async def render_chapter_batch_by_id(
    series_id: str,
    chapter_id: str,
    concurrency: int = Query(3, ge=1, le=8),
):
    """Render all panels in a chapter using bounded concurrency."""
    chapter = ai_series_repo.get_chapter_by_id(series_id, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail=f"Chapter '{chapter_id}' not found.")

    res = await series_image_service.render_chapter_panels_batch(
        series_id=series_id,
        chapter=chapter,
        concurrency=concurrency,
        save_local=True,
    )
    return res


class RenderPanelRequest(BaseModel):
    panel_id: str
    prompt: Optional[str] = None
    image_model: Optional[str] = None
    session_number: int = 1
    chapter_number: int = 1


@router.post("/{series_id}/panels/{panel_id}/render-image")
async def render_single_panel_image(series_id: str, panel_id: str, req: RenderPanelRequest):
    """Render or re-render a single panel image with customized prompt and AI model."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Chapters] Series '{series_id}' not found.")
        raise HTTPException(status_code=404, detail="Project not found")

    chapter = ai_series_repo.get_chapter(series_id, req.session_number, req.chapter_number)
    if not chapter:
        logger.error(f"[Chapters] Chapter S{req.session_number}:C{req.chapter_number} not found.")
        raise HTTPException(status_code=404, detail="Chapter not found")

    panel = next((p for p in chapter.panels if (p.panel_id or p.id) == panel_id), None)
    if not panel:
        logger.error(f"[Chapters] Panel '{panel_id}' not found.")
        raise HTTPException(status_code=404, detail="Panel not found")

    prompt = req.prompt or panel.prompt
    fmt = (project.format_type.value if hasattr(project.format_type, "value") else str(project.format_type)).lower()
    w, h = (1024, 576) if "anime" in fmt else ((768, 1024) if ("comic" in fmt or "manga" in fmt) else (768, 1152))

    resolved_model = req.image_model or AIOrchestrator.resolve_model_for_task("image_diffusion", "primary")
    res = await series_image_service.render_panel_image(
        series_id=series_id,
        panel=panel,
        panel_id=panel_id,
        prompt=prompt,
        width=w,
        height=h,
        model=resolved_model,
        force_regenerate=True,
    )

    if isinstance(res, dict) and res.get("status") == "error":
        err_msg = res.get("error", "Image generation failed")
        status_code = 402 if "402" in str(err_msg) or "Payment" in str(err_msg) else 502
        raise HTTPException(status_code=status_code, detail=err_msg)

    if isinstance(res, dict) and res.get("image_url"):
        panel.image_url = res["image_url"]
        if req.prompt:
            panel.prompt = req.prompt
        ai_series_repo.update_chapter(series_id, chapter)

    return res
