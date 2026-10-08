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
        
        # Support format aliases and alternative skill names
        alias_map = {
            "series_arc_manhwa": "series_arc_director",
            "series_arc_comic": "series_arc_director",
            "series_arc_anime": "series_arc_director",
            "manhwa_arc_director": "series_arc_director",
            "comic_arc_director": "series_arc_director",
            "anime_arc_director": "series_arc_director",
            "manhwa": "series_arc_director",
            "comic": "series_arc_director",
            "manga": "series_arc_director",
            "comic_manga": "series_arc_director",
            "anime": "series_arc_director",
            "anime_sakuga": "series_arc_director",
        }
        resolved = alias_map.get(name, name)
        if resolved not in self._skills:
            # Fall back to master series_arc_director if specialized skill not directly found
            if "series_arc" in resolved and "series_arc_director" in self._skills:
                return self._skills["series_arc_director"]
            raise KeyError(f"Skill '{name}' is not registered in the AI Skills Registry.")
        return self._skills[resolved]

    def list_skills(self) -> Dict[str, str]:
        if not self._skills:
            self.load_skills()
        return {name: skill.description for name, skill in self._skills.items()}

    def load_skills(self):
        """Scans templates/, prompts/, and local directory for all markdown files and registers them."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        templates_dir = os.path.join(current_dir, "templates")
        prompts_dir = os.path.join(current_dir, "prompts")
        creative_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "features", "creative"))

        md_files = (
            glob.glob(os.path.join(templates_dir, "*.md"))
            + glob.glob(os.path.join(prompts_dir, "*.md"))
            + glob.glob(os.path.join(current_dir, "*.md"))
            + glob.glob(os.path.join(creative_dir, "**", "*.md"), recursive=True)
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
