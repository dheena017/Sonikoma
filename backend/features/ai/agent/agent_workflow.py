"""
Autonomous agent video workflow.

Runs the complete 1-click video agent pipeline:
scrapes chapter pictures, cuts panels, reads dialogue and writes script,
assigns character voices, and renders a cinematic video.
"""

from typing import Dict, Any, Optional
import time
import logging
from database.engine import get_db_connection
from features.creative.agent.workflow import AutonomousAgentWorkflow
from features.creative.agent.schemas import AgentRunRequest

logger = logging.getLogger("sonikoma.features.ai.agent.workflow")


def _save_step_status(run_id: str, percent: int, step_name: str) -> None:
    """Updates progress percentage and action description in the database."""
    try:
        with get_db_connection() as conn:
            conn.execute(
                """
                UPDATE creative_agent_runs
                SET progress = ?,
                    current_action = ?,
                    updated_at = ?
                WHERE run_id = ?
                """,
                (percent, step_name, time.time(), run_id),
            )
            conn.commit()
    except Exception as e:
        logger.warning(f"Failed to update step status for {run_id}: {e}")


async def start_video_agent(
    run_id: str,
    chapter_url: str,
    video_shape: str = "shorts",
    language: str = "en",
    default_voice: str = "en-US-ChristopherNeural",
    pause_for_review: bool = False,
    max_panels: Optional[int] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Runs the complete 1-click process: scrapes chapter, cuts panels, writes script, speaks audio, and builds video."""
    _save_step_status(run_id, 5, "Initializing video agent...")

    req = AgentRunRequest(
        url=chapter_url,
        video_format=video_shape,
        language=language,
        voice=default_voice,
        pause_for_review=pause_for_review,
        max_panels=max_panels,
    )

    workflow = AutonomousAgentWorkflow(
        run_id=run_id,
        request=req,
        user_id=user_id,
    )

    return workflow.state.model_dump()


__all__ = ["start_video_agent", "AutonomousAgentWorkflow"]
