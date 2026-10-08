"""
backend/app/services/ai/skills/__init__.py
─────────────────────────────────────────────────────────────────────────────
AI Intelligence Skills package: prompt templates, registry, and coordinator.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.skills.base import BaseAISkill, SCHEMA_MAP
from ai_engine.skills.registry import registry, SkillRegistry

__all__ = [
    "BaseAISkill",
    "SCHEMA_MAP",
    "registry",
    "SkillRegistry",
    "execute_skill_pipeline",
]
