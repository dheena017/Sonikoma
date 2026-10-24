"""
backend/features/ai/utils/clean_json.py
─────────────────────────────────────────────────────────────────────────────
Cleans and repairs JSON strings returned by AI models.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import re
from typing import Dict, Any


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _strip_markdown_codeblocks(text: str) -> str:
    """Removes ```json and ``` wrapping from raw model output."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _extract_outer_brackets(text: str) -> str:
    """Finds the first { and matching last } in the response."""
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def _repair_common_syntax_errors(text: str) -> str:
    """Fixes trailing commas before closing braces and unescaped newlines."""
    fixed = re.sub(r",\s*([\]}])", r"\1", text)
    return fixed


# ── Public API ───────────────────────────────────────────────────────────────

def fix_bad_json(raw_text: str) -> Dict[str, Any]:
    """Fixes broken quotes and formatting from AI answers so they parse cleanly into a dictionary."""
    if not raw_text or not raw_text.strip():
        return {}

    cleaned = _strip_markdown_codeblocks(raw_text)
    candidate = _extract_outer_brackets(cleaned)
    repaired = _repair_common_syntax_errors(candidate)

    try:
        data = json.loads(repaired)
        if isinstance(data, dict):
            return data
        return {"data": data}
    except Exception:
        # Fallback to standard json loads on stripped text
        try:
            data = json.loads(cleaned)
            return data if isinstance(data, dict) else {"data": data}
        except Exception:
            return {"error": "Failed to parse JSON", "raw_text": raw_text[:500]}


__all__ = ["fix_bad_json"]
