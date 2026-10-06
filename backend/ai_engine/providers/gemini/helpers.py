"""
backend/app/providers/gemini/helpers.py
─────────────────────────────────────────────────────────────────────────────
Helper utilities for Gemini prompt formatting and generation config builders.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, Any, Optional
from ai_engine.providers.gemini.types import GeminiGenerationConfig


def build_config_dict(cfg: Optional[GeminiGenerationConfig] = None) -> Dict[str, Any]:
    """Convert GeminiGenerationConfig dataclass into an API parameters dictionary."""
    if cfg is None:
        return {}
    res: Dict[str, Any] = {
        "temperature": cfg.temperature,
        "top_p": cfg.top_p,
        "top_k": cfg.top_k,
    }
    if cfg.max_output_tokens is not None:
        res["max_output_tokens"] = cfg.max_output_tokens
    if cfg.response_mime_type is not None:
        res["response_mime_type"] = cfg.response_mime_type
    return res


def sanitize_prompt(prompt: str) -> str:
    """Trim excess empty lines and format prompt."""
    return prompt.strip()
