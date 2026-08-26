"""
backend/python/skills/registry.py
─────────────────────────────────────────────────────────────────────────────
Registry loader discovering and caching Markdown skills on startup.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import glob
import logging
from typing import Dict
from .base import BaseAISkill

logger = logging.getLogger("sonikoma.skills.registry")

class SkillRegistry:
    def __init__(self):
        self._skills: Dict[str, BaseAISkill] = {}

    def register(self, skill: BaseAISkill):
        self._skills[skill.name] = skill

    def get(self, name: str) -> BaseAISkill:
        if not self._skills:
            self.load_skills()
        if name not in self._skills:
            raise KeyError(f"Skill '{name}' is not registered in the AI Skills Registry.")
        return self._skills[name]

    def list_skills(self) -> Dict[str, str]:
        if not self._skills:
            self.load_skills()
        return {name: skill.description for name, skill in self._skills.items()}

    def load_skills(self):
        """Scans the prompts/ directory and local directory for all markdown files and registers them."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        prompts_dir = os.path.join(current_dir, "prompts")

        md_files = glob.glob(os.path.join(prompts_dir, "*.md")) + glob.glob(os.path.join(current_dir, "*.md"))

        loaded_count = 0
        for filepath in md_files:
            try:
                skill = BaseAISkill(filepath)
                if skill.name:
                    self.register(skill)
                    loaded_count += 1
            except Exception as e:
                logger.error(f"Failed to load AI skill from {filepath}: {e}", exc_info=True)


# Global singleton registry instance
registry = SkillRegistry()
