"""
backend/app/services/ai/skills/base.py
─────────────────────────────────────────────────────────────────────────────
Base AISkill class loading prompts directly from Markdown files.
Exposes modularized schemas, utils, and fallbacks.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import time
import json
import logging
import asyncio
from typing import Any, Optional, Type
from pydantic import BaseModel

from app.core.config import ai_initialized, call_gemini_with_retry, genai_client
from app.core.config import GEMINI_MODEL_PRIMARY, GEMINI_FALLBACK_MODELS
try:
    from google.genai import types
except Exception:
    types = None

# Import schemas and map
from services.ai.skills.schemas import (
    SCHEMA_MAP
)

# Import model registry & orchestrator
from services.model_catalog.registry import ModelRegistry
from services.ai.orchestrator import AIOrchestrator, classify_error

# Import utils
from services.ai.skills.utils import (
    parse_simple_yaml,
    extract_json,
    resolve_api_key,
    get_provider_and_model,
    SkillLogger
)

# Import fallbacks
from services.ai.skills.coordinator import FallbackCoordinator

logger = logging.getLogger("sonikoma.skills.base")


class BaseAISkill:
    """Parses and executes an AI skill defined in a Markdown file."""

    def __init__(self, filepath: str):
        self.filepath = filepath
        self.name = ""
        self.description = ""
        self.default_model = GEMINI_MODEL_PRIMARY
        self.response_schema_name = ""
        self.prompt_template = ""
        self.logger = SkillLogger()
        self.last_input_tokens = 0
        self.last_output_tokens = 0
        self.load()

    def load(self):
        """Loads and parses the .md file."""
        if not os.path.exists(self.filepath):
            raise FileNotFoundError(f"Markdown skill file not found: {self.filepath}")

        with open(self.filepath, "r", encoding="utf-8") as f:
            content = f.read()

        match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
        if match:
            yaml_block = match.group(1)
            self.prompt_template = match.group(2).strip()

            yaml_data = parse_simple_yaml(yaml_block)
            self.name = yaml_data.get("name", "")
            self.description = yaml_data.get("description", "")
            self.default_model = yaml_data.get("model", GEMINI_MODEL_PRIMARY)
            self.response_schema_name = yaml_data.get("response_schema", "")
        else:
            self.prompt_template = content.strip()
            self.name = os.path.splitext(os.path.basename(self.filepath))[0]

    @property
    def response_schema(self) -> Optional[Type[BaseModel]]:
        if self.response_schema_name:
            return SCHEMA_MAP.get(self.response_schema_name)
        return None

    def build_prompt(self, **kwargs) -> str:
        """Dynamically inserts key-value contexts into prompt brackets."""
        safe_template = self.prompt_template

        try:
            return safe_template.format(**kwargs)
        except KeyError as e:
            logger.warning(f"Missing parameter '{e}' during dynamic variable replacement in skill '{self.name}'. Injecting empty string.")
            kwargs[str(e).strip("'")] = ""
            return safe_template.format(**kwargs)
        except Exception as e:
            logger.error(f"Failed to compile prompt template for '{self.name}': {e}")
            return safe_template

    async def execute(
        self,
        model: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        api_key: Optional[str] = None,
        user_keys: Optional[dict] = None,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        job_id: Optional[str] = None,
        **kwargs
    ) -> Any:
        """Invokes AIOrchestrator (Central AI Core) for unified rate limiting, quota validation, and execution."""
        start_time = time.monotonic()
        target_model = model or self.default_model
        prompt = self.build_prompt(**kwargs)

        res = await AIOrchestrator.execute_capability(
            capability=self.name,
            prompt=prompt,
            model=target_model,
            image_bytes=image_bytes,
            api_key=api_key,
            user_keys=user_keys,
            user_id=user_id,
            project_id=project_id,
            job_id=job_id,
            skill_obj=self,
            **kwargs
        )

        parsed_data = res.get("result", {})
        if isinstance(parsed_data, dict) and "raw_output" in parsed_data and len(parsed_data) == 1:
            raw_output = str(parsed_data["raw_output"])
        elif isinstance(parsed_data, (dict, list)):
            raw_output = json.dumps(parsed_data)
        else:
            raw_output = str(parsed_data)

        elapsed_ms = int((time.monotonic() - start_time) * 1000)
        self.logger.log_execution(self.name, elapsed_ms, res.get("success", False), kwargs, parsed_data if isinstance(parsed_data, dict) else {}, self.last_input_tokens, self.last_output_tokens)
        return raw_output
