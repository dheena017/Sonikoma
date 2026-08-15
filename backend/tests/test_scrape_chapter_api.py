"""
backend/tests/test_scrape_chapter_api.py
─────────────────────────────────────────────────────────────────────────────
Unit tests for the canonical Job-based scraper and jobs API.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from api.router import api_router
from services.jobs import job_manager, JobStatus, JobType
from services.scraper.models import (
    ChapterResult,
    SourceInfo,
    SeriesInfo,
    ChapterInfo,
    ImageItem,
    ScrapeDiagnostics,
    ScrapeCompleteness
)

app = FastAPI()
app.include_router(api_router)
client = TestClient(app)


def test_scrape_chapter_empty_url_returns_400():
    response = client.post("/api/scraper/chapter", json={"url": ""})
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]


@pytest.mark.asyncio
async def test_unified_job_lifecycle():
    job = job_manager.create_job(
        job_type=JobType.SCRAPE_CHAPTER,
        project_id="test_proj"
    )
    assert job.status == JobStatus.QUEUED
    assert job.progress == 0.0

    job_manager.update_progress(job.job_id, 45.0, stage="FETCHING")
    fetched = job_manager.get_job(job.job_id)
    assert fetched.status == JobStatus.RUNNING
    assert fetched.progress == 45.0
    assert fetched.stage == "FETCHING"

    job_manager.complete_job(job.job_id, result={"title": "Test Comic"})
    completed = job_manager.get_job(job.job_id)
    assert completed.status == JobStatus.COMPLETED
    assert completed.progress == 100.0
    assert completed.result == {"title": "Test Comic"}


def test_get_job_status_api():
    job = job_manager.create_job(job_type=JobType.PANEL_SPLIT, project_id="p1")
    job_manager.update_progress(job.job_id, 50.0, stage="SPLITTING")

    resp = client.get(f"/api/v1/jobs/{job.job_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["job_id"] == job.job_id
    assert data["type"] == "PANEL_SPLIT"
    assert data["progress"] == 50.0
    assert data["stage"] == "SPLITTING"


def test_cancel_job_api():
    job = job_manager.create_job(job_type=JobType.OCR, project_id="p2")
    resp = client.post(f"/api/v1/jobs/{job.job_id}/cancel")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "CANCELLED"


@patch("api.v1.scraper.AdaptiveScraperEngine.scrape_url", new_callable=AsyncMock)
def test_scrape_chapter_creates_job_and_completes(mock_scrape):
    mock_result = ChapterResult(
        success=True,
        source=SourceInfo(
            original_url="https://www.webtoons.com/en/fantasy/tower/ep-1/viewer?title_no=95&episode_no=1",
            canonical_url="https://www.webtoons.com/en/fantasy/tower/ep-1/viewer?title_no=95&episode_no=1",
            domain="www.webtoons.com",
            platform="webtoons"
        ),
        series=SeriesInfo(
            title="Tower of God",
            author="SIU",
            genres=["Fantasy", "Action"],
            cover_image="https://example.com/cover.jpg",
            description="Tower of God comic series"
        ),
        chapter=ChapterInfo(
            number=1,
            title="Chapter 1",
            url="https://www.webtoons.com/en/fantasy/tower/ep-1/viewer?title_no=95&episode_no=1"
        ),
        images=[
            ImageItem(index=0, url="https://example.com/panel_001.webp", width=800, height=1200, is_new=True),
            ImageItem(index=1, url="https://example.com/panel_002.webp", width=800, height=1200, is_new=True)
        ],
        scrape=ScrapeDiagnostics(
            image_count=2,
            new_image_count=2,
            completeness=ScrapeCompleteness.COMPLETE,
            delivery_mechanism="DOM_READER",
            level_used="Level 1: Static HTTP + DOM Reader"
        )
    )
    mock_scrape.return_value = mock_result

    payload = {
        "url": "https://www.webtoons.com/en/fantasy/tower/ep-1/viewer?title_no=95&episode_no=1",
        "project_id": "proj_12345",
        "force_refresh": True,
        "proxy_images": True
    }

    # 1. Post to create job
    response = client.post("/api/v1/scraper/chapter", json=payload)
    assert response.status_code == 200
    job_data = response.json()

    assert "job_id" in job_data
    assert job_data["type"] == "SCRAPE_CHAPTER"
    assert job_data["project_id"] == "proj_12345"

    # 2. Check job status
    job_id = job_data["job_id"]
    status_resp = client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["job_id"] == job_id
