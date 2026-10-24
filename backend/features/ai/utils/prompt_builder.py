"""
backend/features/ai/utils/prompt_builder.py
─────────────────────────────────────────────────────────────────────────────
Simple string and template builder for AI prompts.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, Any
import re


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _replace_variables(template: str, values: Dict[str, Any]) -> str:
    """Replaces {variable_name} or {{variable_name}} with stringified value."""
    result = template
    for key, val in values.items():
        pattern = re.compile(r"\{\{\s*" + re.escape(key) + r"\s*\}\}|\{\s*" + re.escape(key) + r"\s*\}")
        result = pattern.sub(str(val), result)
    return result.strip()


# ── Public API ───────────────────────────────────────────────────────────────

def fill_template(template_text: str, variables: Dict[str, Any]) -> str:
    """Fills variable values into a prompt template cleanly."""
    return _replace_variables(template_text, variables)


__all__ = ["fill_template"]
