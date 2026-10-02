"""Health and system diagnostic API routes."""

from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query

from schemas.health import (
    BackendStatusResponse,
    CustomLogPayload,
    FfmpegHealthResponse,
    HealthCheckResponse,
    LogMutationResponse,
    SystemLogsResponse,
)
from services.health import (
    add_system_log,
    clear_system_logs,
    fetch_system_logs,
    get_ffmpeg_health,
    get_health_status,
)
from services.system import get_comprehensive_backend_status

health_router = APIRouter()
router = health_router


@router.get(
    "/status",
    response_model=BackendStatusResponse,
    summary="Comprehensive Backend Status & Telemetry",
    description="Authentic real-time diagnostics including CPU, Memory, GPU, Storage, SQLite metrics, background job queues, and AI provider availability.",
)
async def get_backend_status_endpoint(
    x_user_gemini_key: Optional[str] = Header(None, alias="X-User-Gemini-Key"),
    x_user_huggingface_key: Optional[str] = Header(None, alias="X-User-Huggingface-Key"),
    x_user_openai_key: Optional[str] = Header(None, alias="X-User-Openai-Key"),
    x_user_anthropic_key: Optional[str] = Header(None, alias="X-User-Anthropic-Key"),
):
    return get_comprehensive_backend_status(
        gemini_key_override=x_user_gemini_key,
        huggingface_key_override=x_user_huggingface_key,
        openai_key_override=x_user_openai_key,
        anthropic_key_override=x_user_anthropic_key,
    )


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health check and capability probe",
)
async def get_health_status_endpoint(
    x_user_gemini_key: Optional[str] = Header(None, alias="X-User-Gemini-Key"),
    x_user_huggingface_key: Optional[str] = Header(None, alias="X-User-Huggingface-Key"),
    x_user_openai_key: Optional[str] = Header(None, alias="X-User-Openai-Key"),
    x_user_anthropic_key: Optional[str] = Header(None, alias="X-User-Anthropic-Key"),
):
    return get_health_status(
        gemini_key=x_user_gemini_key,
        huggingface_key=x_user_huggingface_key,
        openai_key=x_user_openai_key,
        anthropic_key=x_user_anthropic_key,
    )


@router.get(
    "/health/ffmpeg",
    response_model=FfmpegHealthResponse,
    summary="FFmpeg binary health probe",
)
async def get_ffmpeg_health_endpoint():
    try:
        return get_ffmpeg_health()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get(
    "/logs",
    response_model=SystemLogsResponse,
    summary="Diagnostic logs retrieval with historical support",
)
async def get_system_logs_endpoint(
    since: int = Query(0, description="Fetch ephemeral logs generated after this sequence ID"),
    limit: int = Query(200, description="Max records to return for historical query"),
    offset: int = Query(0, description="Offset for historical query"),
    level: Optional[str] = Query(None, description="Filter by log level"),
    module: Optional[str] = Query(None, description="Filter by module"),
    search: Optional[str] = Query(None, description="Text search in message or details"),
):
    try:
        return fetch_system_logs(since, limit, offset, level, module, search)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete(
    "/logs",
    response_model=LogMutationResponse,
    summary="Wipe all persistent system logs",
)
async def clear_system_logs_endpoint():
    try:
        return clear_system_logs()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/logs",
    response_model=LogMutationResponse,
    summary="Post a custom log entry to system logs",
)
async def add_custom_log_endpoint(payload: CustomLogPayload):
    try:
        return add_system_log(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
