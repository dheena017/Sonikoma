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
        conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=30.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_tables(self) -> None:
        """Create memory and RLHF feedback storage tables if missing."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS intelligence_continuity_memory (
                    series_id TEXT PRIMARY KEY,
                    active_characters TEXT,
                    world_rules TEXT,
                    lore_revelations TEXT,
                    unresolved_threads TEXT,
                    resolved_threads TEXT,
                    canonical_locations TEXT,
                    total_chapters_generated INTEGER DEFAULT 0,
                    last_synced_at TEXT,
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
                """
            )
            # Ensure new columns exist if table was previously created with legacy schema
            cursor.execute("PRAGMA table_info(intelligence_continuity_memory)")
            existing_cols = {row["name"] for row in cursor.fetchall()}
            for col in [
                "active_characters", "world_rules", "lore_revelations",
                "unresolved_threads", "resolved_threads", "canonical_locations", "last_synced_at"
            ]:
                if col not in existing_cols:
                    try:
                        cursor.execute(f"ALTER TABLE intelligence_continuity_memory ADD COLUMN {col} TEXT")
                    except Exception:
                        pass

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS creative_style_profiles (
                    creator_id TEXT PRIMARY KEY,
                    preferred_art_styles TEXT DEFAULT '[]',
                    pacing_bias TEXT DEFAULT 'balanced',
                    dialogue_density_bias TEXT DEFAULT 'medium',
                    favorite_genres TEXT DEFAULT '[]',
                    negative_prompt_additions TEXT DEFAULT '',
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS intelligence_feedback_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    feedback_id TEXT UNIQUE,
                    series_id TEXT,
                    chapter_number TEXT,
                    panel_index INTEGER,
                    feedback_type TEXT,
                    user_comment TEXT,
                    applied_fix TEXT,
                    created_at TEXT
                )
                """
            )
            conn.commit()

    def get_continuity(self, series_id: str) -> FranchiseContinuityMemory:
        """Retrieve persistent canon continuity state for a series."""
        row = None
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM intelligence_continuity_memory WHERE series_id = ?", (series_id,))
            row = cursor.fetchone()

        if not row:
            mem = FranchiseContinuityMemory(series_id=series_id)
            self.save_continuity(mem)
            return mem

        row_keys = row.keys()
        def _parse_json(col_name: str, fallback_col: Optional[str] = None, default_val: Any = None):
            if col_name in row_keys and row[col_name]:
                try:
                    return json.loads(row[col_name])
                except Exception:
                    pass
            if fallback_col and fallback_col in row_keys and row[fallback_col]:
                try:
                    return json.loads(row[fallback_col])
                except Exception:
                    pass
            return default_val

        return FranchiseContinuityMemory(
            series_id=row["series_id"],
            active_characters=_parse_json("active_characters", "character_states", {}),
            world_rules=_parse_json("world_rules", "canon_facts", []),
            lore_revelations=_parse_json("lore_revelations", None, []),
            unresolved_threads=_parse_json("unresolved_threads", None, []),
            resolved_threads=_parse_json("resolved_threads", None, []),
            canonical_locations=_parse_json("canonical_locations", "recurring_motifs", {}),
            updated_at=datetime.fromisoformat(row["last_synced_at"]) if ("last_synced_at" in row_keys and row["last_synced_at"]) else datetime.utcnow(),
        )

    get_continuity_memory = get_continuity

    def save_continuity(self, memory: FranchiseContinuityMemory) -> None:
        """Persist or update canon continuity state."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO intelligence_continuity_memory (
                    series_id, active_characters, world_rules, lore_revelations,
                    unresolved_threads, resolved_threads, canonical_locations, last_synced_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(series_id) DO UPDATE SET
                    active_characters = excluded.active_characters,
                    world_rules = excluded.world_rules,
                    lore_revelations = excluded.lore_revelations,
                    unresolved_threads = excluded.unresolved_threads,
                    resolved_threads = excluded.resolved_threads,
                    canonical_locations = excluded.canonical_locations,
                    last_synced_at = excluded.last_synced_at
                """,
                (
                    memory.series_id,
                    json.dumps(memory.active_characters),
                    json.dumps(memory.world_rules),
                    json.dumps(memory.lore_revelations),
                    json.dumps(memory.unresolved_threads),
                    json.dumps(memory.resolved_threads),
                    json.dumps(memory.canonical_locations),
                    datetime.utcnow().isoformat(),
                ),
            )
            conn.commit()

    save_continuity_memory = save_continuity

    def record_unresolved_thread(self, series_id: str, thread: str) -> None:
        """Register a mystery or unresolved plot hook into series continuity."""
        mem = self.get_continuity(series_id)
        if thread and thread not in mem.unresolved_threads:
            mem.unresolved_threads.append(thread)
            self.save_continuity(mem)

    def mark_thread_resolved(self, series_id: str, thread: str) -> None:
        """Mark an open plot thread as resolved."""
        mem = self.get_continuity(series_id)
        if thread in mem.unresolved_threads:
            mem.unresolved_threads.remove(thread)
        if thread and thread not in mem.resolved_threads:
            mem.resolved_threads.append(thread)
        self.save_continuity(mem)

    def update_character_state(
        self,
        series_id: str,
        character_name: str,
        state_updates: Dict[str, Any]
    ) -> None:
        """Update active character traits, outfit, or scars in memory."""
        mem = self.get_continuity(series_id)
        if character_name not in mem.active_characters:
            mem.active_characters[character_name] = {}
        mem.active_characters[character_name].update(state_updates)
        self.save_continuity(mem)

    def generate_prompt_enhancements(
        self,
        series_id: str,
        base_prompt: str,
        character_names: Optional[List[str]] = None
    ) -> str:
        """Inject character canon traits and immutable world rules into visual prompt."""
        mem = self.get_continuity(series_id)
        enhancements = []
        if character_names:
            for c_name in character_names:
                c_data = mem.active_characters.get(c_name, {})
                scars = c_data.get("scars")
                outfit = c_data.get("current_outfit")
                if outfit:
                    enhancements.append(f"outfit: {outfit}")
                if scars:
                    enhancements.append(f"traits: {scars}")
        if enhancements:
            return f"{base_prompt}, {', '.join(enhancements)}"
        return base_prompt

    def get_epilogue_audit(self, series_id: str) -> Dict[str, Any]:
        """Audit resolution status for all narrative mysteries."""
        mem = self.get_continuity(series_id)
        total = len(mem.unresolved_threads) + len(mem.resolved_threads)
        closure_rate = 100.0 if not mem.unresolved_threads else (
            round((len(mem.resolved_threads) / max(1, total)) * 100, 1)
        )
        return {
            "series_id": series_id,
            "total_threads": total,
            "unresolved_threads": mem.unresolved_threads,
            "resolved_threads": mem.resolved_threads,
            "closure_rate": closure_rate,
            "is_canon_clean": len(mem.unresolved_threads) == 0,
        }

    def record_feedback(self, event: GenerationFeedbackEvent) -> None:
        """Store creator edit or rejection signal for continuous reinforcement learning."""
        f_id = getattr(event, "feedback_id", None) or getattr(event, "id", str(uuid4()))
        f_type = getattr(event, "event_type", None) or getattr(event, "feedback_type", "edit")
        f_comment = getattr(event, "creator_notes", None) or getattr(event, "user_comment", "")
        f_fix = getattr(event, "adjusted_value", None) or getattr(event, "applied_fix", "")
        f_ch = getattr(event, "chapter_number", 1)
        f_p = getattr(event, "panel_index", 0)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO intelligence_feedback_events (
                    feedback_id, series_id, chapter_number, panel_index,
                    feedback_type, user_comment, applied_fix, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    f_id,
                    event.series_id,
                    f_ch,
                    f_p,
                    f_type,
                    str(f_comment),
                    str(f_fix),
                    datetime.utcnow().isoformat(),
                ),
            )
            conn.commit()

    def get_creator_style(self, creator_id: str = "default_creator") -> CreatorStyleProfile:
        """Fetch creator's global learned aesthetic profile."""
        row = None
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM creative_style_profiles WHERE creator_id = ?", (creator_id,))
            row = cursor.fetchone()

        if not row:
            profile = CreatorStyleProfile(creator_id=creator_id)
            self.save_creator_style(profile)
            return profile

        return CreatorStyleProfile(
            creator_id=row["creator_id"],
            preferred_art_styles=json.loads(row["preferred_art_styles"] or "[]"),
            pacing_bias=row["pacing_bias"] or "balanced",
            dialogue_density_bias=row["dialogue_density_bias"] or "medium",
            favorite_genres=json.loads(row["favorite_genres"] or "[]"),
            negative_prompt_additions=json.loads(row["negative_prompt_additions"] or "[]"),
        )

    get_style_profile = get_creator_style

    def save_creator_style(self, profile: CreatorStyleProfile) -> None:
        """Save or update creator's style preferences."""
        now = datetime.utcnow().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO creative_style_profiles (
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

    save_style_profile = save_creator_style

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
                "SELECT feedback_type, COUNT(*) as cnt FROM intelligence_feedback_events WHERE series_id = ? GROUP BY feedback_type",
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
