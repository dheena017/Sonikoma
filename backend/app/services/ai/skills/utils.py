"""
backend/app/services/ai/skills/utils.py
─────────────────────────────────────────────────────────────────────────────
Utility parsers, token logging, API keys resolution, and provider mapping.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import logging
from typing import Any, Optional

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


import json


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


def robust_parse_json(text: Any) -> dict:
    """
    Robust JSON parser for LLM outputs.
    - Handles direct JSON strings and dicts
    - Strips markdown code fences
    - Auto-repairs truncated JSON (unterminated strings, unclosed brackets)
    - Fallback regex extractor for panels array if outer structure was truncated
    """
    if not text:
        return {}
    if isinstance(text, dict):
        return text
    if not isinstance(text, str):
        try:
            return json.loads(str(text))
        except Exception:
            return {}

    cleaned = text.strip()

    # 1. Direct parse attempt
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # 2. Extract JSON block from markdown fences
    extracted = extract_json(cleaned)
    try:
        data = json.loads(extracted)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # 3. Handle unclosed quotes and brackets (repair truncated JSON)
    trimmed = extracted.rstrip(", \r\n\t")
    quote_candidates = ["", '"']
    bracket_candidates = ["}]}", "]}", "}", "}}", "]"]
    for q in quote_candidates:
        for b in bracket_candidates:
            try:
                candidate = trimmed + q + b
                data = json.loads(candidate)
                if isinstance(data, dict):
                    return data
            except Exception:
                pass

    # 4. Fallback: regex search for individual panels inside array
    panel_pattern = re.compile(r'\{[^{}]*"panel_index"\s*:\s*\d+.*?(?:\}\s*,|\}\s*\]|\}$)', re.DOTALL)
    panel_matches = panel_pattern.findall(cleaned)
    extracted_panels = []
    for pm in panel_matches:
        pm_clean = pm.rstrip(",]").strip()
        if not pm_clean.endswith("}"):
            pm_clean += "}"
        try:
            p_obj = json.loads(pm_clean)
            if isinstance(p_obj, dict):
                extracted_panels.append(p_obj)
        except Exception:
            pass

    if extracted_panels:
        return {"panels": extracted_panels}

    return {}


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
    elif provider == "groq":
        return os.getenv("GROQ_API_KEY")
    elif provider == "deepseek":
        return os.getenv("DEEPSEEK_API_KEY")
    elif provider == "huggingface":
        return os.getenv("HUGGINGFACE_API_KEY")
    elif provider == "elevenlabs":
        return os.getenv("ELEVENLABS_API_KEY")
    elif provider == "deepl":
        return os.getenv("DEEPL_API_KEY")
    elif provider == "replicate":
        return os.getenv("REPLICATE_API_TOKEN")
    else:
        return os.getenv("GEMINI_API_KEY")



def get_provider_and_model(model_name: str) -> tuple[str, str]:
    """Resolves provider and model dynamically using the centralized ModelRegistry."""
    from services.model_catalog.registry import ModelRegistry
    return ModelRegistry.resolve_model_provider(model_name)



class SkillLogger:
    """Helper for skill execution telemetry."""
    def __init__(self):
        self.logger = logging.getLogger("sonikoma.skills.execution")

    def log_execution(self, skill_name: str, latency_ms: int, success: bool, inputs: dict, outputs: dict, prompt_tokens: int = 0, candidates_tokens: int = 0):
        # Redundant logs removed; orchestrator.py is the single source of truth for execution logging.
        pass
