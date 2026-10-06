"""
backend/common/jobs/__init__.py
─────────────────────────────────────────────────────────────────────────────
Common Asynchronous Job System:
Re-exports the unified background execution engine, statuses, and response models.
─────────────────────────────────────────────────────────────────────────────
"""

from features.platform.jobs.schemas import (
    JobType,
    JobStage,
    JobStatus,
    JobRecord,
    JobStatusResponse,
    JobListResponse,
    JobExecutionInfo,
    JobErrorInfo,
)
from features.platform.jobs.service import (
    job_manager,
    UnifiedJobManager,
)

__all__ = [
    "job_manager",
    "JobType",
    "JobStage",
    "JobStatus",
    "JobRecord",
    "JobStatusResponse",
    "JobListResponse",
    "JobExecutionInfo",
    "JobErrorInfo",
    "UnifiedJobManager",
]
