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

logger = logging.getLogger("anivox.skills.registry")

class SkillRegistry:
    def __init__(self):
        self._skills: Dict[str, BaseAISkill] = {}
        self.load_skills()

    def register(self, skill: BaseAISkill):
        self._skills[skill.name] = skill
        logger.info(f"Registered AI Skill: '{skill.name}' from {os.path.basename(skill.filepath)}")

    def get(self, name: str) -> BaseAISkill:
        if name not in self._skills:
            raise KeyError(f"Skill '{name}' is not registered in the AI Skills Registry.")
        return self._skills[name]

    def list_skills(self) -> Dict[str, str]:
        return {name: skill.description for name, skill in self._skills.items()}

    def load_skills(self):
        """Scans the local directory for all markdown files and registers them."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        md_pattern = os.path.join(current_dir, "*.md")
        
        md_files = glob.glob(md_pattern)
        logger.info(f"Scanning for Markdown AI Skills in {current_dir}...")
        
        for filepath in md_files:
            try:
                skill = BaseAISkill(filepath)
                if skill.name:
                    self.register(skill)
            except Exception as e:
                logger.error(f"Failed to load AI skill from {filepath}: {e}", exc_info=True)

# Global singleton registry instance
registry = SkillRegistry()
