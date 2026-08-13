"""
backend/app/services/scraper/batch_job_service.py
─────────────────────────────────────────────────────────────────────────────
Background batch scraper queue and async progress tracker.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import uuid
import logging
import asyncio
from typing import List, Dict, Any, Optional

logger = logging.getLogger("sonikoma.services.scraper.batch_job_service")

# In-memory batch job store
BATCH_JOBS: Dict[str, Dict[str, Any]] = {}


def create_batch_job(
    urls: List[str],
    project_id: Optional[str] = None,
    workspace_job_id: Optional[str] = None,
) -> str:
    """Initializes a new background batch scraping job."""
    batch_execution_id = f"batch_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    BATCH_JOBS[batch_execution_id] = {
        "job_id": batch_execution_id,
        "execution_id": batch_execution_id,
        "project_id": project_id,
        "workspace_job_id": workspace_job_id,
        "status": "queued",
        "progress_percentage": 0,
        "total_urls": len(urls),
        "completed_count": 0,
        "failed_count": 0,
        "urls": urls,
        "results": [],
        "created_at": time.time(),
        "updated_at": time.time()
    }
    return batch_execution_id


def get_batch_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves current progress status for a batch scraping job."""
    return BATCH_JOBS.get(job_id)


async def execute_batch_job(job_id: str, options: Dict[str, Any]):
    """Asynchronously processes a list of webtoon URLs in the background."""
    from services.image.scraper.scraper_service import scrape_and_initialize_project

    job = BATCH_JOBS.get(job_id)
    if not job:
        return

    job["status"] = "processing"
    job["updated_at"] = time.time()
    urls = job["urls"]
    total = len(urls)

    for idx, u in enumerate(urls):
        try:
            res = await scrape_and_initialize_project(
                url=u,
                project_id=job.get("project_id"),
                job_id=job.get("workspace_job_id"),
                limit=options.get("limit"),
                proxy_images=options.get("proxy_images", True),
                filter_banners=options.get("filter_banners", True),
                include_metadata=options.get("include_metadata", True)
            )
            job["results"].append({"url": u, "status": "success", "data": res})
            job["completed_count"] += 1
        except Exception as err:
            logger.error(f"[Batch Scraper] Error scraping URL '{u}': {err}")
            job["results"].append({"url": u, "status": "error", "error": str(err)})
            job["failed_count"] += 1

        pct = int(((idx + 1) / total) * 100)
        job["progress_percentage"] = pct
        job["updated_at"] = time.time()

    job["status"] = "completed"
    job["progress_percentage"] = 100
    job["updated_at"] = time.time()
    logger.info(f"[Batch Scraper] Job '{job_id}' completed with {job['completed_count']} successes and {job['failed_count']} failures.")
