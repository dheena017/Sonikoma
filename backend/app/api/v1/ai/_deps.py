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
from api.dependencies.auth import clean_api_key
from services.ai.skills.registry import registry

logger = logging.getLogger("sonikoma.api.ai")


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


async def run_md_skill(skill_name: str, model: Optional[str], api_key: Any = None, **kwargs) -> Dict[str, Any]:
    """Runs a markdown-templated AI skill and returns structured output."""
    try:
        skill = registry.get(skill_name)
        if not skill:
            raise HTTPException(status_code=404, detail=f"AI Skill '{skill_name}' is not registered.")

        user_keys = api_key if isinstance(api_key, dict) else None
        single_key = api_key if isinstance(api_key, str) else None
        raw_text = await skill.execute(model=model, api_key=single_key, user_keys=user_keys, **kwargs)
        
        try:
            parsed = json.loads(raw_text) if isinstance(raw_text, str) else raw_text
        except Exception:
            parsed = {"raw_output": raw_text}

        return {
            "success": True,
            "result": parsed,
            "inputTokens": getattr(skill, "last_input_tokens", 0),
            "outputTokens": getattr(skill, "last_output_tokens", 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        from services.ai.orchestrator import AIExecutionError, AIErrorCode
        if isinstance(e, AIExecutionError):
            status_map = {
                AIErrorCode.AUTH_FAILURE: 401,
                AIErrorCode.INSUFFICIENT_CREDITS: 402,
                AIErrorCode.MODEL_NOT_FOUND: 404,
                AIErrorCode.RATE_LIMITED: 429,
                AIErrorCode.PROVIDER_UNAVAILABLE: 503,
                AIErrorCode.TIMEOUT: 504,
                AIErrorCode.INVALID_REQUEST: 400,
            }
            status_code = status_map.get(e.error_code, 500)
            raise HTTPException(status_code=status_code, detail=e.message)
        logger.error(f"[AI Skill Error] Skill '{skill_name}' execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
