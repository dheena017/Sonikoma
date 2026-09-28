"""Repository for AI Generated Series.

Persists and manages AI series projects, multi-session structures, chapters,
interactive panels, character vaults, and speech bubbles.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.schemas.series import (
    AISeriesProject,
    AISeriesPanel,
    ChapterSession,
    SeriesSession,
    CharacterDNA,
    InteractiveSpeechBubble,
)

logger = logging.getLogger(__name__)


class AISeriesRepository:
    """Persistent storage for AI Generated Series."""

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            base_dir = Path(__file__).resolve().parent.parent.parent / "data"
            base_dir.mkdir(parents=True, exist_ok=True)
            self.db_path = str(base_dir / "ai_series.db")
        else:
            self.db_path = db_path
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Initialize database schema for AI Generated Series."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # 1. Projects Table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS ai_series_projects (
                    series_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    format_type TEXT NOT NULL,
                    art_style TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    data_json TEXT NOT NULL
                )
                """
            )
            # Index for fast listing
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_ai_series_updated
                ON ai_series_projects(updated_at DESC)
                """
            )
            conn.commit()

    # ---------------------------------------------------------
    # Project CRUD
    # ---------------------------------------------------------

    def create_project(self, project: AISeriesProject) -> AISeriesProject:
        """Insert a newly created AI Series project."""
        project.created_at = datetime.utcnow()
        project.updated_at = datetime.utcnow()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO ai_series_projects (
                    series_id, title, format_type, art_style, status,
                    created_at, updated_at, data_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project.series_id,
                    project.title,
                    project.format_type.value if hasattr(project.format_type, "value") else str(project.format_type),
                    project.art_style.value if hasattr(project.art_style, "value") else str(project.art_style),
                    project.status.value if hasattr(project.status, "value") else str(project.status),
                    project.created_at.isoformat(),
                    project.updated_at.isoformat(),
                    project.model_dump_json(),
                ),
            )
            conn.commit()
        return project

    def get_project(self, series_id: str) -> Optional[AISeriesProject]:
        """Fetch an AI Series project by ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT data_json FROM ai_series_projects WHERE series_id = ?",
                (series_id,),
            )
            row = cursor.fetchone()
            if row:
                data = json.loads(row["data_json"])
                return AISeriesProject(**data)
            return None

    def update_project(self, project: AISeriesProject) -> AISeriesProject:
        """Update full project state."""
        project.updated_at = datetime.utcnow()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE ai_series_projects
                SET title = ?, format_type = ?, art_style = ?, status = ?,
                    updated_at = ?, data_json = ?
                WHERE series_id = ?
                """,
                (
                    project.title,
                    project.format_type.value if hasattr(project.format_type, "value") else str(project.format_type),
                    project.art_style.value if hasattr(project.art_style, "value") else str(project.art_style),
                    project.status.value if hasattr(project.status, "value") else str(project.status),
                    project.updated_at.isoformat(),
                    project.model_dump_json(),
                    project.series_id,
                ),
            )
            conn.commit()
        return project

    def list_projects(
        self,
        format_filter: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AISeriesProject]:
        """List all AI Generated Series with optional format filtering."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if format_filter:
                cursor.execute(
                    """
                    SELECT data_json FROM ai_series_projects
                    WHERE format_type = ?
                    ORDER BY updated_at DESC
                    LIMIT ? OFFSET ?
                    """,
                    (format_filter, limit, offset),
                )
            else:
                cursor.execute(
                    """
                    SELECT data_json FROM ai_series_projects
                    ORDER BY updated_at DESC
                    LIMIT ? OFFSET ?
                    """,
                    (limit, offset),
                )
            rows = cursor.fetchall()
            return [AISeriesProject(**json.loads(r["data_json"])) for r in rows]

    def delete_project(self, series_id: str) -> bool:
        """Delete an AI Series project."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM ai_series_projects WHERE series_id = ?",
                (series_id,),
            )
            conn.commit()
            return cursor.rowcount > 0

    # ---------------------------------------------------------
    # Chapter & Panel Helpers
    # ---------------------------------------------------------

    def get_chapter(
        self, series_id: str, session_number: int, chapter_number: int
    ) -> Optional[ChapterSession]:
        """Direct access to a specific chapter."""
        project = self.get_project(series_id)
        if not project:
            return None

        for sess in project.sessions:
            if sess.session_number == session_number:
                for chap in sess.chapters:
                    if chap.chapter_number == chapter_number:
                        return chap
        return None

    def update_chapter(
        self, series_id: str, updated_chapter: ChapterSession
    ) -> Optional[AISeriesProject]:
        """Update a specific chapter within the series tree."""
        project = self.get_project(series_id)
        if not project:
            return None

        updated = False
        for sess in project.sessions:
            if sess.session_number == updated_chapter.session_number:
                for idx, chap in enumerate(sess.chapters):
                    if chap.chapter_id == updated_chapter.chapter_id:
                        sess.chapters[idx] = updated_chapter
                        updated = True
                        break
        if updated:
            return self.update_project(project)
        return None

    def update_panel_speech_bubble(
        self,
        series_id: str,
        chapter_id: str,
        panel_id: str,
        bubble: InteractiveSpeechBubble,
    ) -> Optional[AISeriesProject]:
        """Directly update or add an interactive speech bubble without image regeneration."""
        project = self.get_project(series_id)
        if not project:
            return None

        for sess in project.sessions:
            for chap in sess.chapters:
                if chap.chapter_id == chapter_id:
                    for panel in chap.panels:
                        if panel.panel_id == panel_id:
                            # Find bubble
                            found = False
                            for i, b in enumerate(panel.speech_bubbles):
                                if b.bubble_id == bubble.bubble_id:
                                    panel.speech_bubbles[i] = bubble
                                    found = True
                                    break
                            if not found:
                                panel.speech_bubbles.append(bubble)
                            return self.update_project(project)
        return None


# Global repository instance
ai_series_repo = AISeriesRepository()
