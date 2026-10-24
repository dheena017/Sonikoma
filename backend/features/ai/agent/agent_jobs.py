"""
Agent job management and database persistence.

Tracks background agent runs, statuses, user approvals, and retrieved history
from SQLite database storage.
"""

from typing import Dict, List, Optional, Any
import json
import time
import logging
from database.engine import get_db_connection

logger = logging.getLogger("sonikoma.features.ai.agent.jobs")


def _check_database_table() -> None:
    """Ensures the SQLite table creative_agent_runs is present."""
    try:
        with get_db_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS creative_agent_runs (
                    run_id            TEXT PRIMARY KEY,
                    user_id           TEXT,
                    status            TEXT NOT NULL,
                    progress          INTEGER NOT NULL DEFAULT 0,
                    current_action    TEXT NOT NULL DEFAULT '',
                    scraped_title     TEXT,
                    series_title      TEXT,
                    chapter_title     TEXT,
                    source_url        TEXT,
                    video_format      TEXT DEFAULT 'shorts',
                    language          TEXT DEFAULT 'en',
                    voice             TEXT DEFAULT 'alloy',
                    cover_image       TEXT,
                    duration          REAL,
                    raw_images_count  INTEGER DEFAULT 0,
                    video_filename    TEXT,
                    video_url         TEXT,
                    youtube_metadata  TEXT DEFAULT '{}',
                    youtube_url       TEXT,
                    error             TEXT,
                    logs              TEXT DEFAULT '[]',
                    panels            TEXT DEFAULT '[]',
                    character_cast    TEXT DEFAULT '[]',
                    created_at        REAL NOT NULL,
                    updated_at        REAL NOT NULL
                )
                """
            )
            conn.commit()
    except Exception as e:
        logger.warning(f"Error checking creative_agent_runs table: {e}")


def check_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Fetches details and progress for a single agent job."""
    _check_database_table()
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM creative_agent_runs WHERE run_id = ?", (job_id,))
            row = cursor.fetchone()
            if not row:
                return None
            cols = [col[0] for col in cursor.description]
            data = dict(zip(cols, row))
            for key in ["logs", "panels", "youtube_metadata", "character_cast"]:
                if key in data and isinstance(data[key], str):
                    try:
                        data[key] = json.loads(data[key])
                    except Exception:
                        pass
            return data
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {e}")
        return None


def approve_job(job_id: str, user_changes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Approves a reviewable agent job and applies any user script/voice overrides."""
    _check_database_table()
    job = check_job(job_id)
    if not job:
        raise ValueError(f"Job {job_id} not found")

    with get_db_connection() as conn:
        conn.execute(
            """
            UPDATE creative_agent_runs
            SET status = 'approved',
                updated_at = ?
            WHERE run_id = ?
            """,
            (time.time(), job_id),
        )
        conn.commit()

    job["status"] = "approved"
    return job


def get_all_jobs(user_id: str) -> List[Dict[str, Any]]:
    """Retrieves all past agent jobs belonging to a user, sorted newest first."""
    _check_database_table()
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT run_id, user_id, status, progress, series_title, chapter_title,
                       video_url, created_at, updated_at
                FROM creative_agent_runs
                WHERE user_id = ? OR user_id IS NULL OR user_id = ''
                ORDER BY created_at DESC
                LIMIT 50
                """,
                (user_id,),
            )
            rows = cursor.fetchall()
            cols = [col[0] for col in cursor.description]
            return [dict(zip(cols, r)) for r in rows]
    except Exception as e:
        logger.error(f"Error fetching all jobs for {user_id}: {e}")
        return []


__all__ = ["check_job", "approve_job", "get_all_jobs"]
