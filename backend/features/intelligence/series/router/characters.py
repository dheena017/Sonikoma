"""Character Vault sub-router for AI Generated Series.

Maintains immutable Character DNA profiles, appearance consistency, outfits,
battle scars, voice assignments, and vocal auditions.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from features.intelligence.series.schemas import CharacterDNA
from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.services.series_memory_engine import series_memory_engine
from features.intelligence.series.services.series_audio_service import series_audio_service

logger = logging.getLogger("sonikoma.series.router.characters")

router = APIRouter(tags=["AI Series - Character Vault"])


class CharacterAuditionRequest(BaseModel):
    sample_text: Optional[str] = Field(None, description="Optional dialogue audition line")


@router.get("/{series_id}/characters", response_model=List[CharacterDNA])
async def list_series_characters(series_id: str):
    """Retrieve all locked Character DNA profiles for an AI Generated Series."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Characters] Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found in database.",
        )
    return project.cast


@router.post("/{series_id}/characters", response_model=CharacterDNA, status_code=status.HTTP_201_CREATED)
async def add_series_character(series_id: str, char: CharacterDNA):
    """Add a new character to the series cast vault with visual identity constraints."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Characters] Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found in database.",
        )

    if not char.character_id:
        char.character_id = f"char_{uuid4().hex[:6]}"

    project.cast.append(char)
    ai_series_repo.update_project(project)

    # Sync to memory engine
    series_memory_engine.update_character_state(
        series_id=series_id,
        character_name=char.name,
        state_updates={
            "role": char.role,
            "current_outfit": char.clothing_palette,
            "scars": ", ".join(char.signature_traits),
        },
    )

    logger.info(f"[Characters] Added character '{char.name}' ({char.character_id}) to series '{series_id}'.")
    return char


@router.put("/{series_id}/characters/{character_id}", response_model=CharacterDNA)
async def update_series_character(series_id: str, character_id: str, updated_char: CharacterDNA):
    """Update character visual details, evolving scars, power levels, or voice casting."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Characters] Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found in database.",
        )

    found = False
    for idx, c in enumerate(project.cast):
        if c.character_id == character_id or c.id == character_id:
            updated_char.character_id = character_id
            project.cast[idx] = updated_char
            found = True
            break

    if not found:
        logger.error(f"[Characters] Character '{character_id}' not found in series '{series_id}'.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Character '{character_id}' not found in series '{series_id}'.",
        )

    ai_series_repo.update_project(project)

    # Sync to memory engine
    series_memory_engine.update_character_state(
        series_id=series_id,
        character_name=updated_char.name,
        state_updates={
            "role": updated_char.role,
            "current_outfit": updated_char.clothing_palette,
            "scars": ", ".join(updated_char.signature_traits),
        },
    )

    logger.info(f"[Characters] Updated character '{updated_char.name}' ({character_id}) in series '{series_id}'.")
    return updated_char


@router.delete("/{series_id}/characters/{character_id}", status_code=status.HTTP_200_OK)
async def delete_series_character(series_id: str, character_id: str):
    """Remove a character from the series cast vault."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Characters] Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found in database.",
        )

    initial_count = len(project.cast)
    project.cast = [c for c in project.cast if c.character_id != character_id and c.id != character_id]

    if len(project.cast) == initial_count:
        logger.error(f"[Characters] Character '{character_id}' not found for deletion in series '{series_id}'.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Character '{character_id}' not found in series '{series_id}'.",
        )

    ai_series_repo.update_project(project)
    logger.info(f"[Characters] Deleted character '{character_id}' from series '{series_id}'.")
    return {"status": "success", "message": f"Character '{character_id}' deleted successfully."}


@router.post("/{series_id}/characters/{character_id}/audition")
async def audition_character(series_id: str, character_id: str, req: Optional[CharacterAuditionRequest] = None):
    """Generate an on-demand vocal audition preview for a character."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail="Series not found.")

    char = next((c for c in project.cast if c.character_id == character_id or c.id == character_id), None)
    if not char:
        raise HTTPException(status_code=404, detail=f"Character '{character_id}' not found.")

    sample_text = req.sample_text if req and req.sample_text else f"Greetings! I am {char.name}. Prepare yourself for our journey."
    try:
        audition_res = await series_audio_service.audition_character_voice(
            character_name=char.name,
            gender=char.gender or "male",
            role=char.role or "protagonist",
            sample_text=sample_text,
        )
        return audition_res
    except Exception as e:
        logger.exception(f"[Characters] Vocal audition failed for '{char.name}': {e}")
        raise HTTPException(status_code=500, detail=f"Audition generation failed: {str(e)}")
