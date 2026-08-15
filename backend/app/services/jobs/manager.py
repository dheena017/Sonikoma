"""
backend/app/services/jobs/manager.py
─────────────────────────────────────────────────────────────────────────────
Unified in-memory Job Manager for asynchronous tasks, progress tracking, and results.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import uuid
import asyncio
import logging
from typing import Dict, Any, Optional, Callable, Coroutine, List

from .models import JobRecord, JobStatus, JobType, JobStage

logger = logging.getLogger("sonikoma.services.jobs")


class UnifiedJobManager:
    """Central Job Manager across all processing domains."""

    def __init__(self):
        self._jobs: Dict[str, JobRecord] = {}
        self._tasks: Dict[str, asyncio.Task] = {}

    def create_job(
        self,
        job_type: JobType,
        project_id: Optional[str] = None,
        job_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> JobRecord:
        """Creates a new Job in QUEUED state."""
        if not job_id:
            job_id = f"job_{uuid.uuid4().hex[:12]}"

        record = JobRecord(
            job_id=job_id,
            type=job_type,
            status=JobStatus.QUEUED,
            progress=0.0,
            stage=JobStage.QUEUED.value,
            project_id=project_id,
            created_at=time.time(),
            metadata=metadata or {}
        )
        self._jobs[job_id] = record
        logger.info(f"[JobManager] Created job {job_id} (type={job_type.value}, project={project_id or 'N/A'})")
        return record

    def get_job(self, job_id: str) -> Optional[JobRecord]:
        """Retrieves a job by ID."""
        return self._jobs.get(job_id)

    def list_jobs(self, project_id: Optional[str] = None) -> List[JobRecord]:
        """Lists jobs, optionally filtered by project ID."""
        jobs = list(self._jobs.values())
        if project_id:
            jobs = [j for j in jobs if j.project_id == project_id]
        return sorted(jobs, key=lambda j: j.created_at, reverse=True)

    def update_progress(
        self,
        job_id: str,
        progress: float,
        stage: Optional[str] = None,
        status: Optional[JobStatus] = None
    ) -> Optional[JobRecord]:
        """Updates progress and stage for an active job."""
        job = self._jobs.get(job_id)
        if not job:
            return None

        job.progress = max(0.0, min(100.0, progress))
        if stage:
            job.stage = stage

        if status:
            job.status = status
        elif job.status == JobStatus.QUEUED:
            job.status = JobStatus.RUNNING
            job.started_at = time.time()

        logger.debug(f"[JobManager] Job {job_id} progress: {job.progress:.1f}% | stage={job.stage}")
        return job

    def complete_job(self, job_id: str, result: Any = None) -> Optional[JobRecord]:
        """Marks a job as COMPLETED with its output result."""
        job = self._jobs.get(job_id)
        if not job:
            return None

        job.status = JobStatus.COMPLETED
        job.progress = 100.0
        job.stage = JobStage.COMPLETED.value
        job.completed_at = time.time()
        job.result = result
        logger.info(f"[JobManager] Job {job_id} COMPLETED successfully")
        return job

    def fail_job(
        self,
        job_id: str,
        error_message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> Optional[JobRecord]:
        """Marks a job as FAILED with error payload."""
        job = self._jobs.get(job_id)
        if not job:
            return None

        job.status = JobStatus.FAILED
        job.stage = JobStage.FAILED.value
        job.completed_at = time.time()
        job.error = {
            "code": error_code or "INTERNAL_ERROR",
            "message": error_message,
            "details": details or {}
        }
        logger.error(f"[JobManager] Job {job_id} FAILED: {error_message}")
        return job

    def cancel_job(self, job_id: str) -> Optional[JobRecord]:
        """Cancels a running or queued job."""
        job = self._jobs.get(job_id)
        if not job:
            return None

        job.status = JobStatus.CANCELLED
        job.stage = JobStage.CANCELLED.value
        job.completed_at = time.time()

        task = self._tasks.get(job_id)
        if task and not task.done():
            task.cancel()

        logger.info(f"[JobManager] Job {job_id} CANCELLED")
        return job

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
