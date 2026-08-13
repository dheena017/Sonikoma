"""
backend/app/services/ai/pipelines/__init__.py
─────────────────────────────────────────────────────────────────────────────
AI Intelligence Pipelines package.
─────────────────────────────────────────────────────────────────────────────
"""

from services.ai.pipelines.storyboard_ai import generate_storyboard_ai

__all__ = ["generate_storyboard_ai"]
