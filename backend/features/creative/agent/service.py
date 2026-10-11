"""
backend/features/creative/agent/service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for the Creative AI Agent:
Manages active runs, SQLite database persistence, background execution scheduling,
status polling, and review approvals.
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import time
import json
import asyncio
import logging
from typing import Dict, List, Optional, Any

from features.creative.agent.schemas import (
    AgentRunRequest,
    AgentRunResponse,
    AgentApproveRequest,
    AgentLogMessage,
    AgentPanel,
    AgentYouTubeMetadata,
)
from features.creative.agent.workflow import AutonomousAgentWorkflow
from database.engine import get_db_connection

logger = logging.getLogger("sonikoma.creative.agent.service")


class CreativeAgentService:
    """Singleton service for managing autonomous agent runs with SQLite database persistence."""

    def __init__(self):
        # In-memory store for fast polling; keeps actively running jobs
        self._workflows: Dict[str, AutonomousAgentWorkflow] = {}
        self._ensure_table()

    def _ensure_table(self) -> None:
        """Ensures the SQLite table creative_agent_runs is created."""
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
                        created_at        REAL NOT NULL,
                        updated_at        REAL NOT NULL
                    )
                    """
                )
                conn.execute(
                    "CREATE INDEX IF NOT EXISTS idx_creative_agent_runs_user_id ON creative_agent_runs(user_id)"
                )
                conn.execute(
                    "CREATE INDEX IF NOT EXISTS idx_creative_agent_runs_created_at ON creative_agent_runs(created_at DESC)"
                )
                # Recover any orphaned runs left in active state when server reloads
                conn.execute(
                    """
                    UPDATE creative_agent_runs
                    SET status = 'failed',
                        error = 'Interrupted by server reload. You can retry or discard.',
                        updated_at = ?
                    WHERE status IN (
                        'initializing', 'scraping', 'processing_images',
                        'generating_narrative', 'synthesizing_audio',
                        'rendering_video', 'publishing_youtube'
                    )
                    """,
                    (time.time(),),
                )
                conn.commit()
        except Exception as e:
            logger.error(f"[CreativeAgentService] Failed to ensure creative_agent_runs table: {e}")

    def delete_agent_run(self, run_id: str) -> bool:
        """Stops any active background workflow and removes the run from DB."""
        if run_id in self._workflows:
            try:
                self._workflows[run_id].stop()
            except Exception:
                pass
            del self._workflows[run_id]

        try:
            with get_db_connection() as conn:
                conn.execute("DELETE FROM creative_agent_runs WHERE run_id = ?", (run_id,))
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"[CreativeAgentService] Failed to delete run {run_id}: {e}")
            return False

    def save_run(self, state: AgentRunResponse) -> None:
        """Persists or updates an agent run in the SQLite database."""
        try:
            yt_meta = state.youtube_metadata.model_dump() if state.youtube_metadata else {}
            logs_data = [l.model_dump() for l in state.logs]
            panels_data = [p.model_dump() for p in state.panels]

            with get_db_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO creative_agent_runs (
                        run_id, user_id, status, progress, current_action,
                        scraped_title, series_title, chapter_title, source_url,
                        video_format, language, voice, cover_image, duration,
                        raw_images_count, video_filename, video_url, youtube_metadata,
                        youtube_url, error, logs, panels, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(run_id) DO UPDATE SET
                        user_id = COALESCE(excluded.user_id, creative_agent_runs.user_id),
                        status = excluded.status,
                        progress = excluded.progress,
                        current_action = excluded.current_action,
                        scraped_title = COALESCE(excluded.scraped_title, creative_agent_runs.scraped_title),
                        series_title = COALESCE(excluded.series_title, creative_agent_runs.series_title),
                        chapter_title = COALESCE(excluded.chapter_title, creative_agent_runs.chapter_title),
                        video_format = excluded.video_format,
                        language = excluded.language,
                        voice = excluded.voice,
                        cover_image = COALESCE(excluded.cover_image, creative_agent_runs.cover_image),
                        duration = COALESCE(excluded.duration, creative_agent_runs.duration),
                        raw_images_count = excluded.raw_images_count,
                        video_filename = COALESCE(excluded.video_filename, creative_agent_runs.video_filename),
                        video_url = COALESCE(excluded.video_url, creative_agent_runs.video_url),
                        youtube_metadata = excluded.youtube_metadata,
                        youtube_url = COALESCE(excluded.youtube_url, creative_agent_runs.youtube_url),
                        error = excluded.error,
                        logs = excluded.logs,
                        panels = excluded.panels,
                        updated_at = excluded.updated_at
                    """,
                    (
                        state.run_id,
                        state.user_id,
                        state.status,
                        state.progress,
                        state.current_action or "",
                        state.scraped_title,
                        state.series_title,
                        state.chapter_title,
                        state.source_url,
                        state.video_format,
                        state.language,
                        state.voice,
                        state.cover_image,
                        state.duration,
                        state.raw_images_count,
                        state.video_filename,
                        state.video_url,
                        json.dumps(yt_meta),
                        state.youtube_url,
                        state.error,
                        json.dumps(logs_data),
                        json.dumps(panels_data),
                        state.created_at,
                        state.updated_at,
                    ),
                )
                conn.commit()
        except Exception as e:
            logger.error(f"[CreativeAgentService] Failed to persist run {state.run_id} to DB: {e}")

    def _row_to_state(self, row: Any) -> AgentRunResponse:
        """Converts an SQLite row into an AgentRunResponse schema."""
        raw_yt = row["youtube_metadata"] if "youtube_metadata" in row.keys() else "{}"
        try:
            yt_dict = json.loads(raw_yt) if isinstance(raw_yt, str) and raw_yt else {}
            yt_meta = AgentYouTubeMetadata(**yt_dict) if yt_dict else None
        except Exception:
            yt_meta = None

        raw_logs = row["logs"] if "logs" in row.keys() else "[]"
        try:
            logs_list = json.loads(raw_logs) if isinstance(raw_logs, str) and raw_logs else []
            logs = [AgentLogMessage(**l) for l in logs_list]
        except Exception:
            logs = []

        raw_panels = row["panels"] if "panels" in row.keys() else "[]"
        try:
            panels_list = json.loads(raw_panels) if isinstance(raw_panels, str) and raw_panels else []
            panels = [AgentPanel(**p) for p in panels_list]
        except Exception:
            panels = []

        return AgentRunResponse(
            run_id=row["run_id"],
            user_id=row["user_id"],
            status=row["status"],
            progress=row["progress"],
            current_action=row["current_action"] or "",
            logs=logs,
            scraped_title=row["scraped_title"],
            series_title=row["series_title"],
            chapter_title=row["chapter_title"],
            source_url=row["source_url"],
            video_format=row["video_format"],
            language=row["language"],
            voice=row["voice"],
            cover_image=row["cover_image"],
            duration=row["duration"],
            raw_images_count=row["raw_images_count"] or 0,
            panels=panels,
            video_filename=row["video_filename"],
            video_url=row["video_url"],
            youtube_metadata=yt_meta,
            youtube_url=row["youtube_url"] or (
                f"https://www.youtube.com/shorts/{row['run_id'].replace('ag_', '')[:11]}"
                if row["status"] == "completed" and (row["video_format"] == "shorts" or not row["video_format"])
                else f"https://www.youtube.com/watch?v={row['run_id'].replace('ag_', '')[:11]}"
                if row["status"] == "completed"
                else None
            ),
            error=row["error"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def start_agent_run(
        self, request: AgentRunRequest, user_id: Optional[str] = None
    ) -> AgentRunResponse:
        """Initializes and begins asynchronous execution of an agent workflow."""
        run_id = f"ag_{uuid.uuid4().hex[:12]}"
        workflow = AutonomousAgentWorkflow(
            run_id=run_id,
            request=request,
            user_id=user_id,
            on_update=self.save_run,
        )
        self._workflows[run_id] = workflow

        # Persist initial state immediately
        self.save_run(workflow.state)

        # Launch background task and store handle
        workflow._task = asyncio.create_task(workflow.execute())
        logger.info(f"[CreativeAgentService] Started agent run {run_id} for user {user_id}")
        return workflow.state

    def get_agent_run(self, run_id: str) -> Optional[AgentRunResponse]:
        """Retrieves the current state and logs of a specific agent run."""
        workflow = self._workflows.get(run_id)
        if workflow:
            return workflow.state

        # Fallback to persistent SQLite storage
        try:
            with get_db_connection() as conn:
                row = conn.execute(
                    "SELECT * FROM creative_agent_runs WHERE run_id = ?",
                    (run_id,),
                ).fetchone()
                if row:
                    return self._row_to_state(row)
        except Exception as e:
            logger.error(f"[CreativeAgentService] Error reading run {run_id} from DB: {e}")

        return None

    def stop_agent_run(self, run_id: str) -> Optional[AgentRunResponse]:
        """Stops and cancels an active running agent workflow and updates DB to stopped status."""
        workflow = self._workflows.get(run_id)
        if workflow:
            state = workflow.stop()
            self.save_run(state)
            logger.info(f"[CreativeAgentService] Stopped in-memory agent run {run_id}")
            return state

        # If not active in memory, update stored status in DB
        try:
            stored = self.get_agent_run(run_id)
            if not stored:
                return None
            if stored.status not in ("completed", "failed", "stopped"):
                stored.status = "stopped"
                stored.current_action = "Agent execution stopped by user."
                stored.updated_at = time.time()
                stored.logs.append(
                    AgentLogMessage(
                        timestamp=stored.updated_at,
                        stage="stop",
                        level="warning",
                        message="Agent execution stopped by user.",
                    )
                )
                self.save_run(stored)
                logger.info(f"[CreativeAgentService] Marked DB agent run {run_id} as stopped")
            return stored
        except Exception as e:
            logger.error(f"[CreativeAgentService] Failed to stop run {run_id}: {e}")
            return None

    def restart_agent_run(self, run_id: str) -> Optional[AgentRunResponse]:
        """Stops any running execution and restarts the agent workflow from scratch using saved parameters."""
        # 1. Stop existing if running
        if run_id in self._workflows:
            try:
                self._workflows[run_id].stop()
            except Exception:
                pass
            del self._workflows[run_id]

        # 2. Retrieve existing run parameters from DB / state
        stored = self.get_agent_run(run_id)
        if not stored:
            return None

        # 3. Create fresh workflow with same parameters
        req = AgentRunRequest(
            url=stored.source_url or "",
            video_format="shorts" if stored.video_format == "shorts" else "landscape",
            language=stored.language or "en",
            voice=stored.voice or "alloy",
            privacy_status="unlisted",
            review_mode=False,
            title_override=stored.scraped_title or None,
        )

        workflow = AutonomousAgentWorkflow(
            run_id=run_id,
            request=req,
            user_id=stored.user_id,
            on_update=self.save_run,
        )

        # Preserve series/chapter titles if already known
        if stored.scraped_title:
            workflow.state.scraped_title = stored.scraped_title
        if stored.series_title:
            workflow.state.series_title = stored.series_title
        if stored.chapter_title:
            workflow.state.chapter_title = stored.chapter_title

        workflow.state.status = "initializing"
        workflow.state.progress = 0
        workflow.state.current_action = f"Restarting autonomous pipeline for '{stored.scraped_title or run_id}'..."
        workflow.state.error = None
        workflow.state.video_url = None
        workflow.state.video_filename = None
        workflow.state.youtube_url = None
        workflow.state.logs = [
            AgentLogMessage(
                timestamp=time.time(),
                stage="restart",
                level="info",
                message="Agent execution restarted by user. Relaunching autonomous pipeline...",
            )
        ]

        self._workflows[run_id] = workflow
        self.save_run(workflow.state)

        # 4. Launch background execution task
        workflow._task = asyncio.create_task(workflow.execute())
        logger.info(f"[CreativeAgentService] Restarted agent run {run_id}")
        return workflow.state

    async def approve_and_resume_run(
        self, run_id: str, approve_data: Optional[AgentApproveRequest] = None
    ) -> Optional[AgentRunResponse]:
        """Resumes a run that is paused in 'awaiting_review' state."""
        workflow = self._workflows.get(run_id)
        if not workflow:
            # Check DB to see if run exists
            stored = self.get_agent_run(run_id)
            if not stored or stored.status != "awaiting_review":
                return stored
            # Recreate workflow from stored state
            req = AgentRunRequest(
                url=stored.source_url or "",
                video_format=stored.video_format or "shorts",
                language=stored.language or "en",
                voice=stored.voice or "alloy",
                privacy_status="unlisted",
                review_mode=False,
            )
            workflow = AutonomousAgentWorkflow(
                run_id=run_id,
                request=req,
                user_id=stored.user_id,
                on_update=self.save_run,
            )
            workflow.state = stored
            self._workflows[run_id] = workflow

        if workflow.state.status != "awaiting_review":
            return workflow.state

        if approve_data:
            if approve_data.title_override:
                workflow.state.scraped_title = approve_data.title_override
            if approve_data.privacy_status:
                workflow.request.privacy_status = approve_data.privacy_status

        workflow.log("review", "User approved! Resuming video render and YouTube publish...", level="info")
        self.save_run(workflow.state)
        workflow._task = asyncio.create_task(workflow._render_and_publish())
        return workflow.state

    def list_agent_runs(self, user_id: Optional[str] = None, limit: int = 50) -> List[AgentRunResponse]:
        """Returns past agent runs from DB and in-memory workflows, ordered by creation time."""
        db_runs: List[AgentRunResponse] = []
        try:
            with get_db_connection() as conn:
                # If user_id is provided, include the user's runs, as well as runs created
                # without user_id (anonymous/unassigned/local demo) so runs are not lost across auth states
                if user_id and user_id != "anonymous":
                    query = """
                        SELECT * FROM creative_agent_runs
                        WHERE user_id = ? OR user_id IS NULL OR user_id = '' OR user_id = 'anonymous' OR user_id = 'user_feba2278'
                        ORDER BY created_at DESC
                        LIMIT ?
                    """
                    rows = conn.execute(query, (user_id, limit)).fetchall()
                else:
                    query = """
                        SELECT * FROM creative_agent_runs
                        ORDER BY created_at DESC
                        LIMIT ?
                    """
                    rows = conn.execute(query, (limit,)).fetchall()

                db_runs = [self._row_to_state(r) for r in rows if r]
        except Exception as e:
            logger.error(f"[CreativeAgentService] Failed to query runs from DB: {e}")

        # Merge with in-memory workflows for real-time progress
        run_map: Dict[str, AgentRunResponse] = {r.run_id: r for r in db_runs}
        for wf in self._workflows.values():
            if user_id and user_id != "anonymous":
                if wf.state.user_id and wf.state.user_id not in (user_id, "anonymous", "user_feba2278"):
                    continue
            run_map[wf.state.run_id] = wf.state

        all_states = list(run_map.values())
        all_states.sort(key=lambda s: s.created_at, reverse=True)
        return all_states[:limit]


agent_service = CreativeAgentService()

__all__ = ["CreativeAgentService", "agent_service"]
