"""
backend/app/features/platform/terminal/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for the web developer terminal execution and sandbox status.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TerminalCommandRequest(BaseModel):
    command: str = Field(..., description="Developer command to execute (e.g. 'status', 'ffmpeg -version', 'cache clear')")
    cwd: Optional[str] = None


class TerminalCommandResponse(BaseModel):
    command: str
    exit_code: int
    stdout: str
    stderr: str
    execution_time_ms: float
    timestamp: str


class TerminalSessionInfo(BaseModel):
    allowed_commands: List[str]
    working_directory: str
    platform: str
    python_version: str
    sandbox_mode: bool = True
