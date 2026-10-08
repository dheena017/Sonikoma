"""
backend/features/creative/agent/service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for the Creative AI Agent:
Manages active runs, background execution scheduling, status polling,
and review approvals.
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import time
import asyncio
import logging
from typing import Dict, List, Optional

from features.creative.agent.schemas import (
    AgentRunRequest,
    AgentRunResponse,
    AgentApproveRequest,
)
from features.creative.agent.workflow import AutonomousAgentWorkflow

logger = logging.getLogger("sonikoma.creative.agent.service")


class CreativeAgentService:
    """Singleton service for managing autonomous agent runs."""

    def __init__(self):
        # In-memory store for fast polling; keeps recent runs
        self._workflows: Dict[str, AutonomousAgentWorkflow] = {}

    def start_agent_run(
        self, request: AgentRunRequest, user_id: Optional[str] = None
    ) -> AgentRunResponse:
        """Initializes and begins asynchronous execution of an agent workflow."""
        run_id = f"ag_{uuid.uuid4().hex[:12]}"
        workflow = AutonomousAgentWorkflow(run_id=run_id, request=request, user_id=user_id)
        self._workflows[run_id] = workflow

        # Launch background task
        asyncio.create_task(workflow.execute())
        logger.info(f"[CreativeAgentService] Started agent run {run_id} for user {user_id}")
        return workflow.state

    def get_agent_run(self, run_id: str) -> Optional[AgentRunResponse]:
        """Retrieves the current state and logs of a specific agent run."""
        workflow = self._workflows.get(run_id)
        if not workflow:
            return None
        return workflow.state

    async def approve_and_resume_run(
        self, run_id: str, approve_data: Optional[AgentApproveRequest] = None
    ) -> Optional[AgentRunResponse]:
        """Resumes a run that is paused in 'awaiting_review' state."""
        workflow = self._workflows.get(run_id)
        if not workflow:
            return None

        if workflow.state.status != "awaiting_review":
            return workflow.state

        if approve_data:
            if approve_data.title_override:
                workflow.state.scraped_title = approve_data.title_override
            if approve_data.privacy_status:
                workflow.request.privacy_status = approve_data.privacy_status

        workflow.log("review", "User approved! Resuming video render and YouTube publish...", level="info")
        asyncio.create_task(workflow._render_and_publish())
        return workflow.state

    def list_agent_runs(self, user_id: Optional[str] = None, limit: int = 20) -> List[AgentRunResponse]:
        """Returns past agent runs, optionally filtered by user."""
        all_states = [w.state for w in self._workflows.values()]
        if user_id and user_id != "anonymous":
            all_states = [s for s in all_states if s.user_id == user_id]
        all_states.sort(key=lambda s: s.created_at, reverse=True)
        return all_states[:limit]


agent_service = CreativeAgentService()

__all__ = ["CreativeAgentService", "agent_service"]
