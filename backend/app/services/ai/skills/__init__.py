"""
backend/app/services/ai/skills/__init__.py
─────────────────────────────────────────────────────────────────────────────
AI Intelligence Skills package: prompt templates, registry, and coordinator.
─────────────────────────────────────────────────────────────────────────────
"""

from services.ai.skills.base import BaseAISkill, SCHEMA_MAP
from services.ai.skills.registry import registry, SkillRegistry
from services.ai.skills.coordinator import execute_skill_pipeline

__all__ = [
    "BaseAISkill",
    "SCHEMA_MAP",
    "registry",
    "SkillRegistry",
    "execute_skill_pipeline",
]
