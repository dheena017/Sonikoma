"""
backend/features/creative/agent/router.py
─────────────────────────────────────────────────────────────────────────────
FastAPI Router for the One-Click Autonomous Creative AI Agent:
- POST /api/v1/creative/agent/run       -> Launch autonomous URL -> YouTube pipeline
- GET  /api/v1/creative/agent/status/{id} -> Poll progress, logs, panels & final YouTube URL
- POST /api/v1/creative/agent/approve/{id}-> Approve review checkpoint
- GET  /api/v1/creative/agent/history    -> List previous agent execution runs
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends

from app.core.dependencies.auth import get_optional_current_user
from features.creative.agent.schemas import (
    AgentRunRequest,
    AgentRunResponse,
    AgentApproveRequest,
    AgentHistoryListResponse,
)
from features.creative.agent.service import agent_service

logger = logging.getLogger("sonikoma.creative.agent.router")
router = APIRouter()


def _extract_user_id(current_user: Optional[dict]) -> Optional[str]:
    if not current_user or not isinstance(current_user, dict):
        return None
    return current_user.get("id") or current_user.get("user_id") or current_user.get("sub")


@router.post("/run", response_model=AgentRunResponse, summary="Launch One-Click AI Agent")
async def launch_agent_endpoint(
    request: AgentRunRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """
    Launches the autonomous AI agent. Takes a Webtoon/Manga URL, scrapes images,
    stitches & crops panels, generates narrative and audio, compiles the video,
    and publishes directly to YouTube with AI-generated SEO headers.
    """
    user_id = _extract_user_id(current_user)
    try:
        initial_state = agent_service.start_agent_run(request=request, user_id=user_id)
        return initial_state
    except Exception as e:
        logger.error(f"[Agent Router] Failed to launch agent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{run_id}", response_model=AgentRunResponse, summary="Get Agent Run Status")
async def get_agent_status_endpoint(run_id: str):
    """Polls real-time progress, terminal logs, panel previews, and the published YouTube link."""
    state = agent_service.get_agent_run(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Agent run '{run_id}' not found.")
    return state


@router.post("/approve/{run_id}", response_model=AgentRunResponse, summary="Approve Review Checkpoint")
async def approve_agent_endpoint(
    run_id: str,
    approve_data: Optional[AgentApproveRequest] = None,
):
    """Resumes an agent run that paused in 'awaiting_review' mode to compile video and publish to YouTube."""
    state = await agent_service.approve_and_resume_run(run_id=run_id, approve_data=approve_data)
    if not state:
        raise HTTPException(status_code=404, detail=f"Agent run '{run_id}' not found.")
    return state


@router.get("/history", response_model=AgentHistoryListResponse, summary="Get Agent Runs History")
async def get_agent_history_endpoint(
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """Returns a list of previous agent execution runs with their YouTube links."""
    user_id = _extract_user_id(current_user)
    runs = agent_service.list_agent_runs(user_id=user_id)
    return AgentHistoryListResponse(runs=runs, total=len(runs))


agent_router = router
__all__ = ["agent_router", "router"]
