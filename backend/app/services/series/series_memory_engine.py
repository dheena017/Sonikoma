"""AI Series Memory & Continuous Improvement Engine.

Maintains persistent franchise canon continuity, tracks character evolutions/scars,
learns creator artistic preferences from editing feedback, and optimizes future prompts.
"""

from __future__ import annotations

import json
import logging
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from app.schemas.memory import (
    CreatorStyleProfile,
    FranchiseContinuityMemory,
    GenerationFeedbackEvent,
    MemoryOptimizationSuggestion,
)

logger = logging.getLogger(__name__)


class SeriesMemoryEngine:
    """Persistent memory engine for AI Generated Series continuity and creator RLHF."""

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            # Default to Sonikoma runtime data directory
            base_dir = Path(__file__).resolve().parent.parent.parent.parent / "data"
            base_dir.mkdir(parents=True, exist_ok=True)
            self.db_path = str(base_dir / "series_memory.db")
        else:
            self.db_path = db_path
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Create tables for style profiles, franchise continuity, and feedback logs."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # 1. Creator Style Profile
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS creator_style_profiles (
                    creator_id TEXT PRIMARY KEY,
                    data_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            # 2. Franchise Continuity Memory
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS franchise_continuity (
                    series_id TEXT PRIMARY KEY,
                    data_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            # 3. Generation Feedback Events
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS generation_feedback (
                    feedback_id TEXT PRIMARY KEY,
                    series_id TEXT NOT NULL,
                    chapter_id TEXT,
                    panel_id TEXT,
                    event_type TEXT NOT NULL,
                    original_value TEXT,
                    adjusted_value TEXT,
                    rating INTEGER,
                    creator_notes TEXT,
                    timestamp TEXT NOT NULL
                )
                """
            )
            conn.commit()

    # ---------------------------------------------------------
    # Creator Style Learning (RLHF)
    # ---------------------------------------------------------

    def get_creator_style(self, creator_id: str = "default_creator") -> CreatorStyleProfile:
        """Retrieve creator style profile or create a fresh one."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT data_json FROM creator_style_profiles WHERE creator_id = ?",
                (creator_id,),
            )
            row = cursor.fetchone()
            if row:
                data = json.loads(row["data_json"])
                return CreatorStyleProfile(**data)
            
            # Default profile
            default_profile = CreatorStyleProfile(creator_id=creator_id)
            self.save_creator_style(default_profile)
            return default_profile

    def save_creator_style(self, profile: CreatorStyleProfile) -> None:
        """Persist updated creator style profile."""
        profile.updated_at = datetime.utcnow()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO creator_style_profiles (creator_id, data_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(creator_id) DO UPDATE SET
                    data_json = excluded.data_json,
                    updated_at = excluded.updated_at
                """,
                (profile.creator_id, profile.model_dump_json(), profile.updated_at.isoformat()),
            )
            conn.commit()

    # ---------------------------------------------------------
    # Franchise Continuity Memory
    # ---------------------------------------------------------

    def get_continuity(self, series_id: str) -> FranchiseContinuityMemory:
        """Retrieve continuity and lore memory for an AI Generated Series."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT data_json FROM franchise_continuity WHERE series_id = ?",
                (series_id,),
            )
            row = cursor.fetchone()
            if row:
                data = json.loads(row["data_json"])
                return FranchiseContinuityMemory(**data)

            default_continuity = FranchiseContinuityMemory(series_id=series_id)
            self.save_continuity(default_continuity)
            return default_continuity

    def save_continuity(self, continuity: FranchiseContinuityMemory) -> None:
        """Save canon continuity state."""
        continuity.updated_at = datetime.utcnow()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO franchise_continuity (series_id, data_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(series_id) DO UPDATE SET
                    data_json = excluded.data_json,
                    updated_at = excluded.updated_at
                """,
                (continuity.series_id, continuity.model_dump_json(), continuity.updated_at.isoformat()),
            )
            conn.commit()

    def update_character_state(
        self,
        series_id: str,
        character_name: str,
        state_updates: Dict[str, Any],
    ) -> FranchiseContinuityMemory:
        """Record injury, wardrobe change, or power level evolution for a character."""
        continuity = self.get_continuity(series_id)
        current = continuity.active_characters.get(character_name, {})
        current.update(state_updates)
        current["last_updated"] = datetime.utcnow().isoformat()
        continuity.active_characters[character_name] = current
        self.save_continuity(continuity)
        return continuity

    def add_lore_revelation(
        self,
        series_id: str,
        chapter_number: int,
        revelation: str,
        lore_tags: Optional[List[str]] = None,
    ) -> FranchiseContinuityMemory:
        """Add a canon lore event or world rule reveal."""
        continuity = self.get_continuity(series_id)
        continuity.lore_revelations.append({
            "chapter_number": chapter_number,
            "revelation": revelation,
            "tags": lore_tags or [],
            "timestamp": datetime.utcnow().isoformat(),
        })
        self.save_continuity(continuity)
        return continuity

    def record_unresolved_thread(self, series_id: str, mystery_text: str) -> None:
        """Register a mystery/sub-plot that MUST be resolved in the final epilogue."""
        continuity = self.get_continuity(series_id)
        if mystery_text not in continuity.unresolved_threads:
            continuity.unresolved_threads.append(mystery_text)
            self.save_continuity(continuity)

    def mark_thread_resolved(self, series_id: str, mystery_text: str) -> None:
        """Mark a sub-plot or mystery as fully resolved."""
        continuity = self.get_continuity(series_id)
        if mystery_text in continuity.unresolved_threads:
            continuity.unresolved_threads.remove(mystery_text)
        if mystery_text not in continuity.resolved_threads:
            continuity.resolved_threads.append(mystery_text)
        self.save_continuity(continuity)

    # ---------------------------------------------------------
    # Feedback & Adaptive Prompt Optimization
    # ---------------------------------------------------------

    def record_feedback(self, event: GenerationFeedbackEvent) -> None:
        """Record an interactive user adjustment to adaptively learn."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO generation_feedback (
                    feedback_id, series_id, chapter_id, panel_id, event_type,
                    original_value, adjusted_value, rating, creator_notes, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event.feedback_id,
                    event.series_id,
                    event.chapter_id,
                    event.panel_id,
                    event.event_type,
                    json.dumps(event.original_value) if event.original_value is not None else None,
                    json.dumps(event.adjusted_value) if event.adjusted_value is not None else None,
                    event.rating,
                    event.creator_notes,
                    event.timestamp.isoformat(),
                ),
            )
            conn.commit()

        # Adapt creator style profile if applicable
        self._adapt_profile_from_feedback(event)

    def _adapt_profile_from_feedback(self, event: GenerationFeedbackEvent) -> None:
        """Self-optimizing feedback loop that updates creator style profile."""
        profile = self.get_creator_style()
        if event.rating is not None:
            profile.total_generations_rated += 1

        if event.event_type == "bubble_edit" and isinstance(event.adjusted_value, dict):
            # Learn preferred typography or colors
            for key in ["font_family", "bg_color", "text_color", "border_color"]:
                if key in event.adjusted_value:
                    profile.bubble_styling_preferences[key] = event.adjusted_value[key]

        elif event.event_type == "prompt_tweak" and isinstance(event.adjusted_value, str):
            # Extract common positive keywords added by user
            user_words = event.adjusted_value.split(",")
            for word in user_words:
                cleaned = word.strip().lower()
                if len(cleaned) > 3 and cleaned not in profile.learned_prompt_modifiers:
                    profile.learned_prompt_modifiers.append(cleaned)
                    if len(profile.learned_prompt_modifiers) > 20:
                        profile.learned_prompt_modifiers.pop(0)

        elif event.event_type == "motion_speed_adjust" and isinstance(event.adjusted_value, (int, float)):
            # Tweak VFX intensity
            profile.vfx_intensity = max(0.2, min(1.0, float(event.adjusted_value)))

        self.save_creator_style(profile)

    def generate_prompt_enhancements(
        self, series_id: str, base_prompt: str, character_names: Optional[List[str]] = None
    ) -> str:
        """Augment a raw generation prompt with learned creator style + active character continuity."""
        profile = self.get_creator_style()
        continuity = self.get_continuity(series_id)

        enhancements: List[str] = [base_prompt.strip()]

        # 1. Apply active character continuity (scars, current outfits)
        if character_names:
            for name in character_names:
                char_data = continuity.active_characters.get(name)
                if char_data:
                    scars = char_data.get("scars")
                    outfit = char_data.get("current_outfit")
                    if scars:
                        enhancements.append(f"({name} with {scars})")
                    if outfit:
                        enhancements.append(f"({name} wearing {outfit})")

        # 2. Add learned creator prompt modifiers
        if profile.learned_prompt_modifiers:
            top_modifiers = ", ".join(profile.learned_prompt_modifiers[-3:])
            enhancements.append(f"styled with {top_modifiers}")

        return ", ".join(enhancements)

    def get_epilogue_audit(self, series_id: str) -> Dict[str, Any]:
        """Verify that all mysteries and subplots are guaranteed to be resolved."""
        continuity = self.get_continuity(series_id)
        unresolved_count = len(continuity.unresolved_threads)
        resolved_count = len(continuity.resolved_threads)

        return {
            "series_id": series_id,
            "has_unresolved_cliffhangers": unresolved_count > 0,
            "unresolved_threads": continuity.unresolved_threads,
            "resolved_threads": continuity.resolved_threads,
            "closure_rate_percent": (
                round((resolved_count / (resolved_count + unresolved_count)) * 100, 1)
                if (resolved_count + unresolved_count) > 0
                else 100.0
            ),
            "guaranteed_epilogue_ready": unresolved_count == 0,
        }


# Global singleton instance
series_memory_engine = SeriesMemoryEngine()
