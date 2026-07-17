"""
backend/app/services/ai/skills/utils.py
─────────────────────────────────────────────────────────────────────────────
Utility parsers, token logging, API keys resolution, and provider mapping.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("sonikoma.skills.utils")


def parse_simple_yaml(text: str) -> dict:
    """Robust, zero-dependency parser for flat YAML frontmatter blocks."""
    result = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip()
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            if val.startswith('[') and val.endswith(']'):
                items = [item.strip().strip('"').strip("'") for item in val[1:-1].split(",") if item.strip()]
                result[key] = items
            else:
                result[key] = val
    return result


def extract_json(text: str) -> str:
    """Extracts raw JSON blocks wrapped in markdown or matching brackets."""
    match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()

    start_bracket = text.find("[")
    start_brace = text.find("{")
    end_bracket = text.rfind("]")
    end_brace = text.rfind("}")

    start = -1
    end = -1

    if start_bracket != -1 and start_brace != -1:
        start = min(start_bracket, start_brace)
    elif start_bracket != -1:
        start = start_bracket
    elif start_brace != -1:
        start = start_brace

    if end_bracket != -1 and end_brace != -1:
        end = max(end_bracket, end_brace)
    elif end_bracket != -1:
        end = end_bracket
    elif end_brace != -1:
        end = end_brace

    if start != -1 and end != -1 and start < end:
        return text[start:end+1].strip()
    return text.strip()


def resolve_api_key(provider: str, user_api_key: Any = None, user_keys: Optional[dict] = None) -> Optional[str]:
    """Resolves correct API key dynamically checking user settings then env vars."""
    if user_keys and isinstance(user_keys, dict) and user_keys.get(provider):
        return user_keys.get(provider)
    if user_api_key:
        if isinstance(user_api_key, dict):
            if user_api_key.get(provider):
                return user_api_key.get(provider)
        else:
            return user_api_key

    if provider == "openai":
        return os.getenv("OPENAI_API_KEY")
    elif provider == "anthropic":
        return os.getenv("ANTHROPIC_API_KEY")
    elif provider == "huggingface":
        return os.getenv("HUGGINGFACE_API_KEY")
    else:
        return os.getenv("GEMINI_API_KEY")


def get_provider_and_model(model_name: str) -> tuple[str, str]:
    """Helper to detect provider (gemini, openai, anthropic, huggingface) from model name."""
    if not model_name:
        return "gemini", "gemini-2.5-flash"
    m_lower = model_name.lower()

    if m_lower.startswith("openai/"):
        return "openai", model_name[len("openai/"):]
    if m_lower.startswith("anthropic/"):
        return "anthropic", model_name[len("anthropic/"):]
    if m_lower.startswith("huggingface/"):
        return "huggingface", model_name[len("huggingface/"):]
    if m_lower.startswith("gemini/"):
        return "gemini", model_name[len("gemini/"):]

    if m_lower.startswith("gpt-") or m_lower.startswith("o1-") or m_lower.startswith("o3-"):
        return "openai", model_name
    if m_lower.startswith("claude-"):
        return "anthropic", model_name
    if m_lower.startswith("gemini-"):
        return "gemini", model_name

    if "/" in model_name:
        return "huggingface", model_name

    return "gemini", model_name


class SkillLogger:
    """Helper to stream structured terminal logs compatible with frontend outputs."""
    def __init__(self):
        self.logger = logging.getLogger("sonikoma.skills.execution")

    def log_execution(self, skill_name: str, latency_ms: int, success: bool, inputs: dict, outputs: dict, prompt_tokens: int = 0, candidates_tokens: int = 0):
        status = "success" if success else "failed"
        tokens_str = f" | Tok: {prompt_tokens} / {candidates_tokens}" if success and (prompt_tokens > 0 or candidates_tokens > 0) else ""
        self.logger.info(f"[AI Model] Executed skill: {skill_name} in {latency_ms}ms. Status: {status}{tokens_str}")
