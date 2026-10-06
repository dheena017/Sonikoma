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

from features.intelligence.series.schemas import (
    CreatorStyleProfile,
    FranchiseContinuityMemory,
    GenerationFeedbackEvent,
    MemoryOptimizationSuggestion,
)

try:
    from database.config import DB_PATH as DEFAULT_DB_PATH
except ImportError:
    DEFAULT_DB_PATH = None

logger = logging.getLogger(__name__)


class SeriesMemoryEngine:
    """Persistent memory engine for AI Generated Series continuity and creator RLHF."""

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            if DEFAULT_DB_PATH and os.path.exists(os.path.dirname(DEFAULT_DB_PATH)):
                self.db_path = str(DEFAULT_DB_PATH)
            else:
                base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / "data"
                base_dir.mkdir(parents=True, exist_ok=True)
                self.db_path = str(base_dir / "webtoon_local.db")
        else:
            self.db_path = db_path

        self._init_tables()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_tables(self) -> None:
        """Create memory and RLHF feedback storage tables if missing."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS series_continuity_memory (
                    series_id TEXT PRIMARY KEY,
                    canon_facts TEXT,
                    character_states TEXT,
                    recurring_motifs TEXT,
                    unresolved_threads TEXT,
                    total_chapters_generated INTEGER DEFAULT 0,
                    last_synced_at TEXT
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS creator_style_profiles (
                    creator_id TEXT PRIMARY KEY,
                    preferred_art_styles TEXT,
                    pacing_bias TEXT DEFAULT 'balanced',
                    dialogue_density_bias TEXT DEFAULT 'medium',
                    favorite_genres TEXT,
                    negative_prompt_additions TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS series_feedback_events (
                    id TEXT PRIMARY KEY,
                    series_id TEXT,
                    chapter_number INTEGER,
                    panel_index INTEGER,
                    feedback_type TEXT,
                    user_comment TEXT,
                    applied_fix TEXT,
                    created_at TEXT
                )
                """
            )
            conn.commit()

    def get_continuity_memory(self, series_id: str) -> FranchiseContinuityMemory:
        """Retrieve persistent canon continuity state for a series."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM series_continuity_memory WHERE series_id = ?", (series_id,))
            row = cursor.fetchone()
            if not row:
                mem = FranchiseContinuityMemory(series_id=series_id)
                self.save_continuity_memory(mem)
                return mem

            return FranchiseContinuityMemory(
                series_id=row["series_id"],
                canon_facts=json.loads(row["canon_facts"] or "[]"),
                character_states=json.loads(row["character_states"] or "{}"),
                recurring_motifs=json.loads(row["recurring_motifs"] or "[]"),
                unresolved_threads=json.loads(row["unresolved_threads"] or "[]"),
                total_chapters_generated=row["total_chapters_generated"] or 0,
                last_synced_at=datetime.fromisoformat(row["last_synced_at"]) if row["last_synced_at"] else datetime.utcnow(),
            )

    def save_continuity_memory(self, memory: FranchiseContinuityMemory) -> None:
        """Persist or update canon continuity state."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO series_continuity_memory (
                    series_id, canon_facts, character_states, recurring_motifs,
                    unresolved_threads, total_chapters_generated, last_synced_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(series_id) DO UPDATE SET
                    canon_facts = excluded.canon_facts,
                    character_states = excluded.character_states,
                    recurring_motifs = excluded.recurring_motifs,
                    unresolved_threads = excluded.unresolved_threads,
                    total_chapters_generated = excluded.total_chapters_generated,
                    last_synced_at = excluded.last_synced_at
                """,
                (
                    memory.series_id,
                    json.dumps(memory.canon_facts),
                    json.dumps(memory.character_states),
                    json.dumps(memory.recurring_motifs),
                    json.dumps(memory.unresolved_threads),
                    memory.total_chapters_generated,
                    datetime.utcnow().isoformat(),
                ),
            )
            conn.commit()

    def record_feedback(self, event: GenerationFeedbackEvent) -> None:
        """Store creator edit or rejection signal for continuous reinforcement learning."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO series_feedback_events (
                    id, series_id, chapter_number, panel_index,
                    feedback_type, user_comment, applied_fix, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event.id,
                    event.series_id,
                    event.chapter_number,
                    event.panel_index,
                    event.feedback_type,
                    event.user_comment,
                    event.applied_fix,
                    event.created_at.isoformat(),
                ),
            )
            conn.commit()

    def get_style_profile(self, creator_id: str) -> CreatorStyleProfile:
        """Fetch creator's global learned aesthetic profile."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM creator_style_profiles WHERE creator_id = ?", (creator_id,))
            row = cursor.fetchone()
            if not row:
                profile = CreatorStyleProfile(creator_id=creator_id)
                self.save_style_profile(profile)
                return profile

            return CreatorStyleProfile(
                creator_id=row["creator_id"],
                preferred_art_styles=json.loads(row["preferred_art_styles"] or "[]"),
                pacing_bias=row["pacing_bias"] or "balanced",
                dialogue_density_bias=row["dialogue_density_bias"] or "medium",
                favorite_genres=json.loads(row["favorite_genres"] or "[]"),
                negative_prompt_additions=json.loads(row["negative_prompt_additions"] or "[]"),
            )

    def save_style_profile(self, profile: CreatorStyleProfile) -> None:
        """Save or update creator's style preferences."""
        now = datetime.utcnow().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO creator_style_profiles (
                    creator_id, preferred_art_styles, pacing_bias, dialogue_density_bias,
                    favorite_genres, negative_prompt_additions, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(creator_id) DO UPDATE SET
                    preferred_art_styles = excluded.preferred_art_styles,
                    pacing_bias = excluded.pacing_bias,
                    dialogue_density_bias = excluded.dialogue_density_bias,
                    favorite_genres = excluded.favorite_genres,
                    negative_prompt_additions = excluded.negative_prompt_additions,
                    updated_at = excluded.updated_at
                """,
                (
                    profile.creator_id,
                    json.dumps(profile.preferred_art_styles),
                    profile.pacing_bias,
                    profile.dialogue_density_bias,
                    json.dumps(profile.favorite_genres),
                    json.dumps(profile.negative_prompt_additions),
                    now,
                    now,
                ),
            )
            conn.commit()

    def generate_optimization_suggestions(self, series_id: str) -> List[MemoryOptimizationSuggestion]:
        """Analyze past chapters, continuity state, and feedback to suggest storyline or visual tuning."""
        mem = self.get_continuity_memory(series_id)
        suggestions: List[MemoryOptimizationSuggestion] = []

        if len(mem.unresolved_threads) > 3:
            suggestions.append(
                MemoryOptimizationSuggestion(
                    category="narrative",
                    suggestion=f"You have {len(mem.unresolved_threads)} open plot hooks. Consider addressing: '{mem.unresolved_threads[0]}'.",
                    confidence=0.88,
                    suggested_action=f"Resolve subplot '{mem.unresolved_threads[0]}' in upcoming chapter.",
                )
            )

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT feedback_type, COUNT(*) as cnt FROM series_feedback_events WHERE series_id = ? GROUP BY feedback_type",
                (series_id,),
            )
            feedback_counts = {r["feedback_type"]: r["cnt"] for r in cursor.fetchall()}

        if feedback_counts.get("anatomy_issue", 0) > 2:
            suggestions.append(
                MemoryOptimizationSuggestion(
                    category="visual",
                    suggestion="Multiple anatomy issues reported. Consider reinforcing negative prompts for hands and limbs.",
                    confidence=0.92,
                    suggested_action="Add 'extra limbs, mutated hands, poorly drawn fingers' to negative prompts.",
                )
            )

        if feedback_counts.get("pacing_too_slow", 0) > 1:
            suggestions.append(
                MemoryOptimizationSuggestion(
                    category="pacing",
                    suggestion="Readers or edits indicate slow pacing. Inject dynamic action or narrative turning points.",
                    confidence=0.85,
                    suggested_action="Increase panel action density and reduce repetitive dialogue in next scene.",
                )
            )

        return suggestions


series_memory_engine = SeriesMemoryEngine()
