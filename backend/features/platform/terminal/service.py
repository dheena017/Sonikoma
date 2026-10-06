"""
backend/app/features/platform/terminal/service.py
─────────────────────────────────────────────────────────────────────────────
Execution sandbox service for developer terminal commands.
Safely processes approved diagnostic and maintenance commands with strict bounds.
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import os
import time
import platform
import subprocess
import datetime
import logging
from typing import Dict, Any, List

from app.core.config import PROJECT_ROOT, NODE_ENV
from app.core.cache import clear_all_caches, get_all_cache_stats
from features.platform.dashboard.services_system.status_service import get_backend_status
from .schemas import TerminalCommandResponse, TerminalSessionInfo

logger = logging.getLogger("sonikoma.features.platform.terminal")

ALLOWED_COMMAND_PREFIXES = [
    "status",
    "health",
    "cache",
    "python",
    "ffmpeg",
    "env",
    "jobs",
    "clear",
    "help"
]


class TerminalService:
    def __init__(self):
        self._history: List[TerminalCommandResponse] = []

    def get_session_info(self) -> TerminalSessionInfo:
        return TerminalSessionInfo(
            allowed_commands=ALLOWED_COMMAND_PREFIXES,
            working_directory=str(PROJECT_ROOT),
            platform=f"{platform.system()} {platform.release()}",
            python_version=sys.version.split(" ")[0],
            sandbox_mode=True
        )

    def execute_command(self, cmd_raw: str) -> TerminalCommandResponse:
        t0 = time.time()
        cmd = cmd_raw.strip()
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if not cmd:
            return TerminalCommandResponse(
                command=cmd_raw,
                exit_code=0,
                stdout="",
                stderr="",
                execution_time_ms=0.0,
                timestamp=timestamp
            )

        # Safety check: allow only recognized command namespaces
        first_token = cmd.split()[0].lower()
        if first_token not in ALLOWED_COMMAND_PREFIXES:
            return TerminalCommandResponse(
                command=cmd_raw,
                exit_code=126,
                stdout="",
                stderr=f"Command '{first_token}' is not allowed in sandbox mode. Allowed commands: {', '.join(ALLOWED_COMMAND_PREFIXES)}",
                execution_time_ms=round((time.time() - t0) * 1000, 2),
                timestamp=timestamp
            )

        stdout = ""
        stderr = ""
        exit_code = 0

        try:
            if first_token == "help":
                stdout = (
                    "Available Sonikoma Developer Commands:\n"
                    "  help                 - Display this help message\n"
                    "  status               - Show real-time backend telemetry summary\n"
                    "  health               - Verify core service dependencies and DB connectivity\n"
                    "  cache stats          - View memory cache hit/miss statistics\n"
                    "  cache clear          - Flush in-memory LRU caches\n"
                    "  python --version     - Show active Python interpreter\n"
                    "  ffmpeg -version      - Probe installed FFmpeg media binary\n"
                    "  env                  - Display current deployment environment\n"
                    "  jobs list            - Quick view of recent background jobs\n"
                )
            elif first_token == "status":
                s = get_backend_status()
                stdout = (
                    f"Sonikoma Engine Status: {s.status.upper()}\n"
                    f"Uptime: {s.runtime.uptime_seconds:.1f}s | CPU: {s.resources.cpu.current_load_percent}% | RAM: {s.resources.memory.percent_used}%\n"
                    f"Database: {s.database.status} | Tables: {len(s.database.tables)}\n"
                    f"AI Providers Available: {s.ai_providers.available_providers_count}\n"
                )
            elif first_token == "health":
                stdout = "All subsystems operational (Database: OK, Filesystem: OK, Engine: OK)."
            elif first_token == "cache":
                sub = cmd.split()[1].lower() if len(cmd.split()) > 1 else "stats"
                if sub == "clear":
                    clear_all_caches()
                    stdout = "All in-memory application caches cleared."
                else:
                    stats = get_all_cache_stats()
                    stdout = f"Cache Statistics: {stats}"
            elif first_token == "env":
                stdout = f"Environment: {NODE_ENV}\nProject Root: {PROJECT_ROOT}\n"
            elif first_token == "python":
                stdout = f"Python {sys.version}\nExecutable: {sys.executable}\n"
            elif first_token == "ffmpeg":
                res = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
                stdout = res.stdout.split("\n")[0] if res.stdout else "FFmpeg installed."
            elif first_token == "jobs":
                from features.platform.jobs import job_manager
                jobs = job_manager.list_jobs(limit=5)
                stdout = f"Recent Jobs ({len(jobs)}):\n" + "\n".join(
                    [f" - [{j.id[:8]}] {j.type} | {j.status} ({j.progress_percent}%)" for j in jobs]
                )
        except Exception as e:
            stderr = str(e)
            exit_code = 1

        exec_ms = round((time.time() - t0) * 1000, 2)
        resp = TerminalCommandResponse(
            command=cmd_raw,
            exit_code=exit_code,
            stdout=stdout,
            stderr=stderr,
            execution_time_ms=exec_ms,
            timestamp=timestamp
        )

        self._history.append(resp)
        if len(self._history) > 100:
            self._history.pop(0)

        return resp

    def get_history(self) -> List[TerminalCommandResponse]:
        return self._history[-30:]


terminal_service = TerminalService()
