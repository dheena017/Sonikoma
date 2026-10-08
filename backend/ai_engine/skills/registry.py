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
        
        alias_map = {
            "series_arc_director": "series_arc_manhwa",
            "manga": "series_arc_comic",
            "comic": "series_arc_comic",
            "anime": "series_arc_anime",
            "manhwa": "series_arc_manhwa",
        }


        resolved = alias_map.get(name, name)
        if resolved not in self._skills:
            if name in self._skills:
                return self._skills[name]
            raise KeyError(f"Skill '{name}' is not registered in the AI Skills Registry.")
        return self._skills[resolved]

    def list_skills(self) -> Dict[str, str]:
        if not self._skills:
            self.load_skills()
        return {name: skill.description for name, skill in self._skills.items()}

    def load_skills(self):
        """Discovers and registers all markdown skills across features and local directories."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        features_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "features"))
        templates_dir = os.path.join(current_dir, "templates")
        prompts_dir = os.path.join(current_dir, "prompts")

        md_files = (
            glob.glob(os.path.join(features_dir, "**", "*.md"), recursive=True)
            + glob.glob(os.path.join(templates_dir, "*.md"))
            + glob.glob(os.path.join(prompts_dir, "*.md"))
            + glob.glob(os.path.join(current_dir, "*.md"))
        )

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
