"""
backend/features/intelligence/ai/service.py
─────────────────────────────────────────────────────────────────────────────
AI Domain Service Facade:
Provides unified access to AI generation capabilities, model routing, and skills.
─────────────────────────────────────────────────────────────────────────────
"""

from features.intelligence.ai.services import facade
from features.intelligence.ai.services._deps import (
    get_user_gemini_key,
    default_output_path,
    run_md_skill,
)


class AIService:
    """Consolidated business service facade for AI generation and skills."""

    def __init__(self):
        self.facade = facade
        self.run_skill = run_md_skill


ai_service = AIService()

__all__ = [
    "AIService",
    "ai_service",
    "get_user_gemini_key",
    "default_output_path",
    "run_md_skill",
]
