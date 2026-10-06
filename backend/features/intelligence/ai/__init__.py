"""
backend/features/intelligence/ai/__init__.py
─────────────────────────────────────────────────────────────────────────────
AI domain module entry point.
Exports router, AIService, ai_service, schemas, and services.
─────────────────────────────────────────────────────────────────────────────
"""

from features.intelligence.ai.router import (
    ai_router,
    router,
)
from features.intelligence.ai.service import (
    AIService,
    ai_service,
)
from features.intelligence.ai import schemas
from features.intelligence.ai import services

__all__ = [
    "ai_router",
    "router",
    "AIService",
    "ai_service",
    "schemas",
    "services",
]
