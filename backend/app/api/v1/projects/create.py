"""
api/v1/projects/create.py
─────────────────────────────────────────────────────────────────────────────
Project creation routes and token-usage calculation helper.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List

from fastapi import APIRouter, HTTPException, Depends

from api.dependencies.auth import get_current_user
from schemas.project import ProjectCreateRequest
from services.project.project_service import ProjectService

logger = logging.getLogger("sonikoma.routes.projects.create")
router = APIRouter()
service = ProjectService()


# ── Token-usage helper ────────────────────────────────────────────────────


def calculate_and_save_token_usage(
    project_id: str,
    panels: List[dict],
    price_per_million: float = 0.50,
) -> dict:
    """Sum token usage across all panels, estimate cost, and persist the log."""
    input_tokens = sum(panel.get("inputTokens", 0) for panel in panels)
    output_tokens = sum(panel.get("outputTokens", 0) for panel in panels)
    total_tokens = input_tokens + output_tokens
    cost = round((total_tokens / 1_000_000.0) * price_per_million, 6)

    usage_metrics = {
        "inputTokens": input_tokens,
        "outputTokens": output_tokens,
        "totalTokens": total_tokens,
        "estimatedCostUSD": cost,
    }

    try:
        service.sync_project_to_supabase(project_id, None, "")
    except Exception as e:
        logger.error(f"Failed to save token usage metrics to Supabase: {e}")

    return usage_metrics


# ── Routes ────────────────────────────────────────────────────────────────


@router.post("", summary="Create a new project entry")
async def create_project(
    body: ProjectCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Attempting to create new project: {body.project_id} "
            f"for user {current_user['user_id']}"
        )
        result = service.create_project(body, current_user["user_id"])
        logger.info(
            f"[Database] Created project {body.project_id} successfully: '{body.title}'"
        )
        return result
    except Exception as e:
        logger.error(f"Failed to save project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save project: {e}")
