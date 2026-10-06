"""
backend/app/features/platform/dashboard/router.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FastAPI router for platform dashboard metrics, overview, and quick stats.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends

from app.core.dependencies.auth import get_optional_current_user
from .schemas import DashboardOverviewResponse
from .service import dashboard_service

logger = logging.getLogger("sonikoma.features.platform.dashboard")

router = APIRouter(prefix="/dashboard", tags=["Platform Dashboard"])


@router.get(
    "/overview",
    response_model=DashboardOverviewResponse,
    summary="Get aggregated dashboard overview data",
    description="Returns high-level statistics, real-time hardware telemetry, recent user projects, and active job states."
)
async def get_dashboard_overview(
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    return dashboard_service.get_overview(user_id=user_id)

