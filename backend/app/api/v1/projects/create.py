"""
api/v1/projects/create.py
─────────────────────────────────────────────────────────────────────────────
Project creation routes and token-usage calculation helper.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import uuid
from typing import List

from fastapi import APIRouter, HTTPException, Depends

from api.dependencies.auth import get_current_user
from schemas.project import ProjectCreateRequest
from repositories.project_repository import (
    get_project,
    insert_project,
    insert_token_log,
)
from database.connection import unwrap_proxy_url

logger = logging.getLogger("sonikoma.routes.projects.create")
router = APIRouter()


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

    log_id = str(uuid.uuid4())

    try:
        insert_token_log(
            log_id, project_id, input_tokens, output_tokens, total_tokens, cost
        )
    except Exception as e:
        logger.error(f"Failed to insert local token usage log: {e}")

    try:
        from db import supabase
        if supabase:
            supabase.table("projects").update({"usage_metrics": usage_metrics}).eq("id", project_id).execute()
            supabase.table("token_usage_logs").insert({
                "id": log_id,
                "project_id": project_id,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "estimated_cost_usd": cost,
            }).execute()
            logger.info(f"Saved usage metrics for project {project_id}: {usage_metrics}")
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
        existing = get_project(body.project_id)
        if existing:
            logger.info(
                f"[Database] Project {body.project_id} already exists. Skipping insertion."
            )
            return {
                "success": True,
                "project_id": body.project_id,
                "message": "Project already exists.",
            }

        insert_project({
            "project_id": body.project_id,
            "url": unwrap_proxy_url(body.url),
            "title": body.title,
            "genre": body.genre,
            "episode": body.episode,
            "status": "pending",
            "panels_count": body.panels_count,
            "video_url": body.video_url,
            "user_id": current_user["user_id"],
            "author": body.author,
            "cover_image": unwrap_proxy_url(body.cover_image),
            "synopsis": body.synopsis,
        })
        logger.info(
            f"[Database] Created project {body.project_id} successfully: '{body.title}'"
        )
        return {"success": True, "project_id": body.project_id}
    except Exception as e:
        logger.error(f"Failed to save project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save project: {e}")
