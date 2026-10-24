"""
Autonomous Video Agent API Router.
"""

import uuid
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from features.ai.agent.agent_workflow import start_video_agent
from features.ai.agent.agent_jobs import (
    check_job,
    approve_job,
    get_all_jobs,
)

router = APIRouter(prefix="/agent", tags=["Autonomous Video Agent"])


class RunAgentRequest(BaseModel):
    chapter_url: str
    video_shape: str = "shorts"
    language: str = "en"
    default_voice: str = "en-US-ChristopherNeural"
    pause_for_review: bool = False
    max_panels: Optional[int] = None
    user_id: Optional[str] = "default_user"


class ApproveAgentRequest(BaseModel):
    user_changes: Optional[Dict[str, Any]] = None


@router.post("/run")
async def endpoint_run_agent(
    req: RunAgentRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Starts the 1-click autonomous video agent."""
    run_id = f"run_{uuid.uuid4().hex[:12]}"

    background_tasks.add_task(
        start_video_agent,
        run_id=run_id,
        chapter_url=req.chapter_url,
        video_shape=req.video_shape,
        language=req.language,
        default_voice=req.default_voice,
        pause_for_review=req.pause_for_review,
        max_panels=req.max_panels,
        user_id=req.user_id,
    )

    return {
        "status": "started",
        "run_id": run_id,
        "message": "Autonomous video agent pipeline started in background"
    }


@router.get("/status/{job_id}")
def endpoint_check_agent_job(job_id: str) -> Dict[str, Any]:
    """Fetches real-time status and logs for an agent run."""
    job = check_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Agent job {job_id} not found")
    return job


@router.post("/approve/{job_id}")
def endpoint_approve_agent_job(job_id: str, req: Optional[ApproveAgentRequest] = None) -> Dict[str, Any]:
    """Approves an agent job paused at the human review checkpoint."""
    try:
        changes = req.user_changes if req else None
        return approve_job(job_id=job_id, user_changes=changes)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs")
def endpoint_get_agent_jobs(user_id: str = "default_user") -> List[Dict[str, Any]]:
    """Returns recent agent jobs for a user."""
    return get_all_jobs(user_id)


__all__ = ["router"]
