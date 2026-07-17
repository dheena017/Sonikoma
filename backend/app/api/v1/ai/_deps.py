"""
backend/app/api/v1/ai/_deps.py
─────────────────────────────────────────────────────────────────────────────
Shared FastAPI dependencies, helpers, and constants used across all AI
sub-router modules.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import json
import logging
from typing import Any, Dict, Optional

from fastapi import Header, HTTPException
from api.dependencies.auth import clean_api_key, get_all_user_keys
from services.ai.skills.registry import registry

logger = logging.getLogger("sonikoma.api.ai")

MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']


def get_user_gemini_key(
    x_user_gemini_key: str = Header(None, alias="X-User-Gemini-Key"),
    x_user_openai_key: str = Header(None, alias="X-User-OpenAI-Key"),
    x_user_anthropic_key: str = Header(None, alias="X-User-Anthropic-Key"),
    x_user_huggingface_key: str = Header(None, alias="X-User-HuggingFace-Key"),
) -> Dict[str, Optional[str]]:
    return {
        "gemini": clean_api_key(x_user_gemini_key) or clean_api_key(os.getenv("GEMINI_API_KEY")),
        "openai": clean_api_key(x_user_openai_key) or clean_api_key(os.getenv("OPENAI_API_KEY")),
        "anthropic": clean_api_key(x_user_anthropic_key) or clean_api_key(os.getenv("ANTHROPIC_API_KEY")),
        "huggingface": clean_api_key(x_user_huggingface_key) or clean_api_key(os.getenv("HUGGINGFACE_API_KEY")),
    }


def default_output_path(suffix: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"stable_diffusion_{os.urandom(4).hex()}{suffix}")


async def run_md_skill(skill_name: str, model: str, api_key: Any = None, **kwargs) -> Dict[str, Any]:
    """Runs a markdown-templated AI skill and returns structured output."""
    try:
        skill = registry.get(skill_name)
        user_keys = api_key if isinstance(api_key, dict) else None
        single_key = api_key if isinstance(api_key, str) else None
        raw_text = await skill.execute(model=model, api_key=single_key, user_keys=user_keys, **kwargs)
        return {
            "success": True,
            "result": json.loads(raw_text),
            "inputTokens": getattr(skill, "last_input_tokens", 0),
            "outputTokens": getattr(skill, "last_output_tokens", 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
