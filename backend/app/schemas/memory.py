"""Memory and learning schemas for AI Generated Series.

Includes Franchise Canon Continuity, Creator Style Preference Learning (RLHF),
and Generation Feedback tracking for continuous improvement.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CreatorStyleProfile(BaseModel):
    """User-specific artistic and cinematic preferences learned over time."""
    creator_id: str = "default_creator"
    preferred_art_style: str = "manhwa_action_hunter"
    pacing_preference: str = "dynamic"  # cinematic, fast, slow_burn, dynamic
    dialogue_density: str = "balanced"  # minimal, balanced, wordy
    color_grading: str = "vibrant_high_contrast"
    favorite_camera_angles: List[str] = Field(
        default_factory=lambda: ["low_angle_hero", "dramatic_close_up", "dynamic_tilt"]
    )
    vfx_intensity: float = 0.8  # 0.0 to 1.0
    learned_prompt_modifiers: List[str] = Field(default_factory=list)
    bubble_styling_preferences: Dict[str, Any] = Field(
        default_factory=lambda: {
            "font_family": "Bangers",
            "bg_color": "#FFFFFF",
            "text_color": "#111827",
            "border_color": "#000000",
            "border_width": 2,
        }
    )
    total_generations_rated: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FranchiseContinuityMemory(BaseModel):
    """Deep canon and timeline memory for an AI Generated Series."""
    series_id: str
    active_characters: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Character states, current outfits, battle scars, power levels"
    )
    world_rules: List[str] = Field(
        default_factory=list,
        description="Core immutable laws of physics/magic in this universe"
    )
    lore_revelations: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Timeline of revealed secrets, key lore discoveries by chapter"
    )
    unresolved_threads: List[str] = Field(
        default_factory=list,
        description="Mysteries and narrative arcs that must be tied up before finale"
    )
    resolved_threads: List[str] = Field(
        default_factory=list,
        description="Arcs successfully resolved in past chapters"
    )
    canonical_locations: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Key locations, architectural traits, visual references"
    )
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class GenerationFeedbackEvent(BaseModel):
    """User feedback event captured during studio editing (RLHF loop)."""
    feedback_id: str
    series_id: str
    chapter_id: Optional[str] = None
    panel_id: Optional[str] = None
    event_type: str  # bubble_edit, prompt_tweak, panel_reroll, motion_speed_adjust, audio_retake
    original_value: Any = None
    adjusted_value: Any = None
    rating: Optional[int] = None  # 1 to 5 stars
    creator_notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MemoryOptimizationSuggestion(BaseModel):
    """AI self-improvement recommendation based on historical memory."""
    suggestion_id: str
    target_area: str  # prompt_dna, panel_composition, character_consistency, audio_pacing
    recommended_action: str
    reasoning: str
    confidence_score: float = 0.95
