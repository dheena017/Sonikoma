"""Character Vault sub-router for AI Generated Series.

Maintains immutable Character DNA profiles, appearance consistency, outfits,
battle scars, and voice assignments.
"""

from __future__ import annotations

from typing import List
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status

from app.schemas.series import CharacterDNA
from app.repositories.series import ai_series_repo
from app.services.series.series_memory_engine import series_memory_engine

router = APIRouter(tags=["AI Series - Character Vault"])


@router.get("/{series_id}/characters", response_model=List[CharacterDNA])
async def list_series_characters(series_id: str):
    """Retrieve all locked Character DNA profiles for an AI Generated Series."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"AI Series '{series_id}' not found.")
    return project.cast


@router.post("/{series_id}/characters", response_model=CharacterDNA, status_code=status.HTTP_201_CREATED)
async def add_series_character(series_id: str, char: CharacterDNA):
    """Add a new character to the series cast vault with visual identity constraints."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"AI Series '{series_id}' not found.")

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

    return char


@router.put("/{series_id}/characters/{character_id}", response_model=CharacterDNA)
async def update_series_character(series_id: str, character_id: str, updated_char: CharacterDNA):
    """Update character visual details, evolving scars, power levels, or voice casting."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"AI Series '{series_id}' not found.")

    found = False
    for idx, c in enumerate(project.cast):
        if c.character_id == character_id:
            project.cast[idx] = updated_char
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail=f"Character '{character_id}' not found in series.")

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

    return updated_char
