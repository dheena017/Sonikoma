"""
backend/app/features/platform/terminal/router.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FastAPI router for developer terminal sessions and command sandbox execution.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies.auth import get_current_user
from .schemas import TerminalCommandRequest, TerminalCommandResponse, TerminalSessionInfo
from .service import terminal_service

logger = logging.getLogger("sonikoma.features.platform.terminal")

router = APIRouter(prefix="/terminal", tags=["Platform Terminal"])


@router.get(
    "/info",
    response_model=TerminalSessionInfo,
    summary="Get developer terminal session metadata",
    description="Returns sandbox restrictions, allowed commands, working directory, and runtime details."
)
async def get_terminal_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    return terminal_service.get_session_info()


@router.post(
    "/execute",
    response_model=TerminalCommandResponse,
    summary="Execute sandboxed developer command",
    description="Runs an approved diagnostic or maintenance command and returns stdout, stderr, and execution duration."
)
async def execute_command(
    body: TerminalCommandRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Only allow admin or authorized staff to run terminal commands
    user_role = current_user.get("role", "user")
    if user_role not in ("admin", "developer", "superuser"):
        logger.warning(f"[Terminal] Unauthorized command attempt by user {current_user.get('id')}")
        raise HTTPException(status_code=403, detail="Terminal execution requires administrative privileges.")

    logger.info(f"[Terminal] Executing command: '{body.command}' for user {current_user.get('id')}")
    return terminal_service.execute_command(body.command)


@router.get(
    "/history",
    response_model=List[TerminalCommandResponse],
    summary="Get recent terminal execution history"
)
async def get_command_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_role = current_user.get("role", "user")
    if user_role not in ("admin", "developer", "superuser"):
        raise HTTPException(status_code=403, detail="Terminal execution requires administrative privileges.")
    return terminal_service.get_history()

