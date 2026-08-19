"""
backend/app/services/jobs/manager.py
─────────────────────────────────────────────────────────────────────────────
Unified database-backed Job Manager for asynchronous tasks, progress tracking, and results.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import uuid
import json
import asyncio
import logging
import datetime
from typing import Dict, Any, Optional, Callable, Coroutine, List

from database.engine import get_db_connection
from .models import JobRecord, JobStatus, JobType, JobStage

logger = logging.getLogger("sonikoma.services.jobs")

def _job_record_from_row(row: dict) -> JobRecord:
    result = None
    if row.get("result"):
        try:
            result = json.loads(row["result"])
        except:
            result = row["result"]

    error = None
    if row.get("error"):
        try:
            error = json.loads(row["error"])
        except:
            error = {"message": row["error"]}

    metadata = {}
    if row.get("metadata"):
        try:
            metadata = json.loads(row["metadata"])
        except:
            pass

    return JobRecord(
        job_id=row["id"],
        user_id=row["user_id"],
        type=JobType(row["type"]),
        status=JobStatus(row["status"]),
        progress=float(row["progress"]),
        stage=row["stage"],
        project_id=row.get("project_id"),
        chapter_id=row.get("chapter_id"),
        created_at=row["created_at"],
        started_at=row.get("started_at"),
        completed_at=row.get("completed_at"),
        cancelled_at=row.get("cancelled_at"),
        result=result,
        error=error,
        metadata=metadata
    )

class UnifiedJobManager:
    """Central Job Manager across all processing domains, backed by the database."""

    def __init__(self):
        self._tasks: Dict[str, asyncio.Task] = {}
        self._ensure_table()

    def _ensure_table(self):
        try:
            with get_db_connection() as conn:
                conn.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                  id              TEXT    PRIMARY KEY,
                  user_id         TEXT    NOT NULL,
                  project_id      TEXT,
                  chapter_id      TEXT,
                  type            TEXT    NOT NULL,
                  status          TEXT    NOT NULL DEFAULT 'QUEUED',
                  progress        REAL    NOT NULL DEFAULT 0.0,
                  stage           TEXT    NOT NULL DEFAULT 'QUEUED',
                  result          TEXT,
                  error           TEXT,
                  metadata        TEXT,
                  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
                  started_at      TEXT,
                  completed_at    TEXT,
                  cancelled_at    TEXT
                )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)")
                conn.commit()
        except Exception as e:
            logger.warning(f"[JobManager] Failed to verify jobs table: {e}")

    def create_job(
        self,
        job_type: JobType,
        user_id: str,
        project_id: Optional[str] = None,
        chapter_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> JobRecord:
        """Creates a new Job in QUEUED state, persisted to database. Only backend can set job_id."""
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        now = datetime.datetime.now().isoformat()

        with get_db_connection() as conn:
            metadata_json = json.dumps(metadata) if metadata else "{}"
            conn.execute(
                """
                INSERT INTO jobs (id, user_id, project_id, chapter_id, type, status, progress, stage, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (job_id, user_id, project_id, chapter_id, job_type.value, JobStatus.QUEUED.value, 0.0, JobStage.QUEUED.value, metadata_json, now)
            )
            conn.commit()

        record = self.get_job(job_id)
        if metadata:
            record.metadata = metadata
        logger.info(f"[JobManager] Created job {job_id} (type={job_type.value}, user={user_id})")
        return record

    def get_job(self, job_id: str) -> Optional[JobRecord]:
        """Retrieves a job by ID from the database."""
        with get_db_connection() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
            if not row:
                return None
            return _job_record_from_row(dict(row))

    def list_jobs(
        self,
        user_id: str,
        project_id: Optional[str] = None,
        chapter_id: Optional[str] = None,
        status: Optional[str] = None,
        job_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[JobRecord]:
        """Lists jobs for a user, optionally filtered by project ID, chapter ID, status, and job type."""
        with get_db_connection() as conn:
            query = "SELECT * FROM jobs WHERE user_id = ?"
            params: list = [user_id]

            if project_id:
                query += " AND project_id = ?"
                params.append(project_id)
            if chapter_id:
                query += " AND chapter_id = ?"
                params.append(chapter_id)
            if status:
                query += " AND UPPER(status) = ?"
                params.append(status.upper())
            if job_type:
                query += " AND UPPER(type) = ?"
                params.append(job_type.upper())

            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([max(1, min(200, limit)), max(0, offset)])

            rows = conn.execute(query, tuple(params)).fetchall()
            return [_job_record_from_row(dict(r)) for r in rows]

    def list_all_jobs_admin(
        self,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        chapter_id: Optional[str] = None,
        status: Optional[str] = None,
        job_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[JobRecord]:
        """Lists all system jobs across users for administration."""
        with get_db_connection() as conn:
            query = "SELECT * FROM jobs WHERE 1=1"
            params: list = []
            if user_id:
                query += " AND user_id = ?"
                params.append(user_id)
            if project_id:
                query += " AND project_id = ?"
                params.append(project_id)
            if chapter_id:
                query += " AND chapter_id = ?"
                params.append(chapter_id)
            if status:
                query += " AND UPPER(status) = ?"
                params.append(status.upper())
            if job_type:
                query += " AND UPPER(type) = ?"
                params.append(job_type.upper())

            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([max(1, min(500, limit)), max(0, offset)])

            rows = conn.execute(query, tuple(params)).fetchall()
            return [_job_record_from_row(dict(r)) for r in rows]

    def delete_job_admin(self, job_id: str) -> bool:
        """Deletes a job record from the database."""
        with get_db_connection() as conn:
            res = conn.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
            conn.commit()
            return res.rowcount > 0

    def purge_completed_jobs_admin(self) -> int:
        """Purges all terminal (COMPLETED, FAILED, CANCELLED) jobs."""
        with get_db_connection() as conn:
            res = conn.execute("DELETE FROM jobs WHERE status IN ('COMPLETED', 'FAILED', 'CANCELLED')")
            conn.commit()
            return res.rowcount

    def update_progress(
        self,
        job_id: str,
        progress: float,
        stage: Optional[str] = None,
        status: Optional[JobStatus] = None
    ) -> Optional[JobRecord]:
        """Updates progress and stage for an active job."""
        job = self.get_job(job_id)
        if not job:
            return None

        # Protect terminal states
        if job.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
            logger.warning(f"[JobManager] Cannot update progress for terminal job {job_id} ({job.status})")
            return job

        new_progress = max(0.0, min(100.0, progress))
        new_stage = stage if stage else job.stage
        new_status = status if status else job.status
        now = datetime.datetime.now().isoformat()
        started_at = job.started_at

        # Transition from QUEUED to RUNNING implicitly or explicitly sets started_at
        if job.status == JobStatus.QUEUED and new_status == JobStatus.RUNNING:
            started_at = now
        elif job.status == JobStatus.QUEUED and status is None:
            new_status = JobStatus.RUNNING
            started_at = now

        with get_db_connection() as conn:
            cursor = conn.execute(
                """
                UPDATE jobs
                SET progress = ?, stage = ?, status = ?, started_at = ?
                WHERE id = ? AND status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED')
                """,
                (new_progress, new_stage, new_status.value, started_at, job_id)
            )
            conn.commit()
            if cursor.rowcount == 0:
                logger.warning(f"[JobManager] update_progress failed for job {job_id}. Possible race condition or already terminal.")
                return self.get_job(job_id)

        logger.debug(f"[JobManager] Job {job_id} progress: {new_progress:.1f}% | stage={new_stage}")
        return self.get_job(job_id)

    def complete_job(self, job_id: str, result: Any = None) -> Optional[JobRecord]:
        """Marks a job as COMPLETED with its output result."""
        job = self.get_job(job_id)
        if not job:
            return None

        if job.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
            logger.warning(f"[JobManager] Cannot complete terminal job {job_id} ({job.status})")
            return job

        now = datetime.datetime.now().isoformat()
        result_json = json.dumps(result) if result is not None else None

        with get_db_connection() as conn:
            cursor = conn.execute(
                """
                UPDATE jobs
                SET status = ?, progress = ?, stage = ?, completed_at = ?, result = ?
                WHERE id = ? AND status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED')
                """,
                (JobStatus.COMPLETED.value, 100.0, JobStage.COMPLETED.value, now, result_json, job_id)
            )
            conn.commit()
            if cursor.rowcount == 0:
                logger.warning(f"[JobManager] complete_job failed for job {job_id}. Possible race condition.")
                return self.get_job(job_id)

        logger.info(f"[JobManager] Job {job_id} COMPLETED successfully")
        return self.get_job(job_id)

    def fail_job(
        self,
        job_id: str,
        error_message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> Optional[JobRecord]:
        """Marks a job as FAILED with error payload."""
        job = self.get_job(job_id)
        if not job:
            return None

        if job.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
            logger.warning(f"[JobManager] Cannot fail terminal job {job_id} ({job.status})")
            return job

        now = datetime.datetime.now().isoformat()
        error_payload = {
            "code": error_code or "INTERNAL_ERROR",
            "message": error_message,
            "details": details or {}
        }
        error_json = json.dumps(error_payload)

        with get_db_connection() as conn:
            cursor = conn.execute(
                """
                UPDATE jobs
                SET status = ?, stage = ?, completed_at = ?, error = ?
                WHERE id = ? AND status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED')
                """,
                (JobStatus.FAILED.value, JobStage.FAILED.value, now, error_json, job_id)
            )
            conn.commit()
            if cursor.rowcount == 0:
                logger.warning(f"[JobManager] fail_job failed for job {job_id}. Possible race condition.")
                return self.get_job(job_id)

        logger.error(f"[JobManager] Job {job_id} FAILED: {error_message}")
        return self.get_job(job_id)

    def cancel_job(self, job_id: str) -> Optional[JobRecord]:
        """Cancels a running or queued job."""
        job = self.get_job(job_id)
        if not job:
            return None

        if job.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
            logger.warning(f"[JobManager] Cannot cancel terminal job {job_id} ({job.status})")
            return job

        now = datetime.datetime.now().isoformat()

        with get_db_connection() as conn:
            cursor = conn.execute(
                """
                UPDATE jobs
                SET status = ?, stage = ?, cancelled_at = ?
                WHERE id = ? AND status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED')
                """,
                (JobStatus.CANCELLED.value, JobStage.CANCELLED.value, now, job_id)
            )
            conn.commit()
            if cursor.rowcount == 0:
                logger.warning(f"[JobManager] cancel_job failed for job {job_id}. Possible race condition.")
                return self.get_job(job_id)

        task = self._tasks.get(job_id)
        if task and not task.done():
            task.cancel()

        logger.info(f"[JobManager] Job {job_id} CANCELLED")
        return self.get_job(job_id)

    def run_in_background(
        self,
        job_id: str,
        coroutine_func: Callable[[Callable[[float, str], None]], Coroutine[Any, Any, Any]]
    ):
        """
        Dispatches a background async task.
        Passes a `report_progress(pct, stage_name)` callback into the coroutine function.
        """
        def report_progress(pct: float, stage: str = ""):
            self.update_progress(job_id, pct, stage=stage)

        async def _wrapper():
            # Update to RUNNING with started_at correctly set in db
            self.update_progress(job_id, 0.0, status=JobStatus.RUNNING)
            try:
                result = await coroutine_func(report_progress)
                self.complete_job(job_id, result=result)
            except asyncio.CancelledError:
                self.cancel_job(job_id)
            except Exception as e:
                logger.error(f"[JobManager] Background task error on {job_id}: {e}", exc_info=True)
                self.fail_job(job_id, error_message=str(e))
            finally:
                self._tasks.pop(job_id, None)

        task = asyncio.create_task(_wrapper())
        self._tasks[job_id] = task


# Global singleton instance
job_manager = UnifiedJobManager()
