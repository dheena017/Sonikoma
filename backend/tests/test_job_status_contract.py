"""
backend/tests/test_job_status_contract.py
─────────────────────────────────────────────────────────────────────────────
Tests for canonical JobStatusResponse contract on GET /api/jobs/{job_id}.
─────────────────────────────────────────────────────────────────────────────
"""
import pytest
from services.jobs.models import (
    JobRecord,
    JobStatus,
    JobType,
    JobStage,
    JobStatusResponse,
    JobExecutionInfo,
    JobErrorInfo,
)


def test_job_status_response_running():
    record = JobRecord(
        job_id="job_ee0d933ce498",
        user_id="user_123",
        project_id="proj_solo_leveling",
        chapter_id="chap_ep_1",
        type=JobType.GENERATE_STORYBOARD,
        status=JobStatus.RUNNING,
        progress=65.0,
        stage="panel_analysis",
        created_at="2026-08-18T10:00:00Z",
        metadata={
            "capability": "storyboard_generation",
            "provider": "gemini",
            "model": "gemini-2.5-flash",
            "attempt": 1,
        },
    )

    resp = record.to_status_response()
    assert isinstance(resp, JobStatusResponse)
    assert resp.job_id == "job_ee0d933ce498"
    assert resp.project_id == "proj_solo_leveling"
    assert resp.chapter_id == "chap_ep_1"
    assert resp.job_type == "generate_storyboard"
    assert resp.capability == "storyboard_generation"
    assert resp.status == "running"
    assert resp.progress == 65
    assert resp.stage == "panel_analysis"
    assert resp.execution is not None
    assert resp.execution.provider == "gemini"
    assert resp.execution.model == "gemini-2.5-flash"
    assert resp.execution.attempt == 1
    assert resp.result is None
    assert resp.error is None


def test_job_status_response_completed():
    record = JobRecord(
        job_id="job_ee0d933ce498",
        user_id="user_123",
        type=JobType.GENERATE_STORYBOARD,
        status=JobStatus.COMPLETED,
        progress=100.0,
        stage="completed",
        created_at="2026-08-18T10:00:00Z",
        completed_at="2026-08-18T10:01:00Z",
        result={"storyboard_id": "storyboard_123"},
        metadata={
            "capability": "storyboard_generation",
            "provider": "gemini",
            "model": "gemini-2.5-flash",
            "attempt": 1,
        },
    )

    resp = record.to_status_response()
    assert resp.status == "completed"
    assert resp.progress == 100
    assert resp.stage == "completed"
    assert resp.result == {"storyboard_id": "storyboard_123"}
    assert resp.error is None


def test_job_status_response_failed():
    record = JobRecord(
        job_id="job_ee0d933ce498",
        user_id="user_123",
        type=JobType.GENERATE_STORYBOARD,
        status=JobStatus.FAILED,
        progress=65.0,
        stage="panel_analysis",
        created_at="2026-08-18T10:00:00Z",
        error={
            "code": "PROVIDER_UNAVAILABLE",
            "message": "AI provider temporarily unavailable",
            "stage": "panel_analysis",
            "provider": "gemini",
            "model": "gemini-2.5-flash",
            "attempt": 5,
        },
        metadata={
            "capability": "narrative_analysis",
            "provider": "gemini",
            "model": "gemini-2.5-flash",
            "attempt": 5,
        },
    )

    resp = record.to_status_response()
    assert resp.status == "failed"
    assert resp.progress == 65
    assert resp.capability == "narrative_analysis"
    assert resp.error is not None
    assert resp.error.code == "PROVIDER_UNAVAILABLE"
    assert resp.error.message == "AI provider temporarily unavailable"
    assert resp.error.stage == "panel_analysis"
    assert resp.error.provider == "gemini"
    assert resp.error.model == "gemini-2.5-flash"
    assert resp.execution.attempt == 5


def test_job_list_response():
    record1 = JobRecord(
        job_id="job_1",
        user_id="user_123",
        project_id="proj_1",
        chapter_id="chap_1",
        type=JobType.SCRAPE_CHAPTER,
        status=JobStatus.COMPLETED,
        progress=100.0,
        stage="completed",
        created_at="2026-08-18T10:00:00Z",
    )
    record2 = JobRecord(
        job_id="job_2",
        user_id="user_123",
        project_id="proj_1",
        chapter_id="chap_2",
        type=JobType.RENDER_VIDEO,
        status=JobStatus.RUNNING,
        progress=45.0,
        stage="rendering_video",
        created_at="2026-08-18T10:05:00Z",
    )

    from services.jobs.models import JobListResponse

    list_resp = JobListResponse(
        success=True,
        total=2,
        jobs=[record1.to_status_response(), record2.to_status_response()]
    )

    assert list_resp.success is True
    assert list_resp.total == 2
    assert len(list_resp.jobs) == 2
    assert list_resp.jobs[0].job_id == "job_1"
    assert list_resp.jobs[0].chapter_id == "chap_1"
    assert list_resp.jobs[1].job_id == "job_2"
    assert list_resp.jobs[1].chapter_id == "chap_2"
    assert list_resp.jobs[1].progress == 45
