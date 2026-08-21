import asyncio
import json
import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from services.ai.skills.base import BaseAISkill


class TestSkillModelFallbacks(unittest.TestCase):
    def test_execute_returns_programmatic_fallback_when_gemini_models_fail(self):
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as handle:
            handle.write("---\nname: test_skill\nmodel: gemini-2.5-flash\n---\nPrompt")
            skill_path = handle.name

        try:
            skill = BaseAISkill(skill_path)

            with patch("services.ai.orchestrator.AIOrchestrator.is_provider_configured", return_value=True), \
                 patch("services.ai.skills.coordinator.execute_provider_call", side_effect=RuntimeError("429 quota exhausted")):
                result = asyncio.run(skill.execute())

            parsed = json.loads(result)
            self.assertEqual(parsed.get("source"), "fallback:error")


        finally:
            os.remove(skill_path)
