"""
backend/app/services/video/job_queue.py
─────────────────────────────────────────────────────────────────────────────
In-memory job queue manager for background video transcode and rendering tasks.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import uuid
import asyncio
import logging
from typing import Dict, Any, Optional, Callable, Coroutine

logger = logging.getLogger("sonikoma.services.video.job_queue")


class VideoJobQueueManager:
    """Manages background FFmpeg and rendering job statuses in-memory."""

    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}

    def create_job(self, task_name: str) -> str:
        """Create a new job record and return its unique job_id."""
        job_id = str(uuid.uuid4())
        self.jobs[job_id] = {
            "job_id": job_id,
            "task_name": task_name,
            "status": "pending",
            "progress": 0.0,
            "created_at": time.time(),
            "started_at": None,
            "completed_at": None,
            "result": None,
            "error": None
        }
        logger.info(f"[Job Queue] Created job {job_id} for task '{task_name}'")
        return job_id

    def update_status(self, job_id: str, status: str, progress: float = 0.0, result: Any = None, error: Optional[str] = None):
        """Update status and metadata of a specific job."""
        if job_id not in self.jobs:
            return
        
        job = self.jobs[job_id]
        job["status"] = status
        job["progress"] = progress
        
        if status == "running" and job["started_at"] is None:
            job["started_at"] = time.time()
        elif status in ("completed", "failed"):
            job["completed_at"] = time.time()
            
        if result is not None:
            job["result"] = result
        if error is not None:
            job["error"] = error

        logger.debug(f"[Job Queue] Job {job_id} updated: status={status}, progress={progress}%")

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve job record by ID."""
        return self.jobs.get(job_id)

    def list_jobs(self) -> Dict[str, Dict[str, Any]]:
        """List all managed job records."""
        return self.jobs

    def run_in_background(self, job_id: str, coroutine_func: Callable[[], Coroutine[Any, Any, Any]]):
        """Launches a coroutine in the background, updating status automatically on completion."""
        async def wrapper():
            self.update_status(job_id, "running", progress=10.0)
            try:
                result = await coroutine_func()
                self.update_status(job_id, "completed", progress=100.0, result=result)
                logger.info(f"[Job Queue] Job {job_id} completed successfully")
            except Exception as e:
                err_msg = str(e)
                self.update_status(job_id, "failed", progress=0.0, error=err_msg)
                logger.error(f"[Job Queue] Job {job_id} failed: {err_msg}", exc_info=True)

        asyncio.create_task(wrapper())


# Singleton instance
_job_queue_instance: Optional[VideoJobQueueManager] = None


def get_job_queue() -> VideoJobQueueManager:
    """Retrieve the job queue manager singleton."""
    global _job_queue_instance
    if _job_queue_instance is None:
        _job_queue_instance = VideoJobQueueManager()
    return _job_queue_instance
