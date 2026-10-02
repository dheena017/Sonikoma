"""Application services for health probes and system log operations."""

import logging
import os
import platform
import subprocess
import sys
import time
from typing import Optional

from app.core.config import API_VERSION
from app.repositories.system import get_db_stats, get_system_logs, wipe_system_logs
from app.schemas.health import (
    CustomLogPayload,
    FfmpegHealthResponse,
    HealthCheckResponse,
    LogMutationResponse,
    SystemLogsResponse,
)
from core.logging import get_logs

logger = logging.getLogger("sonikoma.services.health")
START_TIME = time.time()


def _check_capability(module_name: str) -> bool:
    try:
        __import__(module_name)
        return True
    except Exception:
        return False


def get_health_status(
    gemini_key: Optional[str] = None,
    huggingface_key: Optional[str] = None,
    openai_key: Optional[str] = None,
    anthropic_key: Optional[str] = None,
) -> HealthCheckResponse:
    """Build the lightweight health response without HTTP concerns."""
    uptime_sec = round(time.time() - START_TIME, 1)
    hours = int(uptime_sec // 3600)
    minutes = int((uptime_sec % 3600) // 60)
    seconds = int(uptime_sec % 60)

    db_status = "connected"
    db_stats = {}
    try:
        db_stats = get_db_stats()
    except Exception:
        db_status = "error"

    return HealthCheckResponse(
        service="Sonikoma Computational Backend",
        version=API_VERSION,
        uptime=f"{hours}h {minutes}m {seconds}s",
        uptime_seconds=uptime_sec,
        database=db_status,
        db_type="SQLite (local)",
        db_stats=db_stats,
        python=sys.version.split(" ")[0],
        platform=f"{platform.system()} {platform.machine()}",
        capabilities={
            "cv2": _check_capability("cv2"),
            "PIL": _check_capability("PIL"),
            "numpy": _check_capability("numpy"),
            "moviepy": _check_capability("moviepy"),
            "edge_tts": _check_capability("edge_tts"),
            "pydub": _check_capability("pydub"),
            "easyocr": _check_capability("easyocr"),
            "httpx": _check_capability("httpx"),
            "google_genai": _check_capability("google.genai"),
        },
        env={
            "GEMINI_API_KEY": bool(gemini_key or os.getenv("GEMINI_API_KEY")),
            "HUGGINGFACE_API_KEY": bool(huggingface_key or os.getenv("HUGGINGFACE_API_KEY")),
            "OPENAI_API_KEY": bool(openai_key or os.getenv("OPENAI_API_KEY")),
            "ANTHROPIC_API_KEY": bool(anthropic_key or os.getenv("ANTHROPIC_API_KEY")),
        },
    )


def get_ffmpeg_health() -> FfmpegHealthResponse:
    """Probe the FFmpeg executable and raise when it is unavailable."""
    try:
        proc = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            check=True,
        )
        version = proc.stdout.splitlines()[0] if proc.stdout else "unknown"
        return FfmpegHealthResponse(status="ok", version=version)
    except Exception as exc:
        raise RuntimeError(f"FFmpeg is not accessible on the server path: {exc}") from exc


def fetch_system_logs(
    since: int = 0,
    limit: int = 200,
    offset: int = 0,
    level: Optional[str] = None,
    module: Optional[str] = None,
    search: Optional[str] = None,
) -> SystemLogsResponse:
    """Fetch live logs or filtered historical logs."""
    if level or module or search or offset > 0:
        logs = get_system_logs(limit, offset, level, module, search)
        return SystemLogsResponse(logs=logs, historical=True)
    return SystemLogsResponse(logs=get_logs(since), historical=False)


def clear_system_logs() -> LogMutationResponse:
    wipe_system_logs()
    return LogMutationResponse(message="Persistent system logs wiped successfully.")


def add_system_log(payload: CustomLogPayload) -> LogMutationResponse:
    vite_logger = logging.getLogger("sonikoma.vite")
    level = payload.level.upper()
    if level == "ERROR":
        vite_logger.error(payload.message)
    elif level in ("WARNING", "WARN"):
        vite_logger.warning(payload.message)
    else:
        vite_logger.info(payload.message)
    return LogMutationResponse()
